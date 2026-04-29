package com.jamunabank.branchsync.service.impl;

import com.jamunabank.branchsync.dto.request.CreateBranchDto;
import com.jamunabank.branchsync.dto.request.CreateDepartmentDto;
import com.jamunabank.branchsync.dto.request.CreateUserDto;
import com.jamunabank.branchsync.model.entity.*;
import com.jamunabank.branchsync.model.enums.BranchType;
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
        Branch branch = branchRepository.findById(dto.getBranchId())
                .orElseThrow(() -> new RuntimeException("Branch not found"));

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
            user.setPasswordHash(passwordEncoder.encode(dto.getPassword()));
        }

        user.setRole(roleRepository.findById(dto.getRoleId()).orElse(user.getRole()));
        user.setBranch(branchRepository.findById(dto.getBranchId()).orElse(user.getBranch()));
        
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
        return departmentRepository.findAllWithBranch();
    }

    @Override
    public Department createDepartment(CreateDepartmentDto dto) {
        Department department = Department.builder()
                .departmentName(dto.getDepartmentName())
                .createdAt(OffsetDateTime.now())
                .build();

        if (dto.getBranchId() != null) {
            department.setBranch(branchRepository.findById(dto.getBranchId()).orElse(null));
        }

        return departmentRepository.save(department);
    }
}
