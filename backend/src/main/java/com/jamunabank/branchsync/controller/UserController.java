package com.jamunabank.branchsync.controller;

import com.jamunabank.branchsync.model.entity.User;
import com.jamunabank.branchsync.repository.UserRepository;
import com.jamunabank.branchsync.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/profile")
    public ResponseEntity<Map<String, Object>> getMyProfile(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails)) {
            return ResponseEntity.status(401).build();
        }

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        
        User user = userRepository.findById(userDetails.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found: " + userDetails.getUserId()));

        Map<String, Object> map = new LinkedHashMap<>();
        map.put("userId", user.getUserId());
        map.put("employeeId", user.getEmployeeId());
        map.put("fullName", user.getFullName());
        map.put("email", user.getEmail());
        map.put("phoneNumber", user.getPhoneNumber());
        map.put("roleName", user.getRole() != null ? user.getRole().getRoleName() : null);
        map.put("branchName", user.getBranch() != null ? user.getBranch().getBranchName() : null);
        map.put("branchCode", user.getBranch() != null ? user.getBranch().getBranchCode() : null);
        map.put("departmentName", user.getDepartment() != null ? user.getDepartment().getDepartmentName() : null);
        map.put("isActive", user.getIsActive());
        map.put("createdAt", user.getCreatedAt());
        
        return ResponseEntity.ok(map);
    }

    @GetMapping("/branch-directory")
    public ResponseEntity<java.util.List<Map<String, Object>>> getBranchDirectory(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails)) {
            return ResponseEntity.status(401).build();
        }

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        User currentUser = userRepository.findById(userDetails.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (currentUser.getBranch() == null) {
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }

        java.util.List<Map<String, Object>> users = userRepository.findAll().stream()
                .filter(u -> u.getBranch() != null && u.getBranch().getBranchId().equals(currentUser.getBranch().getBranchId()))
                .map(u -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("userId", u.getUserId());
                    map.put("employeeId", u.getEmployeeId());
                    map.put("fullName", u.getFullName());
                    map.put("email", u.getEmail());
                    map.put("phoneNumber", u.getPhoneNumber());
                    map.put("roleName", u.getRole() != null ? u.getRole().getRoleName() : null);
                    map.put("departmentName", u.getDepartment() != null ? u.getDepartment().getDepartmentName() : null);
                    map.put("isActive", u.getIsActive());
                    return map;
                })
                .collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok(users);
    }
}
