CREATE TABLE `pmam_blog_post` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` longtext NOT NULL,
	`image_url` varchar(512),
	`author_id` int NOT NULL,
	`published` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pmam_blog_post_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pmam_mission_media` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mission_id` int NOT NULL,
	`type` enum('image','video','audio','pdf','document') NOT NULL,
	`title` varchar(255),
	`description` text,
	`url` varchar(512) NOT NULL,
	`file_size` int,
	`mime_type` varchar(100),
	`duration` int,
	`thumbnail` varchar(512),
	`order` int DEFAULT 0,
	`is_active` boolean DEFAULT true,
	`uploaded_by` int,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pmam_mission_media_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `pmam_cfap_missions` ADD `image_url` varchar(512);--> statement-breakpoint
ALTER TABLE `pmam_cfap_missions` ADD `video_url` varchar(512);--> statement-breakpoint
ALTER TABLE `pmam_cfap_missions` ADD `audio_url` varchar(512);--> statement-breakpoint
ALTER TABLE `pmam_cfap_missions` ADD `pdf_url` varchar(512);