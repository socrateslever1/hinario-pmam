CREATE TABLE IF NOT EXISTS `pmam_voice_profiles` (
  `profile_key` VARCHAR(128) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `photo_url` LONGTEXT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`profile_key`),
  KEY `idx_pmam_voice_profiles_active` (`is_active`)
);

INSERT IGNORE INTO `pmam_voice_profiles` (`profile_key`, `name`, `photo_url`, `is_active`)
SELECT `voice_profile_key`, MAX(`voice_author_name`), MAX(`voice_author_photo_url`), TRUE
FROM `pmam_ordem_unida_audios`
WHERE `item_type` = 'voz' AND `voice_author_name` IS NOT NULL AND `voice_author_name` <> ''
GROUP BY `voice_profile_key`;
