-- Table pour les informations médicales de BASE des patients
-- (Remplies par le patient lui-même, indépendantes des consultations)

CREATE TABLE IF NOT EXISTS patients_infos_medicales (
    id_info INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL UNIQUE,
    groupe_sanguin ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
    poids DECIMAL(5,2) COMMENT 'Poids en kg',
    taille DECIMAL(5,2) COMMENT 'Taille en cm',
    tension VARCHAR(20) COMMENT 'Format: 120/80',
    allergies TEXT COMMENT 'Liste des allergies connues',
    antecedents TEXT COMMENT 'Antécédents médicaux et familiaux',
    maladies_chroniques TEXT COMMENT 'Maladies chroniques actuelles',
    medicaments_actuels TEXT COMMENT 'Traitements en cours',
    contacts_urgence TEXT COMMENT 'Contacts en cas d\'urgence',
    infos_complementaires JSON COMMENT 'Autres informations médicales',
    date_maj TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id_patient) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_patient (patient_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Informations médicales de base remplies par les patients';

-- Index pour recherche rapide
CREATE INDEX idx_groupe_sanguin ON patients_infos_medicales(groupe_sanguin);

SELECT 'Table patients_infos_medicales créée avec succès!' as message;

