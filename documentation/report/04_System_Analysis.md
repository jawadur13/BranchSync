# Chapter 4: System Analysis

**[INSTRUCTION TO GEMINI]**
Generate the content for Chapter 4: System Analysis for the BranchSync project. Focus on how the problem was analyzed and how the system's actors interact with it. Assume the reader understands the project's background. Keep the tone academic and analytical.

### 4.1 System Overview Analysis
*Hint:* Write an introductory paragraph about analyzing the shift from a manual paper-based transfer process to the automated BranchSync system. Discuss how the problem space was broken down into manageable modules.

### 4.2 Actor Identification & Role Analysis
*Hint:* Define the primary actors interacting with the system and their responsibilities.
*   **System Admin:** Org configuration, user provisioning.
*   **Requester / Officer:** Initiating transfers, receiving items.
*   **Approver / Manager (FEO):** Authorizing outgoing and incoming assets.
*   **Delivery Person:** Transporting items and updating transit states.

### 4.3 Use Case Modeling
*Hint:* Describe the use cases from an analytical perspective. Explain how the actors defined above execute the use cases.
*   *[PLACEHOLDER: Insert Use Case Diagram here]*
*   **Description of Key Use Cases:** Break down 3-4 major use cases (e.g., "Process Transfer Request", "Manage Branch Data"). Detail the preconditions, primary flow, and post-conditions for the "Process Transfer Request" use case.

### 4.4 Data Flow Analysis (Overview)
*Hint:* Introduce the concept of how data moves through the system. Explain why tracking the state (PENDING -> APPROVED -> TRANSIT, etc.) is the core analytical challenge of this system. (Note: Detailed DFD diagrams will go in Chapter 6, but this section should explain the *analysis* of the data flow).
