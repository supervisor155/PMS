-- migration_add_reset_token.sql
-- Run this if you already have the pms database created from schema.sql.
-- Adds reset_token and reset_token_expires columns to the users table.

USE pms;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reset_token_expires DATETIME DEFAULT NULL;
