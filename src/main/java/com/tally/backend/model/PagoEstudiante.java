package com.tally.backend.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "pagos_estudiante")
public class PagoEstudiante {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; 

    private Long estudianteId;
    private Integer conceptoId;
    private BigDecimal montoFinalDivisa; 
    private BigDecimal montoAbonado = BigDecimal.ZERO; 

    private String estatusPago; // PENDIENTE, SOLVENTE, MOROSO, EN REVISION

    @PrePersist
    protected void onCreate() {
        if(estatusPago == null) estatusPago = "PENDIENTE";
        if(montoAbonado == null) montoAbonado = BigDecimal.ZERO;
    }

    // ==========================================
    // GETTERS Y SETTERS 
    // ==========================================
    
    public Long getId() { return id; }
    public void setId(Long id) {this.id = id;}
    public Long getEstudianteId() { return estudianteId; }
    public void setEstudianteId(Long estudianteId) { this.estudianteId = estudianteId; }
    public Integer getConceptoId() { return conceptoId; }
    public void setConceptoId(Integer conceptoId) { this.conceptoId = conceptoId; }
    public BigDecimal getMontoFinalDivisa() { return montoFinalDivisa; }
    public void setMontoFinalDivisa(BigDecimal montoFinalDivisa) { this.montoFinalDivisa = montoFinalDivisa; }
    public BigDecimal getMontoAbonado() { return montoAbonado; }
    public void setMontoAbonado(BigDecimal montoAbonado) { this.montoAbonado = montoAbonado; }
    public String getEstatusPago() { return estatusPago; }
    public void setEstatusPago(String estatusPago) { this.estatusPago = estatusPago; }
}