package com.jamunabank.branchsync.service.impl;

import com.jamunabank.branchsync.dto.request.CreateBranchDto;
import com.jamunabank.branchsync.dto.request.CreateDepartmentDto;
import com.jamunabank.branchsync.dto.request.CreateItemCategoryDto;
import com.jamunabank.branchsync.dto.request.CreateUserDto;
import com.jamunabank.branchsync.model.entity.*;
import com.jamunabank.branchsync.model.enums.BranchType;
import com.jamunabank.branchsync.model.enums.CategoryBehavior;
import com.jamunabank.branchsync.repository.*;
import com.jamunabank.branchsync.service.ManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ManagementServiceImpl implements ManagementService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final BranchRepository branchRepository;
    private final DepartmentRepository departmentRepository;
    private final ItemCategoryRepository itemCategoryRepository;
    private final StockItemRepository stockItemRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public List<User> getAllUsers() {
        return userRepository.findAllWithDetails();
    }

    @Override
    public User createUser(CreateUserDto dto) {
        if (userRepository.findByEmployeeId(dto.getEmployeeId()).isPresent()) {
            throw new RuntimeException("Employee ID already exists: " + dto.getEmployeeId());
        }

        Role role = roleRepository.findById(dto.getRoleId())
                .orElseThrow(() -> new RuntimeException("Role not found"));
        
        Branch branch = null;
        if (dto.getBranchId() != null) {
            branch = branchRepository.findById(dto.getBranchId())
                    .orElseThrow(() -> new RuntimeException("Branch not found"));
        } else if (!role.getRoleName().equals("DELIVERY_PERSON") && !role.getRoleName().equals("SYSTEM_ADMIN")) {
            // SYSTEM_ADMIN and DELIVERY_PERSON can have no branch
            throw new RuntimeException("Branch is required for this role");
        }

        User user = User.builder()
                .employeeId(dto.getEmployeeId())
                .fullName(dto.getFullName())
                .email(dto.getEmail())
                .phoneNumber(dto.getPhoneNumber())
                .passwordHash(passwordEncoder.encode(dto.getPassword()))
                .role(role)
                .branch(branch)
                .isActive(true)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build();

        if (dto.getDepartmentId() != null) {
            user.setDepartment(departmentRepository.findById(dto.getDepartmentId()).orElse(null));
        }

        return userRepository.save(user);
    }

    @Override
    public User updateUser(Long userId, CreateUserDto dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setFullName(dto.getFullName());
        user.setEmail(dto.getEmail());
        user.setPhoneNumber(dto.getPhoneNumber());
        
        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            if (dto.getCurrentPassword() == null || dto.getCurrentPassword().isBlank()) {
                throw new RuntimeException("Current password of the employee is required to set a new password");
            }
            if (!passwordEncoder.matches(dto.getCurrentPassword(), user.getPasswordHash())) {
                throw new RuntimeException("Incorrect current password of the employee");
            }
            user.setPasswordHash(passwordEncoder.encode(dto.getPassword()));
        }

        Role role = roleRepository.findById(dto.getRoleId()).orElse(user.getRole());
        user.setRole(role);
        
        if (dto.getBranchId() != null) {
            user.setBranch(branchRepository.findById(dto.getBranchId()).orElse(user.getBranch()));
        } else if (role.getRoleName().equals("DELIVERY_PERSON") || role.getRoleName().equals("SYSTEM_ADMIN")) {
            user.setBranch(null);
        }
        
        if (dto.getDepartmentId() != null) {
            user.setDepartment(departmentRepository.findById(dto.getDepartmentId()).orElse(null));
        }

        user.setUpdatedAt(OffsetDateTime.now());
        return userRepository.save(user);
    }

    @Override
    public User toggleUserStatus(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setIsActive(!user.getIsActive());
        user.setUpdatedAt(OffsetDateTime.now());
        return userRepository.save(user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Branch> getAllBranches() {
        return branchRepository.findAllBranches();
    }

    @Override
    public Branch createBranch(CreateBranchDto dto) {
        try {
            Branch branch = Branch.builder()
                    .branchCode(dto.getBranchCode().trim())
                    .branchName(dto.getBranchName().trim())
                    .branchType(BranchType.valueOf(dto.getBranchType().toUpperCase().trim()))
                    .district(dto.getDistrict().trim())
                    .division(dto.getDivision().trim())
                    .address(dto.getAddress().trim())
                    .phone(dto.getPhone() != null ? dto.getPhone().trim() : null)
                    .isActive(true)
                    .createdAt(OffsetDateTime.now())
                    .build();
            if (dto.getDepartmentIds() != null && !dto.getDepartmentIds().isEmpty()) {
                List<Department> departments = departmentRepository.findAllById(dto.getDepartmentIds());
                // Enforce: HQ-only departments can only be assigned to HQ branches
                boolean targetIsHq = BranchType.HQ.name().equalsIgnoreCase(dto.getBranchType().trim());
                for (Department dept : departments) {
                    if (Boolean.TRUE.equals(dept.getIsHqOnly()) && !targetIsHq) {
                        throw new RuntimeException(
                            "Department '" + dept.getDepartmentName() + "' is restricted to HQ branches only.");
                    }
                }
                branch.setDepartments(new java.util.HashSet<>(departments));
            }
            return branchRepository.save(branch);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid Branch Type: " + dto.getBranchType());
        } catch (Exception e) {
            throw new RuntimeException("Failed to save branch: " + e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }

    @Override
    public Department createDepartment(CreateDepartmentDto dto) {
        Department department = Department.builder()
                .departmentName(dto.getDepartmentName())
                .isHqOnly(Boolean.TRUE.equals(dto.getIsHqOnly()))
                .createdAt(OffsetDateTime.now())
                .build();
        return departmentRepository.save(department);
    }

    @Override
    public Branch updateBranch(Long branchId, CreateBranchDto dto) {
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new RuntimeException("Branch not found"));
        
        try {
            branch.setBranchCode(dto.getBranchCode().trim());
            branch.setBranchName(dto.getBranchName().trim());
            branch.setBranchType(BranchType.valueOf(dto.getBranchType().toUpperCase().trim()));
            branch.setDistrict(dto.getDistrict().trim());
            branch.setDivision(dto.getDivision().trim());
            branch.setAddress(dto.getAddress().trim());
            branch.setPhone(dto.getPhone() != null ? dto.getPhone().trim() : null);
            if (dto.getDepartmentIds() != null) {
                List<Department> departments = departmentRepository.findAllById(dto.getDepartmentIds());
                // Enforce: HQ-only departments can only be assigned to HQ branches
                boolean targetIsHq = BranchType.HQ.name().equalsIgnoreCase(dto.getBranchType().trim());
                for (Department dept : departments) {
                    if (Boolean.TRUE.equals(dept.getIsHqOnly()) && !targetIsHq) {
                        throw new RuntimeException(
                            "Department '" + dept.getDepartmentName() + "' is restricted to HQ branches only.");
                    }
                }
                branch.setDepartments(new java.util.HashSet<>(departments));
            }
            
            return branchRepository.save(branch);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid Branch Type: " + dto.getBranchType());
        }
    }

    @Override
    public Department updateDepartment(Long departmentId, CreateDepartmentDto dto) {
        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new RuntimeException("Department not found"));
        
        department.setDepartmentName(dto.getDepartmentName());
        if (dto.getIsHqOnly() != null) {
            department.setIsHqOnly(dto.getIsHqOnly());
        }
        return departmentRepository.save(department);
    }

    @Override
    public void mapItemCategoryToDepartment(Long categoryId, Long departmentId) {
        ItemCategory category = itemCategoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Item Category not found"));
        
        Department department = null;
        if (departmentId != null) {
            department = departmentRepository.findById(departmentId)
                    .orElseThrow(() -> new RuntimeException("Department not found"));
        }
        
        category.setDepartment(department);
        itemCategoryRepository.save(category);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ItemCategory> getAllItemCategories() {
        return itemCategoryRepository.findAll();
    }

    @Override
    public ItemCategory createItemCategory(CreateItemCategoryDto dto) {
        if (itemCategoryRepository.findByCategoryName(dto.getCategoryName()).isPresent()) {
            throw new RuntimeException("Category name already exists: " + dto.getCategoryName());
        }
        CategoryBehavior behavior = CategoryBehavior.DOCUMENT_CASE;
        if (dto.getBehaviorType() != null) {
            try {
                behavior = CategoryBehavior.valueOf(dto.getBehaviorType().toUpperCase().trim());
            } catch (IllegalArgumentException e) {
                // fall back to default
            }
        }
        ItemCategory category = ItemCategory.builder()
                .categoryName(dto.getCategoryName().trim())
                .sensitivityLevel(dto.getSensitivityLevel() != null ? dto.getSensitivityLevel() : "LOW")
                .description(dto.getDescription())
                .behaviorType(behavior)
                .createdAt(OffsetDateTime.now())
                .build();
        if (dto.getDepartmentId() != null) {
            Department dept = departmentRepository.findById(dto.getDepartmentId())
                    .orElseThrow(() -> new RuntimeException("Department not found"));
            category.setDepartment(dept);
        }
        return itemCategoryRepository.save(category);
    }

    @Override
    public ItemCategory updateItemCategory(Long categoryId, CreateItemCategoryDto dto) {
        ItemCategory category = itemCategoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Item Category not found: " + categoryId));
        category.setCategoryName(dto.getCategoryName().trim());
        category.setSensitivityLevel(dto.getSensitivityLevel() != null ? dto.getSensitivityLevel() : "LOW");
        category.setDescription(dto.getDescription());
        if (dto.getBehaviorType() != null) {
            try {
                category.setBehaviorType(CategoryBehavior.valueOf(dto.getBehaviorType().toUpperCase().trim()));
            } catch (IllegalArgumentException e) {
                // fall back or keep previous
            }
        }
        if (dto.getDepartmentId() != null) {
            Department dept = departmentRepository.findById(dto.getDepartmentId())
                    .orElseThrow(() -> new RuntimeException("Department not found"));
            category.setDepartment(dept);
        } else {
            category.setDepartment(null);
        }
        return itemCategoryRepository.save(category);
    }

    @Override
    public ItemCategory toggleItemCategoryStatus(Long categoryId) {
        ItemCategory category = itemCategoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Item Category not found: " + categoryId));
        category.setIsActive(!category.getIsActive());
        return itemCategoryRepository.save(category);
    }

    @Override
    public void deleteItemCategory(Long categoryId) {
        ItemCategory category = itemCategoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Item Category not found: " + categoryId));
        try {
            itemCategoryRepository.delete(category);
        } catch (Exception e) {
            throw new RuntimeException("Cannot delete item category '" + category.getCategoryName() + "'. It is currently referenced by physical asset transfer request records in the database. Please deactivate it instead.");
        }
    }

    // ── Stock Item Management ───────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<StockItem> getStockItemsByCategory(Long categoryId) {
        return stockItemRepository.findByCategory_CategoryId(categoryId);
    }

    @Override
    public StockItem createStockItem(Long categoryId, String itemName, String unit, String description) {
        ItemCategory category = itemCategoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Item Category not found: " + categoryId));
        
        if (category.getBehaviorType() != CategoryBehavior.STOCK) {
            throw new RuntimeException("Cannot create stock items for non-STOCK category behaviors.");
        }

        if (itemName == null || itemName.trim().isEmpty()) {
            throw new RuntimeException("Stock item name is required.");
        }

        if (stockItemRepository.findByCategory_CategoryIdAndItemName(categoryId, itemName.trim()).isPresent()) {
            throw new RuntimeException("A stock item with name '" + itemName.trim() + "' already exists under this category.");
        }

        StockItem item = StockItem.builder()
                .category(category)
                .itemName(itemName.trim())
                .unit(unit != null && !unit.trim().isEmpty() ? unit.trim() : "pcs")
                .description(description)
                .isActive(true)
                .createdAt(OffsetDateTime.now())
                .build();

        return stockItemRepository.save(item);
    }

    @Override
    public StockItem updateStockItem(Long stockItemId, String itemName, String unit, String description) {
        StockItem item = stockItemRepository.findById(stockItemId)
                .orElseThrow(() -> new RuntimeException("Stock Item not found: " + stockItemId));

        if (itemName == null || itemName.trim().isEmpty()) {
            throw new RuntimeException("Stock item name is required.");
        }

        // Check for duplicate name under same category (excluding current item)
        stockItemRepository.findByCategory_CategoryIdAndItemName(item.getCategory().getCategoryId(), itemName.trim())
                .ifPresent(existing -> {
                    if (!existing.getStockItemId().equals(stockItemId)) {
                        throw new RuntimeException("Another stock item with name '" + itemName.trim() + "' already exists under this category.");
                    }
                });

        item.setItemName(itemName.trim());
        item.setUnit(unit != null && !unit.trim().isEmpty() ? unit.trim() : "pcs");
        item.setDescription(description);

        return stockItemRepository.save(item);
    }

    @Override
    public StockItem toggleStockItemStatus(Long stockItemId) {
        StockItem item = stockItemRepository.findById(stockItemId)
                .orElseThrow(() -> new RuntimeException("Stock Item not found: " + stockItemId));
        item.setIsActive(!item.getIsActive());
        return stockItemRepository.save(item);
    }
}
