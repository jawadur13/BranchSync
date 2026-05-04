# BranchSync: Inter-Branch Transfer & Requisition System

## 📌 Project Overview
BranchSync is a specialized logistics and audit management platform designed for banking operations. It facilitates the secure movement of sensitive assets (Cash, Stationery, IT equipment, Security items) between branches through a strictly regulated 6-step workflow.

---

## 👥 Roles & Responsibilities

| Role | Branch Context | Responsibilities |
| :--- | :--- | :--- |
| **System Admin** | Global | Manage master lists (Branches, Departments, Items). Map items to departments. Full audit visibility. |
| **Branch Manager / Operation Manager / FEO** | Specific Branch | **Source Branch**: Internal gatekeeping (Step 1). **Target Branch**: Final release approval (Step 3). |
| **Department Staff (Employee)** | Branch + Dept | **Source Branch**: Initiate requests (Step 1). Final verification (Step 6). **Target Branch**: Acceptance and Agent Assignment (Step 2). |
| **Delivery Person** | Floating | Pickup items (Step 4), delivery (Step 5). Status tracks as **Available** or **Busy**. |

---

## 🏛️ Organizational Architecture

1. **Centralized Master List**: Departments are created globally (e.g., IT, Cash Ops, General Admin).
2. **Branch Customization**: Each branch is assigned a subset of departments from the master list.
3. **User Scoping**: Users are tied to a Branch and a specific Department within that branch (except Floating roles like Delivery/Admin).
4. **Item Ownership**: Every item category is mapped to a "Responsible Department."
   - *Regular employees can only request items assigned to their specific department.*

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
- **Constraint**: Only agents with status **Available** can be assigned.

### Step 3: Final Destination Approval
- **Action**: A Manager/FEO at the **target branch** gives the final "Green Light" to release the item.
- **State**: Status changes to **READY_FOR_PICKUP**.

### Step 4: Physical Pickup & Transit
- **Action**: Delivery Person confirms pickup at the source branch.
- **State**: Status changes to **IN_TRANSIT**. Agent's status becomes **Busy**.

### Step 5: Delivery & Drop-off
- **Action**: Delivery Person confirms arrival at the destination.
- **State**: Status changes to **DELIVERED**. Agent's status returns to **Available**.

### Step 6: Requester's Final Verification
- **Action**: The original requester (Step 1) performs a physical check.
- **Choice**: Click **Accept** to close the ticket or **Reject** (requires a mandatory explanation note).
- **Final State**: **COMPLETED** or **REJECTED_ON_RECEIPT**.

---

## 📊 Database Considerations

- **User Status**: Delivery Persons must have an `is_busy` or `current_status` (Available/Busy) flag.
- **Transfer States**: New statuses added: `PENDING_INTERNAL`, `READY_FOR_PICKUP`, `DELIVERED`, `REJECTED_ON_RECEIPT`.
- **Ownership tracking**: The system must track the original requester ID to ensure only they can perform the final closing step.
- **Audit Logs**: Every "Accept" or "Release" action must be logged with the actor's ID and role.
