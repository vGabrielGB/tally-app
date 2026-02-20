package com.tally.backend.controller;

import com.tally.backend.model.*;
import com.tally.backend.repository.*;
import com.tally.backend.service.TasaBcvService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.Comparator;
import java.util.stream.Collectors;
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/config")
@CrossOrigin(origins = "*")
public class ConfigController {

    @Autowired private PeriodoRepository periodoRepo;
    @Autowired private ConceptoPagoRepository conceptoRepo;
    @Autowired private DatosPagoRepository DatosRepo;
    @Autowired private TasaBcvService bcvService;
    @Autowired private DivisaRepository divisaRepo;
    @Autowired private UsuarioRepository usuarioRepo;
    @Autowired private PagoEstudianteRepository pagoRepo;

    // --- 1. PERIODOS ---
    @GetMapping("/periodos")
    public List<Periodo> listarPeriodos() { return periodoRepo.findAll(); }

    @PostMapping("/periodo")
    public Periodo guardarPeriodo(@RequestBody Periodo p) { return periodoRepo.save(p); }

    @PostMapping("/periodo/{id}/activar")
    public ResponseEntity<?> activarPeriodo(@PathVariable Integer id) {
        // 1. Desactivar todos
        List<Periodo> todos = periodoRepo.findAll();
        for (Periodo p : todos) {
            p.setEstatus("INACTIVO");
            periodoRepo.save(p);
        }
        
        // 2. Activar el seleccionado
        Periodo p = periodoRepo.findById(id).orElseThrow();
        p.setEstatus("ACTIVO");
        periodoRepo.save(p);
        
        return ResponseEntity.ok(Map.of("mensaje", "Periodo " + p.getNombre() + " activado"));
    }
    
    @DeleteMapping("/periodo/{id}")
    public ResponseEntity<?> borrarPeriodo(@PathVariable Integer id) {
        Periodo p = periodoRepo.findById(id).orElse(null);
        if (p == null) return ResponseEntity.notFound().build();
        
        if ("ACTIVO".equals(p.getEstatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "No puedes eliminar el periodo activo. Activa otro primero."));
        }
        
