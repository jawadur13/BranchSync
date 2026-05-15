-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 15, 2026 at 09:57 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `branchsync`
--

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `audit_id` bigint(20) NOT NULL,
  `request_id` bigint(20) DEFAULT NULL,
  `actor_id` bigint(20) DEFAULT NULL,
  `action` varchar(100) NOT NULL COMMENT 'CREATED | APPROVED_INTERNAL | ASSIGNED_DRIVER | RELEASED | PICKED_UP | DELIVERED | COMPLETED | REJECTED',
  `from_status` varchar(50) DEFAULT NULL,
  `to_status` varchar(50) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `acted_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`audit_id`, `request_id`, `actor_id`, `action`, `from_status`, `to_status`, `remarks`, `ip_address`, `acted_at`) VALUES
(1, 1, 19, 'CREATED', NULL, 'PENDING_INTERNAL', NULL, '127.0.0.1', '2026-05-06 10:56:17'),
(2, 1, 5, 'APPROVED_INTERNAL', 'PENDING_INTERNAL', 'PENDING_ASSIGNMENT', NULL, '127.0.0.1', '2026-05-06 11:27:54'),
(3, 1, 24, 'ASSIGNED_DRIVER', 'PENDING_ASSIGNMENT', 'PENDING_FINAL_RELEASE', NULL, '127.0.0.1', '2026-05-06 11:29:36'),
(4, 1, 12, 'RELEASED', 'PENDING_FINAL_RELEASE', 'READY_FOR_PICKUP', NULL, '127.0.0.1', '2026-05-06 11:34:14'),
(5, 1, 33, 'PICKED_UP', 'READY_FOR_PICKUP', 'IN_TRANSIT', NULL, '127.0.0.1', '2026-05-06 11:34:58'),
(6, 1, 33, 'DELIVERED', 'IN_TRANSIT', 'DELIVERED', NULL, '127.0.0.1', '2026-05-06 11:35:23'),
(7, 1, 19, 'COMPLETED', 'DELIVERED', 'COMPLETED', '', '127.0.0.1', '2026-05-06 11:37:51'),
(8, 2, 28, 'CREATED', NULL, 'PENDING_INTERNAL', NULL, '127.0.0.1', '2026-05-10 11:48:11'),
(9, 2, 7, 'APPROVED_INTERNAL', 'PENDING_INTERNAL', 'PENDING_ASSIGNMENT', NULL, '127.0.0.1', '2026-05-10 11:52:01'),
(10, 2, 30, 'ASSIGNED_DRIVER', 'PENDING_ASSIGNMENT', 'PENDING_FINAL_RELEASE', NULL, '127.0.0.1', '2026-05-10 11:56:15'),
(11, 2, 8, 'RELEASED', 'PENDING_FINAL_RELEASE', 'READY_FOR_PICKUP', NULL, '127.0.0.1', '2026-05-10 12:00:14'),
(12, 2, 33, 'PICKED_UP', 'READY_FOR_PICKUP', 'IN_TRANSIT', NULL, '127.0.0.1', '2026-05-10 12:02:21'),
(13, 2, 33, 'DELIVERED', 'IN_TRANSIT', 'DELIVERED', NULL, '127.0.0.1', '2026-05-10 12:03:18'),
(14, 2, 28, 'COMPLETED', 'DELIVERED', 'COMPLETED', '', '127.0.0.1', '2026-05-10 12:05:30');

-- --------------------------------------------------------

--
-- Table structure for table `branches`
--

CREATE TABLE `branches` (
  `branch_id` bigint(20) NOT NULL,
  `branch_code` varchar(20) NOT NULL,
  `branch_name` varchar(150) NOT NULL,
  `branch_type` varchar(50) NOT NULL COMMENT 'AD_BRANCH | SUB_BRANCH | HQ',
  `district` varchar(255) DEFAULT NULL,
  `division` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `branches`
--

INSERT INTO `branches` (`branch_id`, `branch_code`, `branch_name`, `branch_type`, `district`, `division`, `address`, `phone`, `email`, `is_active`, `created_at`) VALUES
(1, 'HQ-001', 'Head Office - Motijheel', 'HQ', 'Dhaka', 'Dhaka', 'Dilkusha C/A, Motijheel, Dhaka-1000', '02-9550123', 'hq@jamunabank.com', 1, '2026-05-04 16:32:09'),
(2, 'BR-DHK-001', 'Dhaka Main Branch', 'AD_BRANCH', 'Dhaka', 'Dhaka', 'Mirpur Road, Dhanmondi, Dhaka-1205', '02-8120456', 'dhaka.main@jamunabank.com', 1, '2026-05-04 16:32:09'),
(3, 'BR-CTG-001', 'Chittagong Agrabad Branch', 'AD_BRANCH', 'Chattogram', 'Chattogram', 'Agrabad Commercial Area, Chattogram-4100', '031-714552', 'ctg.agrabad@jamunabank.com', 1, '2026-05-04 16:32:09'),
(4, 'BR-SYL-001', 'Sylhet Zindabazar Branch', 'AD_BRANCH', 'Sylhet', 'Sylhet', 'Zindabazar, Sylhet-3100', '0821-718920', 'sylhet@jamunabank.com', 1, '2026-05-04 16:32:09'),
(5, 'BR-RAJ-001', 'Rajshahi Station Road Branch', 'SUB_BRANCH', 'Rajshahi', 'Rajshahi', 'Station Road, Rajshahi-6000', '0721-812345', 'rajshahi@jamunabank.com', 1, '2026-05-04 16:32:09'),
(6, 'BR-KHL-001', 'Khulna KDA Branch', 'SUB_BRANCH', 'Khulna', 'Khulna', 'KDA Avenue, Khulna-9100', '041-723456', 'khulna@jamunabank.com', 1, '2026-05-04 16:32:09'),
(7, 'BR-FAR-001', 'Jhiltuli Branch', 'AD_BRANCH', 'Faridpur', 'Dhaka', '8B, Jhiltuli, Faridpur - 7800', '01824844522', NULL, 1, '2026-05-06 09:37:06');

-- --------------------------------------------------------

--
-- Table structure for table `branch_departments`
--

CREATE TABLE `branch_departments` (
  `branch_id` bigint(20) NOT NULL,
  `department_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `branch_departments`
