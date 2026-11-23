-- Création de la table des fiches médicales
-- Exécuter après 005_medecins.sql

CREATE TABLE IF NOT EXISTS fiches_medicales (
    id_fiche INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    groupe_sanguin ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
    poids DECIMAL(5,2),
    taille DECIMAL(5,2),
    tension VARCHAR(20),
    allergies TEXT,
    antecedents TEXT,
    infos_complementaires JSON,
    date_maj TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id_patient) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_patient (patient_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertion de quelques fiches médicales d'exemple
INSERT INTO fiches_medicales (patient_id, groupe_sanguin, poids, taille, tension, allergies, antecedents) VALUES
(1, 'O+', 65.5, 165.0, '120/80', 'Pénicilline', 'Hypertension familiale'),
(2, 'A+', 70.0, 175.0, '110/70', 'Aucune', 'Aucun'),
(3, 'B+', 58.0, 160.0, '115/75', 'Sulfamides', 'Diabète type 2'),
(4, 'AB+', 75.0, 180.0, '125/85', 'Aucune', 'Asthme');

SELECT 'Table fiches_medicales créée et peuplée avec succès!' as message;
