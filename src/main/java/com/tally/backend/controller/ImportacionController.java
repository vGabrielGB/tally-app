package com.tally.backend.controller; // Asegúrate que sea tu paquete correcto

import com.tally.backend.model.Usuario;
import com.tally.backend.repository.UsuarioRepository; // O tu repositorio de usuarios
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/importacion")
public class ImportacionController {

    @Autowired
    private UsuarioRepository usuarioRepo;

    @PostMapping("/estudiantes")
    public ResponseEntity<?> importarExcel(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) return ResponseEntity.badRequest().body("El archivo está vacío");

        List<String> errores = new ArrayList<>();
        int guardados = 0;

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0); // Leemos la hoja 1

            // Iteramos las filas (Saltamos la 0 porque son los títulos)
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                try {

                    // Columna 0: Cédula | 1: Nombre | 2: Apellido | 3: Email
                    String cedula = getCellValue(row, 0);
                    String nombre = getCellValue(row, 1);
                    String apellido = getCellValue(row, 2);
                    String email = getCellValue(row, 3);

                    if (cedula.isEmpty() || nombre.isEmpty()) continue;

                    // Evitar duplicados
                    if (usuarioRepo.existsByCedula(cedula)) {
                        errores.add("Fila " + (i+1) + ": La cédula " + cedula + " ya existe.");
                        continue;
                    }

                    // CREAR USUARIO
                    Usuario u = new Usuario();
                    u.setCedula(cedula);
                    u.setNombre(nombre);
                    u.setApellido(apellido);
                    u.setEmail(email);
                    u.setRol("ESTUDIANTE");
                    u.setActivo(true); 
                    u.setTelefono("");
                    u.setPassword("{noop}1234");
    

                    usuarioRepo.save(u);
                    guardados++;

                } catch (Exception e) {
                    errores.add("Error en fila " + (i+1) + ": " + e.getMessage());
                }
            }

        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Error al leer el archivo Excel");
        }

        return ResponseEntity.ok().body(new ImportResult(guardados, errores));
    }

    // Método auxiliar para leer celdas sean texto o número
    private String getCellValue(Row row, int index) {
        Cell cell = row.getCell(index);
        if (cell == null) return "";
        
        switch (cell.getCellType()) {
            case STRING: return cell.getStringCellValue().trim();
            case NUMERIC: 
                // para corregir lecturas de cedula como 1.23E7. Esto lo corrige.
                return String.valueOf((long) cell.getNumericCellValue());
            default: return "";
        }
    }

    // para devolver la respuesta
    static class ImportResult {
        public int guardados;
        public List<String> errores;
        public ImportResult(int g, List<String> e) { this.guardados = g; this.errores = e; }
    }
}