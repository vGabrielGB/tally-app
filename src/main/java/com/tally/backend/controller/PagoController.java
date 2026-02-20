package com.tally.backend.controller;

import com.tally.backend.model.*;
import com.tally.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.nio.file.*;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/pagos")
@CrossOrigin(origins = "*")
public class PagoController {

    @Autowired private ComprobanteRepository comprobanteRepo;
    @Autowired private PagoEstudianteRepository pagoEstRepo;
    @Autowired private ConceptoPagoRepository conceptoRepo;
    @Autowired private DivisaRepository divisaRepo;
    @Autowired private AuditoriaRepository auditoriaRepo;
    @Autowired private EstudianteDetalleRepository detalleRepo; 

    private final String UPLOAD_DIR = "uploads/";

    @PostMapping("/registrar")
    public ResponseEntity<?> registrarPago(
            @RequestParam("archivo") MultipartFile archivo,
            @RequestParam("deuda_id") Long deudaId,
            @RequestParam("banco") String banco,
            @RequestParam("referencia") String referencia,
            @RequestParam("monto") Double monto,
            @RequestParam("fecha") String fecha
    ) {
        try {
            Optional<PagoEstudiante> deudaOpt = pagoEstRepo.findById(deudaId);
            if (deudaOpt.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error", "Deuda no existe"));
            
            PagoEstudiante deuda = deudaOpt.get();
            
            String nombreArchivo = System.currentTimeMillis() + "_" + archivo.getOriginalFilename();
            Path rutaDestino = Paths.get(UPLOAD_DIR + nombreArchivo);
            if (!Files.exists(Paths.get(UPLOAD_DIR))) Files.createDirectories(Paths.get(UPLOAD_DIR));
            Files.copy(archivo.getInputStream(), rutaDestino, StandardCopyOption.REPLACE_EXISTING);

            Comprobante c = new Comprobante();
            c.setPagoEstudiante(deuda);
            c.setMontoPagadoBs(monto);
            c.setBancoOrigen(banco);
            c.setNumeroReferencia(referencia);
            c.setFechaTransaccion(java.time.LocalDate.parse(fecha));
            c.setUrlArchivo("uploads/" + nombreArchivo);
            c.setEstatusAdmin("PENDIENTE");
            
            deuda.setEstatusPago("EN_REVISION");
            pagoEstRepo.save(deuda);
            comprobanteRepo.save(c);

            return ResponseEntity.ok(Map.of("mensaje", "Enviado"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/pendientes")
    public List<Map<String, Object>> listarPendientes() {
        return comprobanteRepo.buscarPendientesConDetalle();
    }

    @PostMapping("/procesar")
    public ResponseEntity<?> procesarPago(@RequestBody Map<String, Object> datos) {
        try {
            Long idComprobante = Long.valueOf(datos.get("id").toString());
            String nuevoEstatus = datos.get("estatus").toString();
            String motivo = (String) datos.get("motivo");

            Comprobante comp = comprobanteRepo.findById(idComprobante)
                    .orElseThrow(() -> new RuntimeException("Comprobante no encontrado"));

            if (!"PENDIENTE".equalsIgnoreCase(comp.getEstatusAdmin())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Ya procesado"));
            }

            comp.setEstatusAdmin(nuevoEstatus);
            if ("RECHAZADO".equalsIgnoreCase(nuevoEstatus)) comp.setMotivoRechazo(motivo);
            comprobanteRepo.save(comp);

            PagoEstudiante deudaAsociada = comp.getPagoEstudiante();
            Long estudianteId = Long.valueOf(deudaAsociada.getEstudianteId());

            if ("APROBADO".equalsIgnoreCase(nuevoEstatus)) {
                // A. METER DINERO EN BILLETERA
                BigDecimal montoBs = BigDecimal.valueOf(comp.getMontoPagadoBs());
                
                // Buscamos el detalle o creamos uno si por error no existe
                EstudianteDetalle detalle = detalleRepo.findById(estudianteId)
                        .orElse(new EstudianteDetalle());
                // Aseguramos IDs por si es nuevo
                if(detalle.getUsuarioId() == null) detalle.setUsuarioId(estudianteId);
                
                // Sumar
                BigDecimal saldoActual = detalle.getSaldoBilletera() != null ? detalle.getSaldoBilletera() : BigDecimal.ZERO;
                detalle.setSaldoBilletera(saldoActual.add(montoBs));
                detalleRepo.save(detalle);

                // B. COBRAR AUTOMÁTICO
                procesarCobroAutomatico(estudianteId);

                // C.INSCRIPCIÓN
                PagoEstudiante deudaActualizada = pagoEstRepo.findById(deudaAsociada.getId()).orElse(deudaAsociada);
                if ("APROBADO".equalsIgnoreCase(deudaActualizada.getEstatusPago())) {
                    generarDeudasRestantesDelPeriodo(deudaActualizada);
                }

            } else {
                if (!"APROBADO".equalsIgnoreCase(deudaAsociada.getEstatusPago())) {
                    deudaAsociada.setEstatusPago("PENDIENTE");
                    pagoEstRepo.save(deudaAsociada);
                }
            }

            auditoriaRepo.save(new Auditoria("Admin", "ADMIN", nuevoEstatus + " Pago #" + idComprobante));
            return ResponseEntity.ok(Map.of("mensaje", "Procesado"));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private void generarDeudasRestantesDelPeriodo(PagoEstudiante pagoAprobado) {
        try {
            ConceptoPago conceptoPagado = conceptoRepo.findById(pagoAprobado.getConceptoId()).orElse(null);
            if (conceptoPagado == null) return;

            List<ConceptoPago> conceptosPeriodo = conceptoRepo.findByPeriodoId(conceptoPagado.getPeriodoId());
            conceptosPeriodo.sort(Comparator.comparing(ConceptoPago::getFechaVencimiento));

            if (conceptosPeriodo.isEmpty()) return;

            boolean esInscripcion = conceptosPeriodo.get(0).getId().equals(conceptoPagado.getId());

            if (esInscripcion) {
                Long estudianteId = Long.valueOf(pagoAprobado.getEstudianteId());
                for (ConceptoPago c : conceptosPeriodo) {
                    if (c.getId().equals(conceptoPagado.getId())) continue;
                    if (!pagoEstRepo.existsByEstudianteIdAndConceptoId(estudianteId, c.getId())) {
                        PagoEstudiante nueva = new PagoEstudiante();
                        nueva.setEstudianteId(pagoAprobado.getEstudianteId()); 
                        nueva.setConceptoId(c.getId());
                        nueva.setMontoFinalDivisa(c.getMontoDefault());
                        nueva.setMontoAbonado(BigDecimal.ZERO);
                        nueva.setEstatusPago("PENDIENTE");
                        pagoEstRepo.save(nueva);
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Error generando deudas: " + e.getMessage());
        }
    }

    private void procesarCobroAutomatico(Long estudianteId) {
        // 1. Obtener saldo de la NUEVA tabla
        Optional<EstudianteDetalle> detOpt = detalleRepo.findById(estudianteId);
        if (detOpt.isEmpty()) return;
        
        EstudianteDetalle detalle = detOpt.get();
        BigDecimal saldoDisponibleBs = detalle.getSaldoBilletera();
        if (saldoDisponibleBs == null) saldoDisponibleBs = BigDecimal.ZERO;

        List<PagoEstudiante> deudas = pagoEstRepo.findByEstudianteIdAndEstatusPagoNot(estudianteId, "APROBADO");
        
        for (PagoEstudiante deuda : deudas) {
            Optional<ConceptoPago> cOpt = conceptoRepo.findById(deuda.getConceptoId());
            if (cOpt.isEmpty()) continue;
            ConceptoPago c = cOpt.get();

            LocalDate hoy = LocalDate.now();
            if (hoy.isBefore(c.getFechaVencimiento())) {
                if ("EN_REVISION".equalsIgnoreCase(deuda.getEstatusPago())) {
                    deuda.setEstatusPago("PENDIENTE");
                    pagoEstRepo.save(deuda);
                }
                continue; 
            }

            BigDecimal tasa = divisaRepo.findById(c.getDivisaId()).map(Divisa::getTasa).orElse(BigDecimal.ONE);
            BigDecimal costoTotalBs = deuda.getMontoFinalDivisa().multiply(tasa);

            if (saldoDisponibleBs.compareTo(costoTotalBs) >= 0) {
                saldoDisponibleBs = saldoDisponibleBs.subtract(costoTotalBs);
                
                // Actualizar Billetera
                detalle.setSaldoBilletera(saldoDisponibleBs);
                
                // Aprobar Deuda
                deuda.setMontoAbonado(deuda.getMontoFinalDivisa()); 
                deuda.setEstatusPago("APROBADO");
                
                pagoEstRepo.save(deuda);
                detalleRepo.save(detalle);
            } else {
                if ("EN_REVISION".equalsIgnoreCase(deuda.getEstatusPago())) {
                    deuda.setEstatusPago("PENDIENTE");
                    pagoEstRepo.save(deuda);
                }
            }
        }
    }

    // 4. HISTORIAL DE PAGOS
    @GetMapping("/historial/{estudianteId}")
    public ResponseEntity<?> obtenerHistorial(@PathVariable Long estudianteId) {
        try {
            List<Map<String, Object>> historial = comprobanteRepo.buscarHistorialPorEstudiante(estudianteId);
            return ResponseEntity.ok(historial);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
} // Fin de la clase
