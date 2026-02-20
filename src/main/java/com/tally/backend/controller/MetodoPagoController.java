package com.tally.backend.controller;

import com.tally.backend.model.MetodoPago;
import com.tally.backend.repository.MetodoPagoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/metodos")
@CrossOrigin(origins = "*")
public class MetodoPagoController {

    @Autowired
    private MetodoPagoRepository repo;

    @GetMapping("/listar/{usuarioId}")
    public List<MetodoPago> listar(@PathVariable Long usuarioId) {
        return repo.findByUsuarioId(usuarioId);
    }

    @PostMapping("/guardar")
    public ResponseEntity<?> guardar(@RequestBody MetodoPago metodo) {
        repo.save(metodo);
        return ResponseEntity.ok(Map.of("mensaje", "Método guardado"));
    }
    
    @DeleteMapping("/borrar/{id}")
    public ResponseEntity<?> borrar(@PathVariable Long id) {
        repo.deleteById(id);
        return ResponseEntity.ok(Map.of("mensaje", "Borrado"));
    }
}