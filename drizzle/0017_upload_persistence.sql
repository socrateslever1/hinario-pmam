CREATE TABLE IF NOT EXISTS `pmam_upload_registry` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `file_key` VARCHAR(700) NOT NULL,
  `file_url` LONGTEXT NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `mime_type` VARCHAR(120) NOT NULL,
  `file_size` INT NOT NULL,
  `folder` VARCHAR(160) NOT NULL,
  `status` ENUM('stored', 'linked', 'deleted', 'failed') NOT NULL DEFAULT 'stored',
  `uploaded_by` INT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_pmam_upload_registry_key` (`file_key`),
  KEY `idx_pmam_upload_registry_status` (`status`, `created_at`),
  KEY `idx_pmam_upload_registry_user` (`uploaded_by`, `created_at`)
);

CREATE TABLE IF NOT EXISTS `pmam_aditamentos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `companhia` INT NOT NULL,
  `peloton` INT NOT NULL,
  `titulo` VARCHAR(255) NOT NULL,
  `conteudo` TEXT NULL,
  `data` DATE NOT NULL,
  `pdf_url` VARCHAR(512) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_pmam_aditamentos_scope` (`companhia`, `peloton`, `data`)
);

CREATE TABLE IF NOT EXISTS `pmam_student_baixado_documents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `companhia` INT NOT NULL,
  `peloton` INT NOT NULL,
  `file_url` LONGTEXT NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `mime_type` VARCHAR(120) NOT NULL,
  `file_size` INT NULL,
  `note` VARCHAR(1000) NULL,
  `baixado_kind` VARCHAR(40) NOT NULL DEFAULT 'informativo',
  `hpm_homologated` BOOLEAN NOT NULL DEFAULT FALSE,
  `uploaded_by` INT NULL,
  `uploaded_by_student_id` INT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_pmam_baixado_docs_student` (`student_id`, `created_at`),
  KEY `idx_pmam_baixado_docs_scope` (`companhia`, `peloton`, `created_at`)
);
