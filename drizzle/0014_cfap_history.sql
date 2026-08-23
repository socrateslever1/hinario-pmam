CREATE TABLE IF NOT EXISTS `pmam_cfap_history` (
  `slug` varchar(160) NOT NULL,
  `rank_name` varchar(80) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `periods_json` longtext NOT NULL,
  `portrait_url` longtext,
  `biography` longtext,
  `highlights_json` longtext NOT NULL,
  `videos_json` longtext NOT NULL,
  `sources_json` longtext NOT NULL,
  `in_memoriam` boolean NOT NULL DEFAULT false,
  `is_visible` boolean NOT NULL DEFAULT true,
  `sort_order` int NOT NULL DEFAULT 0,
  `updated_by` int,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `pmam_cfap_history_slug` PRIMARY KEY(`slug`),
  KEY `idx_pmam_cfap_history_visible_order` (`is_visible`, `sort_order`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `pmam_cfap_history_audit` (
  `id` int AUTO_INCREMENT NOT NULL,
  `commander_slug` varchar(160) NOT NULL,
  `snapshot_json` longtext NOT NULL,
  `changed_by` int,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `pmam_cfap_history_audit_id` PRIMARY KEY(`id`),
  KEY `idx_pmam_cfap_history_audit_slug` (`commander_slug`, `created_at`)
);
