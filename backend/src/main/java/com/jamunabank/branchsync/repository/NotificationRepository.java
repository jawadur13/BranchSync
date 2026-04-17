package com.jamunabank.branchsync.repository;

import com.jamunabank.branchsync.model.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    Page<Notification> findByRecipient_UserIdAndIsReadFalseOrderBySentAtDesc(Long userId, Pageable pageable);
    Page<Notification> findByRecipient_UserIdOrderBySentAtDesc(Long userId, Pageable pageable);
}
