# Implementation Plan: Behavior-Based Item Handling

## Overview

Extend `ItemCategory` with a `behavior_type` enum (`CASH`, `STOCK`, `DOCUMENT_CASE`) so each category drives different runtime behavior. The existing Cash workflow stays untouched. STOCK categories gain lightweight inventory tracking. DOCUMENT_CASE categories use the current plain transfer workflow.

---

## Current State Analysis

### How CASH is detected today
- **Backend**: `TransferServiceImpl.isCashBundle()` checks `"Cash Bundle".equalsIgnoreCase(category.getCategoryName())`
- **Frontend**: `categoryName?.toLowerCase().includes('cash bundle')` scattered across `NewTransfer.tsx`, `TransferDetails.tsx`
- This is **name-based detection** — fragile. The new `behavior_type` field replaces this.

### Key touchpoints that need changes

| Layer | File | What changes |
|---|---|---|
| Entity | `ItemCategory.java` | Add `behaviorType` field |
| Enum | New `CategoryBehavior.java` | `CASH`, `STOCK`, `DOCUMENT_CASE` |
| Entity | New `StockItem.java` | Stock items under STOCK categories |
| Entity | New `BranchStockBalance.java` | Per-branch per-stock-item quantities |
| Entity | New `StockLedgerEntry.java` | Audit trail for stock movements |
| Entity | New `StockManualAdjustment.java` | Officer adjustment requests |
| Entity | `TransferRequest.java` | Add `stockItemId`, `quantity` fields |
| DTO | `CreateItemCategoryDto.java` | Add `behaviorType` |
| DTO | `InitiateTransferRequestDto.java` | Add `stockItemId`, `quantity` |
| DTO | `TransferDetailDto.java` | Add `stockItemName`, `quantity`, `behaviorType` |
| Service | `TransferServiceImpl.java` | Replace `isCashBundle()` with behavior check; add stock movement |
| Service | New `StockService.java` + `StockServiceImpl.java` | Stock balance, adjustments, ledger |
| Service | `ManagementServiceImpl.java` | CRUD for stock items |
| Controller | `OrgManagementController.java` | Stock item endpoints |
| Controller | New `StockController.java` | Stock balance/adjustment/ledger endpoints |
| Controller | `LookupController.java` | Expose `behaviorType` in category lookups |
| Controller | `TransferController.java` | Pass stock fields through |
| Mapper | `TransferMapper.java` | Map stock fields |
| Frontend | `OrgManagement.tsx` | Behavior selector + stock item sub-management |
| Frontend | `NewTransfer.tsx` | Show quantity field for STOCK categories |
| Frontend | `TransferDetails.tsx` | Replace name-based cash checks with `behaviorType` |
| Frontend | `Sidebar.tsx` | Add Stock Ledger link |
| Frontend | New `StockLedger.tsx` | Branch stock balances + movement history |
| Frontend | New `StockAdjustment.tsx` | Manual stock adjustments |
| Frontend | `App.tsx` | New routes |

---

## Phase 1: Backend Enum & Entity Foundation

### 1.1 Create `CategoryBehavior` enum
**File**: `backend/.../model/enums/CategoryBehavior.java`
```java
public enum CategoryBehavior {
    CASH,
    STOCK,
    DOCUMENT_CASE
}
```

### 1.2 Add `behaviorType` to `ItemCategory`
**File**: `backend/.../model/entity/ItemCategory.java`
- Add field: `@Enumerated(EnumType.STRING) @Column(name = "behavior_type", nullable = false, length = 20) private CategoryBehavior behaviorType = CategoryBehavior.DOCUMENT_CASE;`
- Add getter/setter and builder method
- Default = `DOCUMENT_CASE` (preserves backward compatibility for existing categories)

> [!IMPORTANT]
> After deployment, manually set `behavior_type = 'CASH'` for the existing "Cash Bundle" category in the database. All other existing categories default to `DOCUMENT_CASE`.

### 1.3 Create `StockItem` entity
**File**: `backend/.../model/entity/StockItem.java`
- `stockItemId` (PK, auto-increment)
- `category` (ManyToOne → ItemCategory, not null)
- `itemName` (String, not null) — e.g. "Executive Chair"
- `itemCode` (String, unique, nullable) — optional short code
- `unit` (String, default "pcs") — e.g. "pcs", "ream", "box"
- `description` (TEXT, nullable)
- `isActive` (boolean, default true)
- `createdAt` (OffsetDateTime)

