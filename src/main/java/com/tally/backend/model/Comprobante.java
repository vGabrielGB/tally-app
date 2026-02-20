package com.tally.backend.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "comprobantes")
public class Comprobante {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Relación con PagoEstudiante
    @ManyToOne
    @JoinColumn(name = "pago_estudiante_id", nullable = false)
    private PagoEstudiante pagoEstudiante;

    private Double montoPagadoBs;
    private String bancoOrigen;
    private String numeroReferencia;
    private String telefonoOrigen;
    private LocalDate fechaTransaccion;
    private String urlArchivo;
    private String motivoRechazo;

    private String estatusAdmin; // "PENDIENTE", "APROBADO", "RECHAZADO"

    @Column(columnDefinition = "TEXT")
    private String notasAdmin; // Notas del administrador

    private LocalDateTime fechaSubida;

    // Constructor vacío
    public Comprobante() {
        this.fechaSubida = LocalDateTime.now();
        this.estatusAdmin = "PENDIENTE";
    }

    // Getters y setters

    public Long getId() {return id;}
    public void setId(Long id) {this.id = id;}

    // Getter y setter para PagoEstudiante
    public PagoEstudiante getPagoEstudiante() {return pagoEstudiante;}

    public void setPagoEstudiante(PagoEstudiante pagoEstudiante) {this.pagoEstudiante = pagoEstudiante;}

    public Double getMontoPagadoBs() {return montoPagadoBs;}

    public void setMontoPagadoBs(Double montoPagadoBs) {this.montoPagadoBs = montoPagadoBs;}

    public String getBancoOrigen() {return bancoOrigen;}

    public void setBancoOrigen(String bancoOrigen) {this.bancoOrigen = bancoOrigen;}

    public String getNumeroReferencia() {return numeroReferencia;}

    public void setNumeroReferencia(String numeroReferencia) {this.numeroReferencia = numeroReferencia;}

    public String getTelefonoOrigen() {return telefonoOrigen;}

    public void setTelefonoOrigen(String telefonoOrigen) {this.telefonoOrigen = telefonoOrigen;}

    public LocalDate getFechaTransaccion() {return fechaTransaccion;}

    public void setFechaTransaccion(LocalDate fechaTransaccion) {this.fechaTransaccion = fechaTransaccion;}

    public String getUrlArchivo() {return urlArchivo;}

    public void setUrlArchivo(String urlArchivo) {this.urlArchivo = urlArchivo;}

    public String getEstatusAdmin() {
        return estatusAdmin;
    }

    public void setEstatusAdmin(String estatusAdmin) {
        this.estatusAdmin = estatusAdmin;
    }

    // Getter y setter para NotasAdmin
    public String getNotasAdmin() {
        return notasAdmin;
    }

    public void setNotasAdmin(String notasAdmin) {
        this.notasAdmin = notasAdmin;
    }

    public LocalDateTime getFechaSubida() {
        return fechaSubida;
    }

    public void setFechaSubida(LocalDateTime fechaSubida) {
        this.fechaSubida = fechaSubida;
    }

    public String getMotivoRechazo() { return motivoRechazo; }
public void setMotivoRechazo(String motivoRechazo) { this.motivoRechazo = motivoRechazo; }
}