--

INSERT INTO `branch_departments` (`branch_id`, `department_id`) VALUES
(1, 1),
(1, 2),
(1, 3),
(1, 4),
(1, 5),
(1, 6),
(2, 1),
(2, 2),
(2, 3),
(2, 4),
(2, 5),
(2, 6),
(3, 1),
(3, 2),
(3, 3),
(3, 6),
(4, 1),
(4, 3),
(4, 6),
(5, 1),
(5, 3),
(6, 1),
(6, 3),
(7, 1),
(7, 3),
(7, 6);

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `department_id` bigint(20) NOT NULL,
  `department_name` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_hq_only` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`department_id`, `department_name`, `created_at`, `is_hq_only`) VALUES
(1, 'Cash Operations', '2026-05-04 16:32:09', 0),
(2, 'IT Department', '2026-05-04 16:32:09', 0),
(3, 'General Administration', '2026-05-04 16:32:09', 0),
(4, 'Security & Compliance', '2026-05-04 16:32:09', 0),
(5, 'Human Resources', '2026-05-04 16:32:09', 0),
(6, 'Customer Service', '2026-05-04 16:32:09', 0),
(7, 'Central Logistics Control', '2026-05-15 19:56:20', 1);

-- --------------------------------------------------------

--
-- Table structure for table `item_categories`
--

CREATE TABLE `item_categories` (
  `category_id` bigint(20) NOT NULL,
  `category_name` varchar(255) NOT NULL,
  `department_id` bigint(20) DEFAULT NULL COMMENT 'NULL = open access for all roles',
  `sensitivity_level` varchar(50) NOT NULL DEFAULT 'LOW' COMMENT 'LOW | MEDIUM | HIGH | CRITICAL',
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `item_categories`
--

INSERT INTO `item_categories` (`category_id`, `category_name`, `department_id`, `sensitivity_level`, `description`, `created_at`) VALUES
(1, 'Cash Bundle', 1, 'CRITICAL', 'Physical cash in sealed bags for branch settlement', '2026-05-04 16:32:09'),
(2, 'Cheque Books', 1, 'HIGH', 'Blank cheque books for customer issuance', '2026-05-04 16:32:09'),
(3, 'Demand Draft', 1, 'HIGH', 'Demand draft documents for inter-branch transfer', '2026-05-04 16:32:09'),
(4, 'Laptop', 2, 'HIGH', 'Employee laptops and workstations', '2026-05-04 16:32:09'),
(5, 'Network Equipment', 2, 'MEDIUM', 'Routers, switches, and network accessories', '2026-05-04 16:32:09'),
(6, 'Office Printer', 2, 'MEDIUM', 'Laser and inkjet printers', '2026-05-04 16:32:09'),
(7, 'Stationery Pack', 3, 'LOW', 'General office stationery bundle', '2026-05-04 16:32:09'),
(8, 'Printed Forms', 3, 'LOW', 'Pre-printed official bank forms', '2026-05-04 16:32:09'),
(9, 'Office Furniture', 3, 'LOW', 'Chairs, desks, and minor office items', '2026-05-04 16:32:09'),
(10, 'Security Badge', 4, 'HIGH', 'Access control badges for staff', '2026-05-04 16:32:09'),
(11, 'CCTV Equipment', 4, 'CRITICAL', 'Surveillance cameras and recording equipment', '2026-05-04 16:32:09'),
(12, 'First Aid Kit', NULL, 'LOW', 'Medical first aid supplies, open access', '2026-05-04 16:32:09');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `role_id` bigint(20) NOT NULL,
  `role_name` varchar(100) NOT NULL COMMENT 'SYSTEM_ADMIN | BRANCH_MANAGER | OPERATION_MANAGER | FIRST_EXECUTIVE_OFFICER | OFFICER | DELIVERY_PERSON'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`role_id`, `role_name`) VALUES
(3, 'BRANCH_MANAGER'),
(6, 'DELIVERY_PERSON'),
(2, 'FIRST_EXECUTIVE_OFFICER'),
(7, 'HQ_LOGISTICS_OFFICER'),
(5, 'OFFICER'),
(4, 'OPERATION_MANAGER'),
(1, 'SYSTEM_ADMIN');

-- --------------------------------------------------------

--
-- Table structure for table `transfer_requests`
--

CREATE TABLE `transfer_requests` (
  `request_id` bigint(20) NOT NULL,
  `request_code` varchar(50) NOT NULL COMMENT 'e.g. REQ-2026-001',
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `category_id` bigint(20) NOT NULL,
  `priority` varchar(50) NOT NULL DEFAULT 'NORMAL' COMMENT 'NORMAL | HIGH | URGENT | CRITICAL',
  `status` varchar(50) NOT NULL DEFAULT 'PENDING_INTERNAL' COMMENT 'PENDING_INTERNAL | PENDING_ASSIGNMENT | READY_FOR_PICKUP | IN_TRANSIT | DELIVERED | COMPLETED | REJECTED_ON_RECEIPT | CANCELLED',
  `origin_branch_id` bigint(20) NOT NULL,
  `origin_department_id` bigint(20) DEFAULT NULL,
  `initiated_by_id` bigint(20) NOT NULL COMMENT 'Original requester — enforces Step 6 restriction',
  `internal_approver_id` bigint(20) DEFAULT NULL COMMENT 'Manager/FEO who approved internally. NULL if bypassed.',
  `destination_branch_id` bigint(20) NOT NULL,
  `destination_department_id` bigint(20) DEFAULT NULL,
  `dept_acceptor_id` bigint(20) DEFAULT NULL,
  `final_releaser_id` bigint(20) DEFAULT NULL,
  `delivery_person_id` bigint(20) DEFAULT NULL,
  `picked_up_at` timestamp NULL DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `final_note` text DEFAULT NULL COMMENT 'Required when status = REJECTED_ON_RECEIPT',
  `closed_at` timestamp NULL DEFAULT NULL,
  `requested_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `hq_approver_id` bigint(20) DEFAULT NULL,
  `hq_approved_at` datetime(6) DEFAULT NULL,
  `hq_rejection_note` longtext DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `transfer_requests`
