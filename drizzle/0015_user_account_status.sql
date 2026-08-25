ALTER TABLE `pmam_users`
  MODIFY COLUMN `role` enum('master','admin','comandante_corpo','subcomandante_corpo','comandante_cfap','subcomandante_cfap','comandante_cia','comandante_pel','student') DEFAULT 'student';
--> statement-breakpoint
ALTER TABLE `pmam_users`
  ADD COLUMN `is_active` boolean NOT NULL DEFAULT true AFTER `force_password_change`;
