-- Table pour les documents médicaux uploadés
-- Exécuter après les autres tables

CREATE TABLE IF NOT EXISTS documents_medicaux (
    id_document INT AUTO_INCREMENT PRIMARY KEY,
    fiche_medicale_id INT,
    patient_id INT NOT NULL,
    rendez_vous_id INT,
    prescription_id INT,
    
    -- Informations du fichier
    nom_fichier VARCHAR(255) NOT NULL,
    nom_fichier_original VARCHAR(255) NOT NULL,
    chemin_fichier VARCHAR(500) NOT NULL,
    type_fichier VARCHAR(100) NOT NULL COMMENT 'MIME type',
    taille_fichier BIGINT NOT NULL COMMENT 'Taille en octets',
    
    -- Métadonnées
    type_document ENUM(
        'analyse_laboratoire',
        'radiologie',
        'echographie',
        'scanner',
        'irm',
        'electrocardiogramme',
        'ordonnance',
        'certificat_medical',
        'compte_rendu',
        'autre'
    ) DEFAULT 'autre',
    description TEXT,
    
    -- Sécurité et traçabilité
    upload_par INT NOT NULL COMMENT 'ID de l\'utilisateur qui a uploadé',
    statut ENUM('actif', 'archive', 'supprime') DEFAULT 'actif',
    
    -- Dates
    date_upload DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_examen DATE COMMENT 'Date de l\'examen/document',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Contraintes
    FOREIGN KEY (patient_id) REFERENCES patients(id_patient) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (fiche_medicale_id) REFERENCES fiches_medicales(id_fiche) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (rendez_vous_id) REFERENCES rendez_vous(id_rdv) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(id_prescription) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (upload_par) REFERENCES utilisateurs(id_user) ON DELETE RESTRICT ON UPDATE CASCADE,
    
    -- Index pour performance
    INDEX idx_patient (patient_id),
    INDEX idx_fiche (fiche_medicale_id),
    INDEX idx_rdv (rendez_vous_id),
    INDEX idx_prescription (prescription_id),
    INDEX idx_type (type_document),
    INDEX idx_statut (statut),
    INDEX idx_date_upload (date_upload),
    INDEX idx_date_examen (date_examen)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Documents médicaux uploadés (analyses, radiologies, etc.)';

-- Créer le dossier uploads s'il n'existe pas (sera fait par l'application)
-- Note : Créer manuellement le dossier backend/uploads/documents/ en production

SELECT 'Table documents_medicaux créée avec succès!' as message;