### 1.4 Create `BranchStockBalance` entity
**File**: `backend/.../model/entity/BranchStockBalance.java`
- `id` (PK, auto-increment)
- `branch` (ManyToOne → Branch)
- `stockItem` (ManyToOne → StockItem)
- `currentQuantity` (int, default 0)
- `lastUpdatedAt` (OffsetDateTime)
- Unique constraint on `(branch_id, stock_item_id)`

### 1.5 Create `StockLedgerEntry` entity
**File**: `backend/.../model/entity/StockLedgerEntry.java`

Mirrors `CashLedgerEntry` pattern:
- `ledgerId` (PK)
- `branch` (ManyToOne → Branch)
- `stockItem` (ManyToOne → StockItem)
- `entryType` (String) — `TRANSFER_OUT`, `TRANSFER_IN`, `REVERSAL_IN`, `REVERSAL_OUT`, `MANUAL_ADJUSTMENT`
- `transferRequest` (ManyToOne → TransferRequest, nullable)
- `quantity` (int) — always positive absolute value
- `balanceBefore` (int)
- `balanceAfter` (int)
- `actor` (ManyToOne → User)
- `approver` (ManyToOne → User, nullable)
- `reason` (TEXT)
- `createdAt` (OffsetDateTime)

### 1.6 Create `StockManualAdjustment` entity
**File**: `backend/.../model/entity/StockManualAdjustment.java`

Mirrors `CashManualAdjustment` pattern:
- `adjustmentId` (PK)
- `branch` (ManyToOne → Branch)
- `stockItem` (ManyToOne → StockItem)
- `quantity` (int) — positive = add, negative = remove
- `reason` (TEXT, not null)
- `status` (String) — `PENDING`, `APPROVED`, `REJECTED`
- `submittedBy` (ManyToOne → User)
- `submittedAt` (OffsetDateTime)
- `approvedBy` (ManyToOne → User, nullable)
- `decidedAt` (OffsetDateTime, nullable)
- `decisionNote` (TEXT, nullable)

### 1.7 Add stock fields to `TransferRequest`
**File**: `backend/.../model/entity/TransferRequest.java`
- Add: `@ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "stock_item_id") private StockItem stockItem;`
- Add: `@Column(name = "quantity") private Integer quantity;`
- Add to builder

---

## Phase 2: Backend Repositories

Create 4 new repository interfaces:

| Repository | Key Methods |
|---|---|
| `StockItemRepository` | `findByCategory_CategoryId()`, `findByCategoryAndIsActiveTrue()`, `findByItemName()` |
| `BranchStockBalanceRepository` | `findByBranch_BranchIdAndStockItem_StockItemId()`, `findByBranch_BranchId()` |
| `StockLedgerRepository` | `findByBranch_BranchIdAndStockItem_StockItemIdOrderByCreatedAtDesc()`, `findByBranch_BranchIdOrderByCreatedAtDesc()` |
| `StockManualAdjustmentRepository` | `findByBranch_BranchIdAndStatusOrderBySubmittedAtDesc()`, `findByBranch_BranchIdOrderBySubmittedAtDesc()` |

---

## Phase 3: Backend Services

### 3.1 Update `ManagementService` + `ManagementServiceImpl`
Add stock item CRUD methods:
- `List<StockItem> getStockItemsByCategory(Long categoryId)`
- `StockItem createStockItem(Long categoryId, String itemName, String itemCode, String unit, String description)`
- `StockItem updateStockItem(Long stockItemId, String itemName, String itemCode, String unit, String description)`
- `StockItem toggleStockItemStatus(Long stockItemId)`

Update `createItemCategory` / `updateItemCategory` to accept and persist `behaviorType`.

### 3.2 Update `CreateItemCategoryDto`
Add: `private String behaviorType;` (defaults to `"DOCUMENT_CASE"`)

### 3.3 Create `StockService` interface + `StockServiceImpl`
**File**: `backend/.../service/StockService.java` and `backend/.../service/impl/StockServiceImpl.java`

Pattern mirrors `CashService` / `CashServiceImpl`:

```
// Balance
BranchStockBalance getOrCreateBalance(Long branchId, Long stockItemId)
List<BranchStockBalance> getBranchStockBalances(Long branchId)

// Ledger
List<StockLedgerEntry> getLedger(Long branchId, Long stockItemId, Long actorId)

// Transfer movements (called from TransferServiceImpl)
void recordTransferOut(Long branchId, Long stockItemId, Long requestId, int quantity, Long actorId)
void recordTransferIn(Long branchId, Long stockItemId, Long requestId, int quantity, Long actorId)
void recordReversal(Long branchId, Long stockItemId, Long requestId, int quantity, Long actorId, String direction)

// Manual adjustments
StockManualAdjustment submitAdjustment(Long branchId, Long stockItemId, Long actorId, int quantity, String reason)
StockManualAdjustment approveAdjustment(Long adjustmentId, Long approverId, boolean approved, String decisionNote)
List<StockManualAdjustment> getPendingAdjustments(Long branchId)
List<StockManualAdjustment> getAllAdjustments(Long branchId)
```

