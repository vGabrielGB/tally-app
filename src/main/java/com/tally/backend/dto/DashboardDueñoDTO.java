package com.tally.backend.dto;

import com.tally.backend.model.Auditoria;
import java.math.BigDecimal;
import java.util.List;

public class DashboardDueñoDTO {
    private BigDecimal ingresos;
    private Long totalEstudiantes;
    private Long morosos;
    private Integer porcentajeSolvencia;
    private BigDecimal tasaBcv;
    private List<Auditoria> auditoria;

    // Getters y Setters
    public BigDecimal getIngresos() { return ingresos; }
    public void setIngresos(BigDecimal ingresos) { this.ingresos = ingresos; }

    public Long getTotalEstudiantes() { return totalEstudiantes; }
    public void setTotalEstudiantes(Long totalEstudiantes) { this.totalEstudiantes = totalEstudiantes; }

    public Long getMorosos() { return morosos; }
    public void setMorosos(Long morosos) { this.morosos = morosos; }

    public Integer getPorcentajeSolvencia() { return porcentajeSolvencia; }
    public void setPorcentajeSolvencia(Integer porcentajeSolvencia) { this.porcentajeSolvencia = porcentajeSolvencia; }

    public BigDecimal getTasaBcv() { return tasaBcv; }
    public void setTasaBcv(BigDecimal tasaBcv) { this.tasaBcv = tasaBcv; }

    public List<Auditoria> getAuditoria() { return auditoria; }
    public void setAuditoria(List<Auditoria> auditoria) { this.auditoria = auditoria; }
}