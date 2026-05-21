package com.jamunabank.branchsync.controller;

import com.jamunabank.branchsync.dto.request.CreateBranchDto;
import com.jamunabank.branchsync.dto.request.CreateDepartmentDto;
import com.jamunabank.branchsync.dto.request.CreateItemCategoryDto;
import com.jamunabank.branchsync.model.entity.Branch;
import com.jamunabank.branchsync.model.entity.Department;
import com.jamunabank.branchsync.model.entity.ItemCategory;
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
                    map.put("departmentIds", b.getDepartments().stream().map(Department::getDepartmentId).collect(Collectors.toList()));
                    map.put("departments", b.getDepartments().stream().map(Department::getDepartmentName).collect(Collectors.toList()));
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
                    map.put("isHqOnly", Boolean.TRUE.equals(d.getIsHqOnly()));
                    map.put("branchName", Boolean.TRUE.equals(d.getIsHqOnly()) ? "HQ Only" : "Global (Master List)");
                    map.put("branchId", null);
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
                    return map;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(roles);
    }

    @PutMapping("/branches/{id}")
    public ResponseEntity<Map<String, Object>> updateBranch(@PathVariable Long id, @Valid @RequestBody CreateBranchDto dto) {
        try {
            Branch saved = managementService.updateBranch(id, dto);
            return ResponseEntity.ok(Map.of(
                    "message", "Branch updated successfully",
                    "branchId", saved.getBranchId()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Error: " + e.getMessage()));
        }
    }

    @PutMapping("/departments/{id}")
    public ResponseEntity<Map<String, Object>> updateDepartment(@PathVariable Long id, @Valid @RequestBody CreateDepartmentDto dto) {
        try {
            Department saved = managementService.updateDepartment(id, dto);
            return ResponseEntity.ok(Map.of(
                    "message", "Department updated successfully",
                    "departmentId", saved.getDepartmentId()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/items/{categoryId}/map")
    public ResponseEntity<Map<String, String>> mapItemToDepartment(
            @PathVariable Long categoryId,
            @RequestBody Map<String, Long> payload) {
        managementService.mapItemCategoryToDepartment(categoryId, payload.get("departmentId"));
        return ResponseEntity.ok(Map.of("message", "Item mapped successfully"));
    }

    // ── Item Category CRUD ─────────────────────────────────────────────────────

    @GetMapping("/items")
    public ResponseEntity<List<Map<String, Object>>> listItemCategories() {
        List<Map<String, Object>> items = managementService.getAllItemCategories().stream()
                .map(c -> {
                    Map<String, Object> map = new java.util.LinkedHashMap<>();
                    map.put("categoryId", c.getCategoryId());
                    map.put("categoryName", c.getCategoryName());
                    map.put("sensitivityLevel", c.getSensitivityLevel());
                    map.put("description", c.getDescription());
                    map.put("behaviorType", c.getBehaviorType() != null ? c.getBehaviorType().name() : "DOCUMENT_CASE");
                    map.put("departmentId", c.getDepartment() != null ? c.getDepartment().getDepartmentId() : null);
                    map.put("departmentName", c.getDepartment() != null ? c.getDepartment().getDepartmentName() : "Open Access");
                    map.put("isActive", c.getIsActive());
                    return map;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(items);
    }

    @PostMapping("/items")
    public ResponseEntity<Map<String, Object>> createItemCategory(@Valid @RequestBody CreateItemCategoryDto dto) {
        try {
            ItemCategory saved = managementService.createItemCategory(dto);
            return new ResponseEntity<>(Map.of(
                    "message", "Item category created successfully",
                    "categoryId", saved.getCategoryId()
            ), HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/items/{categoryId}")
    public ResponseEntity<Map<String, Object>> updateItemCategory(
            @PathVariable Long categoryId,
            @Valid @RequestBody CreateItemCategoryDto dto) {
        try {
            ItemCategory saved = managementService.updateItemCategory(categoryId, dto);
            return ResponseEntity.ok(Map.of(
                    "message", "Item category updated successfully",
                    "categoryId", saved.getCategoryId()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/items/{categoryId}/toggle-active")
    public ResponseEntity<Map<String, Object>> toggleItemCategoryActive(@PathVariable Long categoryId) {
        try {
            ItemCategory category = managementService.toggleItemCategoryStatus(categoryId);
            return ResponseEntity.ok(Map.of(
                    "message", category.getIsActive() ? "Item category activated" : "Item category deactivated",
                    "isActive", category.getIsActive()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/items/{categoryId}")
    public ResponseEntity<Map<String, Object>> deleteItemCategory(@PathVariable Long categoryId) {
        try {
            managementService.deleteItemCategory(categoryId);
            return ResponseEntity.ok(Map.of("message", "Item category physically deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ── Stock Item Administrative Management ────────────────────────────────

    @GetMapping("/items/{categoryId}/stock-items")
    public ResponseEntity<List<Map<String, Object>>> listStockItems(@PathVariable Long categoryId) {
        List<Map<String, Object>> list = managementService.getStockItemsByCategory(categoryId).stream()
                .map(item -> {
                    Map<String, Object> map = new java.util.LinkedHashMap<>();
                    map.put("stockItemId", item.getStockItemId());
                    map.put("categoryId", item.getCategory().getCategoryId());
                    map.put("itemName", item.getItemName());
                    map.put("itemCode", item.getItemCode());
                    map.put("unit", item.getUnit());
                    map.put("description", item.getDescription());
                    map.put("isActive", item.getIsActive());
                    return map;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @PostMapping("/items/{categoryId}/stock-items")
    public ResponseEntity<Map<String, Object>> createStockItem(
            @PathVariable Long categoryId,
            @RequestBody Map<String, String> payload) {
        try {
            com.jamunabank.branchsync.model.entity.StockItem item = managementService.createStockItem(
                categoryId,
                payload.get("itemName"),
                payload.get("itemCode"),
                payload.get("unit"),
                payload.get("description")
            );
            return new ResponseEntity<>(Map.of(
                    "message", "Stock item created successfully",
                    "stockItemId", item.getStockItemId()
            ), HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/stock-items/{stockItemId}")
    public ResponseEntity<Map<String, Object>> updateStockItem(
            @PathVariable Long stockItemId,
            @RequestBody Map<String, String> payload) {
        try {
            com.jamunabank.branchsync.model.entity.StockItem item = managementService.updateStockItem(
                stockItemId,
                payload.get("itemName"),
                payload.get("itemCode"),
                payload.get("unit"),
                payload.get("description")
            );
            return ResponseEntity.ok(Map.of(
                    "message", "Stock item updated successfully",
                    "stockItemId", item.getStockItemId()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/stock-items/{stockItemId}/toggle-active")
    public ResponseEntity<Map<String, Object>> toggleStockItemActive(@PathVariable Long stockItemId) {
        try {
            com.jamunabank.branchsync.model.entity.StockItem item = managementService.toggleStockItemStatus(stockItemId);
            return ResponseEntity.ok(Map.of(
                    "message", item.getIsActive() ? "Stock item activated" : "Stock item deactivated",
                    "isActive", item.getIsActive()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
