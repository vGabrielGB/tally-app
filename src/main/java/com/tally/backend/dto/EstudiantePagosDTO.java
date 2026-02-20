package com.tally.backend.dto;

import java.math.BigDecimal;
import java.util.List;
import com.tally.backend.model.DatosPago;

public class EstudiantePagosDTO {

    private Long id;
    private String conceptoActual;
    private BigDecimal montoActual;
    private String simboloMoneda;
    private BigDecimal tasaAplicada;
    private BigDecimal totalAbonado;
    private String fechaVencimientoActual;
    
    private String conceptoSiguiente;
    private BigDecimal montoSiguiente;
    private String fechaVencimientoSiguiente;

    private BigDecimal tasaDolar;
    private BigDecimal tasaEur;
    
    private List<DatosPago> cuentasBancarias;

    private String nombreEstudiante;
    private String fotoPerfil;

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getConceptoActual() { return conceptoActual; }
    public void setConceptoActual(String conceptoActual) { this.conceptoActual = conceptoActual; }
    public BigDecimal getMontoActual() { return montoActual; }
    public void setMontoActual(BigDecimal montoActual) { this.montoActual = montoActual; }
    public String getSimboloMoneda() { return simboloMoneda; }
    public void setSimboloMoneda(String simboloMoneda) { this.simboloMoneda = simboloMoneda; }
    public BigDecimal getTasaAplicada() { return tasaAplicada; }
    public void setTasaAplicada(BigDecimal tasaAplicada) { this.tasaAplicada = tasaAplicada; }
    public BigDecimal getTotalAbonado() { return totalAbonado; }
    public void setTotalAbonado(BigDecimal totalAbonado) { this.totalAbonado = totalAbonado; }
    public String getFechaVencimientoActual() { return fechaVencimientoActual; }
    public void setFechaVencimientoActual(String fechaVencimientoActual) { this.fechaVencimientoActual = fechaVencimientoActual; }
    public String getConceptoSiguiente() { return conceptoSiguiente; }
    public void setConceptoSiguiente(String conceptoSiguiente) { this.conceptoSiguiente = conceptoSiguiente; }
    public BigDecimal getMontoSiguiente() { return montoSiguiente; }
    public void setMontoSiguiente(BigDecimal montoSiguiente) { this.montoSiguiente = montoSiguiente; }
    public String getFechaVencimientoSiguiente() { return fechaVencimientoSiguiente; }
    public void setFechaVencimientoSiguiente(String fechaVencimientoSiguiente) { this.fechaVencimientoSiguiente = fechaVencimientoSiguiente; }
    public BigDecimal getTasaDolar() { return tasaDolar; }
    public void setTasaDolar(BigDecimal tasaDolar) { this.tasaDolar = tasaDolar; }
    public BigDecimal getTasaEur() { return tasaEur; }
    public void setTasaEur(BigDecimal tasaEur) { this.tasaEur = tasaEur; }
    public List<DatosPago> getCuentasBancarias() { return cuentasBancarias; }
    public void setCuentasBancarias(List<DatosPago> cuentasBancarias) { this.cuentasBancarias = cuentasBancarias; }

    public String getNombreEstudiante() { return nombreEstudiante; }
    public void setNombreEstudiante(String nombreEstudiante) { this.nombreEstudiante = nombreEstudiante; }
    public String getFotoPerfil() { return fotoPerfil; }
    public void setFotoPerfil(String fotoPerfil) { this.fotoPerfil = fotoPerfil; }
}