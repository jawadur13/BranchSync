package com.jamunabank.branchsync.controller;

import com.jamunabank.branchsync.model.entity.Branch;
import com.jamunabank.branchsync.model.entity.ItemCategory;
import com.jamunabank.branchsync.repository.BranchRepository;
import com.jamunabank.branchsync.repository.ItemCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/lookup")
@RequiredArgsConstructor
public class LookupController {

    private final BranchRepository branchRepository;
    private final ItemCategoryRepository itemCategoryRepository;

    @GetMapping("/branches")
    public ResponseEntity<List<Map<String, Object>>> getAllBranches() {
        List<Map<String, Object>> branches = branchRepository.findAll().stream()
                .filter(b -> b.getIsActive())
                .map(b -> Map.<String, Object>of(
                        "id", b.getBranchId(),
                        "code", b.getBranchCode(),
                        "name", b.getBranchName(),
                        "type", b.getBranchType().name(),
                        "district", b.getDistrict()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(branches);
    }

    @GetMapping("/categories")
    public ResponseEntity<List<Map<String, Object>>> getAllCategories() {
        List<Map<String, Object>> categories = itemCategoryRepository.findAll().stream()
                .map(c -> Map.<String, Object>of(
                        "id", c.getCategoryId(),
                        "name", c.getCategoryName().name(),
                        "requiresDualVerification", c.getRequiresDualVerification(),
                        "requiresHqApproval", c.getRequiresHqApproval(),
                        "sensitivityLevel", c.getSensitivityLevel().name()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(categories);
    }
}
