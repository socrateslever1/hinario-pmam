CREATE TABLE `cfap_missions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`priority` enum('normal','urgente','critica') NOT NULL DEFAULT 'normal',
	`isActive` boolean NOT NULL DEFAULT true,
	`authorId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cfap_missions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hymns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`number` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`subtitle` varchar(255),
	`author` varchar(255),
	`composer` varchar(255),
	`category` enum('nacional','militar','pmam','arma','oracao') NOT NULL,
	`lyrics` text NOT NULL,
	`description` text,
	`youtubeUrl` varchar(500),
	`audioUrl` varchar(500),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hymns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `site_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`settingKey` varchar(100) NOT NULL,
	`settingValue` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `site_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `site_settings_settingKey_unique` UNIQUE(`settingKey`)
);
