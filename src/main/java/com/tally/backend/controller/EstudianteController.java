package com.tally.backend.controller;

import com.tally.backend.dto.EstudiantePagosDTO;
import com.tally.backend.model.*;
import com.tally.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/estudiante")
@CrossOrigin(origins = "*") 
public class EstudianteController {

    @Autowired private UsuarioRepository usuarioRepo;
    @Autowired private PeriodoRepository periodoRepo;
    @Autowired private ConceptoPagoRepository conceptoRepo;
    @Autowired private DatosPagoRepository datosPagoRepo;
    @Autowired private DivisaRepository divisaRepo;
    @Autowired private PagoEstudianteRepository pagoEstRepo; 
    @Autowired private ComprobanteRepository comprobanteRepo;

    @GetMapping("/dashboard/{id}")
    public ResponseEntity<?> getDashboardData(@PathVariable Long id) {
        Optional<Usuario> userOpt = usuarioRepo.findById(id);
        if (userOpt.isPresent()) {
            Usuario user = userOpt.get();
            Map<String, Object> data = new HashMap<>();
            data.put("nombre", user.getNombre());
            data.put("apellido", user.getApellido());
            data.put("cedula", user.getCedula());
            data.put("rol", user.getRol());
            data.put("fotoPerfil", user.getFotoPerfil()); 
            
            // --- LÓGICA DE ESTATUS ---
            String estatus = "SOLVENTE"; 
            String clase = "status-solvente";

            boolean enRevision = comprobanteRepo.existsByPagoEstudiante_EstudianteIdAndEstatusAdmin(id, "PENDIENTE");
            
            if (enRevision) {
                estatus = "EN REVISIÓN";
                clase = "status-revision"; 
            } else {
                List<PagoEstudiante> deudas = pagoEstRepo.findByEstudianteIdAndEstatusPagoNot(id, "APROBADO");
                LocalDate hoy = LocalDate.now();

                for (PagoEstudiante deuda : deudas) {
                    Optional<ConceptoPago> cOpt = conceptoRepo.findById(deuda.getConceptoId());
                    if (cOpt.isPresent()) {
                        ConceptoPago c = cOpt.get();
                        LocalDate fechaCierre = c.getFechaVencimiento();
                        int diasProrroga = c.getProrroga() != null ? c.getProrroga() : 0;
                        LocalDate fechaLimite = fechaCierre.plusDays(diasProrroga);

                        if (hoy.isAfter(fechaLimite)) {
                            estatus = "MOROSO";
                            clase = "status-moroso"; 
                            break; 
                        } else if (hoy.isAfter(fechaCierre) || hoy.isEqual(fechaCierre)) {
                            estatus = "PENDIENTE";
                            clase = "status-pendiente"; 
                        }
                    }
                }
            }

            data.put("estatusTexto", estatus);
            data.put("estatusClase", clase);
            
            return ResponseEntity.ok(data);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/pagos-info")
    public ResponseEntity<?> getInfoPagos(@RequestParam Long estudianteId) { 
        
        if (estudianteId == null) return ResponseEntity.badRequest().body("Falta el ID del estudiante");

        EstudiantePagosDTO dto = new EstudiantePagosDTO();

        // 1. OBTENER USUARIO, FOTO Y BILLETERA
        BigDecimal saldoBilleteraBs = BigDecimal.ZERO;
        Optional<Usuario> uOpt = usuarioRepo.findById(estudianteId);
        
        if(uOpt.isPresent()) {
            Usuario u = uOpt.get();

            dto.setNombreEstudiante(u.getNombre() + " " + u.getApellido());
            dto.setFotoPerfil(u.getFotoPerfil());
            
            // Accedemos a sus DETALLES para la billetera
            if(u.getDetalles() != null && u.getDetalles().getSaldoBilletera() != null) {
                saldoBilleteraBs = u.getDetalles().getSaldoBilletera();
            }
        }

        // 2. Cuentas Bancarias
        dto.setCuentasBancarias(datosPagoRepo.findByActivoTrue());

        try {
            divisaRepo.findById(1).ifPresent(d -> dto.setTasaDolar(d.getTasa()));
            divisaRepo.findById(2).ifPresent(e -> dto.setTasaEur(e.getTasa()));
        } catch (Exception e) {
            System.err.println("Advertencia: tasas.");
        }

        // 3. Buscar Periodo Activo
        List<Periodo> periodos = periodoRepo.findAll();
        Periodo periodoActivo = periodos.stream()
                .filter(p -> "ACTIVO".equalsIgnoreCase(p.getEstatus()))
                .findFirst().orElse(null);

        if (periodoActivo != null) {
            List<ConceptoPago> conceptos = conceptoRepo.findByPeriodoId(periodoActivo.getId());
            conceptos.sort(Comparator.comparing(ConceptoPago::getFechaVencimiento));

            if (!conceptos.isEmpty()) {
                ConceptoPago conceptoAmostrar = null;
                ConceptoPago conceptoSiguiente = null;

                for (int i = 0; i < conceptos.size(); i++) {
                    ConceptoPago candidato = conceptos.get(i);
                    Optional<PagoEstudiante> deudaOpt = pagoEstRepo.findByEstudianteIdAndConceptoId(estudianteId, candidato.getId());

                    boolean estaPagada = false;
                    if (deudaOpt.isPresent()) {
                        if ("APROBADO".equalsIgnoreCase(deudaOpt.get().getEstatusPago())) {
                            estaPagada = true;
                        }
                    }

                    if (!estaPagada) {
                        conceptoAmostrar = candidato;
                        if (i + 1 < conceptos.size()) {
                            conceptoSiguiente = conceptos.get(i + 1);
                        }
                        break; 
                    }
                }

                if (conceptoAmostrar == null) {
                    dto.setConceptoActual("¡Estás Solvente!");
                    dto.setMontoActual(BigDecimal.ZERO);
                    dto.setTotalAbonado(BigDecimal.ZERO);
                    dto.setSimboloMoneda("");
                    dto.setId(null); 
                } else {
                    dto.setConceptoActual(conceptoAmostrar.getNombre());
                    dto.setMontoActual(conceptoAmostrar.getMontoDefault());
                    dto.setFechaVencimientoActual(conceptoAmostrar.getFechaVencimiento().toString());

                    Optional<PagoEstudiante> deudaReal = pagoEstRepo.findByEstudianteIdAndConceptoId(estudianteId, conceptoAmostrar.getId());
                    PagoEstudiante deudaEntidad;
                    
                    if (deudaReal.isPresent()) {
                        deudaEntidad = deudaReal.get();
                    } else {
                        PagoEstudiante nuevaDeuda = new PagoEstudiante();
                        nuevaDeuda.setEstudianteId(estudianteId);
                        nuevaDeuda.setConceptoId(conceptoAmostrar.getId());
                        nuevaDeuda.setMontoFinalDivisa(conceptoAmostrar.getMontoDefault());
                        nuevaDeuda.setMontoAbonado(BigDecimal.ZERO);
                        nuevaDeuda.setEstatusPago("PENDIENTE");
                        deudaEntidad = pagoEstRepo.save(nuevaDeuda);
                    }
                    
                    dto.setId(deudaEntidad.getId());

                    BigDecimal tasa = BigDecimal.ONE;
                    Optional<Divisa> divisaOpt = divisaRepo.findById(conceptoAmostrar.getDivisaId());
                    if (divisaOpt.isPresent()) {
                        dto.setSimboloMoneda(divisaOpt.get().getSimbolo());
                        tasa = divisaOpt.get().getTasa();
                        dto.setTasaAplicada(tasa);
                    } else {
                        dto.setSimboloMoneda("$");
                        dto.setTasaAplicada(BigDecimal.ZERO);
                    }

                    // --- CÁLCULO FINAL DE ABONOS ---
                    BigDecimal abonadoDirectoUSD = deudaEntidad.getMontoAbonado();
                    BigDecimal abonadoDirectoBs = abonadoDirectoUSD.multiply(tasa);
                    
                    // Aquí sumamos lo que ya pagó más lo que tiene en billetera
                    BigDecimal totalVisualBs = abonadoDirectoBs.add(saldoBilleteraBs);
                    
                    dto.setTotalAbonado(totalVisualBs);

                    if (conceptoSiguiente != null) {
                        dto.setConceptoSiguiente(conceptoSiguiente.getNombre());
                        dto.setMontoSiguiente(conceptoSiguiente.getMontoDefault());
                        dto.setFechaVencimientoSiguiente(conceptoSiguiente.getFechaVencimiento().toString());
                    }
                }
            }
        } else {
            dto.setConceptoActual("Periodo Cerrado");
            dto.setMontoActual(BigDecimal.ZERO);
            dto.setTotalAbonado(BigDecimal.ZERO);
        }
        return ResponseEntity.ok(dto);
    }
}