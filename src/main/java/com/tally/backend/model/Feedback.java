package com.tally.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "feedback")
public class Feedback {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String tipo; // Sugerencia, Bug, etc.
    private String comentario;
    
    @Column(name = "fecha_enviado")
    private LocalDateTime fechaEnviado;

    // Constructor vacío
    public Feedback() {}

    // Constructor para facilitar la creación
    public Feedback(String tipo, String comentario) {
        this.tipo = tipo;
        this.comentario = comentario;
        this.fechaEnviado = LocalDateTime.now();
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    
    public String getComentario() { return comentario; }
    public void setComentario(String comentario) { this.comentario = comentario; }
    
    public LocalDateTime getFechaEnviado() { return fechaEnviado; }
    public void setFechaEnviado(LocalDateTime fechaEnviado) { this.fechaEnviado = fechaEnviado; }
}