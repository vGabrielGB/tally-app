package com.tally.backend.controller;

import com.tally.backend.repository.ComprobanteRepository;
import com.tally.backend.repository.PagoEstudianteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList; // Importante
import java.util.HashMap;   // Importante
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired private ComprobanteRepository comprobanteRepo;
    @Autowired private PagoEstudianteRepository pagoEstRepo;


    @GetMapping("/dashboard-stats")
    public ResponseEntity<?> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        // 1. Pagos por Revisar
        long pendientes = comprobanteRepo.countByEstatusAdmin("PENDIENTE");
        stats.put("pagosPorRevisar", pendientes);

        // 2.Total = Inscritos Reales
        long totalInscritos = pagoEstRepo.contarInscritosReales();
        stats.put("totalEstudiantes", totalInscritos);

        // Morosos = Vencidos sin inscripción
        long morosos = pagoEstRepo.contarMorososVencidosSinInscripcion();
        stats.put("estudiantesMorosos", morosos);

        // 3. Total Recaudado 
        Double totalDinero = comprobanteRepo.sumTotalIngresos();
        stats.put("totalRecaudado", totalDinero != null ? totalDinero : 0.0);

        // 4. GRÁFICO
        List<Object[]> rawData = pagoEstRepo.obtenerEstadisticasPeriodoActivo();
        List<Map<String, Object>> grafico = new ArrayList<>();

        for (Object[] row : rawData) {
            Map<String, Object> item = new HashMap<>();
            String label = (String) row[0];
            Long pagados = ((Number) row[1]).longValue();
            Long total = ((Number) row[2]).longValue();

            item.put("label", label);
            item.put("pagados", pagados);
            item.put("total", total);
            grafico.add(item);
        }
        stats.put("datosGrafico", grafico);

        return ResponseEntity.ok(stats);
    }
}