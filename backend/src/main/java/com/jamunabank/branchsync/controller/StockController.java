package com.jamunabank.branchsync.controller;

import com.jamunabank.branchsync.model.entity.*;
import com.jamunabank.branchsync.security.CustomUserDetails;
import com.jamunabank.branchsync.service.StockService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/stock")
@RequiredArgsConstructor
public class StockController {

    private final StockService stockService;

    // ── Balance ───────────────────────────────────────────────────────────────

    @GetMapping("/balance/{branchId}/{stockItemId}")
    public ResponseEntity<Map<String, Object>> getBranchStockBalance(
            @PathVariable Long branchId,
            @PathVariable Long stockItemId) {
        BranchStockBalance balance = stockService.getOrCreateBalance(branchId, stockItemId);
        Map<String, Object> result = new HashMap<>();
        result.put("branchId", branchId);
        result.put("stockItemId", stockItemId);
        result.put("itemName", balance.getStockItem() != null ? balance.getStockItem().getItemName() : null);
        result.put("currentQuantity", balance.getCurrentQuantity());
        result.put("lastUpdatedAt", balance.getLastUpdatedAt());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/balances/{branchId}")
    public ResponseEntity<List<Map<String, Object>>> getBranchBalances(@PathVariable Long branchId) {
        List<BranchStockBalance> balances = stockService.getBranchStockBalances(branchId);
        List<Map<String, Object>> result = balances.stream().map(b -> {
            Map<String, Object> m = new HashMap<>();
            m.put("branchStockBalanceId", b.getBranchStockBalanceId());
            m.put("stockItemId", b.getStockItem().getStockItemId());
            m.put("itemName", b.getStockItem().getItemName());
            m.put("itemCode", b.getStockItem().getItemCode());
            m.put("categoryName", b.getStockItem().getCategory().getCategoryName());
            m.put("currentQuantity", b.getCurrentQuantity());
            m.put("unit", b.getStockItem().getUnit());
            m.put("lastUpdatedAt", b.getLastUpdatedAt());
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // ── Ledger ────────────────────────────────────────────────────────────────

    @GetMapping("/ledger/{branchId}/{stockItemId}")
    public ResponseEntity<List<Map<String, Object>>> getLedger(
            @PathVariable Long branchId,
            @PathVariable Long stockItemId,
            Authentication authentication) {

        Long actorId = getUserId(authentication);
        List<StockLedgerEntry> entries = stockService.getLedger(branchId, stockItemId, actorId);
        List<Map<String, Object>> result = entries.stream().map(e -> {
            Map<String, Object> m = new HashMap<>();
            m.put("ledgerId", e.getLedgerId());
            m.put("entryType", e.getEntryType());
            m.put("quantity", e.getQuantity());
            m.put("balanceBefore", e.getBalanceBefore());
            m.put("balanceAfter", e.getBalanceAfter());
            m.put("reason", e.getReason());
            m.put("createdAt", e.getCreatedAt());
            m.put("requestId", e.getTransferRequest() != null ? e.getTransferRequest().getRequestId() : null);
            m.put("requestCode", e.getTransferRequest() != null ? e.getTransferRequest().getRequestCode() : null);
            m.put("actorFullName", e.getActor() != null ? e.getActor().getFullName() : null);
            m.put("actorEmployeeId", e.getActor() != null ? e.getActor().getEmployeeId() : null);
            m.put("approverFullName", e.getApprover() != null ? e.getApprover().getFullName() : null);
            m.put("approverEmployeeId", e.getApprover() != null ? e.getApprover().getEmployeeId() : null);
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // ── Manual Adjustments ────────────────────────────────────────────────────

    @PostMapping("/adjust")
    public ResponseEntity<Map<String, Object>> submitAdjustment(
            @RequestBody Map<String, Object> body,
            Authentication authentication) {

        Long actorId = getUserId(authentication);
        Long stockItemId = Long.valueOf(body.get("stockItemId").toString());
        int quantity = Integer.parseInt(body.get("quantity").toString());
        String reason = (String) body.get("reason");

        Long resolvedBranchId = ((CustomUserDetails) authentication.getPrincipal()).getBranchId();
        StockManualAdjustment adj = stockService.submitAdjustment(resolvedBranchId, stockItemId, actorId, quantity, reason);
        return ResponseEntity.ok(mapAdjustment(adj));
    }

    @PostMapping("/adjust/{adjustmentId}/decide")
    public ResponseEntity<Map<String, Object>> decideAdjustment(
            @PathVariable Long adjustmentId,
            @RequestBody Map<String, Object> body,
            Authentication authentication) {

        Long approverId = getUserId(authentication);
        boolean approved = Boolean.TRUE.equals(body.get("approved"));
        String decisionNote = (String) body.get("decisionNote");
        StockManualAdjustment adj = stockService.approveAdjustment(adjustmentId, approverId, approved, decisionNote);
        return ResponseEntity.ok(mapAdjustment(adj));
    }

    @GetMapping("/adjust/pending")
    public ResponseEntity<List<Map<String, Object>>> getPendingAdjustments(Authentication authentication) {
        Long branchId = ((CustomUserDetails) authentication.getPrincipal()).getBranchId();
        List<StockManualAdjustment> list = stockService.getPendingAdjustments(branchId);
        return ResponseEntity.ok(list.stream().map(this::mapAdjustment).collect(Collectors.toList()));
    }

    @GetMapping("/adjust/all")
    public ResponseEntity<List<Map<String, Object>>> getAllAdjustments(
            @RequestParam(required = false) Long branchId,
            Authentication authentication) {
        Long resolvedBranchId = branchId != null ? branchId
                : ((CustomUserDetails) authentication.getPrincipal()).getBranchId();
        List<StockManualAdjustment> list = stockService.getAllAdjustments(resolvedBranchId);
        return ResponseEntity.ok(list.stream().map(this::mapAdjustment).collect(Collectors.toList()));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Long getUserId(Authentication auth) {
        return ((CustomUserDetails) auth.getPrincipal()).getUserId();
    }

    private Map<String, Object> mapAdjustment(StockManualAdjustment adj) {
        Map<String, Object> m = new HashMap<>();
        m.put("adjustmentId", adj.getAdjustmentId());
        m.put("branchId", adj.getBranch() != null ? adj.getBranch().getBranchId() : null);
        m.put("branchName", adj.getBranch() != null ? adj.getBranch().getBranchName() : null);
        m.put("stockItemId", adj.getStockItem() != null ? adj.getStockItem().getStockItemId() : null);
        m.put("itemName", adj.getStockItem() != null ? adj.getStockItem().getItemName() : null);
        m.put("quantity", adj.getQuantity());
        m.put("reason", adj.getReason());
        m.put("status", adj.getStatus());
        m.put("submittedAt", adj.getSubmittedAt());
        m.put("submittedByFullName", adj.getSubmittedBy() != null ? adj.getSubmittedBy().getFullName() : null);
        m.put("submittedByEmployeeId", adj.getSubmittedBy() != null ? adj.getSubmittedBy().getEmployeeId() : null);
        m.put("approvedByFullName", adj.getApprovedBy() != null ? adj.getApprovedBy().getFullName() : null);
        m.put("decidedAt", adj.getDecidedAt());
        m.put("decisionNote", adj.getDecisionNote());
        return m;
    }
}
