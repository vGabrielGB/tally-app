package com.tally.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "usuarios")
public class Usuario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String cedula;
    private String nombre;
    private String apellido;
    private String email;
    private String password;
    private String rol;
    private String telefono;
    private Boolean activo = true;
    private String fotoPerfil;

    // Constructor vacío obligatorio
    public Usuario() {}

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getCedula() { return cedula; }
    public void setCedula(String cedula) { this.cedula = cedula; }
    
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getApellido() { return apellido; }
    public void setApellido(String apellido) { this.apellido = apellido; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    
    public String getRol() { return rol; }
    public void setRol(String rol) { this.rol = rol; }

    public String getTelefono() {return telefono;}
    public void setTelefono(String telefono) {this.telefono = telefono;}

    public Boolean getActivo() {return activo; }
    public void setActivo(Boolean activo) { this.activo = activo;}

    public String getFotoPerfil() { return fotoPerfil; }
    public void setFotoPerfil(String fotoPerfil) { this.fotoPerfil = fotoPerfil; }

  
    @OneToOne(mappedBy = "usuario", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private EstudianteDetalle detalles;

    // Getter y Setter para detalles
    public EstudianteDetalle getDetalles() { return detalles; }
    public void setDetalles(EstudianteDetalle detalles) {
        this.detalles = detalles;
        if (detalles != null) {
            detalles.setUsuario(this); // Vinculación bidireccional
        }
    }
    // Simula que el usuario tiene carrera directa
    public String getCarreraNombre() {
        if (detalles != null && detalles.getCarrera() != null) {
            return detalles.getCarrera().getNombre();
        }
        return null;
    }

    // Simula que el usuario tiene extensión directa
    public String getExtensionNombre() {
        if (detalles != null && detalles.getExtension() != null) {
            return detalles.getExtension().getNombre();
        }
        return null;
    }
    
    public Integer getExtensionId() {
        if (detalles != null && detalles.getExtension() != null) {
            return detalles.getExtension().getId();
        }
        return null;
    }
    
}