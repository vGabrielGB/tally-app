package com.tally.backend.repository;

import com.tally.backend.model.Comprobante;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public interface ComprobanteRepository extends JpaRepository<Comprobante, Long> {


    // Agregamos 'c.telefonoOrigen as telefono_origen'
    @Query("SELECT c.id as id, " +
           "u.nombre as nombre, " +
           "u.apellido as apellido, " +
           "u.cedula as cedula, " +
           "c.bancoOrigen as banco_origen, " +
           "c.numeroReferencia as numero_referencia, " +
           "c.montoPagadoBs as monto_pagado_bs, " +
           "c.urlArchivo as url_archivo, " +
           "c.telefonoOrigen as telefono_origen " + // <--- ¡ESTA LÍNEA FALTABA!
           "FROM Comprobante c, PagoEstudiante pe, Usuario u " +
           "WHERE c.pagoEstudiante.id = pe.id " +
           "AND pe.estudianteId = u.id " +
           "AND c.estatusAdmin = 'PENDIENTE'")
    List<Map<String, Object>> buscarPendientesConDetalle();

    long countByEstatusAdmin(String estatus);

    @Query("SELECT SUM(c.montoPagadoBs) FROM Comprobante c WHERE c.estatusAdmin = 'APROBADO'")
Double sumTotalIngresos();
boolean existsByPagoEstudiante_EstudianteIdAndEstatusAdmin(Long estudianteId, String estatusAdmin);

@Query("SELECT new map(" +
           "c.fechaTransaccion as fecha, " +
           "cp.nombre as concepto, " +
           "c.numeroReferencia as referencia, " +
           "c.bancoOrigen as banco, " +
           "c.montoPagadoBs as monto, " +
           "c.estatusAdmin as estatus) " +
           "FROM Comprobante c " +
           "JOIN c.pagoEstudiante pe " +
           "JOIN ConceptoPago cp ON pe.conceptoId = cp.id " +
           "WHERE pe.estudianteId = :estId " +
           "ORDER BY c.fechaTransaccion DESC")
    List<Map<String, Object>> buscarHistorialPorEstudiante(@Param("estId") Long estId);
}
