package com.jamunabank.branchsync.repository;

import com.jamunabank.branchsync.model.entity.Branch;
import com.jamunabank.branchsync.model.entity.ItemCategory;
import com.jamunabank.branchsync.model.entity.Role;
import com.jamunabank.branchsync.model.entity.TransferRequest;
import com.jamunabank.branchsync.model.entity.User;
import com.jamunabank.branchsync.model.enums.BranchType;
import com.jamunabank.branchsync.model.enums.CategoryName;
import com.jamunabank.branchsync.model.enums.RequestType;
import com.jamunabank.branchsync.model.enums.TransferStatus;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import java.time.OffsetDateTime;
import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class TransferRequestRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private TransferRequestRepository transferRequestRepository;

    @Test
    void whenFindByOriginBranchAndStatus_thenReturnPagedRequests() {
        // Given
        Role role = Role.builder()
                .roleName("OFFICER")
                .roleLevel(5)
                .build();
        entityManager.persist(role);

        Branch branch = Branch.builder()
                .branchCode("JBL-DHK-001")
                .branchName("Dhaka Main")
                .branchType(BranchType.BRANCH)
                .district("Dhaka")
                .division("Dhaka")
                .address("Dhaka Bank St")
                .createdAt(OffsetDateTime.now())
                .build();
        entityManager.persist(branch);

        Branch destBranch = Branch.builder()
                .branchCode("JBL-CTG-001")
                .branchName("Chattogram Branch")
                .branchType(BranchType.BRANCH)
                .district("Chattogram")
                .division("Chattogram")
                .address("CTG Bank St")
                .createdAt(OffsetDateTime.now())
                .build();
        entityManager.persist(destBranch);

        User user = User.builder()
                .employeeId("E1001")
                .fullName("John Doe")
                .email("john@jamunabank.com.bd")
                .passwordHash("hash")
                .role(role)
                .branch(branch)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build();
        entityManager.persist(user);

        ItemCategory category = ItemCategory.builder()
                .categoryName(CategoryName.CASH)
                .createdAt(OffsetDateTime.now())
                .build();
        entityManager.persist(category);

        TransferRequest request = TransferRequest.builder()
                .requestCode("TRF-001")
                .category(category)
                .requestType(RequestType.BRANCH_TO_BRANCH)
                .originBranch(branch)
                .destinationBranch(destBranch)
                .initiatedBy(user)
                .status(TransferStatus.PENDING_APPROVAL)
                .title("Cash Transfer")
                .requestedAt(OffsetDateTime.now())
                .build();
        entityManager.persist(request);
        entityManager.flush();

        // When
        Page<TransferRequest> result = transferRequestRepository.findByOriginBranch_BranchIdAndStatus(
                branch.getBranchId(), 
                TransferStatus.PENDING_APPROVAL, 
                PageRequest.of(0, 10)
        );

        // Then
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getRequestCode()).isEqualTo("TRF-001");
    }
}
