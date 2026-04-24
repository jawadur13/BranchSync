package com.jamunabank.branchsync.controller;

import com.jamunabank.branchsync.dto.request.InitiateTransferRequestDto;
import com.jamunabank.branchsync.dto.request.VerificationRequestDto;
import com.jamunabank.branchsync.dto.response.TransferResponseDto;
import com.jamunabank.branchsync.mapper.TransferMapper;
import com.jamunabank.branchsync.model.entity.TransferRequest;
import com.jamunabank.branchsync.service.TransferService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.jamunabank.branchsync.security.CustomUserDetails;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/transfers")
@RequiredArgsConstructor
public class TransferController {

    private final TransferService transferService;
    private final TransferMapper transferMapper;

    @PostMapping
    public ResponseEntity<TransferResponseDto> initiateTransfer(
            Authentication authentication,
            @Valid @RequestBody InitiateTransferRequestDto requestDto) {
        
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        Long actorId = userDetails.getUserId();

        TransferRequest requestEntity = transferMapper.toEntity(requestDto);
        TransferRequest savedRequest = transferService.initiateTransfer(requestEntity, actorId);
        
        return new ResponseEntity<>(transferMapper.toResponseDto(savedRequest), HttpStatus.CREATED);
    }

    @PostMapping("/{requestId}/approve")
    @PreAuthorize("hasAnyRole('BRANCH_MANAGER', 'FIRST_EXECUTIVE_OFFICER')")
    public ResponseEntity<TransferResponseDto> approveTransfer(
            Authentication authentication,
            @PathVariable Long requestId) {
        
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        Long approverId = userDetails.getUserId();

        TransferRequest approvedRequest = transferService.approveTransfer(requestId, approverId);
        
        return ResponseEntity.ok(transferMapper.toResponseDto(approvedRequest));
    }

    @PostMapping("/{requestId}/verify")
    public ResponseEntity<TransferResponseDto> verifyTransfer(
            Authentication authentication,
            @PathVariable Long requestId,
            @Valid @RequestBody VerificationRequestDto verificationDto) {
        
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        Long actorId = userDetails.getUserId();

        TransferRequest verifiedRequest = transferService.processDualVerification(
                requestId, 
                actorId, 
                verificationDto.getIsOriginConfirmation()
        );
        
        return ResponseEntity.ok(transferMapper.toResponseDto(verifiedRequest));
    }

    @GetMapping
    public ResponseEntity<List<TransferResponseDto>> getDashboardTransfers(Authentication authentication) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        Long actorId = userDetails.getUserId();

        List<TransferRequest> transfers = transferService.getDashboardTransfers(actorId);
        
        List<TransferResponseDto> responseDtos = transfers.stream()
                .map(transferMapper::toResponseDto)
                .collect(Collectors.toList());
                
        return ResponseEntity.ok(responseDtos);
    }
}
