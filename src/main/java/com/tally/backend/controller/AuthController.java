package com.tally.backend.controller;

import com.tally.backend.model.Usuario;
import com.tally.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UsuarioRepository usuarioRepo;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credenciales) {
        String cedula = credenciales.get("cedula");
        String password = credenciales.get("password");

        // 1. Buscar usuario
        Optional<Usuario> userOpt = usuarioRepo.findByCedula(cedula);

        if (userOpt.isPresent()) {
            Usuario usuario = userOpt.get();

            // 2. Verificar si está ACTIVO
            if (usuario.getActivo() != null && !usuario.getActivo()) {
                return ResponseEntity.status(403).body(Map.of("error", "Usuario inactivo. Contacte a soporte."));
            }

            // 3. Verificar Contraseña (quitando el {noop} si existe)
            String passDb = usuario.getPassword().replace("{noop}", "");
            
            if (passDb.equals(password)) {
                // 4. Determinar a dónde redirigir según el ROL
                String redirectUrl = "index.html"; 
                String rol = usuario.getRol().toUpperCase();

                switch (rol) {
                    case "ESTUDIANTE":
                        redirectUrl = "estudiante.html";
                        break;
                    case "ADMINISTRADOR": 
                        redirectUrl = "dueño.html";
                        break;
                    case "GERENTE": 
                        redirectUrl = "admin.html";
                        break;
                    case "VERIFICADOR":
                        redirectUrl = "verificador.html";
                        break;
                }
                return ResponseEntity.ok(Map.of(
                    "mensaje", "Login exitoso",
                    "id", usuario.getId(),
                    "nombre", usuario.getNombre(),
                    "redirect", redirectUrl + "?id=" + usuario.getId()
                ));
            }
        }

        return ResponseEntity.status(401).body(Map.of("error", "Cédula o contraseña incorrecta"));
    }
}