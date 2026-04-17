package com.jamunabank.branchsync.repository;

import com.jamunabank.branchsync.model.entity.ItemCategory;
import com.jamunabank.branchsync.model.enums.CategoryName;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ItemCategoryRepository extends JpaRepository<ItemCategory, Long> {
    Optional<ItemCategory> findByCategoryName(CategoryName categoryName);
}