**Key rules:**
- Debit adjustments validate `currentQuantity >= |quantity|`
- Transfer out validates sufficient stock at pickup time
- Role checks: Only OFFICER of the assigned department can submit; only MANAGER/FEO can approve

### 3.4 Update `TransferServiceImpl`

**Replace `isCashBundle()` method:**
```java
private boolean isCashBehavior(TransferRequest request) {
    return request.getCategory() != null
        && request.getCategory().getBehaviorType() == CategoryBehavior.CASH;
}

private boolean isStockBehavior(TransferRequest request) {
    return request.getCategory() != null
        && request.getCategory().getBehaviorType() == CategoryBehavior.STOCK;
}
```

**Update `markPickedUp()`:**
- Existing CASH logic stays (uses `isCashBehavior()` instead of `isCashBundle()`)
- Add STOCK block: call `stockService.recordTransferOut(destBranch, stockItemId, requestId, quantity, driverId)`

**Update `markDelivered()`:**
- Same pattern: CASH stays, add STOCK credit

**Update `closeRequest()` (rejection path):**
- Same pattern: CASH reversal stays, add STOCK reversal

---

## Phase 4: Backend Controllers & DTOs

### 4.1 Update `OrgManagementController`
- Expose `behaviorType` in `listItemCategories` response
- Add stock item endpoints:
  - `GET /api/admin/org/items/{categoryId}/stock-items` — list stock items under a category
  - `POST /api/admin/org/items/{categoryId}/stock-items` — create stock item
  - `PUT /api/admin/org/stock-items/{stockItemId}` — update stock item
  - `PUT /api/admin/org/stock-items/{stockItemId}/toggle-active` — activate/deactivate

### 4.2 Create `StockController`
**File**: `backend/.../controller/StockController.java`
- `GET /api/stock/balances/{branchId}` — list all stock balances for a branch
- `GET /api/stock/ledger/{branchId}/{stockItemId}` — ledger for a specific item at a branch
- `POST /api/stock/adjust` — submit manual adjustment
- `POST /api/stock/adjust/{id}/decide` — approve/reject adjustment
- `GET /api/stock/adjust/pending/{branchId}` — pending adjustments
- `GET /api/stock/adjust/all/{branchId}` — all adjustments history

### 4.3 Update `LookupController`
- Add `behaviorType` field to `/api/lookup/categories` response
- Add endpoint: `GET /api/lookup/stock-items/{categoryId}` — returns active stock items for a category (used by NewTransfer form)

### 4.4 Update Transfer DTOs
- `InitiateTransferRequestDto`: Add `Long stockItemId`, `Integer quantity`
- `TransferDetailDto`: Add `String stockItemName`, `Integer quantity`, `String behaviorType`
- `TransferResponseDto`: Add `String behaviorType` (for dashboard/history badge rendering)

### 4.5 Update `TransferMapper`
- Map `stockItem` and `quantity` in `toEntity()`, `toDetailDto()`, `toResponseDto()`
- Map `behaviorType` from category

---

## Phase 5: Frontend — Admin UI Updates

### 5.1 Update `OrgManagement.tsx` (Items tab)

**Category form changes:**
- Add `Behavior Type` dropdown: `CASH`, `STOCK`, `DOCUMENT_CASE`
- Default selection: `DOCUMENT_CASE`
- Show warning if changing behavior of an existing category that has transfer history

**Stock items sub-panel:**
- When a STOCK category is selected/viewed, show expandable section: "📦 Stock Items under this category"
- Table: Item Name | Code | Unit | Status | Actions (Edit, Toggle Active)
- "+ Add Stock Item" button opens inline form with: Name*, Code, Unit (default "pcs"), Description
- Only visible when `behaviorType === 'STOCK'`

**Table column update:**
- Add "Behavior" column showing a colored badge:
  - `CASH` → gold badge
  - `STOCK` → blue badge
  - `DOCUMENT_CASE` → gray badge

### 5.2 Update `CategoryRow` interface
Add: `behaviorType?: string`

---

## Phase 6: Frontend — Transfer Workflow Updates

