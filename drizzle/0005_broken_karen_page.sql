CREATE TABLE `pmam_disciplines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`created_by` int NOT NULL,
	`is_active` boolean DEFAULT true,
	`start_date` date,
	`exam_date` date,
	`status` varchar(50) DEFAULT 'em_breve',
	`study_material_url` varchar(512),
	`study_material_name` varchar(255),
	`gaivotas_links` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pmam_disciplines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pmam_fato_observado` (
	`id` int AUTO_INCREMENT NOT NULL,
	`student_id` int NOT NULL,
	`tipo` enum('positive','negative') NOT NULL,
	`descricao` text NOT NULL,
	`data` date NOT NULL,
	`registrado_por` int NOT NULL,
	`validado_por` int,
	`status` enum('pendente','validado','rejeitado') DEFAULT 'pendente',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pmam_fato_observado_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pmam_fato_observado_provas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fato_observado_id` int NOT NULL,
	`arquivo_url` longtext NOT NULL,
	`tipo` enum('foto','video','audio','documento') DEFAULT 'foto',
	`nome_arquivo` varchar(255),
	`tamanho` int,
	`mime_type` varchar(100),
	`data_upload` timestamp DEFAULT (now()),
	`criado_por` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pmam_fato_observado_provas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pmam_grade_disciplines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`student_id` int NOT NULL,
	`discipline_name` varchar(255) NOT NULL,
	`professor_name` varchar(255),
	`grade` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pmam_grade_disciplines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pmam_grade_students` (
	`id` int AUTO_INCREMENT NOT NULL,
	`student_number` varchar(10) NOT NULL,
	`cpf` varchar(14) NOT NULL,
	`full_name` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pmam_grade_students_id` PRIMARY KEY(`id`),
	CONSTRAINT `pmam_grade_students_student_number_unique` UNIQUE(`student_number`),
	CONSTRAINT `pmam_grade_students_cpf_unique` UNIQUE(`cpf`)
);
--> statement-breakpoint
CREATE TABLE `pmam_post_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`post_id` int,
	`url` varchar(512) NOT NULL,
	`file_key` varchar(512) NOT NULL,
	`alt_text` varchar(255),
	`width` int,
	`height` int,
	`alignment` varchar(20) DEFAULT 'center',
	`size_percent` int DEFAULT 100,
	`mime_type` varchar(100),
	`file_size` int,
	`uploaded_by` int,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `pmam_post_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pmam_student_grades` (
	`id` int AUTO_INCREMENT NOT NULL,
	`student_id` int NOT NULL,
	`discipline_id` int NOT NULL,
	`professor_name` varchar(255),
	`grade` decimal(3,1),
	`evaluation_date` date,
	`observation` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pmam_student_grades_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pmam_students` (
	`id` int AUTO_INCREMENT NOT NULL,
	`numerica` varchar(4) NOT NULL,
	`nome_guerra` varchar(255) NOT NULL,
	`senha` varchar(255) NOT NULL,
	`session_token` varchar(128),
	`companhia` int NOT NULL,
	`peloton` int NOT NULL,
	`nome_completo` varchar(255),
	`rg` varchar(20),
	`email` varchar(255),
	`foto_url` longtext,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pmam_students_id` PRIMARY KEY(`id`),
	CONSTRAINT `pmam_students_numerica_unique` UNIQUE(`numerica`)
);
--> statement-breakpoint
DROP TABLE `cfap_missions`;--> statement-breakpoint
DROP TABLE `comments`;--> statement-breakpoint
DROP TABLE `hymns`;--> statement-breakpoint
DROP TABLE `likes`;--> statement-breakpoint
DROP TABLE `site_settings`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `pmam_blog_post` MODIFY COLUMN `image_url` varchar(512);--> statement-breakpoint
ALTER TABLE `pmam_hymns` MODIFY COLUMN `audio_url` text;--> statement-breakpoint
ALTER TABLE `pmam_users` MODIFY COLUMN `open_id` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `pmam_users` MODIFY COLUMN `role` enum('admin','comandante_corpo','comandante_cfap','comandante_cia','comandante_pel','student') DEFAULT 'student';--> statement-breakpoint
ALTER TABLE `pmam_blog_post` ADD `youtube_url` varchar(512);--> statement-breakpoint
ALTER TABLE `pmam_hymns` ADD `instrumental_youtube_url` varchar(512);--> statement-breakpoint
ALTER TABLE `pmam_hymns` ADD `instrumental_audio_url` text;--> statement-breakpoint
ALTER TABLE `pmam_users` ADD `pelotao_id` int;--> statement-breakpoint
ALTER TABLE `pmam_users` ADD `companhia_id` int;--> statement-breakpoint
ALTER TABLE `pmam_users` ADD `force_password_change` boolean DEFAULT false;