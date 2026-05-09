# Chapter 7: Software Testing

**[INSTRUCTION TO GEMINI]**
Generate the content for Chapter 7: Software Testing. Focus on the QA methodologies applied to BranchSync to ensure a bug-free, secure, and reliable system. Write in a formal, analytical tone.

### 7.1 Testing Strategy
*Hint:* Provide an overview of the testing approach. Discuss why testing is critical for a banking logistics application where data integrity and state management (the 6-step workflow) are paramount. Mention manual vs. automated testing approaches.

### 7.2 Types of Testing Performed
*Hint:* Detail the specific testing phases executed.
*   **Unit Testing:** Explain testing individual backend services (e.g., testing the JWT generation or testing the state transition logic from PENDING to ASSIGNMENT).
*   **Integration Testing:** Explain testing the communication between the React frontend and Spring Boot REST APIs.
*   **System/Workflow Testing:** Emphasize testing the entire 6-step lifecycle to ensure a transfer cannot skip a mandatory approval step.
*   **Security Testing:** Mention testing role-based access control (e.g., ensuring an 'Officer' cannot access 'Admin' endpoints).

### 7.3 Test Cases (Sample)
*Hint:* Generate a formal table or structured list of 4-5 critical test cases.
*   *Example Format:* Test ID | Description | Pre-condition | Test Steps | Expected Result | Actual Result | Status (Pass/Fail).
*   *Suggested Test Scenarios:* 
    1. Unauthorized access attempt to Admin dashboard.
    2. Approving a transfer request as a Manager.
    3. Attempting to skip the 'Pickup' state directly to 'Closed'.
    4. Successful login with valid JWT generation.

### 7.4 Defect Tracking & Resolution
*Hint:* Briefly discuss how bugs were identified during development (e.g., console errors, Spring Boot logs) and how they were resolved.
