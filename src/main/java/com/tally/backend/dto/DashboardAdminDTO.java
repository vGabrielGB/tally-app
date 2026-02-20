package com.tally.backend.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class DashboardAdminDTO {
    private long pagosPorRevisar;
    private long estudiantesMorosos;
    private BigDecimal totalRecaudado;
    private long totalEstudiantes;
    
    
    // Lista para el gráfico:
    private List<Map<String, Object>> datosGrafico;

    public DashboardAdminDTO() {}

    // Getters y Setters
    public long getPagosPorRevisar() { return pagosPorRevisar; }
    public void setPagosPorRevisar(long pagosPorRevisar) { this.pagosPorRevisar = pagosPorRevisar; }
    public long getEstudiantesMorosos() { return estudiantesMorosos; }
    public void setEstudiantesMorosos(long estudiantesMorosos) { this.estudiantesMorosos = estudiantesMorosos; }
    public BigDecimal getTotalRecaudado() { return totalRecaudado; }
    public void setTotalRecaudado(BigDecimal totalRecaudado) { this.totalRecaudado = totalRecaudado; }
    public List<Map<String, Object>> getDatosGrafico() { return datosGrafico; }
    public void setDatosGrafico(List<Map<String, Object>> datosGrafico) { this.datosGrafico = datosGrafico; }
    public long getTotalEstudiantes() { return totalEstudiantes; }
    public void setTotalEstudiantes(long totalEstudiantes) { this.totalEstudiantes = totalEstudiantes; }
}