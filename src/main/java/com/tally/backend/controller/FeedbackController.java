package com.tally.backend.controller;

import com.tally.backend.model.Feedback;
import com.tally.backend.repository.FeedbackRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

import java.util.Map;

@RestController // Indica que devuelve datos (JSON)
@RequestMapping("/api/feedback")
@CrossOrigin(origins = "*")
public class FeedbackController {

    @Autowired
    private FeedbackRepository feedbackRepo;

    @PostMapping("/enviar")
    public ResponseEntity<?> recibirFeedback(@RequestBody Map<String, String> datos) {
        try {
            String tipo = datos.get("tipo");
            String comentario = datos.get("comentario");

            // Crear y guardar
            Feedback nuevoFeedback = new Feedback(tipo, comentario);
            feedbackRepo.save(nuevoFeedback);

            return ResponseEntity.ok().body(Map.of("mensaje", "¡Feedback recibido con éxito!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Error al guardar"));
        }
    }

    @GetMapping("/listar")
    public List<Feedback> listarFeedback() {

        return feedbackRepo.findAll();
    }
}