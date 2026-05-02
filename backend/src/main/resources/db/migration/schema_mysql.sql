-- MySQL compatible schema
-- Order is important due to foreign key dependencies

CREATE TABLE roles (
  role_id BIGINT NOT NULL AUTO_INCREMENT,
  role_name VARCHAR(255) NOT NULL UNIQUE,
  role_level INT NOT NULL CHECK (role_level >= 1),
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id)
);

CREATE TABLE branches (
  branch_id BIGINT NOT NULL AUTO_INCREMENT,
  branch_code VARCHAR(255) NOT NULL UNIQUE,
  branch_name VARCHAR(255) NOT NULL,
  branch_type VARCHAR(255) NOT NULL,
  district VARCHAR(255) NOT NULL,
  division VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  email VARCHAR(255),
  PRIMARY KEY (branch_id)
);

CREATE TABLE item_categories (
  category_id BIGINT NOT NULL AUTO_INCREMENT,
  category_name VARCHAR(255) NOT NULL UNIQUE,
  requires_dual_verification BOOLEAN NOT NULL DEFAULT FALSE,
  requires_hq_approval BOOLEAN NOT NULL DEFAULT FALSE,
  sensitivity_level VARCHAR(255) NOT NULL DEFAULT 'LOW',
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (category_id)
);

CREATE TABLE permissions (
  permission_id BIGINT NOT NULL AUTO_INCREMENT,
  permission_name VARCHAR(255) NOT NULL UNIQUE,
  module VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (permission_id)
);

