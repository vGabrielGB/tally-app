package com.tally.backend;

import org.springframework.boot.autoconfigure.SpringBootApplication;
import java.awt.EventQueue;

@SpringBootApplication
public class BackendApplication {

    public static void main(String[] args) {
       
        
        System.setProperty("java.awt.headless", "false");
        
        EventQueue.invokeLater(() -> {
            LoginWindow frame = new LoginWindow();
            frame.setVisible(true);
        });
    }
}