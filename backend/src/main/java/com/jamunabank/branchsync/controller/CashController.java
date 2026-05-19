package com.jamunabank.branchsync.controller;

import com.jamunabank.branchsync.model.entity.*;
import com.jamunabank.branchsync.repository.BranchRepository;
import com.jamunabank.branchsync.security.CustomUserDetails;
import com.jamunabank.branchsync.service.CashService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/cash")
@RequiredArgsConstructor
public class CashController {

    private final CashService cashService;
    private final BranchRepository branchRepository;

    // ── Balance ───────────────────────────────────────────────────────────────

    @GetMapping("/balance/{branchId}")
    public ResponseEntity<Map<String, Object>> getBranchBalance(@PathVariable Long branchId) {
        BranchCashBalance balance = cashService.getOrCreateBalance(branchId);
        Map<String, Object> result = new HashMap<>();
        result.put("branchId", branchId);
        result.put("branchName", balance.getBranch() != null ? balance.getBranch().getBranchName() : null);
        result.put("currentBalance", balance.getCurrentBalance());
        result.put("lastUpdatedAt", balance.getLastUpdatedAt());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/balances")
    public ResponseEntity<List<Map<String, Object>>> getAllBalances() {
        // For HQ routing view — initialize balances for all branches on the fly
        List<Branch> branches = branchRepository.findAll();
        List<Map<String, Object>> result = branches.stream().map(branch -> {
            BranchCashBalance balance = cashService.getOrCreateBalance(branch.getBranchId());
            Map<String, Object> m = new HashMap<>();
            m.put("branchId", branch.getBranchId());
            m.put("branchCode", branch.getBranchCode());
            m.put("branchName", branch.getBranchName());
            m.put("currentBalance", balance.getCurrentBalance());
            m.put("lastUpdatedAt", balance.getLastUpdatedAt());
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // ── Denominations ─────────────────────────────────────────────────────────

    @PostMapping("/denominations/{requestId}")
    public ResponseEntity<List<Map<String, Object>>> submitDenominations(
            @PathVariable Long requestId,
            @RequestBody Map<String, Object> body,
            Authentication authentication) {

        Long actorId = getUserId(authentication);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> denominations = (List<Map<String, Object>>) body.get("denominations");
        List<CashTransferDenomination> saved = cashService.submitDenominations(requestId, actorId, denominations);
        return ResponseEntity.ok(mapDenominations(saved));
    }

    @GetMapping("/denominations/{requestId}")
    public ResponseEntity<List<Map<String, Object>>> getDenominations(@PathVariable Long requestId) {
        List<CashTransferDenomination> denoms = cashService.getDenominations(requestId);
        return ResponseEntity.ok(mapDenominations(denoms));
    }

    // ── Ledger ────────────────────────────────────────────────────────────────

    @GetMapping("/ledger/{branchId}")
    public ResponseEntity<List<Map<String, Object>>> getLedger(
            @PathVariable Long branchId,
            Authentication authentication) {

        Long actorId = getUserId(authentication);
        List<CashLedgerEntry> entries = cashService.getLedger(branchId, actorId);
        List<Map<String, Object>> result = entries.stream().map(e -> {
            Map<String, Object> m = new HashMap<>();
            m.put("ledgerId", e.getLedgerId());
            m.put("entryType", e.getEntryType());
            m.put("amount", e.getAmount());
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
        Long branchId = actorId; // will be resolved in service from actor's branch
        BigDecimal amount = new BigDecimal(body.get("amount").toString());
        String reason = (String) body.get("reason");

        // Resolve actual branchId from actor
        Long resolvedBranchId = ((CustomUserDetails) authentication.getPrincipal()).getBranchId();
        CashManualAdjustment adj = cashService.submitAdjustment(resolvedBranchId, actorId, amount, reason);
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
        CashManualAdjustment adj = cashService.approveAdjustment(adjustmentId, approverId, approved, decisionNote);
        return ResponseEntity.ok(mapAdjustment(adj));
    }

    @GetMapping("/adjust/pending")
    public ResponseEntity<List<Map<String, Object>>> getPendingAdjustments(Authentication authentication) {
        Long branchId = ((CustomUserDetails) authentication.getPrincipal()).getBranchId();
        List<CashManualAdjustment> list = cashService.getPendingAdjustments(branchId);
        return ResponseEntity.ok(list.stream().map(this::mapAdjustment).collect(Collectors.toList()));
    }

    @GetMapping("/adjust/all")
    public ResponseEntity<List<Map<String, Object>>> getAllAdjustments(
            @RequestParam(required = false) Long branchId,
            Authentication authentication) {
        Long resolvedBranchId = branchId != null ? branchId
                : ((CustomUserDetails) authentication.getPrincipal()).getBranchId();
        List<CashManualAdjustment> list = cashService.getAllAdjustments(resolvedBranchId);
        return ResponseEntity.ok(list.stream().map(this::mapAdjustment).collect(Collectors.toList()));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Long getUserId(Authentication auth) {
        return ((CustomUserDetails) auth.getPrincipal()).getUserId();
    }

    private List<Map<String, Object>> mapDenominations(List<CashTransferDenomination> denoms) {
        return denoms.stream().map(d -> {
            Map<String, Object> m = new HashMap<>();
            m.put("denominationId", d.getDenominationId());
            m.put("denomination", d.getDenomination());
            m.put("quantity", d.getQuantity());
            m.put("subtotal", d.getSubtotal());
            m.put("submittedAt", d.getSubmittedAt());
            m.put("submittedByFullName", d.getSubmittedBy() != null ? d.getSubmittedBy().getFullName() : null);
            return m;
        }).collect(Collectors.toList());
    }

    private Map<String, Object> mapAdjustment(CashManualAdjustment adj) {
        Map<String, Object> m = new HashMap<>();
        m.put("adjustmentId", adj.getAdjustmentId());
        m.put("branchId", adj.getBranch() != null ? adj.getBranch().getBranchId() : null);
        m.put("branchName", adj.getBranch() != null ? adj.getBranch().getBranchName() : null);
        m.put("amount", adj.getAmount());
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
