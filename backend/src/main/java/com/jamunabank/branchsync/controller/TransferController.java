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
import org.springframework.web.bind.annotation.*;
import com.jamunabank.branchsync.security.CustomUserDetails;

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

    @GetMapping("/{requestId}")
    public ResponseEntity<TransferDetailDto> getTransferById(@PathVariable Long requestId) {
        TransferRequest request = transferRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Transfer request not found: " + requestId));
        return ResponseEntity.ok(transferMapper.toDetailDto(request));
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

    // Step 1 Gate: Source manager approves internally
    @PostMapping("/{requestId}/approve-internal")
    public ResponseEntity<TransferResponseDto> approveInternal(
            Authentication authentication, @PathVariable Long requestId) {

        TransferRequest updated = transferService.approveInternal(requestId, getUserId(authentication));
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
