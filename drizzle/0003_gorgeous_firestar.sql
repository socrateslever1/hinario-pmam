CREATE TABLE `comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`targetType` enum('hymn','mission') NOT NULL,
	`targetId` int NOT NULL,
	`authorName` varchar(100) NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `likes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`targetType` enum('hymn','mission') NOT NULL,
	`targetId` int NOT NULL,
	`visitorId` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `likes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `cfap_missions` ADD `status` enum('ativa','cumprida','inativa') DEFAULT 'ativa' NOT NULL;--> statement-breakpoint
ALTER TABLE `cfap_missions` ADD `dueDate` date;--> statement-breakpoint
ALTER TABLE `cfap_missions` ADD `likesCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `cfap_missions` ADD `viewsCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `hymns` ADD `likesCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `hymns` ADD `viewsCount` int DEFAULT 0 NOT NULL;