### 6.1 Update `NewTransfer.tsx`
- Fetch `behaviorType` from lookup categories response
- **CASH behavior**: Show existing Amount Requested field (no change)
- **STOCK behavior**:
  - Show "Stock Item" dropdown (fetched from `/api/lookup/stock-items/{categoryId}`)
  - Show "Quantity" number input (integer, min 1)
  - Both fields required
- **DOCUMENT_CASE behavior**: No extra fields (current behavior)

### 6.2 Update `TransferDetails.tsx`

**Replace ALL `categoryName?.toLowerCase().includes('cash bundle')` checks** with `transfer.behaviorType === 'CASH'`.

**Add STOCK display sections:**
- Show stock item name and quantity in the details card
- Show "⚠️ LOW STOCK" warnings similar to cash low balance warnings
- The denomination form is CASH-only (unchanged)

### 6.3 Update `TransferHistory.tsx` and `Dashboard.tsx`
- Show behavior badge on transfer rows (small colored pill)

---

## Phase 7: Frontend — Stock Management Pages

### 7.1 Create `StockLedger.tsx` + `StockLedger.css`
Similar to `CashLedger.tsx` pattern:
- Branch officers of assigned dept see their branch stock
- Managers see full branch stock
- System Admin sees all branches (card grid → select branch)
- Per-branch view: table of stock items with current quantities
- Click an item → shows movement ledger (transfers in/out, adjustments, reversals)
- Print/PDF button for stock report

### 7.2 Create `StockAdjustment.tsx` + `StockAdjustment.css`
Similar to `ManualAdjustment.tsx` pattern:
- Officers submit: select stock item → quantity (+ or -) → reason → submit
- Managers see pending adjustments → approve/reject with note
- History table of all adjustments

### 7.3 Update `Sidebar.tsx`
Add "Stock Management" section (visible to managers, officers of stock-dept, and admin):
```
── Stock Management ──
📦 Stock Ledger    → /stock/ledger
⚙️ Stock Adjustments → /stock/adjust
```

### 7.4 Update `App.tsx`
Add routes:
```tsx
<Route path="stock/ledger" element={<StockLedger />} />
<Route path="stock/adjust" element={<StockAdjustment />} />
```

---

## Database Migration

Since `ddl-auto=update`, Hibernate will auto-create the new columns and tables. Manual steps needed:

```sql
-- Set behavior_type for existing categories
UPDATE item_categories SET behavior_type = 'CASH' WHERE category_name = 'Cash Bundle';
UPDATE item_categories SET behavior_type = 'DOCUMENT_CASE' WHERE behavior_type IS NULL OR behavior_type = '';
```

---

## What Does NOT Change

| Component | Status |
|---|---|
| Cash vault balance system | ✅ Untouched |
| Cash ledger & denomination logic | ✅ Untouched |
| Cash manual adjustment flow | ✅ Untouched |
| 6-step transfer workflow engine | ✅ Untouched (stock hooks added alongside cash hooks) |
| HQ routing logic | ✅ Untouched |
| Audit trail system | ✅ Untouched |
| JWT auth & RBAC | ✅ Untouched |
| Rejection/re-routing system | ✅ Untouched |

---

## Implementation Order

| Step | Description | Estimated Effort |
|---|---|---|
| 1 | Phase 1: Entities + Enum | Medium |
| 2 | Phase 2: Repositories | Small |
| 3 | Phase 3: Services (StockService + TransferService updates) | Large |
| 4 | Phase 4: Controllers + DTOs | Medium |
| 5 | Phase 5: Admin UI (behavior selector + stock items) | Medium |
| 6 | Phase 6: Transfer workflow UI updates | Medium |
| 7 | Phase 7: Stock Ledger + Adjustment pages | Large |
| 8 | Testing + DB migration | Small |

---

## Key Design Decisions

1. **`behaviorType` on `ItemCategory`** — not a separate table. Simple, queryable, no joins needed.
2. **`StockItem` as child of `ItemCategory`** — categories remain the grouping structure; stock items are the actual quantity-managed objects.
3. **Stock movement mirrors cash movement** — same trigger points (pickup/delivery/reversal), same governance (officer submits, manager approves adjustments).
4. **No ERP features** — no serial tracking, barcodes, vendors, procurement, warehousing, or accounting.
5. **Backward compatibility** — existing categories default to `DOCUMENT_CASE`, existing "Cash Bundle" gets `CASH`. No data migration needed beyond one UPDATE statement.
6. **Replaces fragile name detection** — `isCashBundle()` string check replaced with enum-based `isCashBehavior()`.
