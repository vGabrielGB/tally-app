package com.tally.backend.repository;

import com.tally.backend.model.Periodo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PeriodoRepository extends JpaRepository<Periodo, Integer> {
    
    // Busca el primer periodo que tenga estatus 'ACTIVO'
    Periodo findFirstByEstatus(String estatus);
}