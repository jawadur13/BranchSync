package com.jamunabank.branchsync.security;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

// @Component
public class PasswordEncodingRunner implements CommandLineRunner {
    @Override
    public void run(String... args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String rawPassword = "Admin@123"; 
        String encoded = encoder.encode(rawPassword);
        System.out.println("=== ENCODED PASSWORD ===");
        System.out.println(encoded);
        System.out.println("========================");
    }
}