--

INSERT INTO `transfer_requests` (`request_id`, `request_code`, `title`, `description`, `category_id`, `priority`, `status`, `origin_branch_id`, `origin_department_id`, `initiated_by_id`, `internal_approver_id`, `destination_branch_id`, `destination_department_id`, `dept_acceptor_id`, `final_releaser_id`, `delivery_person_id`, `picked_up_at`, `delivered_at`, `final_note`, `closed_at`, `requested_at`, `hq_approver_id`, `hq_approved_at`, `hq_rejection_note`) VALUES
(1, 'REQ-2026-0001', 'Cash require due to shortage', 'Cash required due to shortage of cash balance at our branch. Kindly arrange cash support as soon as possible.\n', 1, 'URGENT', 'COMPLETED', 2, 1, 19, 5, 3, 1, 24, 12, 33, '2026-05-06 11:34:58', '2026-05-06 11:35:23', '', '2026-05-06 11:37:51', '2026-05-06 10:56:17', NULL, NULL, NULL),
(2, 'REQ-2026-0002', 'Requestion for copy of account opening form ', 'Need a copy of the account opening form of Customer name: Tasnim Jahan (AC#1101008003478)', 8, 'NORMAL', 'COMPLETED', 4, 3, 28, 7, 5, 3, 30, 8, 33, '2026-05-10 12:02:21', '2026-05-10 12:03:18', '', '2026-05-10 12:05:30', '2026-05-10 11:48:11', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` bigint(20) NOT NULL,
  `employee_id` varchar(50) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone_number` varchar(30) DEFAULT NULL,
  `password_hash` text NOT NULL,
  `role_id` bigint(20) NOT NULL,
  `branch_id` bigint(20) DEFAULT NULL COMMENT 'NULL for SYSTEM_ADMIN and DELIVERY_PERSON (floating)',
  `department_id` bigint(20) DEFAULT NULL COMMENT 'NULL for Manager-level roles and Delivery Person',
  `is_available` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'For DELIVERY_PERSON: TRUE=Available, FALSE=Busy',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_login_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `employee_id`, `full_name`, `email`, `phone_number`, `password_hash`, `role_id`, `branch_id`, `department_id`, `is_available`, `is_active`, `created_at`, `updated_at`, `last_login_at`) VALUES
