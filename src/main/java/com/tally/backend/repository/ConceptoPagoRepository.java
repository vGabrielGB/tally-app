package com.tally.backend.repository;

import com.tally.backend.model.ConceptoPago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ConceptoPagoRepository extends JpaRepository<ConceptoPago, Integer> {
    
    // Busca todas las cuotas que pertenecen a un periodo
    List<ConceptoPago> findByPeriodoId(Integer periodoId);
}