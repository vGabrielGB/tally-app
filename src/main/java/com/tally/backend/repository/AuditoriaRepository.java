package com.tally.backend.repository;

import com.tally.backend.model.Auditoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AuditoriaRepository extends JpaRepository<Auditoria, Long> {
    // Obtener las últimas 10 acciones
    List<Auditoria> findTop10ByOrderByFechaDesc();
}