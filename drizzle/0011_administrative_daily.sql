CREATE TABLE IF NOT EXISTS `pmam_administrative_daily` (
  `id` INT AUTO_INCREMENT PRIMARY KEY, `date` DATE NOT NULL, `companhia` INT NOT NULL, `peloton` INT NOT NULL,
  `location_status` VARCHAR(32) NOT NULL DEFAULT 'sala', `formation_status` VARCHAR(32) NOT NULL DEFAULT 'nao_informado',
  `lunch_status` VARCHAR(32) NOT NULL DEFAULT 'nao_informado', `snack_status` VARCHAR(32) NOT NULL DEFAULT 'nao_informado',
  `ranch_advance` TINYINT(1) NOT NULL DEFAULT 0, `punishment_summary` TEXT NULL, `facts_summary` TEXT NULL,
  `pending_summary` TEXT NULL, `pending_resolved_at` TIMESTAMP NULL, `updated_by` INT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_pmam_administrative_daily_scope` (`date`, `companhia`, `peloton`), KEY `idx_pmam_administrative_daily_pending` (`pending_resolved_at`, `date`)
);

CREATE TABLE IF NOT EXISTS `pmam_administrative_weekly_config` (
  `companhia` INT NOT NULL, `peloton` INT NOT NULL, `ranch_weekdays` VARCHAR(32) NOT NULL DEFAULT '',
  `lunch_weekdays` VARCHAR(32) NOT NULL DEFAULT '', `snack_weekdays` VARCHAR(32) NOT NULL DEFAULT '', `updated_by` INT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY (`companhia`, `peloton`)
);
