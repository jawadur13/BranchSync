# 6.2 Function Point Estimation

**[INSTRUCTION TO GEMINI]**
Generate the content for Section 6.2: Function Point Estimation for the BranchSync project. Use the exact table structures, formulas, and formatting shown below. I have provided the specific data and estimates tailored for the BranchSync application. Do not deviate from this format.

### 6.2.1 Functionality, Input, Output
*Hint:* Write a brief introductory paragraph stating that Function Point Analysis (FPA) is used to estimate the size of the BranchSync software based on its functionality, classifying them into Transaction Functions (External Inputs - EI, External Outputs - EO, External Inquiries - EQ) and Data Functions (Internal Logical Files - ILF, External Interface Files - EIF).

### 6.2.2 Identify Complexity
*Hint:* Provide a short text explaining that complexity (Low, Average, High) is determined by counting the Data Element Types (DET), Record Element Types (RET), and File Types Referenced (FTR) for each function.

### 6.2.3 Unadjusted Function Point Contribution

**[GEMINI: Generate the following 3 tables exactly as structured, using the BranchSync data provided.]**

**Table: UFP of Transaction Function**
| Function Name | Type | DET | FTR | Complexity | UFP |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Create Transfer Request | EI | 10 | 2 | Average | 4 |
| Approve Transfer (Manager) | EI | 4 | 2 | Low | 3 |
| Assign Delivery (Dept) | EI | 5 | 2 | Average | 4 |
| Release Transfer | EI | 3 | 1 | Low | 3 |
| Update Transit Status | EI | 4 | 1 | Low | 3 |
| Complete/Close Transfer | EI | 4 | 2 | Low | 3 |
| User Registration/Mgmt | EI | 8 | 2 | Average | 4 |
| Branch Configuration | EI | 6 | 1 | Low | 3 |
| Department Mapping | EI | 5 | 2 | Average | 4 |
| Category Management | EI | 4 | 1 | Low | 3 |
| User Login/Auth | EI | 2 | 2 | Low | 3 |
| Admin Dashboard | EO | 20 | 5 | High | 7 |
| Officer Dashboard | EO | 15 | 4 | High | 7 |
| Delivery Dashboard | EO | 10 | 2 | Average | 5 |
| Transfer Receipt PDF | EO | 12 | 3 | Average | 5 |
| Audit Log Report | EO | 14 | 3 | Average | 5 |
| View Transfer Details | EQ | 12 | 3 | Average | 4 |
| Search Transfer Requests | EQ | 8 | 2 | Low | 3 |
| View Audit Trail | EQ | 6 | 2 | Low | 3 |
| View Branch List | EQ | 4 | 1 | Low | 3 |
| View User Profile | EQ | 4 | 1 | Low | 3 |

**Table: UFP of Data Function**
| Function Name | Type | DET | RET | Complexity | UFP |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Users | ILF | 10 | 1 | Low | 7 |
| Roles | ILF | 4 | 1 | Low | 7 |
| Branches | ILF | 6 | 1 | Low | 7 |
| Departments | ILF | 5 | 1 | Low | 7 |
| BranchDepartments | ILF | 4 | 1 | Low | 7 |
| ItemCategories | ILF | 5 | 1 | Low | 7 |
| TransferRequests | ILF | 15 | 1 | Average | 10 |
| AuditLogs | ILF | 8 | 1 | Low | 7 |

**Table: Total Unadjusted Function Point (UFP)**
| Function Type | Count | Total UFP |
| :--- | :--- | :--- |
| External Input (EI) | 11 | 37 |
| External Output (EO) | 5 | 29 |
| External Inquiry (EQ) | 5 | 16 |
| Internal Logical File (ILF) | 8 | 59 |
| External Interface File (EIF) | 0 | 0 |
| **Total Unadjusted Function Points (UFP)** | **29** | **141** |

### 6.2.4 Calculation of Total Degree of Influence (TDI)

**[GEMINI: Generate the following table using the 14 General System Characteristics (GSC) tailored for BranchSync.]**

**Table: Calculation of Total Degree of Influence (TDI)**
| SI | General System Characteristics | Brief Description | DI |
| :--- | :--- | :--- | :--- |
| 01 | Data Communication | System requires online communication between modules and automated email/notification services for transfer updates. | 4 |
| 02 | Distributed Data Processing | Data processing is centralized but accessed distributedly by multiple bank branches. | 3 |
| 03 | Performance | Fast response times required for tracking transfers and generating audit logs without blocking the UI. | 4 |
| 04 | Heavily Used Configuration | Multiple roles (Admins, Officers, Managers) access the system concurrently during banking hours. | 4 |
| 05 | Transaction Rate | High transaction rate for updating item status, approving, and logging audit trails. | 4 |
| 06 | Online Data Entry | All data entry (creating transfers, config) is online through React web forms. | 5 |
| 07 | End-User Efficiency | User-friendly UI with intuitive workflow navigation and responsive design for different devices. | 5 |
| 08 | Online Update | Real-time status updates for the 6-step transfer lifecycle are immediately reflected. | 5 |
| 09 | Complex Processing | Complex state validation logic ensures transfers cannot skip mandatory approval steps. | 4 |
| 10 | Reusability | Core modules like JWT auth, audit logging, and role verification are highly reusable. | 3 |
| 11 | Installation Ease | Spring Boot backend and React frontend designed for straightforward server deployment. | 3 |
| 12 | Operational Ease | Admin dashboard simplifies the daily management of branches, users, and monitoring. | 4 |
| 13 | Multiple Sites | Designed specifically for multi-branch environments (deployable across the entire bank network). | 5 |
| 14 | Facilitate Change | Modular Spring Boot architecture allows easy addition of new roles or workflow steps in the future. | 4 |
| | | **Total TDI** | **57** |

### 6.2.5 Final Calculation

**[GEMINI: Write out the following formulas and math exactly as shown below.]**

Value Adjustment Factor (VAF) = 0.65 + (0.01 × TDI)
= 0.65 + (0.01 × 57)
= 1.22

Total UFP = UFP (TF) + UFP (DF)
= 82 + 59
= 141

AFP (Adjusted Function Point) = UFP (Total) × VAF
= 141 × 1.22
= 172.02
