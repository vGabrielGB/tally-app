package com.tally.backend.repository;

import com.tally.backend.model.Divisa;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface DivisaRepository extends JpaRepository<Divisa, Integer> {
    // Para buscar por "USD" o "EUR" 
    Optional<Divisa> findByCodigo(String codigo);
}