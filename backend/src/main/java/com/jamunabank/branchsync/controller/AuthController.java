package com.jamunabank.branchsync.controller;

import com.jamunabank.branchsync.dto.auth.JwtResponseDto;
import com.jamunabank.branchsync.dto.auth.LoginRequestDto;
import com.jamunabank.branchsync.security.CustomUserDetails;
import com.jamunabank.branchsync.security.JwtUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import com.jamunabank.branchsync.security.CustomUserDetailsService;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final CustomUserDetailsService userDetailsService;

    @PostMapping("/login")
    public ResponseEntity<JwtResponseDto> authenticateUser(@Valid @RequestBody LoginRequestDto loginRequest) {

        Authentication authentication;
        
        // Development Bypass for ADMIN001 - HARDCODED to isolate DB issues
        if ("ADMIN001".equals(loginRequest.getEmployeeId())) {
            return ResponseEntity.ok(new JwtResponseDto(
                    "dummy-jwt-token-for-admin001-testing", 
                    "Bearer", 
                    1L, 
                    "ADMIN001", 
                    "ROLE_SYSTEM_ADMIN", 
                    1L
            ));
        }

        authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getEmployeeId(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        String role = userDetails.getAuthorities().iterator().next().getAuthority();

        return ResponseEntity.ok(new JwtResponseDto(jwt, "Bearer", userDetails.getUserId(), userDetails.getUsername(), role, userDetails.getBranchId()));
    }
}
