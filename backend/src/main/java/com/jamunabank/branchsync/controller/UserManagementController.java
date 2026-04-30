package com.jamunabank.branchsync.controller;

import com.jamunabank.branchsync.dto.request.CreateUserDto;
import com.jamunabank.branchsync.model.entity.User;
import com.jamunabank.branchsync.service.ManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class UserManagementController {

    private final ManagementService managementService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listAllUsers() {
        List<Map<String, Object>> users = managementService.getAllUsers().stream()
                .map(this::mapUserToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createUser(@Valid @RequestBody CreateUserDto dto) {
        User saved = managementService.createUser(dto);
        return new ResponseEntity<>(Map.of(
                "message", "User created successfully",
                "userId", saved.getUserId()
        ), HttpStatus.CREATED);
    }

    @PutMapping("/{userId}")
    public ResponseEntity<Map<String, Object>> updateUser(@PathVariable Long userId, @Valid @RequestBody CreateUserDto dto) {
        User updated = managementService.updateUser(userId, dto);
        return ResponseEntity.ok(Map.of(
                "message", "User updated successfully",
                "userId", updated.getUserId()
        ));
    }

    @PutMapping("/{userId}/toggle-active")
    public ResponseEntity<Map<String, Object>> toggleUserActive(@PathVariable Long userId) {
        User user = managementService.toggleUserStatus(userId);
        return ResponseEntity.ok(Map.of(
                "message", user.getIsActive() ? "User activated" : "User deactivated",
                "isActive", user.getIsActive()
        ));
    }

    private Map<String, Object> mapUserToResponse(User u) {
        Map<String, Object> map = new java.util.LinkedHashMap<>();
        map.put("userId", u.getUserId());
        map.put("employeeId", u.getEmployeeId());
        map.put("fullName", u.getFullName());
        map.put("email", u.getEmail());
        map.put("phoneNumber", u.getPhoneNumber());
        map.put("roleName", u.getRole() != null ? u.getRole().getRoleName() : null);
        map.put("roleId", u.getRole() != null ? u.getRole().getRoleId() : null);
        map.put("branchName", u.getBranch() != null ? u.getBranch().getBranchName() : null);
        map.put("branchId", u.getBranch() != null ? u.getBranch().getBranchId() : null);
        map.put("departmentName", u.getDepartment() != null ? u.getDepartment().getDepartmentName() : null);
        map.put("departmentId", u.getDepartment() != null ? u.getDepartment().getDepartmentId() : null);
        map.put("isActive", u.getIsActive());
        map.put("createdAt", u.getCreatedAt());
        return map;
    }
}
