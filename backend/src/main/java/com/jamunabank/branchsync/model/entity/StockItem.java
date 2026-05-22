package com.jamunabank.branchsync.model.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

/**
 * Represents a specific quantity-managed item within a STOCK-behavior category.
 *
 * Categories provide the broad operational grouping (e.g. "Office Furniture").
 * StockItems are the actual countable objects (e.g. "Executive Chair", "Customer Desk").
 *
 * Only ItemCategory records with behaviorType = STOCK should have StockItems.
 * CASH and DOCUMENT_CASE categories do not use this entity.
 */
@Entity
@Table(name = "stock_items")
public class StockItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "stock_item_id")
    private Long stockItemId;

    /**
     * Parent category. Must have behaviorType = STOCK.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private ItemCategory category;

    @Column(name = "item_name", nullable = false, length = 255)
    private String itemName;

    /**
     * Unit of measurement (e.g. "pcs", "ream", "box"). Defaults to "pcs".
     */
    @Column(name = "unit", nullable = false, length = 30)
    private String unit = "pcs";

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    public StockItem() {}

    public Long getStockItemId() { return stockItemId; }
    public void setStockItemId(Long stockItemId) { this.stockItemId = stockItemId; }
    public ItemCategory getCategory() { return category; }
    public void setCategory(ItemCategory category) { this.category = category; }
    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public boolean getIsActive() { return isActive; }
    public void setIsActive(boolean active) { this.isActive = active; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public static class StockItemBuilder {
        private StockItem s = new StockItem();
        public StockItemBuilder stockItemId(Long id) { s.stockItemId = id; return this; }
        public StockItemBuilder category(ItemCategory c) { s.category = c; return this; }
        public StockItemBuilder itemName(String n) { s.itemName = n; return this; }
        public StockItemBuilder unit(String u) { s.unit = u; return this; }
        public StockItemBuilder description(String d) { s.description = d; return this; }
        public StockItemBuilder isActive(boolean a) { s.isActive = a; return this; }
        public StockItemBuilder createdAt(OffsetDateTime t) { s.createdAt = t; return this; }
        public StockItem build() { return s; }
    }
    public static StockItemBuilder builder() { return new StockItemBuilder(); }
}
