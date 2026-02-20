package com.tally.backend.repository;

import com.tally.backend.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    
    Optional<Usuario> findByCedula(String cedula); 

    List<Usuario> findByRol(String rol);
    long countByRol(String rol);

    boolean existsByCedula(String cedula);
    
}