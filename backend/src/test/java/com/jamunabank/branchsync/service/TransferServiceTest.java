package com.jamunabank.branchsync.service;

import com.jamunabank.branchsync.model.entity.*;
import com.jamunabank.branchsync.model.enums.CategoryName;
import com.jamunabank.branchsync.model.enums.Priority;
import com.jamunabank.branchsync.model.enums.TransferStatus;
import com.jamunabank.branchsync.repository.*;
import com.jamunabank.branchsync.service.impl.TransferServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
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
    private ReceiptRecordRepository receiptRecordRepository;
    @Mock
    private AuditService auditService;

    @InjectMocks
    private TransferServiceImpl transferService;

    private User actor;
    private Branch branch;
    private ItemCategory cashCategory;

    @BeforeEach
    void setUp() {
        branch = Branch.builder().branchId(1L).branchName("Dhaka Main").build();
        Role role = Role.builder().roleName("OFFICER").build();
        actor = User.builder().userId(1L).fullName("John Doe").branch(branch).role(role).build();
        cashCategory = ItemCategory.builder().categoryName(CategoryName.CASH).build();
    }

    @Test
    void whenInitiateCashTransfer_thenStatusIsPendingApproval() {
        // Given
        TransferRequest request = TransferRequest.builder()
                .category(cashCategory)
                .priority(Priority.NORMAL)
                .build();
        
        when(userRepository.findById(1L)).thenReturn(Optional.of(actor));
        when(transferRequestRepository.count()).thenReturn(10L);
        when(transferRequestRepository.save(any(TransferRequest.class))).thenAnswer(i -> i.getArguments()[0]);

        // When
        TransferRequest result = transferService.initiateTransfer(request, 1L);

        // Then
        assertThat(result.getRequestCode()).startsWith("REQ-2026-0011");
        assertThat(result.getStatus()).isEqualTo(TransferStatus.PENDING_APPROVAL);
        verify(auditService, times(1)).logAction(any(), any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void whenApproveAndAssign_thenStatusIsPendingDelivery() {
        // Given
        Role managerRole = Role.builder().roleName("BRANCH_MANAGER").build();
        User manager = User.builder().userId(2L).role(managerRole).branch(branch).build();
        User deliveryPerson = User.builder().userId(3L).fullName("Courier Dave").build();
        
        TransferRequest request = TransferRequest.builder()
                .requestId(1001L)
                .originBranch(branch)
                .status(TransferStatus.PENDING_APPROVAL)
                .build();

        when(transferRequestRepository.findById(1001L)).thenReturn(Optional.of(request));
        when(userRepository.findById(2L)).thenReturn(Optional.of(manager));
        when(userRepository.findById(3L)).thenReturn(Optional.of(deliveryPerson));
        when(transferRequestRepository.save(any(TransferRequest.class))).thenAnswer(i -> i.getArguments()[0]);

        // When
        TransferRequest result = transferService.approveAndAssignDelivery(1001L, 2L, 3L);

        // Then
        assertThat(result.getStatus()).isEqualTo(TransferStatus.PENDING_DELIVERY);
        assertThat(result.getDeliveryPerson()).isEqualTo(deliveryPerson);
        verify(auditService).logAction(any(), eq(manager), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void whenHandoffByDelivery_thenStatusIsInTransit() {
        // Given
        User deliveryPerson = User.builder().userId(3L).build();
        TransferRequest request = TransferRequest.builder()
                .requestId(1001L)
                .deliveryPerson(deliveryPerson)
                .status(TransferStatus.PENDING_DELIVERY)
                .build();

        when(transferRequestRepository.findById(1001L)).thenReturn(Optional.of(request));
        when(transferRequestRepository.save(any(TransferRequest.class))).thenAnswer(i -> i.getArguments()[0]);

        // When
        TransferRequest result = transferService.markAsInTransit(1001L, 3L);

        // Then
        assertThat(result.getStatus()).isEqualTo(TransferStatus.IN_TRANSIT);
    }

    @Test
    void whenArriveByDelivery_thenStatusIsArrived() {
        // Given
        User deliveryPerson = User.builder().userId(3L).build();
        TransferRequest request = TransferRequest.builder()
                .requestId(1001L)
                .deliveryPerson(deliveryPerson)
                .status(TransferStatus.IN_TRANSIT)
                .build();

        when(transferRequestRepository.findById(1001L)).thenReturn(Optional.of(request));
        when(transferRequestRepository.save(any(TransferRequest.class))).thenAnswer(i -> i.getArguments()[0]);

        // When
        TransferRequest result = transferService.markAsArrived(1001L, 3L);

        // Then
        assertThat(result.getStatus()).isEqualTo(TransferStatus.ARRIVED);
    }

    @Test
    void whenConfirmByDestManager_thenStatusIsCompleted() {
        // Given
        Branch destBranch = Branch.builder().branchId(2L).build();
        Role managerRole = Role.builder().roleName("BRANCH_MANAGER").build();
        User destManager = User.builder().userId(4L).role(managerRole).branch(destBranch).build();
        
        TransferRequest request = TransferRequest.builder()
                .requestId(1001L)
                .destinationBranch(destBranch)
                .status(TransferStatus.ARRIVED)
                .build();

        when(transferRequestRepository.findById(1001L)).thenReturn(Optional.of(request));
        when(userRepository.findById(4L)).thenReturn(Optional.of(destManager));
        when(transferRequestRepository.save(any(TransferRequest.class))).thenAnswer(i -> i.getArguments()[0]);

        // When
        TransferRequest result = transferService.confirmReceipt(1001L, 4L, "Received all boxes intact.");

        // Then
        assertThat(result.getStatus()).isEqualTo(TransferStatus.COMPLETED);
        assertThat(result.getFinalNote()).isEqualTo("Received all boxes intact.");
        assertThat(result.getClosedAt()).isNotNull();
    }
}
