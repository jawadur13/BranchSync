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
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        User user = userRepository.findById(userDetails.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

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
}
