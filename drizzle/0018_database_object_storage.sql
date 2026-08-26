CREATE TABLE IF NOT EXISTS `pmam_file_objects` (
  `file_key` VARCHAR(700) NOT NULL PRIMARY KEY,
  `mime_type` VARCHAR(120) NOT NULL,
  `file_size` INT NOT NULL,
  `chunk_size` INT NOT NULL,
  `total_chunks` INT NOT NULL,
  `status` ENUM('uploading', 'ready', 'failed') NOT NULL DEFAULT 'uploading',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_pmam_file_objects_status` (`status`, `updated_at`)
);

CREATE TABLE IF NOT EXISTS `pmam_file_object_chunks` (
  `file_key` VARCHAR(700) NOT NULL,
  `chunk_index` INT NOT NULL,
  `data_base64` LONGTEXT NOT NULL,
  PRIMARY KEY (`file_key`, `chunk_index`)
);
