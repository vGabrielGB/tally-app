package com.tally.backend.service;

import com.tally.backend.model.Divisa;
import com.tally.backend.repository.DivisaRepository;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import javax.net.ssl.*;
import java.math.BigDecimal;
import java.math.RoundingMode; 
import java.security.cert.X509Certificate;

@Service
public class TasaBcvService {

    @Autowired private DivisaRepository divisaRepo;

    public void actualizarTasas() {
        try {
            
            TrustManager[] trustAllCerts = new TrustManager[]{new X509TrustManager() {
                public java.security.cert.X509Certificate[] getAcceptedIssuers() { return null; }
                public void checkClientTrusted(X509Certificate[] certs, String authType) {}
                public void checkServerTrusted(X509Certificate[] certs, String authType) {}
            }};
            SSLContext sc = SSLContext.getInstance("SSL");
            sc.init(null, trustAllCerts, new java.security.SecureRandom());
            HttpsURLConnection.setDefaultSSLSocketFactory(sc.getSocketFactory());

            String url = "https://www.bcv.org.ve";
            Document doc = Jsoup.connect(url).sslSocketFactory(sc.getSocketFactory()).timeout(10000).get();

            // Dólar
            Element dolarElement = doc.getElementById("dolar");
            if (dolarElement != null) {
                String tasaTexto = dolarElement.select("strong").text().replace(",", ".");
                BigDecimal valor = new BigDecimal(tasaTexto).setScale(2, RoundingMode.HALF_UP);
                actualizarDivisa("USD", valor);
            }

            // Euro
            Element euroElement = doc.getElementById("euro");
            if (euroElement != null) {
                String tasaTexto = euroElement.select("strong").text().replace(",", ".");
                // Redondeo a 2 decimales
                BigDecimal valor = new BigDecimal(tasaTexto).setScale(2, RoundingMode.HALF_UP);
                actualizarDivisa("EUR", valor);
            }

        } catch (Exception e) {
            System.err.println("Error scraping BCV: " + e.getMessage());
        }
    }

    private void actualizarDivisa(String codigo, BigDecimal tasa) {
        Divisa divisa = divisaRepo.findByCodigo(codigo).orElse(null);
        if (divisa != null) {
            divisa.setTasa(tasa);
            divisaRepo.save(divisa);
        }
    }
}