package com.jamunabank.branchsync.controller;

import com.jamunabank.branchsync.dto.request.InitiateTransferRequestDto;
import com.jamunabank.branchsync.dto.response.TransferDetailDto;
import com.jamunabank.branchsync.dto.response.TransferResponseDto;
import com.jamunabank.branchsync.mapper.TransferMapper;
import com.jamunabank.branchsync.model.entity.TransferRequest;
import com.jamunabank.branchsync.repository.TransferRequestRepository;
import com.jamunabank.branchsync.service.TransferService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;
import com.jamunabank.branchsync.security.CustomUserDetails;
import com.jamunabank.branchsync.dto.response.AuditLogResponseDto;
import com.jamunabank.branchsync.repository.AuditLogRepository;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/transfers")
@RequiredArgsConstructor
public class TransferController {

    private final TransferService transferService;
    private final TransferMapper transferMapper;
    private final TransferRequestRepository transferRequestRepository;
    private final AuditLogRepository auditLogRepository;

    @GetMapping("/{requestId}")
    public ResponseEntity<TransferDetailDto> getTransferById(
            @PathVariable Long requestId,
            Authentication authentication) {
        
        TransferRequest request = transferRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Transfer request not found: " + requestId));
        TransferDetailDto dto = transferMapper.toDetailDto(request);
        
        // 1. Fetch current user context
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        Long loggedInUserId = userDetails.getUserId();
        Long loggedInBranchId = userDetails.getBranchId();
        Long loggedInDepartmentId = userDetails.getDepartmentId();
        String loggedInRoleName = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .findFirst()
                .orElse("");
        
        // 2. Fetch all raw logs
        List<AuditLogResponseDto> allLogs = auditLogRepository.findByTransferRequest_RequestIdOrderByActedAtDesc(requestId).stream()
                .map(log -> AuditLogResponseDto.builder()
                        .auditId(log.getAuditId())
                        .action(log.getAction())
                        .fromStatus(log.getFromStatus())
                        .toStatus(log.getToStatus())
                        .remarks(log.getRemarks())
                        .actedAt(log.getActedAt())
                        .ipAddress(log.getIpAddress())
                        .actorUserId(log.getActor() != null ? log.getActor().getUserId() : null)
                        .actorFullName(log.getActor() != null ? log.getActor().getFullName() : null)
                        .actorEmployeeId(log.getActor() != null ? log.getActor().getEmployeeId() : null)
                        .actorRoleName(log.getActor() != null && log.getActor().getRole() != null ? log.getActor().getRole().getRoleName() : null)
                        .actorBranchName(log.getActor() != null && log.getActor().getBranch() != null ? log.getActor().getBranch().getBranchName() : null)
                        .actorDepartmentName(log.getActor() != null && log.getActor().getDepartment() != null ? log.getActor().getDepartment().getDepartmentName() : null)
                        .build())
                .collect(Collectors.toList());
        
        List<AuditLogResponseDto> scopedLogs = new java.util.ArrayList<>();
        
        // 3. Apply role-based scoping constraints
        if ("SYSTEM_ADMIN".equals(loggedInRoleName) || "HQ_LOGISTICS_OFFICER".equals(loggedInRoleName)) {
            // Can see all details for each transfer
            scopedLogs = allLogs;
        } 
        else if ("BRANCH_MANAGER".equals(loggedInRoleName) || "OPERATION_MANAGER".equals(loggedInRoleName) || "FIRST_EXECUTIVE_OFFICER".equals(loggedInRoleName)) {
            // Can see all details for all transfers of their branch
            Long originBranchId = request.getOriginBranch() != null ? request.getOriginBranch().getBranchId() : null;
            Long destBranchId = request.getDestinationBranch() != null ? request.getDestinationBranch().getBranchId() : null;
            
            if (loggedInBranchId != null && (loggedInBranchId.equals(originBranchId) || loggedInBranchId.equals(destBranchId))) {
                scopedLogs = allLogs;
            }
        } 
        else if ("OFFICER".equals(loggedInRoleName)) {
            // Can see all details for their department in their branch
            Long originBranchId = request.getOriginBranch() != null ? request.getOriginBranch().getBranchId() : null;
            Long originDeptId = request.getOriginDepartment() != null ? request.getOriginDepartment().getDepartmentId() : null;
            Long destBranchId = request.getDestinationBranch() != null ? request.getDestinationBranch().getBranchId() : null;
            Long destDeptId = request.getDestinationDepartment() != null ? request.getDestinationDepartment().getDepartmentId() : null;
            
            boolean matchesOrigin = loggedInBranchId != null && loggedInBranchId.equals(originBranchId) 
                    && loggedInDepartmentId != null && loggedInDepartmentId.equals(originDeptId);
            boolean matchesDest = loggedInBranchId != null && loggedInBranchId.equals(destBranchId) 
                    && loggedInDepartmentId != null && loggedInDepartmentId.equals(destDeptId);
            
            if (matchesOrigin || matchesDest) {
                scopedLogs = allLogs;
            }
        } 
        else if ("DELIVERY_PERSON".equals(loggedInRoleName)) {
            // Can see only the assignment, pickup, delivery, and final close (completion/rejection) steps of their assigned transfer
            Long assignedDriverId = request.getDeliveryPerson() != null ? request.getDeliveryPerson().getUserId() : null;
            
            if (loggedInUserId != null && loggedInUserId.equals(assignedDriverId)) {
                scopedLogs = allLogs.stream()
                        .filter(log -> "ASSIGNED_DRIVER".equals(log.getAction())
                                    || "PICKED_UP".equals(log.getAction())
                                    || "DELIVERED".equals(log.getAction())
                                    || "COMPLETED".equals(log.getAction())
                                    || "REJECTED".equals(log.getAction()))
                        .collect(Collectors.toList());
            }
        }
        
        dto.setAuditLogs(scopedLogs);
        return ResponseEntity.ok(dto);
    }

