package com.jamunabank.branchsync.repository;

import com.jamunabank.branchsync.model.entity.StockItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StockItemRepository extends JpaRepository<StockItem, Long> {

    /** All stock items (active or not) under a given category. */
    List<StockItem> findByCategory_CategoryId(Long categoryId);

    /** Only active stock items under a given category. Used by lookup endpoints. */
    List<StockItem> findByCategory_CategoryIdAndIsActiveTrue(Long categoryId);

    /** Check for duplicate item names within the same category. */
    Optional<StockItem> findByCategory_CategoryIdAndItemName(Long categoryId, String itemName);

    /** Check for duplicate item codes globally. */
    Optional<StockItem> findByItemCode(String itemCode);
}
