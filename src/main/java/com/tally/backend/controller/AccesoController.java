package com.tally.backend.controller;

import com.tally.backend.model.*;
import com.tally.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Optional;
import java.util.Map;

@RestController
@RequestMapping("/api/acceso")
@CrossOrigin(origins = "*")
public class AccesoController {

    @Autowired private UsuarioRepository usuarioRepo;
    @Autowired private PeriodoRepository periodoRepo;
    @Autowired private ConceptoPagoRepository conceptoRepo;
    @Autowired private PagoEstudianteRepository pagoEstRepo;

    @GetMapping("/verificar/{cedulaRaw}")
    public ResponseEntity<Map<String, Object>> verificarAcceso(@PathVariable String cedulaRaw) {
        // 1. Limpieza
        String cedula = cedulaRaw.toUpperCase().replace("V-", "").replace("E-", "").replace(".", "").trim();

        Map<String, Object> response = new HashMap<>();

        // 2. Buscar Usuario
        Optional<Usuario> userOpt = usuarioRepo.findByCedula(cedula);
        if (userOpt.isEmpty()) {
            response.put("nombre", "Desconocido");
            response.put("cedula", cedulaRaw);
            response.put("estado", "NO REGISTRADO");
            response.put("mensaje", "Usuario no encontrado");
            response.put("fotoPerfil", null);
            return ResponseEntity.ok(response);
        }
        Usuario user = userOpt.get();

        // 3. Buscar Periodo Activo
        Periodo periodoActivo = periodoRepo.findFirstByEstatus("ACTIVO");
        if (periodoActivo == null) {
            response.put("nombre", user.getNombre());
            response.put("cedula", cedulaRaw);
            response.put("estado", "DENEGADO");
            response.put("mensaje", "Sin Periodo Activo");
            response.put("fotoPerfil", user.getFotoPerfil());
            return ResponseEntity.ok(response);
        }

        // 4. Lógica de Estatus
        List<ConceptoPago> conceptos = conceptoRepo.findByPeriodoId(periodoActivo.getId());
        conceptos.sort(Comparator.comparing(ConceptoPago::getFechaVencimiento));

        String estado = "AUTORIZADO";
        String mensaje = "Bienvenido";
        LocalDate hoy = LocalDate.now();

        for (ConceptoPago c : conceptos) {
            Optional<PagoEstudiante> pago = pagoEstRepo.findByEstudianteIdAndConceptoId(user.getId(), c.getId());
            boolean estaPagado = pago.isPresent() && "APROBADO".equalsIgnoreCase(pago.get().getEstatusPago());

            if (estaPagado) continue;

            LocalDate fechaCierre = c.getFechaVencimiento();
            int diasProrroga = c.getProrroga() != null ? c.getProrroga() : 0;
            LocalDate fechaLimite = fechaCierre.plusDays(diasProrroga);

            if (hoy.isAfter(fechaLimite)) {
                estado = "DENEGADO";
                mensaje = "Venció: " + c.getNombre();
                break;
            } else if (hoy.isAfter(fechaCierre)) {
                estado = "PENDIENTE";
                mensaje = "Prórroga: " + c.getNombre();
                break;
            }
        }

        // 5. Construir Respuesta 
        response.put("nombre", user.getNombre() + " " + user.getApellido());
        response.put("cedula", "V-" + cedula);
        response.put("estado", estado);
        response.put("mensaje", mensaje);
        response.put("ultimoPago", LocalDate.now().toString());
        response.put("fotoPerfil", user.getFotoPerfil()); 

        return ResponseEntity.ok(response);
    }
}