    @GetMapping
    public ResponseEntity<List<TransferResponseDto>> getDashboardTransfers(Authentication authentication) {
        Long actorId = getUserId(authentication);
        return ResponseEntity.ok(
            transferService.getDashboardTransfers(actorId).stream()
                .map(transferMapper::toResponseDto)
                .collect(Collectors.toList())
        );
    }

    @GetMapping("/history")
    public ResponseEntity<List<TransferResponseDto>> getTransferHistory(Authentication authentication) {
        Long actorId = getUserId(authentication);
        return ResponseEntity.ok(
            transferService.getTransferHistory(actorId).stream()
                .map(transferMapper::toResponseDto)
                .collect(Collectors.toList())
        );
    }

    // Step 1: Initiate
    @PostMapping
    public ResponseEntity<TransferResponseDto> initiateTransfer(
            Authentication authentication,
            @Valid @RequestBody InitiateTransferRequestDto dto) {

        TransferRequest entity = transferMapper.toEntity(dto);
        TransferRequest saved = transferService.initiateTransfer(entity, getUserId(authentication));
        return new ResponseEntity<>(transferMapper.toResponseDto(saved), HttpStatus.CREATED);
    }

    // Step 1 Gate: Source manager approves internally → routes to HQ
    @PostMapping("/{requestId}/approve-internal")
    public ResponseEntity<TransferResponseDto> approveInternal(
            Authentication authentication, @PathVariable Long requestId) {

        TransferRequest updated = transferService.approveInternal(requestId, getUserId(authentication));
        return ResponseEntity.ok(transferMapper.toResponseDto(updated));
    }

    // HQ Step: Central Logistics Control officer verifies or rejects
    @PostMapping("/{requestId}/hq-verify")
    public ResponseEntity<TransferResponseDto> hqVerify(
            Authentication authentication,
            @PathVariable Long requestId,
            @RequestBody Map<String, Object> body) {

        String rejectionNote = (String) body.get("rejectionNote");
        boolean approved = Boolean.TRUE.equals(body.get("approved"));
        TransferRequest updated = transferService.hqVerify(requestId, getUserId(authentication), rejectionNote, approved);
        return ResponseEntity.ok(transferMapper.toResponseDto(updated));
    }

    // Step 2: Dest dept staff accepts and assigns driver
    @PostMapping("/{requestId}/accept")
    public ResponseEntity<TransferResponseDto> acceptAndAssignDriver(
            Authentication authentication,
            @PathVariable Long requestId,
            @RequestBody Map<String, Long> body) {

        Long deliveryPersonId = body.get("deliveryPersonId");
        TransferRequest updated = transferService.acceptAndAssignDriver(requestId, getUserId(authentication), deliveryPersonId);
        return ResponseEntity.ok(transferMapper.toResponseDto(updated));
    }

    // Step 3: Dest manager gives green light
    @PostMapping("/{requestId}/release")
    public ResponseEntity<TransferResponseDto> releaseFinal(
            Authentication authentication, @PathVariable Long requestId) {

        TransferRequest updated = transferService.releaseFinal(requestId, getUserId(authentication));
        return ResponseEntity.ok(transferMapper.toResponseDto(updated));
    }

    // Step 4: Driver picks up
    @PostMapping("/{requestId}/pickup")
    public ResponseEntity<TransferResponseDto> markPickedUp(
            Authentication authentication, @PathVariable Long requestId) {

        TransferRequest updated = transferService.markPickedUp(requestId, getUserId(authentication));
        return ResponseEntity.ok(transferMapper.toResponseDto(updated));
    }

    // Step 5: Driver marks delivered
    @PostMapping("/{requestId}/deliver")
    public ResponseEntity<TransferResponseDto> markDelivered(
            Authentication authentication, @PathVariable Long requestId) {

        TransferRequest updated = transferService.markDelivered(requestId, getUserId(authentication));
        return ResponseEntity.ok(transferMapper.toResponseDto(updated));
    }

    // Step 6: Original requester closes
    @PostMapping("/{requestId}/close")
    public ResponseEntity<TransferResponseDto> closeRequest(
            Authentication authentication,
            @PathVariable Long requestId,
            @RequestBody Map<String, Object> body) {

        String finalNote = (String) body.get("finalNote");
        boolean accepted = Boolean.TRUE.equals(body.get("accepted"));
        TransferRequest updated = transferService.closeRequest(requestId, getUserId(authentication), finalNote, accepted);
        return ResponseEntity.ok(transferMapper.toResponseDto(updated));
    }

    private Long getUserId(Authentication auth) {
        return ((CustomUserDetails) auth.getPrincipal()).getUserId();
    }
}