(1, 'EMP-000', 'Jawadur Rafid', 'admin@jamunabank.com', '01700000000', '75K3eLr+dx6JJFuJ7LwIpEpOFmwGZZkRiB84PURz6U8=', 1, NULL, NULL, 1, 1, '2026-05-04 16:32:09', '2026-05-06 18:10:26', NULL),
(2, 'EMP-001', 'Ahmed Karim FEO', 'feo1@jamunabank.com', '01711111111', '75K3eLr+dx6JJFuJ7LwIpEpOFmwGZZkRiB84PURz6U8=', 2, 1, NULL, 1, 1, '2026-05-04 16:32:09', '2026-05-04 16:56:26', NULL),
(3, 'EMP-002', 'Nasrin Akter FEO', 'feo2@jamunabank.com', '01711111122', '75K3eLr+dx6JJFuJ7LwIpEpOFmwGZZkRiB84PURz6U8=', 2, 2, NULL, 1, 1, '2026-05-04 16:32:09', '2026-05-04 16:56:26', NULL),
(4, 'EMP-101', 'Rafiqul Islam', 'mgr.hq@jamunabank.com', '01722221101', '75K3eLr+dx6JJFuJ7LwIpEpOFmwGZZkRiB84PURz6U8=', 3, 1, NULL, 1, 1, '2026-05-04 16:32:09', '2026-05-04 16:56:26', NULL),
(5, 'EMP-102', 'Fatema Khanam', 'mgr.dhk@jamunabank.com', '01722221102', '75K3eLr+dx6JJFuJ7LwIpEpOFmwGZZkRiB84PURz6U8=', 3, 2, NULL, 1, 1, '2026-05-04 16:32:09', '2026-05-04 16:56:26', NULL),
(6, 'EMP-103', 'Shafiqul Hassan', 'mgr.ctg@jamunabank.com', '01722221103', '75K3eLr+dx6JJFuJ7LwIpEpOFmwGZZkRiB84PURz6U8=', 3, 3, NULL, 1, 1, '2026-05-04 16:32:09', '2026-05-04 16:56:26', NULL),
(7, 'EMP-104', 'Momena Begum', 'mgr.syl@jamunabank.com', '01722221104', '75K3eLr+dx6JJFuJ7LwIpEpOFmwGZZkRiB84PURz6U8=', 3, 4, NULL, 1, 1, '2026-05-04 16:32:09', '2026-05-04 16:56:26', NULL),
(8, 'EMP-105', 'Jahangir Alam', 'mgr.raj@jamunabank.com', '01722221105', '75K3eLr+dx6JJFuJ7LwIpEpOFmwGZZkRiB84PURz6U8=', 3, 5, NULL, 1, 1, '2026-05-04 16:32:09', '2026-05-04 16:56:26', NULL),
(9, 'EMP-106', 'Shahida Parvin', 'mgr.khl@jamunabank.com', '01722221106', '75K3eLr+dx6JJFuJ7LwIpEpOFmwGZZkRiB84PURz6U8=', 3, 6, NULL, 1, 1, '2026-05-04 16:32:09', '2026-05-04 16:56:26', NULL),
(10, 'EMP-201', 'Mizanur Rahman', 'om.hq@jamunabank.com', '01733331201', '75K3eLr+dx6JJFuJ7LwIpEpOFmwGZZkRiB84PURz6U8=', 4, 1, NULL, 1, 1, '2026-05-04 16:32:09', '2026-05-04 16:56:26', NULL),
(11, 'EMP-202', 'Khaleda Akter', 'om.dhk@jamunabank.com', '01733331202', '75K3eLr+dx6JJFuJ7LwIpEpOFmwGZZkRiB84PURz6U8=', 4, 2, NULL, 1, 1, '2026-05-04 16:32:09', '2026-05-04 16:56:26', NULL),
(12, 'EMP-203', 'Nurul Huda', 'om.ctg@jamunabank.com', '01733331203', '75K3eLr+dx6JJFuJ7LwIpEpOFmwGZZkRiB84PURz6U8=', 4, 3, NULL, 1, 1, '2026-05-04 16:32:09', '2026-05-04 16:56:26', NULL),
(13, 'EMP-204', 'Saleha Begum', 'om.syl@jamunabank.com', '01733331204', '75K3eLr+dx6JJFuJ7LwIpEpOFmwGZZkRiB84PURz6U8=', 4, 4, NULL, 1, 1, '2026-05-04 16:32:09', '2026-05-04 16:56:26', NULL),
(14, 'EMP-301', 'Karim Hossain', 'karim.hq@jamunabank.com', '01744440301', '75K3eLr+dx6JJFuJ7LwIpEpOFmwGZZkRiB84PURz6U8=', 5, 1, 1, 1, 1, '2026-05-04 16:32:09', '2026-05-04 16:56:26', NULL),
(15, 'EMP-302', 'Rina Begum', 'rina.hq@jamunabank.com', '01744440302', '75K3eLr+dx6JJFuJ7LwIpEpOFmwGZZkRiB84PURz6U8=', 5, 1, 2, 1, 1, '2026-05-04 16:32:09', '2026-05-04 16:56:26', NULL),
(16, 'EMP-303', 'Tanvir Ahmed', 'tanvir.hq@jamunabank.com', '01744440303', '75K3eLr+dx6JJFuJ7LwIpEpOFmwGZZkRiB84PURz6U8=', 5, 1, 3, 1, 1, '2026-05-04 16:32:09', '2026-05-04 16:56:26', NULL),
(17, 'EMP-304', 'Sabrina Islam', 'sabrina.hq@jamunabank.com', '01744440304', '75K3eLr+dx6JJFuJ7LwIpEpOFmwGZZkRiB84PURz6U8=', 5, 1, 1, 1, 1, '2026-05-04 16:32:09', '2026-05-04 16:56:26', NULL),
(18, 'EMP-305', 'Rashed Khan', 'rashed.hq@jamunabank.com', '01744440305', '75K3eLr+dx6JJFuJ7LwIpEpOFmwGZZkRiB84PURz6U8=', 5, 1, 4, 1, 1, '2026-05-04 16:32:09', '2026-05-04 16:56:26', NULL),
(19, 'EMP-311', 'Monira Akter', 'monira.dhk@jamunabank.com', '01744440311', '75K3eLr+dx6JJFuJ7LwIpEpOFmwGZZkRiB84PURz6U8=', 5, 2, 1, 1, 1, '2026-05-04 16:32:09', '2026-05-04 16:56:26', NULL),
(20, 'EMP-312', 'Raihan Uddin', 'raihan.dhk@jamunabank.com', '01744440312', '75K3eLr+dx6JJFuJ7LwIpEpOFmwGZZkRiB84PURz6U8=', 5, 2, 2, 1, 1, '2026-05-04 16:32:09', '2026-05-04 16:56:26', NULL),
(21, 'EMP-313', 'Popy Khatun', 'popy.dhk@jamunabank.com', '01744440313', '75K3eLr+dx6JJFuJ7LwIpEpOFmwGZZkRiB84PURz6U8=', 5, 2, 3, 1, 1, '2026-05-04 16:32:09', '2026-05-04 16:56:26', NULL),
(22, 'EMP-314', 'Nasim Hossain', 'nasim.dhk@jamunabank.com', '01744440314', '75K3eLr+dx6JJFuJ7LwIpEpOFmwGZZkRiB84PURz6U8=', 5, 2, 1, 1, 1, '2026-05-04 16:32:09', '2026-05-04 16:56:26', NULL),
(23, 'EMP-315', 'Sharmin Jahan', 'sharmin.dhk@jamunabank.com', '01744440315', '75K3eLr+dx6JJFuJ7LwIpEpOFmwGZZkRiB84PURz6U8=', 5, 2, 6, 1, 1, '2026-05-04 16:32:09', '2026-05-04 16:56:26', NULL),
(24, 'EMP-321', 'Arif Hossain', 'arif.ctg@jamunabank.com', '01744440321', '75K3eLr+dx6JJFuJ7LwIpEpOFmwGZZkRiB84PURz6U8=', 5, 3, 1, 1, 1, '2026-05-04 16:32:09', '2026-05-04 16:56:26', NULL),
(25, 'EMP-322', 'Sumaiya Khatun', 'sumaiya.ctg@jamunabank.com', '01744440322', '75K3eLr+dx6JJFuJ7LwIpEpOFmwGZZkRiB84PURz6U8=', 5, 3, 2, 1, 1, '2026-05-04 16:32:09', '2026-05-04 16:56:26', NULL),
(26, 'EMP-323', 'Jahirul Islam', 'jahirul.ctg@jamunabank.com', '01744440323', '75K3eLr+dx6JJFuJ7LwIpEpOFmwGZZkRiB84PURz6U8=', 5, 3, 3, 1, 1, '2026-05-04 16:32:09', '2026-05-04 16:56:26', NULL),
(27, 'EMP-331', 'Munmun Akter', 'munmun.syl@jamunabank.com', '01744440331', '75K3eLr+dx6JJFuJ7LwIpEpOFmwGZZkRiB84PURz6U8=', 5, 4, 1, 1, 1, '2026-05-04 16:32:09', '2026-05-04 16:56:26', NULL),
(28, 'EMP-332', 'Touhid Mia', 'touhid.syl@jamunabank.com', '01744440332', '75K3eLr+dx6JJFuJ7LwIpEpOFmwGZZkRiB84PURz6U8=', 5, 4, 3, 1, 1, '2026-05-04 16:32:09', '2026-05-04 16:56:26', NULL),
(29, 'EMP-341', 'Maksuda Begum', 'maksuda.raj@jamunabank.com', '01744440341', '75K3eLr+dx6JJFuJ7LwIpEpOFmwGZZkRiB84PURz6U8=', 5, 5, 1, 1, 1, '2026-05-04 16:32:09', '2026-05-04 16:56:26', NULL),
(30, 'EMP-342', 'Selim Reza', 'selim.raj@jamunabank.com', '01744440342', '75K3eLr+dx6JJFuJ7LwIpEpOFmwGZZkRiB84PURz6U8=', 5, 5, 3, 1, 1, '2026-05-04 16:32:09', '2026-05-04 16:56:26', NULL),
(31, 'EMP-351', 'Hafiza Khanam', 'hafiza.khl@jamunabank.com', '01744440351', '75K3eLr+dx6JJFuJ7LwIpEpOFmwGZZkRiB84PURz6U8=', 5, 6, 1, 1, 1, '2026-05-04 16:32:09', '2026-05-04 16:56:26', NULL),
(32, 'EMP-352', 'Nazmul Haq', 'nazmul.khl@jamunabank.com', '01744440352', '75K3eLr+dx6JJFuJ7LwIpEpOFmwGZZkRiB84PURz6U8=', 5, 6, 3, 1, 1, '2026-05-04 16:32:09', '2026-05-04 16:56:26', NULL),
(33, 'DRV-001', 'Rubel Hossain', 'drv1@jamunabank.com', '01755551001', '75K3eLr+dx6JJFuJ7LwIpEpOFmwGZZkRiB84PURz6U8=', 6, NULL, NULL, 1, 1, '2026-05-04 16:32:09', '2026-05-04 16:56:26', NULL),
(34, 'DRV-002', 'Faruk Ahmed', 'drv2@jamunabank.com', '01755551002', '75K3eLr+dx6JJFuJ7LwIpEpOFmwGZZkRiB84PURz6U8=', 6, NULL, NULL, 1, 1, '2026-05-04 16:32:09', '2026-05-04 16:56:26', NULL),
(35, 'DRV-003', 'Shamim Mia', 'drv3@jamunabank.com', '01755551003', '75K3eLr+dx6JJFuJ7LwIpEpOFmwGZZkRiB84PURz6U8=', 6, NULL, NULL, 1, 1, '2026-05-04 16:32:09', '2026-05-04 16:56:26', NULL),
(36, 'DRV-004', 'Khorshed Alam', 'drv4@jamunabank.com', '01755551004', '75K3eLr+dx6JJFuJ7LwIpEpOFmwGZZkRiB84PURz6U8=', 6, NULL, NULL, 1, 1, '2026-05-04 16:32:09', '2026-05-04 16:56:26', NULL),
(37, 'DRV-005', 'Biplob Kumar Das', 'drv5@jamunabank.com', '01755551005', '75K3eLr+dx6JJFuJ7LwIpEpOFmwGZZkRiB84PURz6U8=', 6, NULL, NULL, 0, 1, '2026-05-04 16:32:09', '2026-05-04 16:56:26', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`audit_id`),
  ADD KEY `request_id` (`request_id`),
  ADD KEY `actor_id` (`actor_id`);

