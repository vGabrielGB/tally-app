package com.tally.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Desactivar CSRF, usamos forms simples
            .csrf(csrf -> csrf.disable())
            
            // Reglas de acceso
            .authorizeHttpRequests(auth -> auth
                // Permitir estilos y scripts
                .requestMatchers("/css/**", "/js/**", "/img/**").permitAll()
                
                // Permitir todas las páginas HTML
                .requestMatchers("/", "/login.html", "/estudiante.html", "/admin.html", 
                                 "/verificar.html", "/registrar-estudiante.html", 
                                 "/gestion-periodos.html", "/historial.html", 
                                 "/pagos.html", "/perfil.html").permitAll()
                
                // Permitir envío de feedback
                .requestMatchers("/api/feedback/**").permitAll()
                .requestMatchers("/api/usuarios/**").permitAll()
                .requestMatchers("/api/pagos/**").permitAll()
                .requestMatchers("/uploads/**").permitAll()

                // El resto permitido
                .anyRequest().permitAll()
            );

        return http.build();
    }
}