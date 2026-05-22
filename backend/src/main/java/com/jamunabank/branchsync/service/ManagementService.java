package com.jamunabank.branchsync.service;

import com.jamunabank.branchsync.dto.request.CreateBranchDto;
import com.jamunabank.branchsync.dto.request.CreateDepartmentDto;
import com.jamunabank.branchsync.dto.request.CreateItemCategoryDto;
import com.jamunabank.branchsync.dto.request.CreateUserDto;
import com.jamunabank.branchsync.model.entity.Branch;
import com.jamunabank.branchsync.model.entity.Department;
import com.jamunabank.branchsync.model.entity.ItemCategory;
import com.jamunabank.branchsync.model.entity.StockItem;
import com.jamunabank.branchsync.model.entity.User;

import java.util.List;

public interface ManagementService {
    // User Management
    List<User> getAllUsers();
    User createUser(CreateUserDto dto);
    User updateUser(Long userId, CreateUserDto dto);
    User toggleUserStatus(Long userId);

    // Org Management
    List<Branch> getAllBranches();
    Branch createBranch(CreateBranchDto dto);
    
    List<Department> getAllDepartments();
    Department createDepartment(CreateDepartmentDto dto);
    
    Branch updateBranch(Long branchId, CreateBranchDto dto);
    Department updateDepartment(Long departmentId, CreateDepartmentDto dto);
    
    void mapItemCategoryToDepartment(Long categoryId, Long departmentId);

    // Item Category Management
    List<ItemCategory> getAllItemCategories();
    ItemCategory createItemCategory(CreateItemCategoryDto dto);
    ItemCategory updateItemCategory(Long categoryId, CreateItemCategoryDto dto);
    ItemCategory toggleItemCategoryStatus(Long categoryId);
    void deleteItemCategory(Long categoryId);

    // Stock Item Management
    List<StockItem> getStockItemsByCategory(Long categoryId);
    StockItem createStockItem(Long categoryId, String itemName, String unit, String description);
    StockItem updateStockItem(Long stockItemId, String itemName, String unit, String description);
    StockItem toggleStockItemStatus(Long stockItemId);
}
