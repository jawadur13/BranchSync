-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.approval_chains (
  chain_id bigint NOT NULL DEFAULT nextval('approval_chains_chain_id_seq'::regclass),
  category_id bigint NOT NULL,
  priority_level character varying NOT NULL DEFAULT 'NORMAL'::priority_enum,
  step_number integer NOT NULL CHECK (step_number >= 1),
  required_role_id bigint NOT NULL,
  approval_scope character varying NOT NULL,
  description text,
  CONSTRAINT approval_chains_pkey PRIMARY KEY (chain_id),
  CONSTRAINT approval_chains_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.item_categories(category_id),
  CONSTRAINT approval_chains_required_role_id_fkey FOREIGN KEY (required_role_id) REFERENCES public.roles(role_id)
);
CREATE TABLE public.approval_logs (
  approval_log_id bigint NOT NULL DEFAULT nextval('approval_logs_approval_log_id_seq'::regclass),
  request_id bigint NOT NULL,
  step_number integer NOT NULL CHECK (step_number >= 1),
  approver_id bigint NOT NULL,
  action character varying NOT NULL,
  comments text,
  acted_at timestamp with time zone NOT NULL DEFAULT now(),
  ip_address character varying,
  CONSTRAINT approval_logs_pkey PRIMARY KEY (approval_log_id),
  CONSTRAINT approval_logs_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.transfer_requests(request_id),
  CONSTRAINT approval_logs_approver_id_fkey FOREIGN KEY (approver_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.audit_logs (
  audit_id bigint NOT NULL DEFAULT nextval('audit_logs_audit_id_seq'::regclass),
  request_id bigint,
  actor_user_id bigint,
  action_type character varying NOT NULL,
  entity_name character varying NOT NULL,
  entity_id bigint NOT NULL,
  old_value jsonb,
  new_value jsonb,
  ip_address character varying,
  user_agent text,
  acted_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (audit_id),
  CONSTRAINT audit_logs_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.transfer_requests(request_id),
  CONSTRAINT audit_logs_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.branches (
  branch_id bigint NOT NULL DEFAULT nextval('branches_branch_id_seq'::regclass),
  branch_code character varying NOT NULL UNIQUE,
  branch_name character varying NOT NULL,
  branch_type character varying NOT NULL,
  district character varying NOT NULL,
  division character varying NOT NULL,
  address text NOT NULL,
  phone character varying,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT branches_pkey PRIMARY KEY (branch_id)
);
CREATE TABLE public.cash_transfer_details (
  cash_detail_id bigint NOT NULL DEFAULT nextval('cash_transfer_details_cash_detail_id_seq'::regclass),
  request_id bigint NOT NULL UNIQUE,
  total_amount_bdt numeric NOT NULL CHECK (total_amount_bdt > 0::numeric),
  denomination_1000 integer NOT NULL DEFAULT 0 CHECK (denomination_1000 >= 0),
  denomination_500 integer NOT NULL DEFAULT 0 CHECK (denomination_500 >= 0),
  denomination_200 integer NOT NULL DEFAULT 0 CHECK (denomination_200 >= 0),
  denomination_100 integer NOT NULL DEFAULT 0 CHECK (denomination_100 >= 0),
  denomination_50 integer NOT NULL DEFAULT 0 CHECK (denomination_50 >= 0),
  denomination_20 integer NOT NULL DEFAULT 0 CHECK (denomination_20 >= 0),
  denomination_10 integer NOT NULL DEFAULT 0 CHECK (denomination_10 >= 0),
  denomination_5 integer NOT NULL DEFAULT 0 CHECK (denomination_5 >= 0),
  denomination_2 integer NOT NULL DEFAULT 0 CHECK (denomination_2 >= 0),
  denomination_1 integer NOT NULL DEFAULT 0 CHECK (denomination_1 >= 0),
  sealed_bag_count integer NOT NULL DEFAULT 0 CHECK (sealed_bag_count >= 0),
  bag_serial_numbers text,
  cit_agent_name character varying,
  cit_company character varying,
  CONSTRAINT cash_transfer_details_pkey PRIMARY KEY (cash_detail_id),
  CONSTRAINT cash_transfer_details_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.transfer_requests(request_id)
);
CREATE TABLE public.departments (
  department_id bigint NOT NULL DEFAULT nextval('departments_department_id_seq'::regclass),
  department_name character varying NOT NULL,
  branch_id bigint,
  head_user_id bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT departments_pkey PRIMARY KEY (department_id),
  CONSTRAINT departments_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id),
  CONSTRAINT departments_head_user_id_fkey FOREIGN KEY (head_user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.dispatch_records (
  dispatch_id bigint NOT NULL DEFAULT nextval('dispatch_records_dispatch_id_seq'::regclass),
  request_id bigint NOT NULL UNIQUE,
  dispatched_by bigint NOT NULL,
  dispatched_at timestamp with time zone NOT NULL DEFAULT now(),
  carrier_type character varying NOT NULL,
  carrier_name character varying NOT NULL,
  carrier_phone character varying,
  vehicle_number character varying,
  estimated_arrival timestamp with time zone,
  dispatch_notes text,
  witness_user_id bigint,
  CONSTRAINT dispatch_records_pkey PRIMARY KEY (dispatch_id),
  CONSTRAINT dispatch_records_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.transfer_requests(request_id),
  CONSTRAINT dispatch_records_witness_user_id_fkey FOREIGN KEY (witness_user_id) REFERENCES public.users(user_id),
  CONSTRAINT dispatch_records_dispatched_by_fkey FOREIGN KEY (dispatched_by) REFERENCES public.users(user_id)
);
CREATE TABLE public.escalation_logs (
  escalation_id bigint NOT NULL DEFAULT nextval('escalation_logs_escalation_id_seq'::regclass),
  request_id bigint NOT NULL,
  escalated_from_user_id bigint,
  escalated_to_user_id bigint NOT NULL,
  reason character varying NOT NULL,
  escalated_at timestamp with time zone NOT NULL DEFAULT now(),
  resolved_at timestamp with time zone,
  resolution_notes text,
  CONSTRAINT escalation_logs_pkey PRIMARY KEY (escalation_id),
  CONSTRAINT escalation_logs_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.transfer_requests(request_id),
  CONSTRAINT escalation_logs_escalated_from_user_id_fkey FOREIGN KEY (escalated_from_user_id) REFERENCES public.users(user_id),
  CONSTRAINT escalation_logs_escalated_to_user_id_fkey FOREIGN KEY (escalated_to_user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.item_categories (
  category_id bigint NOT NULL DEFAULT nextval('item_categories_category_id_seq'::regclass),
  category_name character varying NOT NULL UNIQUE,
  requires_dual_verification boolean NOT NULL DEFAULT false,
  requires_hq_approval boolean NOT NULL DEFAULT false,
  sensitivity_level character varying NOT NULL DEFAULT 'LOW'::sensitivity_level_enum,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT item_categories_pkey PRIMARY KEY (category_id)
);
CREATE TABLE public.notifications (
  notification_id bigint NOT NULL DEFAULT nextval('notifications_notification_id_seq'::regclass),
  recipient_user_id bigint NOT NULL,
  request_id bigint,
  type character varying NOT NULL,
  title character varying NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  read_at timestamp with time zone,
  CONSTRAINT notifications_pkey PRIMARY KEY (notification_id),
  CONSTRAINT notifications_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.transfer_requests(request_id),
  CONSTRAINT notifications_recipient_user_id_fkey FOREIGN KEY (recipient_user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.permissions (
  permission_id bigint NOT NULL DEFAULT nextval('permissions_permission_id_seq'::regclass),
  permission_name character varying NOT NULL UNIQUE,
  module character varying NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT permissions_pkey PRIMARY KEY (permission_id)
);
CREATE TABLE public.receipt_records (
  receipt_id bigint NOT NULL DEFAULT nextval('receipt_records_receipt_id_seq'::regclass),
  request_id bigint NOT NULL UNIQUE,
  received_by bigint NOT NULL,
  received_at timestamp with time zone NOT NULL DEFAULT now(),
  condition_noted character varying NOT NULL,
  receiver_notes text,
  origin_confirmation_by bigint,
  origin_confirmed_at timestamp with time zone,
  destination_confirmation_by bigint,
  destination_confirmed_at timestamp with time zone,
  dual_verification_complete boolean NOT NULL DEFAULT false,
  CONSTRAINT receipt_records_pkey PRIMARY KEY (receipt_id),
  CONSTRAINT receipt_records_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.transfer_requests(request_id),
  CONSTRAINT receipt_records_destination_confirmation_by_fkey FOREIGN KEY (destination_confirmation_by) REFERENCES public.users(user_id),
  CONSTRAINT receipt_records_origin_confirmation_by_fkey FOREIGN KEY (origin_confirmation_by) REFERENCES public.users(user_id),
  CONSTRAINT receipt_records_received_by_fkey FOREIGN KEY (received_by) REFERENCES public.users(user_id)
);
CREATE TABLE public.role_permissions (
  role_permission_id bigint NOT NULL DEFAULT nextval('role_permissions_role_permission_id_seq'::regclass),
  role_id bigint NOT NULL,
  permission_id bigint NOT NULL,
  CONSTRAINT role_permissions_pkey PRIMARY KEY (role_permission_id),
  CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(permission_id),
  CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(role_id)
);
CREATE TABLE public.roles (
  role_id bigint NOT NULL DEFAULT nextval('roles_role_id_seq'::regclass),
  role_name character varying NOT NULL UNIQUE,
  role_level integer NOT NULL CHECK (role_level >= 1),
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT roles_pkey PRIMARY KEY (role_id)
);
CREATE TABLE public.sla_policies (
  sla_id bigint NOT NULL DEFAULT nextval('sla_policies_sla_id_seq'::regclass),
  category_id bigint NOT NULL,
  priority_level character varying NOT NULL,
  max_approval_hours integer NOT NULL CHECK (max_approval_hours > 0),
  max_transit_hours integer NOT NULL CHECK (max_transit_hours > 0),
  max_confirmation_hours integer NOT NULL CHECK (max_confirmation_hours > 0),
  escalation_role_id bigint NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT sla_policies_pkey PRIMARY KEY (sla_id),
  CONSTRAINT sla_policies_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.item_categories(category_id),
  CONSTRAINT sla_policies_escalation_role_id_fkey FOREIGN KEY (escalation_role_id) REFERENCES public.roles(role_id)
);
CREATE TABLE public.transfer_items (
  item_id bigint NOT NULL DEFAULT nextval('transfer_items_item_id_seq'::regclass),
  request_id bigint NOT NULL,
  item_name character varying NOT NULL,
  item_description text,
  quantity numeric NOT NULL CHECK (quantity > 0::numeric),
  unit character varying NOT NULL,
  serial_number character varying,
  condition_on_send character varying NOT NULL DEFAULT 'GOOD'::condition_enum,
  condition_on_receive character varying,
  notes text,
  CONSTRAINT transfer_items_pkey PRIMARY KEY (item_id),
  CONSTRAINT transfer_items_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.transfer_requests(request_id)
);
CREATE TABLE public.transfer_requests (
  request_id bigint NOT NULL DEFAULT nextval('transfer_requests_request_id_seq'::regclass),
  request_code character varying NOT NULL UNIQUE,
  category_id bigint NOT NULL,
  request_type character varying NOT NULL,
  origin_branch_id bigint NOT NULL,
  destination_branch_id bigint NOT NULL,
  initiated_by bigint NOT NULL,
  priority character varying NOT NULL DEFAULT 'NORMAL'::priority_enum,
  status character varying NOT NULL DEFAULT 'DRAFT'::transfer_status_enum,
  title character varying NOT NULL,
  description text,
  requested_at timestamp with time zone NOT NULL DEFAULT now(),
  expected_delivery_date date,
  closed_at timestamp with time zone,
  CONSTRAINT transfer_requests_pkey PRIMARY KEY (request_id),
  CONSTRAINT transfer_requests_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.item_categories(category_id),
  CONSTRAINT transfer_requests_destination_branch_id_fkey FOREIGN KEY (destination_branch_id) REFERENCES public.branches(branch_id),
  CONSTRAINT transfer_requests_origin_branch_id_fkey FOREIGN KEY (origin_branch_id) REFERENCES public.branches(branch_id),
  CONSTRAINT transfer_requests_initiated_by_fkey FOREIGN KEY (initiated_by) REFERENCES public.users(user_id)
);
CREATE TABLE public.transit_checkpoints (
  checkpoint_id bigint NOT NULL DEFAULT nextval('transit_checkpoints_checkpoint_id_seq'::regclass),
  dispatch_id bigint NOT NULL,
  checked_by bigint NOT NULL,
  checkpoint_location character varying NOT NULL,
  status character varying NOT NULL,
  checked_at timestamp with time zone NOT NULL DEFAULT now(),
  notes text,
  CONSTRAINT transit_checkpoints_pkey PRIMARY KEY (checkpoint_id),
  CONSTRAINT transit_checkpoints_dispatch_id_fkey FOREIGN KEY (dispatch_id) REFERENCES public.dispatch_records(dispatch_id),
  CONSTRAINT transit_checkpoints_checked_by_fkey FOREIGN KEY (checked_by) REFERENCES public.users(user_id)
);
CREATE TABLE public.users (
  user_id bigint NOT NULL DEFAULT nextval('users_user_id_seq'::regclass),
  employee_id character varying NOT NULL UNIQUE,
  full_name character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  phone_number character varying,
  password_hash text NOT NULL,
  role_id bigint NOT NULL,
  branch_id bigint NOT NULL,
  department_id bigint,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  last_login_at timestamp with time zone,
  CONSTRAINT users_pkey PRIMARY KEY (user_id),
  CONSTRAINT users_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id),
  CONSTRAINT fk_users_department FOREIGN KEY (department_id) REFERENCES public.departments(department_id),
  CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(role_id)
);