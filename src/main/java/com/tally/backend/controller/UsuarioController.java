package com.tally.backend.controller;

import com.tally.backend.model.Usuario;
import com.tally.backend.repository.PagoEstudianteRepository;
import com.tally.backend.repository.UsuarioRepository;
import com.tally.backend.repository.ExtensionRepository; 
import com.tally.backend.model.Extension; 
import com.tally.backend.model.Carrera;
import com.tally.backend.model.EstudianteDetalle;
import com.tally.backend.repository.CarreraRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.*;
import java.util.Map;       
import java.util.Optional;  
import java.util.HashMap;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "*") 
public class UsuarioController {

    @Autowired private UsuarioRepository usuarioRepo;
    @Autowired private PagoEstudianteRepository PagoRepo;
    @Autowired private ConfigController configController;
    @Autowired private CarreraRepository carreraRepo;
    @Autowired private ExtensionRepository extensionRepo;

// 1. ENDPOINT PARA LLENAR SELECT DE CARRERAS
    @GetMapping("/recursos/carreras")
    public List<Carrera> obtenerCarreras() {
        return carreraRepo.findAll();
    }

    // 2. ENDPOINT PARA LLENAR SELECT DE EXTENSIONES
    @GetMapping("/recursos/extensiones")
    public List<Extension> obtenerExtensiones() {
        return extensionRepo.findAll();
    }

// 1. LISTAR (Usando los métodos de ayuda que se crearon en Usuario.java)
    @GetMapping("/estudiantes")
    public List<Map<String, Object>> listarEstudiantes() {
        List<Usuario> estudiantes = usuarioRepo.findByRol("ESTUDIANTE");
        
        return estudiantes.stream().map(e -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", e.getId());
            map.put("nombre", e.getNombre());
            map.put("apellido", e.getApellido());
            map.put("cedula", e.getCedula());
            map.put("email", e.getEmail());
            map.put("telefono", e.getTelefono());
            map.put("fotoPerfil", e.getFotoPerfil());
            map.put("activo", e.getActivo());

            // MÉTODOS HELPER
            map.put("carrera", e.getCarreraNombre());
            map.put("extension", e.getExtensionNombre());
            map.put("extensionId", e.getExtensionId());

            long inscripcion = PagoRepo.verificarInscripcionActiva(e.getId());
            map.put("estatus", (inscripcion > 0) ? "INSCRITO" : "PENDIENTE");
            
            return map;
        }).collect(Collectors.toList());
    }

    // --- REGISTRAR ESTUDIANTE
    @PostMapping("/registrar")
    public ResponseEntity<?> registrarEstudiante(@RequestBody Map<String, Object> payload) {
        try {
            Usuario usuario = new Usuario();
            
            // 1. Datos Básicos
            usuario.setNombre((String) payload.get("nombre"));
            usuario.setApellido((String) payload.get("apellido"));
            usuario.setCedula((String) payload.get("cedula"));
            usuario.setEmail((String) payload.get("email"));
            usuario.setPassword("{noop}" + payload.get("password"));
            usuario.setRol("ESTUDIANTE");

            // 2. Datos Detalles (Tabla Separada)
            EstudianteDetalle detalles = new EstudianteDetalle();
            
            // Carrera
            String nombreCarrera = (String) payload.get("carrera");
            if(nombreCarrera != null) {
                carreraRepo.findByNombre(nombreCarrera).ifPresent(detalles::setCarrera);
            }

            // Extensión
            if (payload.get("extensionId") != null) {
                Integer extId = Integer.valueOf(payload.get("extensionId").toString());
                extensionRepo.findById(extId).ifPresent(detalles::setExtension);
            } else {
                extensionRepo.findById(1).ifPresent(detalles::setExtension); // Default Maracay
            }

            // VINCULAR
            usuario.setDetalles(detalles); // Esto conecta usuario <-> detalles
            
            // 3. Guardar
            if ("ESTUDIANTE".equalsIgnoreCase(usuario.getRol())) {
                configController.asignarConceptosExistentesANuevoUsuario(usuario);
            }
            
            usuarioRepo.save(usuario); // Cascade guarda los detalles automáticamente

            return ResponseEntity.ok(Map.of("mensaje", "Estudiante registrado correctamente"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", "Error en registro: " + e.getMessage()));
        }
    }
    // Endpoint para obtener datos del perfil
    @GetMapping("/perfil/{id}")
    public ResponseEntity<Map<String, Object>> getPerfil(@PathVariable Long id) {
        Optional<Usuario> userOpt = usuarioRepo.findById(id);
        
        if (userOpt.isPresent()) {
            Usuario e = userOpt.get();
            Map<String, Object> map = new HashMap<>();
            
            // Datos básicos
            map.put("id", e.getId());
            map.put("nombre", e.getNombre());
            map.put("apellido", e.getApellido());
            map.put("cedula", e.getCedula());
            map.put("email", e.getEmail());
            map.put("telefono", e.getTelefono());
            map.put("fotoPerfil", e.getFotoPerfil());
            map.put("activo", e.getActivo());
            map.put("carrera", e.getCarreraNombre()); 
            map.put("extension", e.getExtensionNombre());
            map.put("extensionId", e.getExtensionId());

            return ResponseEntity.ok(map);
        }
        return ResponseEntity.notFound().build();
    }

    // Endpoint para ACTUALIZAR perfil
    @PutMapping("/perfil/actualizar")
    public ResponseEntity<?> actualizarPerfil(@RequestBody Map<String, Object> datos) {
        try {
            // Convertimos el ID de forma segura
            Long id = Long.valueOf(datos.get("id").toString());
            Optional<Usuario> userOpt = usuarioRepo.findById(id);
            
            if (userOpt.isPresent()) {
                Usuario user = userOpt.get();
                
                // Actualizar campos básicos si vienen en el JSON
                if (datos.containsKey("nombre")) user.setNombre((String) datos.get("nombre"));
                if (datos.containsKey("apellido")) user.setApellido((String) datos.get("apellido"));
                if (datos.containsKey("telefono")) user.setTelefono((String) datos.get("telefono"));
                if (datos.containsKey("email")) user.setEmail((String) datos.get("email"));
                
                // Actualizar Contraseña (Solo si enviaron una nueva y no está vacía)
                String nuevaClave = (String) datos.get("password");
                if (nuevaClave != null && !nuevaClave.trim().isEmpty()) {
                    
                    if(!nuevaClave.startsWith("{noop}")) {
                        user.setPassword("{noop}" + nuevaClave); 
                    } else {
                        user.setPassword(nuevaClave);
                    }
                }

                usuarioRepo.save(user);
                return ResponseEntity.ok(Map.of("mensaje", "Perfil actualizado correctamente"));
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", "Error actualizando perfil"));
        }
    }

    // 1. LISTAR PERSONAL (Todos menos los ESTUDIANTE)
    @GetMapping("/personal")
    public List<Usuario> listarPersonal() {
        return usuarioRepo.findAll().stream()
                .filter(u -> !"ESTUDIANTE".equalsIgnoreCase(u.getRol()))
                .collect(Collectors.toList());
    }

    // 2. CREAR PERSONAL (Admin o Verificador)
    @PostMapping("/personal")
    public ResponseEntity<?> crearPersonal(@RequestBody Usuario usuario) {
        try {
            // Validar que no sea estudiante
            if ("ESTUDIANTE".equalsIgnoreCase(usuario.getRol())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Use el módulo de estudiantes para esto."));
            }

            // Contraseña por defecto para empleados: "123456"
            usuario.setPassword("{noop}123456"); 

            usuarioRepo.save(usuario);
            return ResponseEntity.ok(Map.of("mensaje", "Empleado creado con éxito"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Error: El correo o cédula ya existe."));
        }
    }

    // 3. EDITAR PERSONAL
    @PutMapping("/personal/{id}")
    public ResponseEntity<?> editarPersonal(@PathVariable Long id, @RequestBody Map<String, Object> datos) {
        Optional<Usuario> userOpt = usuarioRepo.findById(id);
        if (userOpt.isPresent()) {
            Usuario user = userOpt.get();
            user.setNombre((String) datos.get("nombre"));
            user.setEmail((String) datos.get("email"));
            user.setRol((String) datos.get("rol"));
            // No cambiamos clave aquí por seguridad
            usuarioRepo.save(user);
            return ResponseEntity.ok(Map.of("mensaje", "Actualizado"));
        }
        return ResponseEntity.notFound().build();
    }

    // 4. ELIMINAR PERSONAL (Desactivar)
    @PutMapping("/personal/{id}/toggle")
    public ResponseEntity<?> toggleEstadoUsuario(@PathVariable Long id) {
        Usuario usuario = usuarioRepo.findById(id)
        .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        boolean nuevoEstado = (usuario.getActivo() == null) ? false: !usuario.getActivo();
        usuario.setActivo(nuevoEstado);

        usuarioRepo.save(usuario);
        return ResponseEntity.ok(Map.of("mensaje", "Estado actualizado", "activo", nuevoEstado));
    }

    @PostMapping("/perfil/{id}/foto")
    public ResponseEntity<?> subirFotoPerfil(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) return ResponseEntity.badRequest().body("Archivo vacío");

            Usuario usuario = usuarioRepo.findById(id).orElseThrow();

            // Guardar archivo en carpeta 'uploads/perfil'
            String carpeta = "uploads/perfil/";
            Files.createDirectories(Paths.get(carpeta)); // Crear si no existe
            
            String nombreArchivo = "user_" + id + "_" + System.currentTimeMillis() + ".jpg";
            Path rutaCompleta = Paths.get(carpeta + nombreArchivo);
            Files.write(rutaCompleta, file.getBytes());

            // Guardar URL en BD
            String urlPublica = "/uploads/perfil/" + nombreArchivo;
            usuario.setFotoPerfil(urlPublica);
            usuarioRepo.save(usuario);

            return ResponseEntity.ok(Map.of("mensaje", "Foto actualizada", "url", urlPublica));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error al subir imagen");
        }
    }
   // --- EDITAR ESTUDIANTE
    @PutMapping("/estudiantes/{id}")
    public ResponseEntity<?> editarEstudiante(@PathVariable Long id, @RequestBody Map<String, Object> datos) {
        try {
            Usuario user = usuarioRepo.findById(id).orElseThrow();
            
            // 1. Actualizar Datos Básicos
            if(datos.containsKey("nombre")) user.setNombre((String) datos.get("nombre"));
            if(datos.containsKey("apellido")) user.setApellido((String) datos.get("apellido"));
            if(datos.containsKey("cedula")) user.setCedula((String) datos.get("cedula"));
            if(datos.containsKey("email")) user.setEmail((String) datos.get("email"));
            
            // 2. Actualizar Detalles (Si no existen, crearlos)
            EstudianteDetalle detalles = user.getDetalles();
            if(detalles == null) {
                detalles = new EstudianteDetalle();
                user.setDetalles(detalles);
            }

            // Carrera
            if(datos.containsKey("carrera")) {
                String nombreC = (String) datos.get("carrera");
                carreraRepo.findByNombre(nombreC).ifPresent(detalles::setCarrera);
            }
            
            // Extensión
            if(datos.containsKey("extensionId")) {
                Integer extId = Integer.valueOf(datos.get("extensionId").toString());
                extensionRepo.findById(extId).ifPresent(detalles::setExtension);
            }

            // Password
            if(datos.containsKey("password") && !datos.get("password").toString().isEmpty()) {
                user.setPassword("{noop}" + datos.get("password"));
            }

            usuarioRepo.save(user);
            return ResponseEntity.ok(Map.of("mensaje", "Estudiante actualizado"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", "Error al actualizar"));
        }
    }
    // 2. DESACTIVAR/ACTIVAR ESTUDIANTE (TOGGLE)
    @PutMapping("/estudiantes/{id}/toggle")
    public ResponseEntity<?> toggleEstudiante(@PathVariable Long id) {
        Optional<Usuario> userOpt = usuarioRepo.findById(id);
        if (userOpt.isPresent()) {
            Usuario u = userOpt.get();
            // Invertimos el valor (Si es null asume false, !false = true)
            boolean nuevoEstado = (u.getActivo() == null) ? false : !u.getActivo();
            u.setActivo(nuevoEstado);
            usuarioRepo.save(u);
            return ResponseEntity.ok(Map.of("mensaje", "Estado cambiado", "activo", nuevoEstado));
        }
        return ResponseEntity.notFound().build();
    }
}