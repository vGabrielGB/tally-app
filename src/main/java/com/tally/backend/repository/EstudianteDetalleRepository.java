package com.tally.backend.repository;

import com.tally.backend.model.EstudianteDetalle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EstudianteDetalleRepository extends JpaRepository<EstudianteDetalle, Long> {
   
}