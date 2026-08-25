ALTER TABLE `pmam_students`
  ADD COLUMN `registration_status` enum('available','active','blocked') NOT NULL DEFAULT 'active' AFTER `session_token`;
