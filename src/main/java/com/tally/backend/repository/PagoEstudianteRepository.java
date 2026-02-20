package com.tally.backend.repository;

import com.tally.backend.model.PagoEstudiante;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PagoEstudianteRepository extends JpaRepository<PagoEstudiante, Long> {

    // Buscar deuda específica
@Query("SELECT p FROM PagoEstudiante p WHERE p.estudianteId = :estId AND p.conceptoId = :conId")
Optional<PagoEstudiante> findByEstudianteIdAndConceptoId(
       @Param("estId") Long estudianteId, 
       @Param("conId") Integer conceptoId
);

List<PagoEstudiante> findByEstudianteIdAndEstatusPago(Long estudianteId, String estatusPago);
boolean existsByEstudianteIdAndConceptoId(Long estudianteId, Integer conceptoId);

    // Contar morosos
long countByEstatusPagoNot(String estatus);

@Query("SELECT cp.nombre, " +
       "SUM(CASE WHEN p.estatusPago = 'APROBADO' THEN 1 ELSE 0 END), " +
       "COUNT(p) " +
       "FROM PagoEstudiante p JOIN ConceptoPago cp ON p.conceptoId = cp.id " +
       "GROUP BY cp.id, cp.nombre, cp.fechaVencimiento " +
       "ORDER BY cp.fechaVencimiento")
List<Object[]> obtenerEstadisticasPorCuota();

    List<PagoEstudiante> findByEstudianteIdAndEstatusPagoNot(Long estudianteId, String estatusPago);

    // 1. Busca pagos que NO estén APROBADOS.
    // 2. Y verifica que la fecha de vencimiento sea ANTERIOR a hoy (< CURRENT_DATE).
    @Query("SELECT COUNT(DISTINCT p.estudianteId) FROM PagoEstudiante p " +
           "JOIN ConceptoPago c ON p.conceptoId = c.id " +
           "WHERE p.estatusPago <> 'APROBADO' " +
           "AND c.fechaVencimiento < CURRENT_DATE")
    long contarEstudiantesMorososReales();

    @Query("SELECT COUNT(p) FROM PagoEstudiante p " +
           "JOIN ConceptoPago c ON p.conceptoId = c.id " +
           "JOIN Periodo per ON c.periodoId = per.id " +
           "WHERE p.estudianteId = :estudianteId " +
           "AND per.estatus = 'ACTIVO' " +
           "AND c.nombre LIKE '%Inscripción%' " + // Busca conceptos que digan "Inscripción"
           "AND p.estatusPago = 'APROBADO'")
    long verificarInscripcionActiva(@Param("estudianteId") Long estudianteId);

    @Query("SELECT cp.nombre, " +
           "SUM(CASE WHEN p.estatusPago = 'APROBADO' THEN 1 ELSE 0 END), " + // Pagados
           "COUNT(p) " + // Total asignados
           "FROM PagoEstudiante p " +
           "JOIN ConceptoPago cp ON p.conceptoId = cp.id " +
           "JOIN Periodo per ON cp.periodoId = per.id " +
           "WHERE per.estatus = 'ACTIVO' " +
           "GROUP BY cp.id, cp.nombre, cp.fechaVencimiento " +
           "ORDER BY cp.fechaVencimiento")
    List<Object[]> obtenerEstadisticasPeriodoActivo();

    // 2. TOTAL ESTUDIANTES REALES
    @Query("SELECT COUNT(DISTINCT p.estudianteId) FROM PagoEstudiante p " +
           "JOIN ConceptoPago c ON p.conceptoId = c.id " +
           "JOIN Periodo per ON c.periodoId = per.id " +
           "WHERE per.estatus = 'ACTIVO' " +
           "AND c.nombre LIKE '%Inscripción%' " +
           "AND p.estatusPago = 'APROBADO'")
    long contarInscritosReales();

    // 3. MOROSOS VENCIDOS
    @Query("SELECT COUNT(DISTINCT p.estudianteId) FROM PagoEstudiante p " +
           "JOIN ConceptoPago c ON p.conceptoId = c.id " +
           "WHERE p.estatusPago <> 'APROBADO' " +
           "AND c.fechaVencimiento < CURRENT_DATE " + 
           "AND c.nombre NOT LIKE '%Inscripción%'")   
    long contarMorososVencidosSinInscripcion();
}