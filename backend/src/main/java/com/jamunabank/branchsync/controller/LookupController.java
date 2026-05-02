package com.jamunabank.branchsync.controller;

import com.jamunabank.branchsync.model.entity.Branch;
import com.jamunabank.branchsync.model.entity.ItemCategory;
import com.jamunabank.branchsync.repository.BranchRepository;
import com.jamunabank.branchsync.repository.ItemCategoryRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/lookup")
public class LookupController {

    private final BranchRepository branchRepository;
    private final ItemCategoryRepository itemCategoryRepository;
    private final com.jamunabank.branchsync.repository.DepartmentRepository departmentRepository;
    private final com.jamunabank.branchsync.repository.RoleRepository roleRepository;

    public LookupController(BranchRepository branchRepository, 
                          ItemCategoryRepository itemCategoryRepository,
                          com.jamunabank.branchsync.repository.DepartmentRepository departmentRepository,
                          com.jamunabank.branchsync.repository.RoleRepository roleRepository) {
        this.branchRepository = branchRepository;
        this.itemCategoryRepository = itemCategoryRepository;
        this.departmentRepository = departmentRepository;
        this.roleRepository = roleRepository;
    }

    @GetMapping("/branches")
    public ResponseEntity<List<Map<String, Object>>> getAllBranches() {
        List<Map<String, Object>> branches = branchRepository.findAll().stream()
                .map(b -> {
                    java.util.Map<String, Object> map = new java.util.HashMap<>();
                    map.put("id", b.getBranchId());
                    map.put("code", b.getBranchCode());
                    map.put("name", b.getBranchName());
                    map.put("type", b.getBranchType() != null ? b.getBranchType().name() : null);
                    map.put("district", b.getDistrict());
                    return map;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(branches);
    }

    @GetMapping("/departments")
    public ResponseEntity<List<Map<String, Object>>> getAllDepartments() {
        List<Map<String, Object>> depts = departmentRepository.findAll().stream()
                .map(d -> {
                    java.util.Map<String, Object> map = new java.util.HashMap<>();
                    map.put("departmentId", d.getDepartmentId());
                    map.put("departmentName", d.getDepartmentName());
                    return map;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(depts);
    }

    @GetMapping("/roles")
    public ResponseEntity<List<Map<String, Object>>> getAllRoles() {
        List<Map<String, Object>> roles = roleRepository.findAll().stream()
                .map(r -> {
                    java.util.Map<String, Object> map = new java.util.HashMap<>();
                    map.put("roleId", r.getRoleId());
                    map.put("roleName", r.getRoleName());
                    return map;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(roles);
    }

    @GetMapping("/categories")
    public ResponseEntity<List<Map<String, Object>>> getAllCategories() {
        List<Map<String, Object>> categories = itemCategoryRepository.findAll().stream()
                .map(c -> {
                    java.util.Map<String, Object> map = new java.util.HashMap<>();
                    map.put("id", c.getCategoryId());
                    map.put("name", c.getCategoryName() != null ? c.getCategoryName().name() : null);
                    map.put("requiresDualVerification", c.getRequiresDualVerification());
                    map.put("requiresHqApproval", c.getRequiresHqApproval());
                    map.put("sensitivityLevel", c.getSensitivityLevel() != null ? c.getSensitivityLevel().name() : null);
                    map.put("departmentId", c.getDepartment() != null ? c.getDepartment().getDepartmentId() : null);
                    return map;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(categories);
    }
}
