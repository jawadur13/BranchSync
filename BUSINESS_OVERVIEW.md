# 🏦 Jamuna Bank PLC — BranchSync Business Guide

Welcome to **BranchSync**, Jamuna Bank's central digital coordination platform for securing, routing, and auditing inter-branch asset transfers and document logistics. 

This guide is written in plain, non-technical language to help coordinators, branch operations teams, bank auditors, and executives fully understand what the system does, who uses it, and how the end-to-end routing workflow operates.

---

## 🎯 1. Core Purpose of the System

In a modern banking network like Jamuna Bank PLC, branches frequently need to exchange physical assets, sensitive customer files, bank stationery, and hardware. 

**BranchSync** replaces slow, error-prone manual spreadsheets and paper trails with a real-time, highly audited, and automated coordination workflow. It ensures that:
1. Every physical transfer is authorized locally before leaving.
2. Central Headquarters (HQ Logistics) retains complete control over where assets are routed.
3. Secure and verified custody handshakes occur at every leg of the journey.
4. Internal auditors have an absolute, unalterable timeline of who handled what, when, and where.

---

## 📁 2. Key Concepts & Terminology

To understand the system, it helps to be familiar with the following basic concepts:

*   **Transfer Request**: A digital record representing a physical box, envelope, or asset that needs to be moved. Each request is assigned a unique tracking code (e.g., `REQ-2026-0004`).
*   **Origin Branch & Department**: The branch and department where the physical asset is currently located.
*   **Destination Branch & Department**: The final target branch and department where the asset is being sent.
*   **Priority Level**: Indicates how fast the item must move (`NORMAL`, `HIGH`, `URGENT`, `CRITICAL`).
*   **Sensitivity Level**: Dictates security protocols based on the contents (`LOW` for stationery, `MEDIUM` for standard files, `HIGH` or `CRITICAL` for credit cards, checks, or legal documents).
*   **Audit Trail**: A digital logbook that automatically stamps every single state change with the date, time, employee name, action description, and computer IP address.

---

## 👥 3. User Roles & Accountabilities

Every user account in the system has a designated role. What you see and what you can click depends entirely on your role.

### A. General Officers (Originators)
*   **Who they are**: Frontline desks, operations officers, or department staff initiating a transfer.
*   **What they do**:
    *   Initiate new transfer requests.
    *   Provide description, category, and priority.
    *   Track the real-time status of outgoing packages.
    *   Provide the final "receipt verification" once the delivery driver delivers the item, closing the file.

### B. Branch Managers / Operation Managers / First Executive Officers (Managers)
*   **Who they are**: Local supervisory authorities inside a branch.
*   **What they do**:
    *   **Internal Verification**: Authorize and sign off on outgoing requests initiated by their branch officers.
    *   **Final Custody Release**: Give the "Green Light" to physically hand over items to couriers.
    *   **Branch Staff Directory Access**: Search and contact any local colleague's department, email, or phone.

### C. HQ Logistics Officers (Central Logistics Control)
*   **Who they are**: The central logistics authority located at HQ.
*   **What they do**:
    *   **Central Audit & Traffic Control**: Review every single branch request nationwide.
    *   **Deferred Allocation**: Read the transfer request and assign the optimal **Destination Branch** and **Destination Department** for delivery.
    *   **Verification / Rejection**: Approve/Forward requests or reject invalid requests back to the originator with a mandatory explanation.

### D. Delivery Persons (Couriers / Drivers)
*   **Who they are**: The physical couriers responsible for moving items between branches.
*   **What they do**:
    *   View active transit pipelines.
    *   Physically pick up the package and click "Confirm Pickup" in the app (starting the transit timer).
    *   Deliver the package to the destination branch and click "Confirm Delivery" (ending the transit timer).

### E. System Administrators (Admins)
*   **Who they are**: Technical coordinators managing the system.
*   **What they do**:
    *   Manage User accounts and grant roles.
    *   Create, modify, and manage Branches and Departments.
    *   Read the complete, unalterable bank-wide Audit Logs.

---

## 🔄 4. The End-to-End Transfer Workflow

The core power of **BranchSync** is its structured, step-by-step state machine. Here is the life cycle of a transfer request:

*   **Step 1: Request Initiation (Origin Desk)**
    *   A general officer creates a request detailing *what* needs to be moved.
    *   **Deferred Destination Safety**: They do *not* select where the item goes. The request is created in a "Pending Internal Review" state, automatically tracking their own branch as the origin.
*   **Step 2: Internal Endorsement (Branch Manager)**
    *   A local manager reviews the outgoing request to ensure it is legitimate.
    *   If approved, the request is dispatched to **Central HQ**. If the originator is a Manager/FEO, this step is bypassed automatically.
*   **Step 3: HQ Audit & Destination Allocation (HQ Logistics Officer)**
    *   The Central HQ officer opens their dashboard.
    *   They audit the request contents, select the appropriate target **Destination Branch**, select the target **Destination Department** (which are filtered automatically to show only departments that are actually present in the selected branch), and click **Verify & Forward**.
*   **Step 4: Acceptance & Driver Assignment (Destination Branch)**
    *   The destination branch's desk team is notified. They accept the upcoming delivery and select the available **Delivery Driver** to go collect the package.
*   **Step 5: Local Green Light (Origin Branch Manager)**
    *   The origin branch manager verifies that the physical package is boxed and sealed. They click **Final Green Light (Release)** to authorize custody transfer.
*   **Step 6: Transit Handshake (Delivery Driver)**
    *   The courier arrives at the origin branch, collects the package, and clicks **Confirm Pickup**. The request status changes instantly to **In Transit**.
*   **Step 7: Delivery Handshake (Delivery Driver)**
    *   The courier arrives at the destination branch, hands over the physical package, and clicks **Confirm Delivery**. The package status changes to **Delivered**.
*   **Step 8: Final Receipt Verification (Originator)**
    *   The original general officer who requested the transfer inspects the delivered items to ensure nothing was lost or damaged.
    *   They click **Accept & Close** (completing the loop) or **Reject** (which prompts an audit investigation).

---

## 🌟 5. Outstanding Smart Features

BranchSync is packed with features designed to make daily coordination fast and enjoyable:

*   **⚡ "Attention Required" Smart Widget**:
    A dynamic, real-time indicator on the dashboard that alerts users immediately if there is a pending action waiting on them (e.g., Managers see requests awaiting approval, Couriers see packages ready for pickup).
*   **📋 One-Click Reordering (Duplicate Request)**:
    Allows officers to recreate repetitive, frequent transfers with a single click, copying historical classifications while keeping strict security boundaries (HQ officers and Drivers cannot access this shortcut).
*   **🖨️ Professional Printed Slips**:
    Users can print or save a beautiful high-fidelity PDF Transfer Slip containing route details, classifications, courier assignments, and receipt terms to tape directly onto physical boxes.
*   **🏢 Scoped Staff Directory**:
    Allows branch managers to quickly search names, contact emails, and phone numbers of colleagues to speed up logistics inquiries.
*   **🛡️ Absolute System Audit Logs**:
    Every movement, approval, driver change, and handoff logs the actor's employee ID, role, department, timestamp, and IP address, keeping the bank secure and compliant.
