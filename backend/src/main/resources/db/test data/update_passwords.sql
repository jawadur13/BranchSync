-- ============================================================
-- BranchSync: Update Passwords Fix
-- Use this if you don't want to re-create the whole database.
-- Sets all passwords to BCrypt hash of "password123"
-- ============================================================

UPDATE users 
SET password_hash = '75K3eLr+dx6JJFuJ7LwIpEpOFmwGZZkRiB84PURz6U8=';
