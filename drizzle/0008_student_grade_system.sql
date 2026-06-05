CREATE TABLE IF NOT EXISTS `pmam_students` (
  `id` int AUTO_INCREMENT NOT NULL,
  `numerica` varchar(4) NOT NULL,
  `nome_guerra` varchar(255) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `session_token` varchar(128),
  `companhia` int NOT NULL,
  `peloton` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `pmam_students_id` PRIMARY KEY(`id`),
  CONSTRAINT `pmam_students_numerica_unique` UNIQUE(`numerica`)
);

ALTER TABLE `pmam_students` ADD COLUMN IF NOT EXISTS `session_token` varchar(128);

CREATE TABLE IF NOT EXISTS `pmam_disciplines` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `created_by` int NOT NULL,
  `is_active` boolean DEFAULT true,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `pmam_disciplines_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `pmam_student_grades` (
  `id` int AUTO_INCREMENT NOT NULL,
  `student_id` int NOT NULL,
  `discipline_id` int NOT NULL,
  `professor_name` varchar(255),
  `grade` int,
  `evaluation_date` date,
  `observation` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `pmam_student_grades_id` PRIMARY KEY(`id`)
);
