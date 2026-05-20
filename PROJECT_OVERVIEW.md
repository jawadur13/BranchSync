# BranchSync: Inter-Branch Transfer & Requisition System

## 📌 Project Overview
BranchSync is a specialized logistics, asset tracking, and audit management platform designed for bank branch operations. It facilitates the secure movement of sensitive assets (Stationery, IT equipment, Security items, and Cash) between branches through a strictly regulated workflow, backed by a real-time Cash Ledger and vault tracking system.

---

## 👥 Roles & Responsibilities

| Role | Branch Context | Responsibilities |
| :--- | :--- | :--- |
| **System Admin** | Global | Manage master lists (Branches, Departments, Items). Map items to departments. Full audit visibility of all cash vault balances and ledger exports. |
| **Branch Manager / Operation Manager / FEO** | Specific Branch | **Source Branch**: Internal gatekeeping (Step 1). **Target Branch**: Final release approval (Step 3). Cash vault oversight: Approve/reject manual adjustments and transfer releases. |
| **Department Staff (Employee)** | Branch + Dept | **Source Branch**: Initiate requests (Step 1). Final verification (Step 6). **Target Branch**: Acceptance and Agent Assignment (Step 2). |
| **Cash Department Officer** | Branch + Cash Dept | Special department role with full access to view their own branch **💰 Cash Ledger**, submit manual balance adjustments, and process vault inputs. |
| **Delivery Person** | Floating | Pickup items (Step 4), delivery (Step 5). Status tracks as **Available** or **Busy**. |

---

## 🏛️ Organizational Architecture

1. **Centralized Master List**: Departments are created globally (e.g., IT, Cash Ops, General Admin).
2. **Branch Customization**: Each branch is assigned a subset of departments from the master list.
3. **User Scoping**: Users are tied to a Branch and a specific Department within that branch (except Floating roles like Delivery/Admin).
4. **Item Ownership**: Every item category is mapped to a "Responsible Department."
   - *Regular employees can only request items assigned to their specific department.*

---

## 💰 Cash Stock Tracking & Ledger System
A major component of BranchSync is its automated vault balance tracking system, which is strictly scoped to the **Cash Bundle** category (all other item categories remain simple physical trackings).

### Core Features:
- **Vault Automation**: Each branch holds a real-time cash balance. Sending branch's balance decreases when courier confirms pickup; receiving branch's balance increases when courier confirms delivery. On recipient rejection, it automatically reverses back.
- **Note Denomination Breakdown**: When accepting a cash transfer, destination officers must specify the exact note breakdown (৳1000, ৳500, ৳200, ৳100, ৳50, etc.). The system calculates and validates that the sum matches the requested amount. The breakdown is shown on the printed transfer slip.
- **Low Cash Warnings**: HQ Logistics officers see warning flags (`⚠️ LOW`) if a sending branch is short on cash during approval. Sending cash officers are blocked from accepting if their vault balance is lower than requested, but can top up beforehand.
- **Manual Balance Adjustments**: Scoped panel for Cash Officers to submit manual adjustments (Add Credit / Remove Debit) with mandatory explanations, and for Managers/FEOs to approve/reject them.
- **Safe Debit Validation**: Robust double-guard validation (frontend warning checks and backend exception constraints) prevents any officer from requesting, and any manager from approving, a manual debit adjustment that exceeds the branch's current cash balance.
- **Visual Ledger & Audit Logs**: Interactive movement ledger showing Date, Type (Sent/Received/Adjustment/Reversal), mathematically sign-formatted Debit/Credit amounts (minus for Out, plus for In), before/after balances, actor/approver details, linked requests, and explanations.
- **Landscape & Consolidated Printing**: 
  - Standard users can print a highly-styled **Landscape Audit Report** for a single branch ledger.
  - **System Admins** have a **Consolidated Portrait Report** print button to export all branch balances and sum total vault cash reserves.

---

## 🔄 The Corrected 6-Step Workflow

The system follows a sequential sequence where no steps can be skipped except where noted.

### Step 1: Initiation & Internal Gatekeeping
- **Action**: A Department Employee creates a request.
- **The Gate**: Stays in **PENDING_INTERNAL**. Hidden from the target branch until a Manager/FEO from the *requester's own branch* verifies and accepts it.
- **The Bypass**: If a Manager/FEO creates the request, it skips this step and goes straight to Step 2.

### Step 2: Destination Department Acceptance
- **Action**: Request arrives at the target branch's matching department.
- **The Task**: A staff member in that destination department must "Accept" the request and **assign a Delivery Person**.
- **Constraint (Cash Category)**: Must input note denomination breakdown matching the requested amount. Cannot accept if branch balance is too low.
- **Delivery Agent Constraint**: Only agents with status **Available** can be assigned.

### Step 3: Final Destination Approval
- **Action**: A Manager/FEO at the **target branch** gives the final "Green Light" to release the item.
- **State**: Status changes to **READY_FOR_PICKUP**.

### Step 4: Physical Pickup & Transit
- **Action**: Delivery Person confirms pickup at the source branch.
- **State**: Status changes to **IN_TRANSIT**. Agent's status becomes **Busy**. For cash transfers, the sending branch's vault balance is debited here.

### Step 5: Delivery & Drop-off
- **Action**: Delivery Person confirms arrival at the destination.
- **State**: Status changes to **DELIVERED**. Agent's status returns to **Available**. For cash transfers, the receiving branch's vault balance is credited here.

### Step 6: Requester's Final Verification
- **Action**: The original requester (Step 1) performs a physical check.
- **Choice**: Click **Accept** to close the ticket or **Reject** (requires a mandatory explanation note).
- **Cash Category Reversal**: If rejected, the balance automatically reverses back (sending branch gets credited, receiving branch gets debited).
- **Final State**: **COMPLETED** or **REJECTED_ON_RECEIPT**.

---

## 📊 Database Considerations

- **User Status**: Delivery Persons must have an `is_busy` or `current_status` (Available/Busy) flag.
- **Transfer States**: Statuses: `PENDING_INTERNAL`, `PENDING_ASSIGNMENT`, `PENDING_FINAL_RELEASE`, `READY_FOR_PICKUP`, `IN_TRANSIT`, `DELIVERED`, `COMPLETED`, `REJECTED_ON_RECEIPT`, `CANCELLED`.
- **Cash Tables**:
  - `branch_cash_balances`: Real-time vault balances per branch.
  - `cash_ledger`: Append-only immutable list logs for all vault balance movements, audit fields, reasons, and actors.
  - `cash_manual_adjustments`: Records of pending/approved/rejected manual adjustments.
- **Audit Logs**: Every "Accept" or "Release" action must be logged with the actor's ID and role.