CREATE TABLE role_permissions (
  role_permission_id BIGINT NOT NULL AUTO_INCREMENT,
  role_id BIGINT NOT NULL,
  permission_id BIGINT NOT NULL,
  PRIMARY KEY (role_permission_id),
  FOREIGN KEY (permission_id) REFERENCES permissions(permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

CREATE TABLE departments (
  department_id BIGINT NOT NULL AUTO_INCREMENT,
  department_name VARCHAR(255) NOT NULL,
  branch_id BIGINT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (department_id),
  FOREIGN KEY (branch_id) REFERENCES branches(branch_id)
);

CREATE TABLE users (
  user_id BIGINT NOT NULL AUTO_INCREMENT,
  employee_id VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone_number VARCHAR(255),
  password_hash TEXT NOT NULL,
  role_id BIGINT NOT NULL,
  branch_id BIGINT NOT NULL,
  department_id BIGINT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP NULL,
  PRIMARY KEY (user_id),
  FOREIGN KEY (branch_id) REFERENCES branches(branch_id),
  FOREIGN KEY (department_id) REFERENCES departments(department_id),
  FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

CREATE TABLE transfer_requests (
  request_id BIGINT NOT NULL AUTO_INCREMENT,
  request_code VARCHAR(255) NOT NULL UNIQUE,
  category_id BIGINT NOT NULL,
  request_type VARCHAR(255) NOT NULL,
  origin_branch_id BIGINT NOT NULL,
  destination_branch_id BIGINT NOT NULL,
  initiated_by BIGINT NOT NULL,
  priority VARCHAR(255) NOT NULL DEFAULT 'NORMAL',
  status VARCHAR(255) NOT NULL DEFAULT 'DRAFT',
  title VARCHAR(255) NOT NULL,
  description TEXT,
  requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expected_delivery_date DATE,
  closed_at TIMESTAMP NULL,
  destination_department_id BIGINT,
  origin_department_id BIGINT,
  PRIMARY KEY (request_id),
  FOREIGN KEY (destination_department_id) REFERENCES departments(department_id),
  FOREIGN KEY (origin_department_id) REFERENCES departments(department_id),
  FOREIGN KEY (category_id) REFERENCES item_categories(category_id),
  FOREIGN KEY (destination_branch_id) REFERENCES branches(branch_id),
  FOREIGN KEY (origin_branch_id) REFERENCES branches(branch_id),
  FOREIGN KEY (initiated_by) REFERENCES users(user_id)
);

CREATE TABLE approval_chains (
  chain_id BIGINT NOT NULL AUTO_INCREMENT,
  category_id BIGINT NOT NULL,
  priority_level VARCHAR(255) NOT NULL DEFAULT 'NORMAL',
  step_number INT NOT NULL CHECK (step_number >= 1),
  required_role_id BIGINT NOT NULL,
  approval_scope VARCHAR(255) NOT NULL,
  description TEXT,
  PRIMARY KEY (chain_id),
  FOREIGN KEY (category_id) REFERENCES item_categories(category_id),
  FOREIGN KEY (required_role_id) REFERENCES roles(role_id)
);

CREATE TABLE approval_logs (
  approval_log_id BIGINT NOT NULL AUTO_INCREMENT,
  request_id BIGINT NOT NULL,
  step_number INT NOT NULL CHECK (step_number >= 1),
  approver_id BIGINT NOT NULL,
  action VARCHAR(255) NOT NULL,
  comments TEXT,
  acted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(255),
  PRIMARY KEY (approval_log_id),
  FOREIGN KEY (request_id) REFERENCES transfer_requests(request_id),
  FOREIGN KEY (approver_id) REFERENCES users(user_id)
);

CREATE TABLE audit_logs (
  audit_id BIGINT NOT NULL AUTO_INCREMENT,
  request_id BIGINT,
  actor_user_id BIGINT,
  action_type VARCHAR(255) NOT NULL,
  entity_name VARCHAR(255) NOT NULL,
  entity_id BIGINT NOT NULL,
  old_value JSON,
  new_value JSON,
  ip_address VARCHAR(255),
  user_agent TEXT,
  acted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (audit_id),
  FOREIGN KEY (request_id) REFERENCES transfer_requests(request_id),
  FOREIGN KEY (actor_user_id) REFERENCES users(user_id)
);

CREATE TABLE cash_transfer_details (
  cash_detail_id BIGINT NOT NULL AUTO_INCREMENT,
  request_id BIGINT NOT NULL UNIQUE,
  total_amount_bdt DECIMAL(15,2) NOT NULL CHECK (total_amount_bdt > 0),
  denomination_1000 INT NOT NULL DEFAULT 0 CHECK (denomination_1000 >= 0),
  denomination_500 INT NOT NULL DEFAULT 0 CHECK (denomination_500 >= 0),
  denomination_200 INT NOT NULL DEFAULT 0 CHECK (denomination_200 >= 0),
  denomination_100 INT NOT NULL DEFAULT 0 CHECK (denomination_100 >= 0),
  denomination_50 INT NOT NULL DEFAULT 0 CHECK (denomination_50 >= 0),
  denomination_20 INT NOT NULL DEFAULT 0 CHECK (denomination_20 >= 0),
  denomination_10 INT NOT NULL DEFAULT 0 CHECK (denomination_10 >= 0),
  denomination_5 INT NOT NULL DEFAULT 0 CHECK (denomination_5 >= 0),
  denomination_2 INT NOT NULL DEFAULT 0 CHECK (denomination_2 >= 0),
  denomination_1 INT NOT NULL DEFAULT 0 CHECK (denomination_1 >= 0),
  sealed_bag_count INT NOT NULL DEFAULT 0 CHECK (sealed_bag_count >= 0),
  bag_serial_numbers TEXT,
  cit_agent_name VARCHAR(255),
  cit_company VARCHAR(255),
  PRIMARY KEY (cash_detail_id),
  FOREIGN KEY (request_id) REFERENCES transfer_requests(request_id)
);

CREATE TABLE dispatch_records (
  dispatch_id BIGINT NOT NULL AUTO_INCREMENT,
  request_id BIGINT NOT NULL UNIQUE,
  dispatched_by BIGINT NOT NULL,
  dispatched_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  carrier_type VARCHAR(255) NOT NULL,
  carrier_name VARCHAR(255) NOT NULL,
  carrier_phone VARCHAR(255),
  vehicle_number VARCHAR(255),
  estimated_arrival TIMESTAMP NULL,
  dispatch_notes TEXT,
  witness_user_id BIGINT,
  PRIMARY KEY (dispatch_id),
  FOREIGN KEY (request_id) REFERENCES transfer_requests(request_id),
  FOREIGN KEY (witness_user_id) REFERENCES users(user_id),
  FOREIGN KEY (dispatched_by) REFERENCES users(user_id)
);

CREATE TABLE escalation_logs (
  escalation_id BIGINT NOT NULL AUTO_INCREMENT,
  request_id BIGINT NOT NULL,
  escalated_from_user_id BIGINT,
  escalated_to_user_id BIGINT NOT NULL,
  reason VARCHAR(255) NOT NULL,
  escalated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  resolution_notes TEXT,
  PRIMARY KEY (escalation_id),
  FOREIGN KEY (request_id) REFERENCES transfer_requests(request_id),
  FOREIGN KEY (escalated_from_user_id) REFERENCES users(user_id),
  FOREIGN KEY (escalated_to_user_id) REFERENCES users(user_id)
);

CREATE TABLE notifications (
  notification_id BIGINT NOT NULL AUTO_INCREMENT,
  recipient_user_id BIGINT NOT NULL,
  request_id BIGINT,
  type VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL,
  PRIMARY KEY (notification_id),
  FOREIGN KEY (request_id) REFERENCES transfer_requests(request_id),
  FOREIGN KEY (recipient_user_id) REFERENCES users(user_id)
);

CREATE TABLE receipt_records (
  receipt_id BIGINT NOT NULL AUTO_INCREMENT,
  request_id BIGINT NOT NULL UNIQUE,
  received_by BIGINT NOT NULL,
  received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  condition_noted VARCHAR(255) NOT NULL,
  receiver_notes TEXT,
  origin_confirmation_by BIGINT,
  origin_confirmed_at TIMESTAMP NULL,
  destination_confirmation_by BIGINT,
  destination_confirmed_at TIMESTAMP NULL,
  dual_verification_complete BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (receipt_id),
  FOREIGN KEY (request_id) REFERENCES transfer_requests(request_id),
  FOREIGN KEY (destination_confirmation_by) REFERENCES users(user_id),
  FOREIGN KEY (origin_confirmation_by) REFERENCES users(user_id),
  FOREIGN KEY (received_by) REFERENCES users(user_id)
);

CREATE TABLE sla_policies (
  sla_id BIGINT NOT NULL AUTO_INCREMENT,
  category_id BIGINT NOT NULL,
  priority_level VARCHAR(255) NOT NULL,
  max_approval_hours INT NOT NULL CHECK (max_approval_hours > 0),
  max_transit_hours INT NOT NULL CHECK (max_transit_hours > 0),
  max_confirmation_hours INT NOT NULL CHECK (max_confirmation_hours > 0),
  escalation_role_id BIGINT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (sla_id),
  FOREIGN KEY (category_id) REFERENCES item_categories(category_id),
  FOREIGN KEY (escalation_role_id) REFERENCES roles(role_id)
);

CREATE TABLE transfer_items (
  item_id BIGINT NOT NULL AUTO_INCREMENT,
  request_id BIGINT NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  item_description TEXT,
  quantity DECIMAL(15,2) NOT NULL CHECK (quantity > 0),
  unit VARCHAR(255) NOT NULL,
  serial_number VARCHAR(255),
  condition_on_send VARCHAR(255) NOT NULL DEFAULT 'GOOD',
  condition_on_receive VARCHAR(255),
  notes TEXT,
  PRIMARY KEY (item_id),
  FOREIGN KEY (request_id) REFERENCES transfer_requests(request_id)
);

CREATE TABLE transit_checkpoints (
  checkpoint_id BIGINT NOT NULL AUTO_INCREMENT,
  dispatch_id BIGINT NOT NULL,
  checked_by BIGINT NOT NULL,
  checkpoint_location VARCHAR(255) NOT NULL,
  status VARCHAR(255) NOT NULL,
  checked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  PRIMARY KEY (checkpoint_id),
  FOREIGN KEY (dispatch_id) REFERENCES dispatch_records(dispatch_id),
  FOREIGN KEY (checked_by) REFERENCES users(user_id)
);
