# Chapter 6: System Design

**[INSTRUCTION TO GEMINI]**
Generate the content for Chapter 6: System Design. This is the most crucial, diagram-heavy chapter. Describe the architecture, database design, and UML diagrams of the BranchSync system. Write highly detailed, technical explanations for each subsection. Make sure to refer to the specific diagrams created for this project.

### 6.1 Architectural Design
*Hint:* Describe the Client-Server architecture. Explain the separation of concerns: React (Frontend), Spring Boot (Backend API), and MySQL (Database). Mention the RESTful communication.

### 6.2 Database Design
*Hint:* Describe the relational database design.
*   **Entity Relationship Diagram (ERD):** 
    *   *[PLACEHOLDER: Insert branchsync_erd.mmd or image here]*
    *   Explain the relationships between the 8 core tables (Users, Roles, Branches, Departments, BranchDepartments, ItemCategories, TransferRequests, AuditLogs). Mention Foreign Keys and constraints.

### 6.3 Data Flow Diagrams (DFD)
*Hint:* Provide a technical description of how data flows through the system based on the DFDs.
*   **Level 0 (Context Diagram):** 
    *   *[PLACEHOLDER: Insert dfd_level_0.svg here]*
    *   Describe the system boundary and external entities.
*   **Level 1 (System Overview):**
    *   *[PLACEHOLDER: Insert dfd_level_1.svg here]*
    *   Describe the 4 main modules and data stores.
*   **Level 2 (Detailed Workflows):**
    *   *[PLACEHOLDER: Insert dfd_level_2_transfer.svg here]*
    *   *[PLACEHOLDER: Insert dfd_level_2_admin.svg here]*
    *   Describe the intricate data flows of the Transfer Lifecycle and Admin management.

### 6.4 UML Diagrams
*Hint:* Provide descriptions for the Object-Oriented design and dynamic behavior.
*   **Class Diagram:**
    *   *[PLACEHOLDER: Insert branchsync_class_diagram_figma.svg here]*
    *   Explain the class structure, attributes, methods, and multiplicity.
*   **Sequence Diagram:**
    *   *[PLACEHOLDER: Insert branchsync_sequence_figma.svg here]*
    *   Explain the chronological sequence of API calls and database interactions during a transfer request.
*   **Activity Diagrams:**
    *   *[PLACEHOLDER: Insert activity_transfer_workflow.svg here]*
    *   *[PLACEHOLDER: Insert activity_user_security.svg here]*
    *   Explain the swimlanes and decision nodes for the transfer lifecycle and security routing.