--
-- Indexes for table `branches`
--
ALTER TABLE `branches`
  ADD PRIMARY KEY (`branch_id`),
  ADD UNIQUE KEY `branch_code` (`branch_code`);

--
-- Indexes for table `branch_departments`
--
ALTER TABLE `branch_departments`
  ADD PRIMARY KEY (`branch_id`,`department_id`),
  ADD KEY `department_id` (`department_id`);

--
-- Indexes for table `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`department_id`),
  ADD UNIQUE KEY `department_name` (`department_name`);

--
-- Indexes for table `item_categories`
--
ALTER TABLE `item_categories`
  ADD PRIMARY KEY (`category_id`),
  ADD UNIQUE KEY `category_name` (`category_name`),
  ADD KEY `department_id` (`department_id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`role_id`),
  ADD UNIQUE KEY `role_name` (`role_name`);

--
-- Indexes for table `transfer_requests`
--
ALTER TABLE `transfer_requests`
  ADD PRIMARY KEY (`request_id`),
  ADD UNIQUE KEY `request_code` (`request_code`),
  ADD KEY `category_id` (`category_id`),
  ADD KEY `origin_branch_id` (`origin_branch_id`),
  ADD KEY `origin_department_id` (`origin_department_id`),
  ADD KEY `destination_branch_id` (`destination_branch_id`),
  ADD KEY `destination_department_id` (`destination_department_id`),
  ADD KEY `initiated_by_id` (`initiated_by_id`),
  ADD KEY `internal_approver_id` (`internal_approver_id`),
  ADD KEY `dept_acceptor_id` (`dept_acceptor_id`),
  ADD KEY `final_releaser_id` (`final_releaser_id`),
  ADD KEY `delivery_person_id` (`delivery_person_id`),
  ADD KEY `fk_tr_hq_approver` (`hq_approver_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `employee_id` (`employee_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `role_id` (`role_id`),
  ADD KEY `branch_id` (`branch_id`),
  ADD KEY `department_id` (`department_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `audit_id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `branches`
--
ALTER TABLE `branches`
  MODIFY `branch_id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `department_id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `item_categories`
--
ALTER TABLE `item_categories`
  MODIFY `category_id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `role_id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `transfer_requests`
--
ALTER TABLE `transfer_requests`
  MODIFY `request_id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `transfer_requests` (`request_id`),
  ADD CONSTRAINT `audit_logs_ibfk_2` FOREIGN KEY (`actor_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `branch_departments`
--
ALTER TABLE `branch_departments`
  ADD CONSTRAINT `branch_departments_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`),
  ADD CONSTRAINT `branch_departments_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`);

