package com.jamunabank.branchsync.security;

import com.jamunabank.branchsync.model.entity.User;
import com.jamunabank.branchsync.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class PasswordEncodingRunner implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        List<User> users = userRepository.findAll();
        boolean anyChanged = false;

        for (User user : users) {
            String password = user.getPasswordHash();
            if (password != null && !password.startsWith("$2a$")) {
                user.setPasswordHash(passwordEncoder.encode(password));
                anyChanged = true;
            }
        }

        if (anyChanged) {
            userRepository.saveAll(users);
            System.out.println("Converted plaintext passwords to BCrypt hashes.");
        }
    }
}
