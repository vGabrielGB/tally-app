package com.tally.backend.repository;

import com.tally.backend.model.DatosPago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DatosPagoRepository extends JpaRepository<DatosPago, Long> {
    // Buscar solo las activas (para mostrárselas al estudiante)
    List<DatosPago> findByActivoTrue();
}