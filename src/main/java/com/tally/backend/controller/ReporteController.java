package com.tally.backend.controller;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import com.tally.backend.model.Comprobante;
import com.tally.backend.repository.ComprobanteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import jakarta.servlet.http.HttpServletResponse;
import java.awt.Color;
import java.io.IOException;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;

@Controller
@RequestMapping("/api/reportes")
public class ReporteController {

    @Autowired
    private ComprobanteRepository comprobanteRepo;

    @GetMapping("/pagos/pdf")
    public void exportarApdf(HttpServletResponse response) throws IOException {
        
        response.setContentType("application/pdf");
        DateFormat dateFormatter = new SimpleDateFormat("yyyy-MM-dd_HH:mm");
        String currentDateTime = dateFormatter.format(new Date());
        
        String headerKey = "Content-Disposition";
        String headerValue = "attachment; filename=Reporte_Pagos_" + currentDateTime + ".pdf";
        response.setHeader(headerKey, headerValue);

        // Buscar solo los aprobados
        List<Comprobante> listaPagos = comprobanteRepo.findAll();

        Document document = new Document(PageSize.A4);
        PdfWriter.getInstance(document, response.getOutputStream());

        document.open();
        
        // Título
        Font fontTitle = FontFactory.getFont(FontFactory.HELVETICA_BOLD);
        fontTitle.setSize(18);
        fontTitle.setColor(new Color(63, 81, 181)); // Azul Tally
        
        Paragraph p = new Paragraph("Reporte General de Pagos - TALLY", fontTitle);
        p.setAlignment(Paragraph.ALIGN_CENTER);
        document.add(p);
        
        document.add(new Paragraph(" ")); 

        // Tabla
        PdfPTable table = new PdfPTable(5); // 5 Columnas
        table.setWidthPercentage(100f);
        table.setWidths(new float[] {1.5f, 3.0f, 2.0f, 2.0f, 2.0f});
        table.setSpacingBefore(10);

        // Cabecera
        writeTableHeader(table);
        
        // Datos
        writeTableData(table, listaPagos);

        document.add(table);
        document.close();
    }

    private void writeTableHeader(PdfPTable table) {
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(new Color(63, 81, 181));
        cell.setPadding(5);

        Font font = FontFactory.getFont(FontFactory.HELVETICA);
        font.setColor(Color.WHITE);

        String[] headers = {"ID", "Banco", "Referencia", "Monto (Bs)", "Fecha"};
        for (String header : headers) {
            cell.setPhrase(new Phrase(header, font));
            table.addCell(cell);
        }
    }

    private void writeTableData(PdfPTable table, List<Comprobante> lista) {
        for (Comprobante c : lista) {
            table.addCell(String.valueOf(c.getId()));
            table.addCell(c.getBancoOrigen());
            table.addCell(c.getNumeroReferencia());
            table.addCell(String.format("%,.2f", c.getMontoPagadoBs()));
            table.addCell(c.getFechaTransaccion().toString());
        }
    }
}