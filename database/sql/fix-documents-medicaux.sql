-- Création de la table documents_medicaux si elle n'existe pas

CREATE TABLE IF NOT EXISTS `documents_medicaux` (
  `id_document` int(11) NOT NULL AUTO_INCREMENT,
  `patient_id` int(11) NOT NULL,
  `fiche_id` int(11) DEFAULT NULL,
  `type_document` enum('analyse','radiologie','ordonnance','certificat','autre') NOT NULL,
  `nom_fichier` varchar(255) NOT NULL,
  `chemin_fichier` varchar(500) NOT NULL,
  `taille_fichier` int(11) DEFAULT NULL COMMENT 'Taille en octets',
  `date_upload` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `uploaded_by` int(11) DEFAULT NULL COMMENT 'ID de l utilisateur qui a uploadé',
  `description` text,
  PRIMARY KEY (`id_document`),
  KEY `idx_patient` (`patient_id`),
  KEY `idx_fiche` (`fiche_id`),
  KEY `idx_type` (`type_document`),
  KEY `idx_date_upload` (`date_upload`),
  CONSTRAINT `fk_doc_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id_patient`) ON DELETE CASCADE,
  CONSTRAINT `fk_doc_fiche` FOREIGN KEY (`fiche_id`) REFERENCES `fiches_medicales` (`id_fiche`) ON DELETE SET NULL,
  CONSTRAINT `fk_doc_user` FOREIGN KEY (`uploaded_by`) REFERENCES `utilisateurs` (`id_user`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

