package com.tally.backend.repository;

import com.tally.backend.model.Carrera;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CarreraRepository extends JpaRepository<Carrera, Integer> {
    
    Optional<Carrera> findByNombre(String nombre);
}