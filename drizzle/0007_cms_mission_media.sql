CREATE TABLE IF NOT EXISTS `pmam_mission_media` (
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
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `pmam_mission_media_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `pmam_content` (
  `id` int AUTO_INCREMENT NOT NULL,
  `title` varchar(255) NOT NULL,
  `type` enum('post','news','announcement','highlight') NOT NULL,
  `content` longtext,
  `image_url` varchar(512),
  `video_url` varchar(512),
  `audio_url` varchar(512),
  `pdf_url` varchar(512),
  `position` int DEFAULT 0,
  `is_active` boolean DEFAULT true,
  `is_archived` boolean DEFAULT false,
  `created_by` int,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `pmam_content_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `pmam_content_layout` (
  `id` int AUTO_INCREMENT NOT NULL,
  `content_id` int NOT NULL,
  `section` varchar(100) NOT NULL,
  `column` int DEFAULT 1,
  `row` int DEFAULT 1,
  `width` varchar(50) DEFAULT 'full',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `pmam_content_layout_id` PRIMARY KEY(`id`),
  CONSTRAINT `uq_pmam_content_layout_content` UNIQUE(`content_id`)
);

ALTER TABLE `pmam_drill` ADD COLUMN IF NOT EXISTS `youtube_url` varchar(255);
ALTER TABLE `pmam_drill` ADD COLUMN IF NOT EXISTS `cornetta_audio_url` varchar(255);
