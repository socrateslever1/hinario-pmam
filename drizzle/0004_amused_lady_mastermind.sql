CREATE TABLE `pmam_cfap_missions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255),
	`content` text,
	`attachments_json` longtext,
	`priority` varchar(50),
	`status` varchar(50),
	`due_date` timestamp,
	`is_active` boolean DEFAULT true,
	`author_id` int,
	`likes_count` int DEFAULT 0,
	`views_count` int DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pmam_cfap_missions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pmam_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`target_type` varchar(50),
	`target_id` int,
	`author_name` varchar(255),
	`content` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `pmam_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pmam_drill` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`subtitle` varchar(255),
	`description` longtext,
	`category` varchar(100),
	`difficulty` varchar(50) DEFAULT 'intermediario',
	`duration` int,
	`video_url` varchar(255),
	`pdf_url` varchar(255),
	`image_url` varchar(255),
	`youtube_url` varchar(255),
	`cornetta_audio_url` varchar(255),
	`content` longtext,
	`instructor` varchar(255),
	`prerequisites` text,
	`learning_outcomes` longtext,
	`attachments_json` longtext,
	`is_active` boolean DEFAULT true,
	`likes_count` int DEFAULT 0,
	`views_count` int DEFAULT 0,
	`author_id` int,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pmam_drill_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pmam_hymns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`number` int,
	`title` varchar(255),
	`subtitle` varchar(255),
	`author` varchar(255),
	`composer` varchar(255),
	`category` varchar(100),
	`collection` varchar(64),
	`lyrics` text,
	`description` text,
	`youtube_url` varchar(255),
	`audio_url` varchar(255),
	`lyrics_sync` json,
	`is_active` boolean DEFAULT true,
	`likes_count` int DEFAULT 0,
	`views_count` int DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pmam_hymns_id` PRIMARY KEY(`id`),
	CONSTRAINT `pmam_hymns_number_unique` UNIQUE(`number`)
);
--> statement-breakpoint
CREATE TABLE `pmam_likes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`target_type` varchar(50),
	`target_id` int,
	`visitor_id` varchar(255),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `pmam_likes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pmam_site_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`setting_key` varchar(255),
	`setting_value` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pmam_site_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `pmam_site_settings_setting_key_unique` UNIQUE(`setting_key`)
);
--> statement-breakpoint
CREATE TABLE `pmam_study_module_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`student_number` varchar(64) NOT NULL,
	`module_slug` varchar(96) NOT NULL,
	`completed_section_ids` longtext NOT NULL,
	`answers_json` longtext NOT NULL,
	`last_score` int,
	`best_score` int,
	`last_submitted_at` datetime,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pmam_study_module_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_pmam_study_module_progress_student_module` UNIQUE(`student_number`,`module_slug`)
);
--> statement-breakpoint
CREATE TABLE `pmam_study_students` (
	`id` int AUTO_INCREMENT NOT NULL,
	`student_number` varchar(64) NOT NULL,
	`display_name` varchar(120),
	`access_token` varchar(128),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`last_active_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pmam_study_students_id` PRIMARY KEY(`id`),
	CONSTRAINT `pmam_study_students_student_number_unique` UNIQUE(`student_number`)
);
--> statement-breakpoint
CREATE TABLE `pmam_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`open_id` varchar(255),
	`name` varchar(255),
	`email` varchar(255),
	`password` varchar(255),
	`login_method` varchar(50),
	`role` varchar(50) DEFAULT 'user',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`last_signed_in` timestamp,
	CONSTRAINT `pmam_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `pmam_users_open_id_unique` UNIQUE(`open_id`),
	CONSTRAINT `pmam_users_email_unique` UNIQUE(`email`)
);
