package com.jamunabank.branchsync.controller;

import com.jamunabank.branchsync.dto.request.CreateBranchDto;
import com.jamunabank.branchsync.dto.request.CreateDepartmentDto;
import com.jamunabank.branchsync.model.entity.Branch;
import com.jamunabank.branchsync.model.entity.Department;
import com.jamunabank.branchsync.repository.RoleRepository;
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
@RequestMapping("/api/admin/org")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SYSTEM_ADMIN')")
public class OrgManagementController {

    private final ManagementService managementService;
    private final RoleRepository roleRepository;

    @GetMapping("/branches")
    public ResponseEntity<List<Map<String, Object>>> listBranches() {
        List<Map<String, Object>> branches = managementService.getAllBranches().stream()
                .map(b -> {
                    Map<String, Object> map = new java.util.LinkedHashMap<>();
                    map.put("branchId", b.getBranchId());
                    map.put("branchCode", b.getBranchCode());
                    map.put("branchName", b.getBranchName());
                    map.put("branchType", b.getBranchType().name());
                    map.put("district", b.getDistrict());
                    map.put("division", b.getDivision());
                    map.put("address", b.getAddress());
                    map.put("phone", b.getPhone());
                    map.put("isActive", b.getIsActive());
                    return map;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(branches);
    }

    @PostMapping("/branches")
    public ResponseEntity<Map<String, Object>> createBranch(@Valid @RequestBody CreateBranchDto dto) {
        try {
            Branch saved = managementService.createBranch(dto);
            return new ResponseEntity<>(Map.of(
                    "message", "Branch created successfully",
                    "branchId", saved.getBranchId()
            ), HttpStatus.CREATED);
        } catch (Exception e) {
            e.printStackTrace(); // Log stack trace to terminal for the user to see
            return ResponseEntity.badRequest().body(Map.of("message", "Error: " + e.getMessage()));
        }
    }

    @GetMapping("/departments")
    public ResponseEntity<List<Map<String, Object>>> listDepartments() {
        List<Map<String, Object>> departments = managementService.getAllDepartments().stream()
                .map(d -> {
                    Map<String, Object> map = new java.util.LinkedHashMap<>();
                    map.put("departmentId", d.getDepartmentId());
                    map.put("departmentName", d.getDepartmentName());
                    map.put("branchName", d.getBranch() != null ? d.getBranch().getBranchName() : "All Branches");
                    map.put("branchId", d.getBranch() != null ? d.getBranch().getBranchId() : null);
                    return map;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(departments);
    }

    @PostMapping("/departments")
    public ResponseEntity<Map<String, Object>> createDepartment(@Valid @RequestBody CreateDepartmentDto dto) {
        try {
            Department saved = managementService.createDepartment(dto);
            return new ResponseEntity<>(Map.of(
                    "message", "Department created successfully",
                    "departmentId", saved.getDepartmentId()
            ), HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/roles")
    public ResponseEntity<List<Map<String, Object>>> listRoles() {
        List<Map<String, Object>> roles = roleRepository.findAll().stream()
                .map(r -> {
                    Map<String, Object> map = new java.util.LinkedHashMap<>();
                    map.put("roleId", r.getRoleId());
                    map.put("roleName", r.getRoleName());
                    map.put("roleLevel", r.getRoleLevel());
                    map.put("description", r.getDescription());
                    return map;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(roles);
    }
}
