CREATE TABLE IF NOT EXISTS `pmam_official_documents` (
  `id` int AUTO_INCREMENT NOT NULL,
  `title` varchar(180) NOT NULL,
  `description` varchar(500),
  `file_name` varchar(255) NOT NULL,
  `file_url` varchar(1024) NOT NULL,
  `file_key` varchar(512) NOT NULL,
  `mime_type` varchar(120) NOT NULL,
  `file_size` int unsigned NOT NULL,
  `uploaded_by` int,
  `is_active` boolean NOT NULL DEFAULT true,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `pmam_official_documents_id` PRIMARY KEY(`id`),
  KEY `idx_pmam_official_documents_active_created` (`is_active`, `created_at`)
);