        try {
            List<ConceptoPago> conceptos = conceptoRepo.findByPeriodoId(id);
            conceptoRepo.deleteAll(conceptos);
            periodoRepo.delete(p);
            return ResponseEntity.ok(Map.of("mensaje", "Periodo y sus conceptos eliminados"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", "Error al eliminar: " + e.getMessage()));
        }
    }

    // --- 2. CONCEPTOS (CUOTAS) ---
    @GetMapping("/conceptos/{periodoId}")
    public List<ConceptoPago> listarConceptos(@PathVariable Integer periodoId) {
        return conceptoRepo.findByPeriodoId(periodoId);
    }

    @PostMapping("/concepto")
    public ConceptoPago guardarConcepto(@RequestBody ConceptoPago c) {
        // 1. Guardar el concepto
        ConceptoPago guardado = conceptoRepo.save(c);
        
        // 2. ASIGNAR AUTOMÁTICAMENTE A LOS ESTUDIANTES
        asignarDeudasAutomaticamente(guardado);
        
        return guardado;
    }

    // --- LÓGICA DE ASIGNACIÓN ---
    private void asignarDeudasAutomaticamente(ConceptoPago nuevoConcepto) {
        // A. Obtener conceptos ordenados
        List<ConceptoPago> conceptosPeriodo = conceptoRepo.findByPeriodoId(nuevoConcepto.getPeriodoId());
        conceptosPeriodo.sort(Comparator.comparing(ConceptoPago::getFechaVencimiento));

        // B. Determinar si es el primero
        boolean esElPrimero = conceptosPeriodo.get(0).getId().equals(nuevoConcepto.getId());

        List<Usuario> estudiantesDestino;

        if (esElPrimero) {
            // CASO 1: Inscripción -> Todos los activos
            estudiantesDestino = usuarioRepo.findAll().stream()
                    .filter(u -> "ESTUDIANTE".equalsIgnoreCase(u.getRol()) && (u.getActivo() == null || u.getActivo()))
                    .collect(Collectors.toList());
        } else {
            // CASO 2: Mensualidad -> Solo los que pagaron la inscripción
            ConceptoPago primerConcepto = conceptosPeriodo.get(0);
            
            // 1. Obtenemos los IDs de quienes pagaron. 
            List<Long> idsSolventes = pagoRepo.findAll().stream()
                    .filter(p -> p.getConceptoId().equals(primerConcepto.getId()) && "APROBADO".equalsIgnoreCase(p.getEstatusPago()))
                    .map(p -> Long.valueOf(p.getEstudianteId())) // Conversión int -> Long
                    .collect(Collectors.toList());

            // 2. Buscamos los usuarios usando la lista de Longs
            estudiantesDestino = usuarioRepo.findAllById(idsSolventes);
        }

        // C. Crear deudas
        for (Usuario estudiante : estudiantesDestino) {

            if (!pagoRepo.existsByEstudianteIdAndConceptoId(estudiante.getId(), nuevoConcepto.getId())) {
                PagoEstudiante deuda = new PagoEstudiante();
                
                // Aquí usamos el ID directo
                deuda.setEstudianteId(estudiante.getId()); 
                deuda.setConceptoId(nuevoConcepto.getId());
                deuda.setMontoFinalDivisa(nuevoConcepto.getMontoDefault());
                deuda.setMontoAbonado(BigDecimal.ZERO);
                deuda.setEstatusPago("PENDIENTE");
                pagoRepo.save(deuda);
            }
        }
    }

    @DeleteMapping("/concepto/{id}")
    public ResponseEntity<?> borrarConcepto(@PathVariable Integer id) {
        conceptoRepo.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // --- 3. MÉTODOS DE PAGO ---
    @GetMapping("/cuentas")
    public List<DatosPago> listarCuentas() {
        return DatosRepo.findAll(); 
    }

    @PostMapping("/cuenta")
    public DatosPago guardarCuenta(@RequestBody DatosPago c) {
        return DatosRepo.save(c);
    }

    @PostMapping("/cuenta/{id}/toggle")
    public ResponseEntity<?> toggleCuenta(@PathVariable Long id) {
        DatosPago c = DatosRepo.findById(id).orElseThrow();
        c.setActivo(!c.getActivo());
        DatosRepo.save(c);
        return ResponseEntity.ok(Map.of("mensaje", "Estado cambiado"));
    }
    
    @DeleteMapping("/cuenta/{id}")
    public ResponseEntity<?> borrarCuenta(@PathVariable Long id) {
        DatosRepo.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // --- TASAS ---
    @GetMapping("/tasas")
    public List<Divisa> getTasas() {
        return divisaRepo.findAll();
    }

    @PostMapping("/tasas/forzar-bcv")
    public ResponseEntity<?> forzarActualizacion() {
        bcvService.actualizarTasas();
        return ResponseEntity.ok(divisaRepo.findAll());
    }

    @PostMapping("/tasa")
    public ResponseEntity<?> actualizarTasaManual(@RequestBody Map<String, Object> datos) {
        String codigo = (String) datos.get("codigo");
        String valorStr = datos.get("valor").toString();
        BigDecimal nuevoValor = new BigDecimal(valorStr);

        Divisa divisa = divisaRepo.findByCodigo(codigo).orElse(null);
        if (divisa != null) {
            divisa.setTasa(nuevoValor);
            divisaRepo.save(divisa);
            return ResponseEntity.ok(Map.of("mensaje", "Tasa actualizada correctamente"));
        }
        return ResponseEntity.badRequest().body(Map.of("error", "Divisa no encontrada"));
    }

    public void asignarConceptosExistentesANuevoUsuario(Usuario nuevoEstudiante) {
        try {
            // 1. Buscar Periodo Activo
            Periodo periodoActivo = periodoRepo.findFirstByEstatus("ACTIVO");
            if (periodoActivo == null) return;

            // 2. Buscar todos los conceptos de ese periodo
            List<ConceptoPago> conceptos = conceptoRepo.findByPeriodoId(periodoActivo.getId());
            
            // Ordenarlos (Inscripción primero)
            conceptos.sort(Comparator.comparing(ConceptoPago::getFechaVencimiento));

            // 3. Asignar los conceptos
            for (int i = 0; i < conceptos.size(); i++) {
                ConceptoPago c = conceptos.get(i);

                if (!pagoRepo.existsByEstudianteIdAndConceptoId(Long.valueOf(nuevoEstudiante.getId()), c.getId())) {
                    PagoEstudiante deuda = new PagoEstudiante();
                    deuda.setEstudianteId(Long.valueOf(nuevoEstudiante.getId()));
                    deuda.setConceptoId(c.getId());
                    deuda.setMontoFinalDivisa(c.getMontoDefault());
                    deuda.setMontoAbonado(BigDecimal.ZERO);
                    deuda.setEstatusPago("PENDIENTE");
                    pagoRepo.save(deuda);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            System.out.println("Error asignando conceptos iniciales: " + e.getMessage());
        }
    }
}