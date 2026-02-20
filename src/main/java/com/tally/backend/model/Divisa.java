package com.tally.backend.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "divisas")
public class Divisa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(unique = true, nullable = false, length = 3)
    private String codigo; // USD EUR

    private String nombre; // Dólar
    private String simbolo; // $

    private BigDecimal tasa; 

    // --- CONSTRUCTORES ---
    public Divisa() {}

    public Divisa(String codigo, String nombre, String simbolo, BigDecimal tasa) {
        this.codigo = codigo;
        this.nombre = nombre;
        this.simbolo = simbolo;
        this.tasa = tasa;
    }

    // --- GETTERS Y SETTERS ---
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getSimbolo() { return simbolo; }
    public void setSimbolo(String simbolo) { this.simbolo = simbolo; }

    public BigDecimal getTasa() { return tasa; }
    public void setTasa(BigDecimal tasa) { this.tasa = tasa; }
}