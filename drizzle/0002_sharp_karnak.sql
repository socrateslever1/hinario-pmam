ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','master') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `password` varchar(255);