package com.jamunabank.branchsync.repository;

import com.jamunabank.branchsync.model.entity.CashTransferDenomination;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CashTransferDenominationRepository extends JpaRepository<CashTransferDenomination, Long> {
    List<CashTransferDenomination> findByTransferRequest_RequestIdOrderByDenominationDesc(Long requestId);
    void deleteByTransferRequest_RequestId(Long requestId);
}