--
-- Constraints for table `item_categories`
--
ALTER TABLE `item_categories`
  ADD CONSTRAINT `item_categories_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`);

--
-- Constraints for table `transfer_requests`
--
ALTER TABLE `transfer_requests`
  ADD CONSTRAINT `fk_tr_hq_approver` FOREIGN KEY (`hq_approver_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `transfer_requests_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `item_categories` (`category_id`),
  ADD CONSTRAINT `transfer_requests_ibfk_10` FOREIGN KEY (`delivery_person_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `transfer_requests_ibfk_2` FOREIGN KEY (`origin_branch_id`) REFERENCES `branches` (`branch_id`),
  ADD CONSTRAINT `transfer_requests_ibfk_3` FOREIGN KEY (`origin_department_id`) REFERENCES `departments` (`department_id`),
  ADD CONSTRAINT `transfer_requests_ibfk_4` FOREIGN KEY (`destination_branch_id`) REFERENCES `branches` (`branch_id`),
  ADD CONSTRAINT `transfer_requests_ibfk_5` FOREIGN KEY (`destination_department_id`) REFERENCES `departments` (`department_id`),
  ADD CONSTRAINT `transfer_requests_ibfk_6` FOREIGN KEY (`initiated_by_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `transfer_requests_ibfk_7` FOREIGN KEY (`internal_approver_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `transfer_requests_ibfk_8` FOREIGN KEY (`dept_acceptor_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `transfer_requests_ibfk_9` FOREIGN KEY (`final_releaser_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`),
  ADD CONSTRAINT `users_ibfk_2` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`),
  ADD CONSTRAINT `users_ibfk_3` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
