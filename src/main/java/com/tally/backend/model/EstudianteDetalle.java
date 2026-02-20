package com.tally.backend.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "estudiante_detalles")
public class EstudianteDetalle {

    @Id
    private Long usuarioId;

    @OneToOne
    @MapsId
    @JoinColumn(name = "usuario_id")
    @JsonIgnore
    private Usuario usuario;

    
    @ManyToOne
    @JoinColumn(name = "carrera_id")
    private Carrera carrera;

    @ManyToOne
    @JoinColumn(name = "extension_id")
    private Extension extension;

    @Column(name = "saldo_billetera")
    private BigDecimal saldoBilletera = BigDecimal.ZERO;

    public EstudianteDetalle() {}

    // Getters y Setters...
    public Long getUsuarioId() { return usuarioId; }
    public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }

    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }

    public Carrera getCarrera() { return carrera; }
    public void setCarrera(Carrera carrera) { this.carrera = carrera; }

    public Extension getExtension() { return extension; }
    public void setExtension(Extension extension) { this.extension = extension; }

    public BigDecimal getSaldoBilletera() { return saldoBilletera; }
    public void setSaldoBilletera(BigDecimal saldoBilletera) { this.saldoBilletera = saldoBilletera; }
}