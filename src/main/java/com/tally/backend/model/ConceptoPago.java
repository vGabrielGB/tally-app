package com.tally.backend.model;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "conceptos_pago")
public class ConceptoPago {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private Integer periodoId;
    private Integer divisaId; 
    private String nombre;    
    private BigDecimal montoDefault;
    private LocalDate fechaVencimiento;
    private Boolean activo;
    private Integer prorroga; 

    // Getters y Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public Integer getPeriodoId() { return periodoId; }
    public void setPeriodoId(Integer periodoId) { this.periodoId = periodoId; }
    public Integer getDivisaId() { return divisaId; }
    public void setDivisaId(Integer divisaId) { this.divisaId = divisaId; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public BigDecimal getMontoDefault() { return montoDefault; }
    public void setMontoDefault(BigDecimal montoDefault) { this.montoDefault = montoDefault; }
    public LocalDate getFechaVencimiento() { return fechaVencimiento; }
    public void setFechaVencimiento(LocalDate fechaVencimiento) { this.fechaVencimiento = fechaVencimiento; }
    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }
    public Integer getProrroga() { return prorroga; }
    public void setProrroga(Integer prorroga) { this.prorroga = prorroga; }
}