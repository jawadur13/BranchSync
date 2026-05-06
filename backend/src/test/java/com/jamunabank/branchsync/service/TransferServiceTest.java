package com.jamunabank.branchsync.service;

import com.jamunabank.branchsync.model.entity.*;
import com.jamunabank.branchsync.repository.*;
import com.jamunabank.branchsync.service.impl.TransferServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransferServiceTest {

    @Mock
    private TransferRequestRepository transferRequestRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private AuditService auditService;

    @InjectMocks
    private TransferServiceImpl transferService;

    private User requester;
    private Branch originBranch;
    private Branch destBranch;
    private ItemCategory cashCategory;

    @BeforeEach
    void setUp() {
        originBranch = Branch.builder().branchId(1L).branchName("Dhaka Main").build();
        destBranch = Branch.builder().branchId(2L).branchName("CTG Branch").build();
        Role role = Role.builder().roleName("OFFICER").build();
        requester = User.builder().userId(1L).fullName("John Doe").branch(originBranch).role(role).build();
        cashCategory = ItemCategory.builder().categoryName("CASH").build();
    }

    @Test
    void whenInitiateTransfer_thenStatusIsPendingInternal() {
        // Given
        TransferRequest request = TransferRequest.builder()
                .category(cashCategory)
                .priority("NORMAL")
                .destinationBranch(destBranch)
                .build();
        
        when(userRepository.findById(1L)).thenReturn(Optional.of(requester));
        when(transferRequestRepository.count()).thenReturn(10L);
        when(transferRequestRepository.save(any(TransferRequest.class))).thenAnswer(i -> i.getArguments()[0]);

        // When
        TransferRequest result = transferService.initiateTransfer(request, 1L);

        // Then
        assertThat(result.getStatus()).isEqualTo("PENDING_INTERNAL");
        verify(auditService).logAction(any(), eq(requester), eq("INITIATE"), isNull(), eq("PENDING_INTERNAL"), any(), any());
    }

    @Test
    void whenApproveInternal_thenStatusIsPendingAssignment() {
        // Given
        Role managerRole = Role.builder().roleName("BRANCH_MANAGER").build();
        User manager = User.builder().userId(2L).role(managerRole).branch(originBranch).build();
        
        TransferRequest request = TransferRequest.builder()
                .requestId(1001L)
                .originBranch(originBranch)
                .status("PENDING_INTERNAL")
                .build();

        when(transferRequestRepository.findById(1001L)).thenReturn(Optional.of(request));
        when(userRepository.findById(2L)).thenReturn(Optional.of(manager));
        when(transferRequestRepository.save(any(TransferRequest.class))).thenAnswer(i -> i.getArguments()[0]);

        // When
        TransferRequest result = transferService.approveInternal(1001L, 2L);

        // Then
        assertThat(result.getStatus()).isEqualTo("PENDING_ASSIGNMENT");
        verify(auditService).logAction(any(), eq(manager), eq("APPROVE_INTERNAL"), eq("PENDING_INTERNAL"), eq("PENDING_ASSIGNMENT"), any(), any());
    }

    @Test
    void whenAcceptAndAssign_thenStatusIsPendingFinalRelease() {
        // Given
        User destStaff = User.builder().userId(3L).branch(destBranch).build();
        User deliveryPerson = User.builder().userId(4L).fullName("Courier Dave").build();
        
        TransferRequest request = TransferRequest.builder()
                .requestId(1001L)
                .destinationBranch(destBranch)
                .status("PENDING_ASSIGNMENT")
                .build();

        when(transferRequestRepository.findById(1001L)).thenReturn(Optional.of(request));
        when(userRepository.findById(3L)).thenReturn(Optional.of(destStaff));
        when(userRepository.findById(4L)).thenReturn(Optional.of(deliveryPerson));
        when(transferRequestRepository.save(any(TransferRequest.class))).thenAnswer(i -> i.getArguments()[0]);

        // When
        TransferRequest result = transferService.acceptAndAssignDriver(1001L, 3L, 4L);

        // Then
        assertThat(result.getStatus()).isEqualTo("PENDING_FINAL_RELEASE");
        assertThat(result.getDeliveryPerson()).isEqualTo(deliveryPerson);
    }

    @Test
    void whenPickup_thenStatusIsInTransit() {
        // Given
        User deliveryPerson = User.builder().userId(4L).build();
        TransferRequest request = TransferRequest.builder()
                .requestId(1001L)
                .deliveryPerson(deliveryPerson)
                .status("READY_FOR_PICKUP")
                .build();

        when(transferRequestRepository.findById(1001L)).thenReturn(Optional.of(request));
        when(transferRequestRepository.save(any(TransferRequest.class))).thenAnswer(i -> i.getArguments()[0]);

        // When
        TransferRequest result = transferService.markPickedUp(1001L, 4L);

        // Then
        assertThat(result.getStatus()).isEqualTo("IN_TRANSIT");
        assertThat(result.getPickedUpAt()).isNotNull();
    }
}
