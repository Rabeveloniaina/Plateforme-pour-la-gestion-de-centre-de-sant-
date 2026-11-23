-- Création de la table des vaccinations
-- Exécuter après 004_patients.sql

CREATE TABLE IF NOT EXISTS vaccinations (
    id_vaccination INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    centre_id INT NOT NULL,
    nom_vaccin VARCHAR(100) NOT NULL,
    type_vaccin ENUM('obligatoire', 'recommandee', 'optionnelle') DEFAULT 'obligatoire',
    fabricant VARCHAR(100),
    numero_lot VARCHAR(50),
    date_expiration DATE,
    date_administration DATE NOT NULL,
    site_injection ENUM('bras_gauche', 'bras_droit', 'cuisse_gauche', 'cuisse_droite', 'fesse_gauche', 'fesse_droite', 'autre') DEFAULT 'bras_gauche',
    voie_administration ENUM('intramusculaire', 'sous_cutanee', 'intradermique', 'orale', 'nasale') DEFAULT 'intramusculaire',
    reactions_adverses TEXT,
    date_rappel_prevu DATE,
    statut ENUM('administre', 'planifie', 'annule', 'reporte') DEFAULT 'administre',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id_patient) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (centre_id) REFERENCES centres_sante(id_centre) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_patient (patient_id),
    INDEX idx_centre (centre_id),
    INDEX idx_nom_vaccin (nom_vaccin),
    INDEX idx_date_administration (date_administration),
    INDEX idx_statut (statut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertion de quelques vaccinations d'exemple
INSERT INTO vaccinations (patient_id, centre_id, nom_vaccin, type_vaccin, fabricant, numero_lot, date_expiration, date_administration, site_injection, voie_administration, reactions_adverses, date_rappel_prevu, statut) VALUES
(1, 1, 'BCG', 'obligatoire', 'Institut Pasteur', 'BCG2024001', '2025-12-31', '2024-01-10', 'bras_gauche', 'intradermique', 'Rougeur légère au site d\'injection', '2024-02-10', 'administre'),
(1, 1, 'DTPolio', 'obligatoire', 'Sanofi Pasteur', 'DTP2024001', '2025-06-30', '2024-01-15', 'bras_droit', 'intramusculaire', 'Aucune réaction', '2024-07-15', 'administre'),
(1, 1, 'Hépatite B', 'obligatoire', 'GSK', 'HBV2024001', '2025-03-31', '2024-01-20', 'bras_gauche', 'intramusculaire', 'Douleur légère au site d\'injection', '2024-07-20', 'administre');

SELECT 'Table vaccinations créée et peuplée avec succès!' as message;

