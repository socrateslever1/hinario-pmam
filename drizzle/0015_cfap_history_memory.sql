ALTER TABLE `pmam_cfap_history`
  ADD COLUMN `command_phrase` longtext AFTER `highlights_json`;
--> statement-breakpoint
ALTER TABLE `pmam_cfap_history`
  ADD COLUMN `memory_gallery_json` longtext AFTER `command_phrase`;
