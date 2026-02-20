package com.tally.backend.controller;

import com.tally.backend.model.Auditoria;
import com.tally.backend.repository.AuditoriaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auditoria")
@CrossOrigin(origins = "*")
public class AuditoriaController {

    @Autowired
    private AuditoriaRepository auditoriaRepo;

    @GetMapping("/listar")
    public List<Auditoria> listarAuditoria() {
        return auditoriaRepo.findAll(
            org.springframework.data.domain.PageRequest.of(0, 50, 
            org.springframework.data.domain.Sort.by("fecha").descending())
        ).getContent();
    }
}