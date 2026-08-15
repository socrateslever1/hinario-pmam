CREATE TABLE IF NOT EXISTS `pmam_ordem_unida_audios` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `item_id` VARCHAR(128) NOT NULL,
  `item_title` VARCHAR(255) NOT NULL,
  `item_type` ENUM('corneta', 'dobrado', 'voz') NOT NULL,
  `audio_url` LONGTEXT NOT NULL,
  `file_key` VARCHAR(512) NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `file_size` INT NULL,
  `mime_type` VARCHAR(100) NULL,
  `duration` INT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `uploaded_by` INT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pmam_ordem_unida_audios_item` (`item_id`),
  KEY `idx_pmam_ordem_unida_audios_active` (`is_active`)
);
