-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 22, 2026 at 03:12 PM
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
(14, 2, 28, 'COMPLETED', 'DELIVERED', 'COMPLETED', '', '127.0.0.1', '2026-05-10 12:05:30'),
(15, 3, 32, 'CREATED', NULL, 'PENDING_INTERNAL', NULL, '127.0.0.1', '2026-05-15 14:15:22'),
(16, 3, 9, 'APPROVED_INTERNAL', 'PENDING_INTERNAL', 'PENDING_HQ_APPROVAL', NULL, '127.0.0.1', '2026-05-15 14:16:20'),
(17, 3, 38, 'HQ_APPROVED', 'PENDING_HQ_APPROVAL', 'PENDING_ASSIGNMENT', NULL, '127.0.0.1', '2026-05-15 14:17:45'),
(18, 3, 40, 'ASSIGNED_DRIVER', 'PENDING_ASSIGNMENT', 'PENDING_FINAL_RELEASE', NULL, '127.0.0.1', '2026-05-17 11:42:20'),
(19, 3, 40, 'RELEASED', 'PENDING_FINAL_RELEASE', 'READY_FOR_PICKUP', NULL, '127.0.0.1', '2026-05-17 11:46:03'),
(20, 3, 34, 'PICKED_UP', 'READY_FOR_PICKUP', 'IN_TRANSIT', NULL, '127.0.0.1', '2026-05-17 11:46:21'),
(21, 3, 34, 'DELIVERED', 'IN_TRANSIT', 'DELIVERED', NULL, '127.0.0.1', '2026-05-17 11:46:25'),
(22, 3, 32, 'COMPLETED', 'DELIVERED', 'COMPLETED', '', '127.0.0.1', '2026-05-17 12:09:17'),
(23, 4, 14, 'CREATED', NULL, 'PENDING_INTERNAL', NULL, '127.0.0.1', '2026-05-17 14:44:04'),
(24, 4, 2, 'APPROVED_INTERNAL', 'PENDING_INTERNAL', 'PENDING_HQ_APPROVAL', NULL, '127.0.0.1', '2026-05-17 14:46:10'),
(25, 5, 24, 'CREATED', NULL, 'PENDING_INTERNAL', NULL, '127.0.0.1', '2026-05-17 23:48:06'),
(26, 5, 6, 'APPROVED_INTERNAL', 'PENDING_INTERNAL', 'PENDING_HQ_APPROVAL', NULL, '127.0.0.1', '2026-05-17 23:49:21'),
(27, 5, 38, 'HQ_APPROVED', 'PENDING_HQ_APPROVAL', 'PENDING_ASSIGNMENT', NULL, '127.0.0.1', '2026-05-17 23:50:13'),
(32, 10, 41, 'CREATED', NULL, 'PENDING_INTERNAL', NULL, '127.0.0.1', '2026-05-19 05:21:04'),
(33, 10, 12, 'APPROVED_INTERNAL', 'PENDING_INTERNAL', 'PENDING_HQ_APPROVAL', NULL, '127.0.0.1', '2026-05-19 05:21:51'),
(34, 4, 38, 'HQ_REJECTED', 'PENDING_HQ_APPROVAL', 'REJECTED_BY_HQ', 'invalid request', '127.0.0.1', '2026-05-19 05:23:14'),
(35, 10, 38, 'HQ_APPROVED', 'PENDING_HQ_APPROVAL', 'PENDING_ASSIGNMENT', NULL, '127.0.0.1', '2026-05-19 05:27:55'),
(36, 11, 39, 'CREATED', NULL, 'PENDING_INTERNAL', NULL, '127.0.0.1', '2026-05-19 06:42:37'),
(37, 11, 42, 'APPROVED_INTERNAL', 'PENDING_INTERNAL', 'PENDING_HQ_APPROVAL', NULL, '127.0.0.1', '2026-05-19 06:50:31'),
(38, 11, 38, 'HQ_APPROVED', 'PENDING_HQ_APPROVAL', 'PENDING_ASSIGNMENT', NULL, '127.0.0.1', '2026-05-19 06:51:56'),
(39, 11, 32, 'DESTINATION_REJECTED', 'PENDING_ASSIGNMENT', 'PENDING_HQ_APPROVAL', 'not available at the branch', '127.0.0.1', '2026-05-19 07:14:02'),
(40, 11, 38, 'HQ_APPROVED', 'PENDING_HQ_APPROVAL', 'PENDING_ASSIGNMENT', NULL, '127.0.0.1', '2026-05-19 07:14:46'),
(41, 11, 28, 'ASSIGNED_DRIVER', 'PENDING_ASSIGNMENT', 'PENDING_FINAL_RELEASE', NULL, '127.0.0.1', '2026-05-19 07:16:11'),
(42, 11, 7, 'RELEASE_REJECTED', 'PENDING_FINAL_RELEASE', 'PENDING_HQ_APPROVAL', 'not available', '127.0.0.1', '2026-05-19 07:32:25'),
(43, 12, 19, 'CREATED', NULL, 'PENDING_INTERNAL', NULL, '127.0.0.1', '2026-05-19 17:09:52'),
(44, 12, 3, 'APPROVED_INTERNAL', 'PENDING_INTERNAL', 'PENDING_HQ_APPROVAL', NULL, '127.0.0.1', '2026-05-19 17:10:29'),
(45, 12, 38, 'HQ_APPROVED', 'PENDING_HQ_APPROVAL', 'PENDING_ASSIGNMENT', NULL, '127.0.0.1', '2026-05-19 17:11:12'),
(46, 12, 17, 'ASSIGNED_DRIVER', 'PENDING_ASSIGNMENT', 'PENDING_FINAL_RELEASE', NULL, '127.0.0.1', '2026-05-19 17:13:18'),
(47, 12, 2, 'RELEASED', 'PENDING_FINAL_RELEASE', 'READY_FOR_PICKUP', NULL, '127.0.0.1', '2026-05-19 17:13:44'),
(48, 12, 33, 'PICKED_UP', 'READY_FOR_PICKUP', 'IN_TRANSIT', NULL, '127.0.0.1', '2026-05-19 17:14:13'),
(49, 12, 33, 'DELIVERED', 'IN_TRANSIT', 'DELIVERED', NULL, '127.0.0.1', '2026-05-19 17:14:17'),
(50, 13, 22, 'CREATED', NULL, 'PENDING_INTERNAL', NULL, '127.0.0.1', '2026-05-19 23:04:28'),
(51, 13, 11, 'APPROVED_INTERNAL', 'PENDING_INTERNAL', 'PENDING_HQ_APPROVAL', NULL, '127.0.0.1', '2026-05-19 23:06:01'),
(52, 13, 38, 'HQ_APPROVED', 'PENDING_HQ_APPROVAL', 'PENDING_ASSIGNMENT', NULL, '127.0.0.1', '2026-05-19 23:10:26'),
(53, 13, 24, 'ASSIGNED_DRIVER', 'PENDING_ASSIGNMENT', 'PENDING_FINAL_RELEASE', NULL, '127.0.0.1', '2026-05-19 23:12:32'),
(54, 13, 6, 'RELEASED', 'PENDING_FINAL_RELEASE', 'READY_FOR_PICKUP', NULL, '127.0.0.1', '2026-05-19 23:13:31'),
(55, 13, 36, 'PICKED_UP', 'READY_FOR_PICKUP', 'IN_TRANSIT', NULL, '127.0.0.1', '2026-05-19 23:13:49'),
(56, 13, 36, 'DELIVERED', 'IN_TRANSIT', 'DELIVERED', NULL, '127.0.0.1', '2026-05-19 23:13:51'),
(57, 13, 22, 'COMPLETED', 'DELIVERED', 'COMPLETED', '', '127.0.0.1', '2026-05-19 23:14:58'),
(58, 14, 5, 'CREATED', NULL, 'PENDING_HQ_APPROVAL', NULL, '127.0.0.1', '2026-05-20 01:06:43'),
(59, 14, 38, 'HQ_APPROVED', 'PENDING_HQ_APPROVAL', 'PENDING_ASSIGNMENT', NULL, '127.0.0.1', '2026-05-20 01:08:44'),
(60, 14, 24, 'ASSIGNED_DRIVER', 'PENDING_ASSIGNMENT', 'PENDING_FINAL_RELEASE', NULL, '127.0.0.1', '2026-05-20 01:10:04'),
(61, 14, 6, 'RELEASED', 'PENDING_FINAL_RELEASE', 'READY_FOR_PICKUP', NULL, '127.0.0.1', '2026-05-20 01:11:04'),
(62, 14, 33, 'PICKED_UP', 'READY_FOR_PICKUP', 'IN_TRANSIT', NULL, '127.0.0.1', '2026-05-20 01:11:41'),
(63, 14, 33, 'DELIVERED', 'IN_TRANSIT', 'DELIVERED', NULL, '127.0.0.1', '2026-05-20 01:11:46'),
(64, 14, 5, 'COMPLETED', 'DELIVERED', 'COMPLETED', '', '127.0.0.1', '2026-05-20 01:16:09'),
(65, 12, 19, 'COMPLETED', 'DELIVERED', 'COMPLETED', '', '127.0.0.1', '2026-05-20 13:15:45');

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
(1, 'HQ-001', 'Head Office - Motijheel', 'HQ', 'Dhaka', 'Dhaka', 'Dilkusha C/A, Motijheel, Dhaka-1000', '02-9550124', 'hq@jamunabank.com', 1, '2026-05-04 16:32:09'),
(2, 'BR-DHK-001', 'Dhaka Main Branch', 'AD_BRANCH', 'Dhaka', 'Dhaka', 'Mirpur Road, Dhanmondi, Dhaka-1205', '02-8120456', 'dhaka.main@jamunabank.com', 1, '2026-05-04 16:32:09'),
(3, 'BR-CTG-001', 'Chittagong Agrabad Branch', 'AD_BRANCH', 'Chattogram', 'Chattogram', 'Agrabad Commercial Area, Chattogram-4100', '031-714552', 'ctg.agrabad@jamunabank.com', 1, '2026-05-04 16:32:09'),
(4, 'BR-SYL-001', 'Sylhet Zindabazar Branch', 'AD_BRANCH', 'Sylhet', 'Sylhet', 'Zindabazar, Sylhet-3100', '0821-718920', 'sylhet@jamunabank.com', 1, '2026-05-04 16:32:09'),
(5, 'BR-RAJ-001', 'Rajshahi Station Road Branch', 'SUB_BRANCH', 'Rajshahi', 'Rajshahi', 'Station Road, Rajshahi-6000', '0721-812345', 'rajshahi@jamunabank.com', 1, '2026-05-04 16:32:09'),
(6, 'BR-KHL-001', 'Khulna KDA Branch', 'SUB_BRANCH', 'Khulna', 'Khulna', 'KDA Avenue, Khulna-9100', '041-723456', 'khulna@jamunabank.com', 1, '2026-05-04 16:32:09'),
(7, 'BR-FAR-001', 'Jhiltuli Branch', 'AD_BRANCH', 'Faridpur', 'Dhaka', '8B, Jhiltuli, Faridpur - 7800', '01824844522', NULL, 1, '2026-05-06 09:37:06');

