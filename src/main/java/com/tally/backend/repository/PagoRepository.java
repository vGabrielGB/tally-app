package com.tally.backend.repository;

import com.tally.backend.model.Comprobante; 
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface PagoRepository extends JpaRepository<Comprobante, Long> {
    
    // Contar cuántos pagos tiene un estudiante en estatus PENDIENTE
    @Query(value = "SELECT COUNT(*) FROM comprobantes WHERE pago_estudiante_id = ?1 AND estatus_admin = 'PENDIENTE'", nativeQuery = true)
    int countPendientes(Long estudianteId);
}