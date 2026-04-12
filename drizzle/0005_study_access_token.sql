ALTER TABLE `pmam_study_students`
ADD COLUMN `access_token` varchar(128) NULL AFTER `display_name`;

UPDATE `pmam_study_students`
SET `access_token` = UUID()
WHERE `access_token` IS NULL OR `access_token` = '';