-- --------------------------------------------------------

--
-- Table structure for table `branch_cash_balance`
--

CREATE TABLE `branch_cash_balance` (
  `branch_id` bigint(20) NOT NULL,
  `current_balance` decimal(18,2) NOT NULL DEFAULT 0.00,
  `last_updated_at` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Live cash balance per branch — updated on every transfer/adjustment';

--
-- Dumping data for table `branch_cash_balance`
--

INSERT INTO `branch_cash_balance` (`branch_id`, `current_balance`, `last_updated_at`) VALUES
(1, 359000000.00, '2026-05-20 04:58:59.000000'),
(2, 2200000.00, '2026-05-20 19:30:08.000000'),
(3, 34475326.00, '2026-05-20 07:11:41.000000'),
(4, 12345002.00, '2026-05-20 04:51:15.000000'),
(5, 450000.00, '2026-05-20 04:52:09.000000'),
(6, 13000000.00, '2026-05-20 04:53:34.000000'),
(7, 45001205.00, '2026-05-20 04:56:00.000000');

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
(1, 7),
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
-- Table structure for table `branch_stock_balance`
--

CREATE TABLE `branch_stock_balance` (
  `balance_id` bigint(20) NOT NULL,
  `current_quantity` int(11) NOT NULL,
  `last_updated_at` datetime(6) DEFAULT NULL,
  `branch_id` bigint(20) NOT NULL,
  `stock_item_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cash_ledger`
--

CREATE TABLE `cash_ledger` (
  `ledger_id` bigint(20) NOT NULL,
  `branch_id` bigint(20) NOT NULL,
  `entry_type` varchar(40) NOT NULL COMMENT 'TRANSFER_OUT | TRANSFER_IN | REVERSAL_IN | REVERSAL_OUT | MANUAL_ADJUSTMENT',
  `request_id` bigint(20) DEFAULT NULL,
  `amount` decimal(18,2) NOT NULL,
  `balance_before` decimal(18,2) NOT NULL,
  `balance_after` decimal(18,2) NOT NULL,
  `actor_id` bigint(20) DEFAULT NULL,
  `approver_id` bigint(20) DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Immutable audit-ready cash ledger — no updates, only inserts';

--
-- Dumping data for table `cash_ledger`
--

INSERT INTO `cash_ledger` (`ledger_id`, `branch_id`, `entry_type`, `request_id`, `amount`, `balance_before`, `balance_after`, `actor_id`, `approver_id`, `reason`, `created_at`) VALUES
(1, 1, 'MANUAL_ADJUSTMENT', NULL, 10000000.00, 0.00, 10000000.00, 14, 4, NULL, '2026-05-19 23:07:45.000000'),
(2, 1, 'TRANSFER_OUT', 12, 1000000.00, 10000000.00, 9000000.00, 33, NULL, NULL, '2026-05-19 23:14:13.000000'),
(3, 2, 'TRANSFER_IN', 12, 1000000.00, 0.00, 1000000.00, 33, NULL, NULL, '2026-05-19 23:14:17.000000'),
(4, 3, 'MANUAL_ADJUSTMENT', NULL, 36475326.00, 0.00, 36475326.00, 24, 12, NULL, '2026-05-20 04:50:10.000000'),
(5, 4, 'MANUAL_ADJUSTMENT', NULL, 12345002.00, 0.00, 12345002.00, 27, 7, NULL, '2026-05-20 04:51:15.000000'),
(6, 5, 'MANUAL_ADJUSTMENT', NULL, 450000.00, 0.00, 450000.00, 29, 8, NULL, '2026-05-20 04:52:09.000000'),
(7, 6, 'MANUAL_ADJUSTMENT', NULL, 13000000.00, 0.00, 13000000.00, 31, 9, NULL, '2026-05-20 04:53:34.000000'),
(8, 7, 'MANUAL_ADJUSTMENT', NULL, 45001205.00, 0.00, 45001205.00, 43, 42, NULL, '2026-05-20 04:56:00.000000'),
(9, 1, 'MANUAL_ADJUSTMENT', NULL, 350000000.00, 9000000.00, 359000000.00, 17, 10, NULL, '2026-05-20 04:58:59.000000'),
(10, 2, 'MANUAL_ADJUSTMENT', NULL, 50000.00, 1000000.00, 1050000.00, 19, 11, NULL, '2026-05-20 05:05:40.000000'),
(11, 3, 'TRANSFER_OUT', 13, 1000000.00, 36475326.00, 35475326.00, 36, NULL, NULL, '2026-05-20 05:13:49.000000'),
(12, 2, 'TRANSFER_IN', 13, 1000000.00, 1050000.00, 2050000.00, 36, NULL, NULL, '2026-05-20 05:13:51.000000'),
(13, 2, 'MANUAL_ADJUSTMENT', NULL, 1000000.00, 2050000.00, 1050000.00, 22, 5, NULL, '2026-05-20 07:03:51.000000'),
(14, 3, 'TRANSFER_OUT', 14, 1000000.00, 35475326.00, 34475326.00, 33, NULL, NULL, '2026-05-20 07:11:41.000000'),
(15, 2, 'TRANSFER_IN', 14, 1000000.00, 1050000.00, 2050000.00, 33, NULL, NULL, '2026-05-20 07:11:46.000000'),
(16, 2, 'MANUAL_ADJUSTMENT', NULL, 50000.00, 2050000.00, 2000000.00, 19, 5, NULL, '2026-05-20 19:21:13.000000'),
(17, 2, 'MANUAL_ADJUSTMENT', NULL, 200000.00, 2000000.00, 2200000.00, 19, 5, 'Customer Deposit', '2026-05-20 19:30:08.000000');

-- --------------------------------------------------------

--
-- Table structure for table `cash_manual_adjustments`
--

CREATE TABLE `cash_manual_adjustments` (
  `adjustment_id` bigint(20) NOT NULL,
  `branch_id` bigint(20) NOT NULL,
  `amount` decimal(18,2) NOT NULL COMMENT 'Positive = credit, negative = debit',
  `reason` text NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING | APPROVED | REJECTED',
  `submitted_by_id` bigint(20) DEFAULT NULL,
  `submitted_at` datetime(6) DEFAULT NULL,
  `approved_by_id` bigint(20) DEFAULT NULL,
  `decided_at` datetime(6) DEFAULT NULL,
  `decision_note` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Manual cash balance adjustments requiring manager approval';

--
-- Dumping data for table `cash_manual_adjustments`
--

INSERT INTO `cash_manual_adjustments` (`adjustment_id`, `branch_id`, `amount`, `reason`, `status`, `submitted_by_id`, `submitted_at`, `approved_by_id`, `decided_at`, `decision_note`) VALUES
(1, 1, 10000000.00, 'customer deposit', 'APPROVED', 14, '2026-05-19 23:06:57.000000', 4, '2026-05-19 23:07:45.000000', ''),
(2, 2, 50000.00, 'deposit', 'APPROVED', 19, '2026-05-19 23:08:59.000000', 11, '2026-05-20 05:05:40.000000', ''),
(3, 3, 36475326.00, 'Initial balance', 'APPROVED', 24, '2026-05-20 04:46:51.000000', 12, '2026-05-20 04:50:10.000000', ''),
(4, 4, 12345002.00, 'initial', 'APPROVED', 27, '2026-05-20 04:50:59.000000', 7, '2026-05-20 04:51:15.000000', ''),
(5, 5, 450000.00, 'initial', 'APPROVED', 29, '2026-05-20 04:51:47.000000', 8, '2026-05-20 04:52:09.000000', ''),
(6, 6, 13000000.00, 'initial', 'APPROVED', 31, '2026-05-20 04:52:45.000000', 9, '2026-05-20 04:53:34.000000', ''),
(7, 7, 45001205.00, 'initial balance', 'APPROVED', 43, '2026-05-20 04:55:31.000000', 42, '2026-05-20 04:56:00.000000', ''),
(8, 1, 350000000.00, 'received', 'APPROVED', 17, '2026-05-20 04:58:32.000000', 10, '2026-05-20 04:58:59.000000', ''),
(9, 2, -1000000.00, 'withdraw', 'APPROVED', 22, '2026-05-20 07:02:46.000000', 5, '2026-05-20 07:03:51.000000', ''),
(10, 2, -5000000.00, 'withdraw', 'REJECTED', 22, '2026-05-20 07:03:04.000000', 5, '2026-05-20 07:04:06.000000', ''),
(11, 2, -50000.00, 'withdraw', 'APPROVED', 19, '2026-05-20 19:20:47.000000', 5, '2026-05-20 19:21:13.000000', ''),
(12, 2, 200000.00, 'Customer Deposit', 'APPROVED', 19, '2026-05-20 19:29:33.000000', 5, '2026-05-20 19:30:08.000000', '');

-- --------------------------------------------------------

--
-- Table structure for table `cash_transfer_denominations`
--

CREATE TABLE `cash_transfer_denominations` (
  `denomination_id` bigint(20) NOT NULL,
  `request_id` bigint(20) NOT NULL,
  `denomination` int(11) NOT NULL COMMENT 'Note face value e.g. 1000, 500, 200',
  `quantity` int(11) NOT NULL,
  `subtotal` decimal(18,2) NOT NULL COMMENT 'denomination × quantity',
  `submitted_by_id` bigint(20) DEFAULT NULL,
  `submitted_at` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Per-denomination note quantities submitted by destination branch for Cash Bundle transfers';

--
-- Dumping data for table `cash_transfer_denominations`
--

INSERT INTO `cash_transfer_denominations` (`denomination_id`, `request_id`, `denomination`, `quantity`, `subtotal`, `submitted_by_id`, `submitted_at`) VALUES
(1, 12, 1000, 500, 500000.00, 17, '2026-05-19 23:12:55.000000'),
(2, 12, 500, 1000, 500000.00, 17, '2026-05-19 23:12:55.000000'),
(3, 13, 1000, 400, 400000.00, 24, '2026-05-20 05:12:12.000000'),
(4, 13, 500, 700, 350000.00, 24, '2026-05-20 05:12:12.000000'),
(5, 13, 200, 1000, 200000.00, 24, '2026-05-20 05:12:12.000000'),
(6, 13, 100, 500, 50000.00, 24, '2026-05-20 05:12:12.000000'),
(7, 14, 1000, 1000, 1000000.00, 24, '2026-05-20 07:09:38.000000');

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
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_active` bit(1) NOT NULL,
  `behavior_type` varchar(20) NOT NULL DEFAULT 'DOCUMENT_CASE'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `item_categories`
--

INSERT INTO `item_categories` (`category_id`, `category_name`, `department_id`, `sensitivity_level`, `description`, `created_at`, `is_active`, `behavior_type`) VALUES
(1, 'Cash Bundle', 1, 'CRITICAL', 'Physical cash in sealed bags for branch settlement', '2026-05-04 16:32:09', b'1', 'CASH'),
(2, 'Cheque Books', 1, 'HIGH', 'Blank cheque books for customer issuance', '2026-05-04 16:32:09', b'1', 'DOCUMENT_CASE'),
(3, 'Demand Draft', 1, 'HIGH', 'Demand draft documents for inter-branch transfer', '2026-05-04 16:32:09', b'1', 'DOCUMENT_CASE'),
(4, 'Computers', 2, 'HIGH', 'Employee laptops and Desktops', '2026-05-04 16:32:09', b'1', 'STOCK'),
(5, 'Network Equipment', 2, 'MEDIUM', 'Routers, switches, and network accessories', '2026-05-04 16:32:09', b'1', 'STOCK'),
(6, 'Office Printer', 2, 'MEDIUM', 'Laser and inkjet printers', '2026-05-04 16:32:09', b'1', 'DOCUMENT_CASE'),
(7, 'Stationery Pack', 3, 'LOW', 'General office stationery bundle', '2026-05-04 16:32:09', b'1', 'DOCUMENT_CASE'),
(8, 'Printed Forms', 3, 'LOW', 'Pre-printed official bank forms', '2026-05-04 16:32:09', b'1', 'STOCK'),
(9, 'Office Furniture', 3, 'LOW', 'Chairs, desks, and minor office items', '2026-05-04 16:32:09', b'1', 'STOCK'),
(10, 'Security Badge', 4, 'HIGH', 'Access control badges for staff', '2026-05-04 16:32:09', b'1', 'DOCUMENT_CASE'),
(11, 'CCTV Equipment', 4, 'CRITICAL', 'Surveillance cameras and recording equipment', '2026-05-04 16:32:09', b'1', 'STOCK'),
(13, 'Customer Documents', 6, 'MEDIUM', 'Documents like kyc, personal forms, etc..', '2026-05-19 04:43:09', b'1', 'DOCUMENT_CASE');

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
-- Table structure for table `stock_items`
--

CREATE TABLE `stock_items` (
  `stock_item_id` bigint(20) NOT NULL,
  `category_id` bigint(20) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `unit` varchar(30) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock_items`
--

INSERT INTO `stock_items` (`stock_item_id`, `category_id`, `item_name`, `unit`, `description`, `is_active`, `created_at`) VALUES
(1, 4, 'Laptop', 'pcs', 'Laptop used by officers', 1, '2026-05-22 06:38:27');

-- --------------------------------------------------------

--
-- Table structure for table `stock_ledger`
--

CREATE TABLE `stock_ledger` (
  `ledger_id` bigint(20) NOT NULL,
  `balance_after` int(11) NOT NULL,
  `balance_before` int(11) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `entry_type` varchar(40) NOT NULL,
  `quantity` int(11) NOT NULL,
  `reason` text DEFAULT NULL,
  `actor_id` bigint(20) DEFAULT NULL,
  `approver_id` bigint(20) DEFAULT NULL,
  `branch_id` bigint(20) NOT NULL,
  `stock_item_id` bigint(20) NOT NULL,
  `request_id` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stock_manual_adjustments`
--

CREATE TABLE `stock_manual_adjustments` (
  `adjustment_id` bigint(20) NOT NULL,
  `branch_id` bigint(20) NOT NULL,
  `stock_item_id` bigint(20) NOT NULL,
  `quantity` int(11) NOT NULL COMMENT 'Positive = credit, negative = debit',
  `reason` text NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING | APPROVED | REJECTED',
  `submitted_by_id` bigint(20) DEFAULT NULL,
  `submitted_at` datetime(6) DEFAULT NULL,
  `approved_by_id` bigint(20) DEFAULT NULL,
  `decided_at` datetime(6) DEFAULT NULL,
  `decision_note` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
  `destination_branch_id` bigint(20) DEFAULT NULL,
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
  `hq_rejection_note` longtext DEFAULT NULL,
  `requested_amount` decimal(18,2) DEFAULT NULL COMMENT 'Cash Bundle: amount requested by origin branch',
  `denominations_submitted` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Cash Bundle: whether dest branch submitted denomination breakdown',
  `stock_item_id` bigint(20) DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `transfer_requests`
--

INSERT INTO `transfer_requests` (`request_id`, `request_code`, `title`, `description`, `category_id`, `priority`, `status`, `origin_branch_id`, `origin_department_id`, `initiated_by_id`, `internal_approver_id`, `destination_branch_id`, `destination_department_id`, `dept_acceptor_id`, `final_releaser_id`, `delivery_person_id`, `picked_up_at`, `delivered_at`, `final_note`, `closed_at`, `requested_at`, `hq_approver_id`, `hq_approved_at`, `hq_rejection_note`, `requested_amount`, `denominations_submitted`, `stock_item_id`, `quantity`) VALUES
(1, 'REQ-2026-0001', 'Cash require due to shortage', 'Cash required due to shortage of cash balance at our branch. Kindly arrange cash support as soon as possible.\n', 1, 'URGENT', 'COMPLETED', 2, 1, 19, 5, 3, 1, 24, 12, 33, '2026-05-06 11:34:58', '2026-05-06 11:35:23', '', '2026-05-06 11:37:51', '2026-05-06 10:56:17', NULL, NULL, NULL, NULL, 0, NULL, NULL),
(2, 'REQ-2026-0002', 'Requestion for copy of account opening form ', 'Need a copy of the account opening form of Customer name: Tasnim Jahan (AC#1101008003478)', 8, 'NORMAL', 'COMPLETED', 4, 3, 28, 7, 5, 3, 30, 8, 33, '2026-05-10 12:02:21', '2026-05-10 12:03:18', '', '2026-05-10 12:05:30', '2026-05-10 11:48:11', NULL, NULL, NULL, NULL, 0, NULL, NULL),
(3, 'REQ-2026-0003', 'Requisation for account opening form', 'as the customer x moved his account from your branch to our one.. send all of his physical document here', 8, 'NORMAL', 'COMPLETED', 6, 3, 32, 9, 7, 3, 40, 40, 34, '2026-05-17 11:46:21', '2026-05-17 11:46:25', '', '2026-05-17 12:09:17', '2026-05-15 14:15:22', 38, '2026-05-15 20:17:45.000000', NULL, NULL, 0, NULL, NULL),
(4, 'REQ-2026-0004', 'need demand draft', '', 3, 'HIGH', 'REJECTED_BY_HQ', 1, 1, 14, 2, 2, 1, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-19 05:23:14', '2026-05-17 14:44:04', 38, '2026-05-19 11:23:14.000000', 'invalid request', NULL, 0, NULL, NULL),
(5, 'REQ-2026-0005', 'test', 'test', 2, 'URGENT', 'PENDING_ASSIGNMENT', 3, 1, 24, 6, 2, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-17 23:48:06', 38, '2026-05-18 05:50:13.000000', NULL, NULL, 0, NULL, NULL),
(10, 'REQ-2026-0006', 'kyc', 'kyc for 110100', 13, 'URGENT', 'PENDING_ASSIGNMENT', 3, 6, 41, 12, 2, 6, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-19 05:21:04', 38, '2026-05-19 11:27:55.000000', NULL, NULL, 0, NULL, NULL),
(11, 'REQ-2026-0007', 'FDR opening form', 'need supply of 100-200 blank FDR opening form ', 8, 'NORMAL', 'PENDING_HQ_APPROVAL', 7, 3, 39, 42, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'not available', NULL, '2026-05-19 06:42:37', NULL, NULL, NULL, NULL, 0, NULL, NULL),
(12, 'REQ-2026-0008', 'Cash Require', 'need cash due to shortage', 1, 'URGENT', 'COMPLETED', 2, 1, 19, 3, 1, 1, 17, 2, 33, '2026-05-19 17:14:13', '2026-05-19 17:14:17', '', '2026-05-20 13:15:45', '2026-05-19 17:09:52', 38, '2026-05-19 23:11:12.000000', NULL, 1000000.00, 1, NULL, NULL),
(13, 'REQ-2026-0009', 'Cash requirement', 'Cash requirement due to shortage', 1, 'URGENT', 'COMPLETED', 2, 1, 22, 11, 3, 1, 24, 6, 36, '2026-05-19 23:13:49', '2026-05-19 23:13:51', '', '2026-05-19 23:14:58', '2026-05-19 23:04:28', 38, '2026-05-20 05:10:26.000000', NULL, 1000000.00, 1, NULL, NULL),
(14, 'REQ-2026-0010', 'cash shortage', 'test', 1, 'URGENT', 'COMPLETED', 2, NULL, 5, 5, 3, 1, 24, 6, 33, '2026-05-20 01:11:41', '2026-05-20 01:11:46', '', '2026-05-20 01:16:09', '2026-05-20 01:06:43', 38, '2026-05-20 07:08:44.000000', NULL, 1000000.00, 1, NULL, NULL);

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
(37, 'DRV-005', 'Biplob Kumar Das', 'drv5@jamunabank.com', '01755551005', '75K3eLr+dx6JJFuJ7LwIpEpOFmwGZZkRiB84PURz6U8=', 6, NULL, NULL, 0, 1, '2026-05-04 16:32:09', '2026-05-04 16:56:26', NULL),
(38, 'EMP-501', 'Rifat Akter', 'rifat@jamunabank.com.bd', '+8801824844522', '75K3eLr+dx6JJFuJ7LwIpEpOFmwGZZkRiB84PURz6U8=', 7, 1, 7, 1, 1, '2026-05-15 14:05:01', '2026-05-15 14:05:01', NULL),
(39, 'EMP-502', 'Rafia Sultana', 'rafia@jamunabank.com.bd', '+8801824844522', '75K3eLr+dx6JJFuJ7LwIpEpOFmwGZZkRiB84PURz6U8=', 5, 7, 3, 1, 1, '2026-05-15 14:09:09', '2026-05-15 14:09:09', NULL),
(40, 'EMP-503', 'Mizanur Rahaman Mizan', 'mizanur@jamunabank.com.bd', '01824844522', '75K3eLr+dx6JJFuJ7LwIpEpOFmwGZZkRiB84PURz6U8=', 3, 7, NULL, 1, 1, '2026-05-15 14:10:06', '2026-05-15 14:10:06', NULL),
(41, 'EMP-509', 'Robai Adnan', 'adnan@jamunabank.bd', '01922333345', '75K3eLr+dx6JJFuJ7LwIpEpOFmwGZZkRiB84PURz6U8=', 5, 3, 6, 1, 1, '2026-05-19 05:14:26', '2026-05-19 05:14:26', NULL),
(42, 'EMP-510', 'Salam Mia', 'salam@jb.plc', '01922333345', '75K3eLr+dx6JJFuJ7LwIpEpOFmwGZZkRiB84PURz6U8=', 2, 7, NULL, 1, 1, '2026-05-19 06:50:07', '2026-05-19 06:50:07', NULL),
(43, 'EMP-190', 'Ahnab Tahmid', 'ahnab.fr@jamunabank.bd', '01922333345', '75K3eLr+dx6JJFuJ7LwIpEpOFmwGZZkRiB84PURz6U8=', 5, 7, 1, 1, 1, '2026-05-19 22:55:01', '2026-05-19 22:55:01', NULL);

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
-- Indexes for table `branch_cash_balance`
--
ALTER TABLE `branch_cash_balance`
  ADD PRIMARY KEY (`branch_id`);

--
-- Indexes for table `branch_departments`
--
ALTER TABLE `branch_departments`
  ADD PRIMARY KEY (`branch_id`,`department_id`),
  ADD KEY `department_id` (`department_id`);

--
-- Indexes for table `branch_stock_balance`
--
ALTER TABLE `branch_stock_balance`
  ADD PRIMARY KEY (`balance_id`),
  ADD UNIQUE KEY `UKivh013blyh301634e8kyfg5vp` (`branch_id`,`stock_item_id`),
  ADD KEY `FKmigyh452itw52lp7kwotr84fu` (`stock_item_id`);

--
-- Indexes for table `cash_ledger`
--
ALTER TABLE `cash_ledger`
  ADD PRIMARY KEY (`ledger_id`),
  ADD KEY `fk_cl_actor` (`actor_id`),
  ADD KEY `fk_cl_approver` (`approver_id`),
  ADD KEY `idx_cl_branch` (`branch_id`),
  ADD KEY `idx_cl_request` (`request_id`),
  ADD KEY `idx_cl_created` (`created_at`);

--
-- Indexes for table `cash_manual_adjustments`
--
ALTER TABLE `cash_manual_adjustments`
  ADD PRIMARY KEY (`adjustment_id`),
  ADD KEY `fk_cma_submitter` (`submitted_by_id`),
  ADD KEY `fk_cma_approver` (`approved_by_id`),
  ADD KEY `idx_cma_branch` (`branch_id`),
  ADD KEY `idx_cma_status` (`status`);

--
-- Indexes for table `cash_transfer_denominations`
--
ALTER TABLE `cash_transfer_denominations`
  ADD PRIMARY KEY (`denomination_id`),
  ADD KEY `fk_ctd_submitter` (`submitted_by_id`),
  ADD KEY `idx_ctd_request` (`request_id`);

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
-- Indexes for table `stock_items`
--
ALTER TABLE `stock_items`
  ADD PRIMARY KEY (`stock_item_id`),
  ADD KEY `fk_si_category` (`category_id`);

--
-- Indexes for table `stock_ledger`
--
ALTER TABLE `stock_ledger`
  ADD PRIMARY KEY (`ledger_id`),
  ADD KEY `FKmswfq01ompv36yjf6nqr2gwq1` (`actor_id`),
  ADD KEY `FKsowxm97irx3nqgignonad8j5h` (`approver_id`),
  ADD KEY `FKecny9kvgl34nbnpjichdgvynx` (`branch_id`),
  ADD KEY `FK33jd2m8tvy2qc5xpdwtj7v12j` (`stock_item_id`),
  ADD KEY `FKa23sqbl0e1x50s6kmxnurfqhr` (`request_id`);

--
-- Indexes for table `stock_manual_adjustments`
--
ALTER TABLE `stock_manual_adjustments`
  ADD PRIMARY KEY (`adjustment_id`),
  ADD KEY `fk_sma_branch` (`branch_id`),
  ADD KEY `fk_sma_stock_item` (`stock_item_id`),
  ADD KEY `fk_sma_submitter` (`submitted_by_id`),
  ADD KEY `fk_sma_approver` (`approved_by_id`);

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
  ADD KEY `fk_tr_hq_approver` (`hq_approver_id`),
  ADD KEY `fk_tr_stock_item` (`stock_item_id`);

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
  MODIFY `audit_id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=66;

--
-- AUTO_INCREMENT for table `branches`
--
ALTER TABLE `branches`
  MODIFY `branch_id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `branch_stock_balance`
--
ALTER TABLE `branch_stock_balance`
  MODIFY `balance_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `cash_ledger`
--
ALTER TABLE `cash_ledger`
  MODIFY `ledger_id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `cash_manual_adjustments`
--
ALTER TABLE `cash_manual_adjustments`
  MODIFY `adjustment_id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `cash_transfer_denominations`
--
ALTER TABLE `cash_transfer_denominations`
  MODIFY `denomination_id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `department_id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `item_categories`
--
ALTER TABLE `item_categories`
  MODIFY `category_id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `role_id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `stock_items`
--
ALTER TABLE `stock_items`
  MODIFY `stock_item_id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `stock_ledger`
--
ALTER TABLE `stock_ledger`
  MODIFY `ledger_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stock_manual_adjustments`
--
ALTER TABLE `stock_manual_adjustments`
  MODIFY `adjustment_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `transfer_requests`
--
ALTER TABLE `transfer_requests`
  MODIFY `request_id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

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
-- Constraints for table `branch_cash_balance`
--
ALTER TABLE `branch_cash_balance`
  ADD CONSTRAINT `fk_bcb_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`);

--
-- Constraints for table `branch_departments`
--
ALTER TABLE `branch_departments`
  ADD CONSTRAINT `branch_departments_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`),
  ADD CONSTRAINT `branch_departments_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`);

--
-- Constraints for table `branch_stock_balance`
--
ALTER TABLE `branch_stock_balance`
  ADD CONSTRAINT `FKjj3kuofjfk4rkhgdh7r5mhqsj` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`),
  ADD CONSTRAINT `FKmigyh452itw52lp7kwotr84fu` FOREIGN KEY (`stock_item_id`) REFERENCES `stock_items` (`stock_item_id`);

--
-- Constraints for table `cash_ledger`
--
ALTER TABLE `cash_ledger`
  ADD CONSTRAINT `fk_cl_actor` FOREIGN KEY (`actor_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_cl_approver` FOREIGN KEY (`approver_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_cl_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`),
  ADD CONSTRAINT `fk_cl_request` FOREIGN KEY (`request_id`) REFERENCES `transfer_requests` (`request_id`) ON DELETE SET NULL;

--
-- Constraints for table `cash_manual_adjustments`
--
ALTER TABLE `cash_manual_adjustments`
  ADD CONSTRAINT `fk_cma_approver` FOREIGN KEY (`approved_by_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_cma_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`),
  ADD CONSTRAINT `fk_cma_submitter` FOREIGN KEY (`submitted_by_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `cash_transfer_denominations`
--
ALTER TABLE `cash_transfer_denominations`
  ADD CONSTRAINT `fk_ctd_request` FOREIGN KEY (`request_id`) REFERENCES `transfer_requests` (`request_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_ctd_submitter` FOREIGN KEY (`submitted_by_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `item_categories`
--
ALTER TABLE `item_categories`
  ADD CONSTRAINT `item_categories_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`);

--
-- Constraints for table `stock_items`
--
ALTER TABLE `stock_items`
  ADD CONSTRAINT `fk_si_category` FOREIGN KEY (`category_id`) REFERENCES `item_categories` (`category_id`);

--
-- Constraints for table `stock_ledger`
--
ALTER TABLE `stock_ledger`
  ADD CONSTRAINT `FK33jd2m8tvy2qc5xpdwtj7v12j` FOREIGN KEY (`stock_item_id`) REFERENCES `stock_items` (`stock_item_id`),
  ADD CONSTRAINT `FKa23sqbl0e1x50s6kmxnurfqhr` FOREIGN KEY (`request_id`) REFERENCES `transfer_requests` (`request_id`),
  ADD CONSTRAINT `FKecny9kvgl34nbnpjichdgvynx` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`),
  ADD CONSTRAINT `FKmswfq01ompv36yjf6nqr2gwq1` FOREIGN KEY (`actor_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `FKsowxm97irx3nqgignonad8j5h` FOREIGN KEY (`approver_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `stock_manual_adjustments`
--
ALTER TABLE `stock_manual_adjustments`
  ADD CONSTRAINT `fk_sma_approver` FOREIGN KEY (`approved_by_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_sma_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`),
  ADD CONSTRAINT `fk_sma_stock_item` FOREIGN KEY (`stock_item_id`) REFERENCES `stock_items` (`stock_item_id`),
  ADD CONSTRAINT `fk_sma_submitter` FOREIGN KEY (`submitted_by_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `transfer_requests`
--
ALTER TABLE `transfer_requests`
  ADD CONSTRAINT `fk_tr_hq_approver` FOREIGN KEY (`hq_approver_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `fk_tr_stock_item` FOREIGN KEY (`stock_item_id`) REFERENCES `stock_items` (`stock_item_id`),
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
