package com.jamunabank.branchsync.repository;

import com.jamunabank.branchsync.model.entity.Branch;
import com.jamunabank.branchsync.model.entity.ItemCategory;
import com.jamunabank.branchsync.model.entity.Role;
import com.jamunabank.branchsync.model.entity.TransferRequest;
import com.jamunabank.branchsync.model.entity.User;
import com.jamunabank.branchsync.model.enums.BranchType;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import java.time.OffsetDateTime;
import java.util.List;
import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class TransferRequestRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private TransferRequestRepository transferRequestRepository;

    @Test
    void whenFindByBranchId_thenReturnRequests() {
        // Given
        Role role = Role.builder()
                .roleName("OFFICER")
                .build();
        entityManager.persist(role);

        Branch branch = Branch.builder()
                .branchCode("JBL-DHK-001")
                .branchName("Dhaka Main")
                .branchType(BranchType.AD_BRANCH)
                .district("Dhaka")
                .division("Dhaka")
                .address("Dhaka Bank St")
                .createdAt(OffsetDateTime.now())
                .build();
        entityManager.persist(branch);

        Branch destBranch = Branch.builder()
                .branchCode("JBL-CTG-001")
                .branchName("Chattogram Branch")
                .branchType(BranchType.SUB_BRANCH)
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
                .categoryName("CASH")
                .createdAt(OffsetDateTime.now())
                .build();
        entityManager.persist(category);

        TransferRequest request = TransferRequest.builder()
                .requestCode("TRF-001")
                .category(category)
                .originBranch(branch)
                .destinationBranch(destBranch)
                .initiatedBy(user)
                .status("PENDING_INTERNAL")
                .title("Cash Transfer")
                .requestedAt(OffsetDateTime.now())
                .build();
        entityManager.persist(request);
        entityManager.flush();

        // When
        List<TransferRequest> result = transferRequestRepository.findByOriginBranch_BranchIdOrDestinationBranch_BranchIdOrderByRequestedAtDesc(
                branch.getBranchId(), 
                branch.getBranchId()
        );

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getRequestCode()).isEqualTo("TRF-001");
    }
}
