package com.tally.backend.model;

import jakarta.persistence.*; // Si usas Spring Boot viejo (2.x) cambia 'jakarta' por 'javax'

@Entity
@Table(name = "extensiones")
public class Extension {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true, length = 100)
    private String nombre;

    public Extension() {} // Constructor vacío requerido por JPA

    public Extension(Integer id, String nombre) {
        this.id = id;
        this.nombre = nombre;
    }

    // Getters y Setters
    public Integer getId() {return id;}

    public void setId(Integer id) { this.id = id;}

    public String getNombre() {return nombre;}

    public void setNombre(String nombre) {this.nombre = nombre;}
}