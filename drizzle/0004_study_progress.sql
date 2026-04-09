CREATE TABLE IF NOT EXISTS `pmam_study_students` (
	`id` int AUTO_INCREMENT NOT NULL,
	`student_number` varchar(64) NOT NULL,
	`display_name` varchar(120),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`last_active_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `pmam_study_students_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_pmam_study_students_number` UNIQUE(`student_number`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `pmam_study_module_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`student_number` varchar(64) NOT NULL,
	`module_slug` varchar(96) NOT NULL,
	`completed_section_ids` longtext NOT NULL,
	`answers_json` longtext NOT NULL,
	`last_score` int,
	`best_score` int,
	`last_submitted_at` datetime,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pmam_study_module_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_pmam_study_module_progress_student_module` UNIQUE(`student_number`,`module_slug`)
);
--> statement-breakpoint
CREATE INDEX `idx_pmam_study_module_progress_student` ON `pmam_study_module_progress` (`student_number`);
--> statement-breakpoint
CREATE INDEX `idx_pmam_study_module_progress_module` ON `pmam_study_module_progress` (`module_slug`);
