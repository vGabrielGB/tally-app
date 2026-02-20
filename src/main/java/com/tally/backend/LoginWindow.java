package com.tally.backend;

import com.tally.backend.model.Usuario;
import com.tally.backend.repository.UsuarioRepository;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;
import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.net.URI;
import java.util.Optional;

public class LoginWindow extends JFrame {

    private JTextField userField;
    private JPasswordField passField;
    private JLabel messageLabel;
    private ConfigurableApplicationContext springContext;

    public LoginWindow() {
        // Configuración visual de la ventana
        setTitle("TALLY - Acceso al Sistema");
        setSize(400, 350);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLocationRelativeTo(null);
        setLayout(null);
        setResizable(false);
        getContentPane().setBackground(new Color(245, 245, 247));

        // Título
        JLabel title = new JLabel("TALLY");
        title.setFont(new Font("Segoe UI", Font.BOLD, 28));
        title.setForeground(new Color(46, 58, 107));
        title.setBounds(0, 30, 400, 40);
        title.setHorizontalAlignment(SwingConstants.CENTER);
        add(title);

        // Inputs
        JLabel userLabel = new JLabel("Usuario (Cédula):");
        userLabel.setBounds(50, 90, 300, 20);
        add(userLabel);

        userField = new JTextField();
        userField.setBounds(50, 115, 280, 35);
        add(userField);

        JLabel passLabel = new JLabel("Contraseña:");
        passLabel.setBounds(50, 160, 300, 20);
        add(passLabel);

        passField = new JPasswordField();
        passField.setBounds(50, 185, 280, 35);
        add(passField);

        // Botón
        JButton loginBtn = new JButton("Iniciar Sesión");
        loginBtn.setBounds(50, 240, 280, 40);
        loginBtn.setBackground(new Color(63, 81, 181));
        loginBtn.setForeground(Color.WHITE);
        loginBtn.setFocusPainted(false);
        add(loginBtn);

        // Mensajes
        messageLabel = new JLabel("");
        messageLabel.setBounds(0, 285, 400, 20);
        messageLabel.setHorizontalAlignment(SwingConstants.CENTER);
        messageLabel.setForeground(Color.RED);
        add(messageLabel);

        // Acción al hacer clic
        loginBtn.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                verificarCredenciales();
            }
        });
    }

    private void verificarCredenciales() {
        String cedulaIngresada = userField.getText();
        String claveIngresada = new String(passField.getPassword());
        
        messageLabel.setText("Conectando...");
        messageLabel.setForeground(Color.BLUE);

        // Hilo secundario para procesar
        new Thread(() -> {
            try {
                // 1. Encender Spring Boot
                if (springContext == null) {
                    SpringApplicationBuilder builder = new SpringApplicationBuilder(BackendApplication.class);
                    builder.headless(false); // Permite ventanas
                    springContext = builder.run();
                }

                // 2. Obtener  usuarios
                UsuarioRepository usuarioRepo = springContext.getBean(UsuarioRepository.class);

                // 3. Buscar en la base de datos por Cédula
                Optional<Usuario> usuarioEncontrado = usuarioRepo.findByCedula(cedulaIngresada);

                if (usuarioEncontrado.isPresent()) {
                    Usuario usuario = usuarioEncontrado.get();
                    
                    // Si activo es false, bloqueamos
        if (usuario.getActivo() != null && !usuario.getActivo()) {
            messageLabel.setForeground(Color.RED);
            messageLabel.setText("Cuenta inhabilitada. Acceso denegado.");
            return;
        }
                    // 4. Verificar contraseña
                    String claveReal = usuario.getPassword().replace("{noop}", "");
                    
                    if (claveReal.equals(claveIngresada)) {
                        messageLabel.setForeground(new Color(0, 150, 0));
                        messageLabel.setText("¡Bienvenido " + usuario.getNombre() + "!");
                        
                        // 5. Decidir a qué página ir según el ROL
                        String urlBase = "http://localhost:8080/";
                        String destino = "";

                        if (usuario.getRol().equalsIgnoreCase("GERENTE")) {
                            destino = "admin.html?id=" + usuario.getId();
                        } else if (usuario.getRol().equalsIgnoreCase("ESTUDIANTE")) {
                            destino = "estudiante.html?id=" + usuario.getId();
                        } else if (usuario.getRol().equalsIgnoreCase("ADMINISTRADOR")) {
                            destino = "dueño.html?id=" + usuario.getId();
                        } else {
                            destino = "verificador.html"; // VERIFICADOR
                        }
                        
                        Thread.sleep(1000); // Pequeña pausa
                        abrirNavegador(urlBase + destino);
                        dispose(); // Cerrar ventana Java
                    } else {
                        messageLabel.setForeground(Color.RED);
                        messageLabel.setText("Contraseña incorrecta");
                    }
                } else {
                    messageLabel.setForeground(Color.RED);
                    messageLabel.setText("Usuario no encontrado");
                }

            } catch (Exception ex) {
                messageLabel.setForeground(Color.RED);
                messageLabel.setText("Error de conexión");
                ex.printStackTrace();
            }
        }).start();
    }

    private void abrirNavegador(String url) {
        try {
            Desktop.getDesktop().browse(new URI(url));
        } catch (Exception e) { e.printStackTrace(); }
    }
}