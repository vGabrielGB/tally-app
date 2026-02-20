package com.tally.backend.controller;

import com.tally.backend.model.*;
import com.tally.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/dueno")
@CrossOrigin(origins = "*")
public class DueñoController {

    @Autowired private PeriodoRepository periodoRepo;
    @Autowired private ConceptoPagoRepository conceptoRepo;
    @Autowired private UsuarioRepository usuarioRepo; 
    @Autowired private PagoEstudianteRepository deudaRepo;
    @Autowired private ComprobanteRepository comprobanteRepo;
    @Autowired private AuditoriaRepository auditoriaRepo;
    @Autowired private DivisaRepository divisaRepo;

    // 1. GUARDAR PERIODO
    @PostMapping("/periodo")
    public ResponseEntity<?> guardarPeriodo(@RequestBody Periodo periodo) {
        periodo.setEstatus("ACTIVO");
        Periodo guardado = periodoRepo.save(periodo);
        return ResponseEntity.ok(Map.of("mensaje", "Periodo creado", "id", guardado.getId()));
    }

    // 2. GUARDAR CUOTA (Concepto)
    @PostMapping("/concepto")
    public ResponseEntity<?> guardarConcepto(@RequestBody ConceptoPago concepto) {
        // Buscamos el periodo activo si no viene ID
        if (concepto.getPeriodoId() == null) {
            Periodo activo = periodoRepo.findFirstByEstatus("ACTIVO");
            if (activo != null) concepto.setPeriodoId(activo.getId());
            else return ResponseEntity.badRequest().body(Map.of("error", "No hay periodo activo"));
        }
        
        concepto.setDivisaId(1); // Default USD
        concepto.setActivo(true);
        ConceptoPago guardado = conceptoRepo.save(concepto);
        return ResponseEntity.ok(Map.of("mensaje", "Cuota configurada", "id", guardado.getId()));
    }

    // 3. LISTAR CUOTAS DEL PERIODO ACTIVO
    @GetMapping("/conceptos-activos")
    public List<ConceptoPago> listarConceptos() {
        Periodo activo = periodoRepo.findFirstByEstatus("ACTIVO");
        if (activo == null) return List.of();
        return conceptoRepo.findByPeriodoId(activo.getId());
    }

    // 4. GENERAR DEUDA MASIVA
    @PostMapping("/generar-deuda")
    public ResponseEntity<?> generarDeudaMasiva() {
        try {
            // A. Buscar periodo activo y sus conceptos
            Periodo periodo = periodoRepo.findFirstByEstatus("ACTIVO");
            if (periodo == null) return ResponseEntity.badRequest().body("No hay periodo activo");
            
            List<ConceptoPago> cuotas = conceptoRepo.findByPeriodoId(periodo.getId());
            if (cuotas.isEmpty()) return ResponseEntity.badRequest().body("No hay cuotas configuradas");

            // B. Buscar todos los estudiantes
            List<Usuario> estudiantes = usuarioRepo.findByRol("ESTUDIANTE"); 
            
            int contador = 0;

            // C. Asignar cada cuota a cada estudiante
            for (Usuario estudiante : estudiantes) {
                for (ConceptoPago cuota : cuotas) {
                    // Evitar duplicados
                    if (!deudaRepo.existsByEstudianteIdAndConceptoId(estudiante.getId(), cuota.getId())) {
                        PagoEstudiante deuda = new PagoEstudiante();
                        deuda.setEstudianteId(estudiante.getId());
                        deuda.setConceptoId(cuota.getId());
                        deuda.setMontoFinalDivisa(cuota.getMontoDefault());
                        deuda.setEstatusPago("PENDIENTE");
                        deudaRepo.save(deuda);
                        contador++;
                    }
                }
            }

            return ResponseEntity.ok(Map.of("mensaje", "Se generaron " + contador + " deudas nuevas."));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error generando deuda");
        }
    }

    @GetMapping("/dashboard-kpi")
   public ResponseEntity<Map<String, Object>> getKpis() {
        Map<String, Object> response = new HashMap<>();

        Double ingresos = comprobanteRepo.sumTotalIngresos();
        response.put("ingresos", ingresos != null ? ingresos : 0.0);

        //Total Estudiantes = Realmente Inscritos
        long totalInscritos = deudaRepo.contarInscritosReales();
        response.put("totalEstudiantes", totalInscritos);

        // Morosos (Vencidos sin contar inscripción)
        long morosos = deudaRepo.contarMorososVencidosSinInscripcion();
        response.put("morosos", morosos);

        //  Porcentaje Global (Del anillo por defecto)
        double porcentajeGlobal = 100.0;
        if (totalInscritos > 0) {
            long solventes = totalInscritos - morosos;
            porcentajeGlobal = ((double) solventes / totalInscritos) * 100;
        }
        response.put("porcentajeSolvencia", (int) porcentajeGlobal);

        // Auditoría y Tasas
        response.put("auditoria", auditoriaRepo.findTop10ByOrderByFechaDesc());
        
        divisaRepo.findById(1).ifPresent(d -> response.put("tasaUsd", d.getTasa()));
        divisaRepo.findById(2).ifPresent(e -> response.put("tasaEur", e.getTasa()));

        // DATOS GRÁFICO (SOLO PERIODO ACTIVO)
        List<Object[]> rawStats = deudaRepo.obtenerEstadisticasPeriodoActivo();
        List<Map<String, Object>> chartData = new ArrayList<>();

        for (Object[] row : rawStats) {
            Map<String, Object> item = new HashMap<>();
            String label = (String) row[0];
            Long pagados = ((Number) row[1]).longValue();
            Long total = ((Number) row[2]).longValue();
            
            item.put("label", label);
            item.put("pagados", pagados);
            item.put("total", total);
            
            // Calculamos el porcentaje individual para el anillo
            int porcIndividual = (total > 0) ? (int)((pagados * 100) / total) : 0;
            item.put("porcentaje", porcIndividual);
            
            chartData.add(item);
        }
        response.put("datosGrafico", chartData);

        return ResponseEntity.ok(response);
    }
}