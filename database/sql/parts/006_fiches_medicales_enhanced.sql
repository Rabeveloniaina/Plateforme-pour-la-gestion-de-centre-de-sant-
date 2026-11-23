-- Amélioration de la table des fiches médicales + nouvelles tables
-- Exécuter après 005_medecins.sql

-- Table des fiches médicales améliorée
DROP TABLE IF EXISTS fiches_medicales;
CREATE TABLE fiches_medicales (
    id_fiche INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    medecin_id INT NOT NULL,
    date_consultation DATETIME NOT NULL,
    
    -- Données vitales
    poids DECIMAL(5,2),
    taille DECIMAL(5,2),
    imc DECIMAL(4,2) GENERATED ALWAYS AS (
        CASE 
            WHEN taille > 0 THEN ROUND(poids / (taille/100 * taille/100), 2)
            ELSE NULL 
        END
    ) STORED,
    tension_systolique INT,
    tension_diastolique INT,
    frequence_cardiaque INT,
    temperature DECIMAL(4,2),
    
    -- Informations médicales
    motif_consultation TEXT NOT NULL,
    symptomes JSON,
    examen_physique TEXT,
    diagnostic_principal VARCHAR(500),
    diagnostics_secondaires JSON,
    
    -- Notes et observations
    observations_medecin TEXT,
    recommandations TEXT,
    suivi_necessaire BOOLEAN DEFAULT FALSE,
    date_prochain_rdv DATE,
    
    -- Métadonnées
    statut ENUM('en_cours', 'termine', 'annule') DEFAULT 'en_cours',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (patient_id) REFERENCES patients(id_patient) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (medecin_id) REFERENCES medecins(id_medecin) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_patient (patient_id),
    INDEX idx_medecin (medecin_id),
    INDEX idx_date (date_consultation),
    INDEX idx_statut (statut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des médicaments
CREATE TABLE IF NOT EXISTS medicaments (
    id_medicament INT AUTO_INCREMENT PRIMARY KEY,
    nom_commercial VARCHAR(200) NOT NULL,
    denomination_commune VARCHAR(200) NOT NULL,
    forme_pharmaceutique ENUM('comprime', 'gelule', 'sirop', 'injection', 'pommade', 'gouttes', 'spray', 'patch', 'suppositoire', 'autre') NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    unite_dosage VARCHAR(50) NOT NULL,
    fabricant VARCHAR(200),
    code_atc VARCHAR(20),
    contre_indications TEXT,
    effets_secondaires TEXT,
    interactions TEXT,
    statut ENUM('actif', 'inactif', 'retire') DEFAULT 'actif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_nom_commercial (nom_commercial),
    INDEX idx_denomination (denomination_commune),
    INDEX idx_statut (statut),
    UNIQUE KEY unique_medicament (nom_commercial, dosage, forme_pharmaceutique)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
    id_prescription INT AUTO_INCREMENT PRIMARY KEY,
    fiche_medicale_id INT NOT NULL,
    medicament_id INT NOT NULL,
    
    -- Posologie
    dosage_prescrit VARCHAR(100) NOT NULL,
    frequence VARCHAR(100) NOT NULL, -- ex: "3 fois par jour", "1 fois le matin"
    duree_traitement INT NOT NULL, -- en jours
    quantite_totale INT NOT NULL,
    
    -- Instructions
    instructions_specifiques TEXT,
    moment_prise ENUM('avant_repas', 'pendant_repas', 'apres_repas', 'a_jeun', 'au_coucher', 'selon_besoin') DEFAULT 'selon_besoin',
    
    -- Métadonnées
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    statut ENUM('active', 'terminee', 'arretee', 'suspendue') DEFAULT 'active',
    raison_arret TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (fiche_medicale_id) REFERENCES fiches_medicales(id_fiche) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (medicament_id) REFERENCES medicaments(id_medicament) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_fiche (fiche_medicale_id),
    INDEX idx_medicament (medicament_id),
    INDEX idx_statut (statut),
    INDEX idx_dates (date_debut, date_fin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des vaccinations
CREATE TABLE IF NOT EXISTS vaccinations (
    id_vaccination INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    medecin_id INT NOT NULL,
    
    -- Informations du vaccin
    nom_vaccin VARCHAR(200) NOT NULL,
    type_vaccin ENUM('obligatoire', 'recommande', 'voyage', 'professionnel') NOT NULL,
    fabricant VARCHAR(200),
    numero_lot VARCHAR(100),
    date_expiration DATE,
    
    -- Administration
    date_administration DATE NOT NULL,
    site_injection ENUM('bras_gauche', 'bras_droit', 'cuisse_gauche', 'cuisse_droite', 'fessier', 'autre') NOT NULL,
    voie_administration ENUM('intramusculaire', 'sous_cutanee', 'intradermique', 'orale', 'nasale') NOT NULL,
    
    -- Suivi
    reactions_adverses TEXT,
    date_rappel_prevu DATE,
    statut ENUM('administre', 'reporte', 'contre_indique') DEFAULT 'administre',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (patient_id) REFERENCES patients(id_patient) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (medecin_id) REFERENCES medecins(id_medecin) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_patient (patient_id),
    INDEX idx_medecin (medecin_id),
    INDEX idx_vaccin (nom_vaccin),
    INDEX idx_date_admin (date_administration),
    INDEX idx_rappel (date_rappel_prevu)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des examens complémentaires
CREATE TABLE IF NOT EXISTS examens_complementaires (
    id_examen INT AUTO_INCREMENT PRIMARY KEY,
    fiche_medicale_id INT NOT NULL,
    
    -- Type d'examen
    type_examen ENUM('biologie', 'imagerie', 'cardiologie', 'pneumologie', 'neurologie', 'autre') NOT NULL,
    nom_examen VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Prescription
    date_prescription DATE NOT NULL,
    urgence ENUM('normale', 'urgent', 'tres_urgent') DEFAULT 'normale',
    instructions_particulieres TEXT,
    
    -- Résultats
    date_realisation DATE,
    resultats TEXT,
    interpretation TEXT,
    valeurs_normales TEXT,
    fichier_resultat VARCHAR(500), -- chemin vers le fichier
    
    -- Statut
    statut ENUM('prescrit', 'realise', 'interprete', 'annule') DEFAULT 'prescrit',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (fiche_medicale_id) REFERENCES fiches_medicales(id_fiche) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_fiche (fiche_medicale_id),
    INDEX idx_type (type_examen),
    INDEX idx_statut (statut),
    INDEX idx_date_prescription (date_prescription)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertion de médicaments d'exemple
INSERT INTO medicaments (nom_commercial, denomination_commune, forme_pharmaceutique, dosage, unite_dosage, fabricant) VALUES
('Paracétamol 500mg', 'Paracétamol', 'comprime', '500', 'mg', 'Laboratoire Générique'),
('Doliprane 1000mg', 'Paracétamol', 'comprime', '1000', 'mg', 'Sanofi'),
('Amoxicilline 250mg', 'Amoxicilline', 'gelule', '250', 'mg', 'Laboratoire Beta'),
('Ventoline', 'Salbutamol', 'spray', '100', 'mcg/dose', 'GSK'),
('Aspirine 100mg', 'Acide acétylsalicylique', 'comprime', '100', 'mg', 'Bayer'),
('Metformine 850mg', 'Metformine', 'comprime', '850', 'mg', 'Laboratoire Alpha'),
('Oméprazole 20mg', 'Oméprazole', 'gelule', '20', 'mg', 'Laboratoire Gamma');

-- Insertion de fiches médicales d'exemple
INSERT INTO fiches_medicales (patient_id, medecin_id, date_consultation, poids, taille, tension_systolique, tension_diastolique, temperature, motif_consultation, diagnostic_principal, observations_medecin) VALUES
(1, 1, '2024-01-15 09:00:00', 65.5, 165, 120, 80, 36.8, 'Contrôle de routine', 'Bilan de santé normal', 'Patient en bonne santé générale'),
(2, 1, '2024-01-15 09:30:00', 70.0, 175, 110, 70, 37.2, 'Maux de tête récurrents', 'Céphalées de tension', 'Prescrire repos et suivi'),
(3, 2, '2024-01-15 10:00:00', 58.0, 160, 115, 75, 36.5, 'Suivi diabète', 'Diabète type 2 stabilisé', 'Continuer traitement actuel'),
(4, 3, '2024-01-15 14:00:00', 75.0, 180, 125, 85, 36.9, 'Douleur thoracique', 'Suspicion angine de poitrine', 'ECG et examens complémentaires nécessaires');

-- Insertion de prescriptions d'exemple
INSERT INTO prescriptions (fiche_medicale_id, medicament_id, dosage_prescrit, frequence, duree_traitement, quantite_totale, date_debut, date_fin, moment_prise) VALUES
(2, 1, '500mg', '3 fois par jour', 7, 21, '2024-01-15', '2024-01-22', 'apres_repas'),
(3, 6, '850mg', '2 fois par jour', 30, 60, '2024-01-15', '2024-02-14', 'avant_repas'),
(4, 5, '100mg', '1 fois par jour', 30, 30, '2024-01-15', '2024-02-14', 'apres_repas');

-- Insertion de vaccinations d'exemple
INSERT INTO vaccinations (patient_id, medecin_id, nom_vaccin, type_vaccin, date_administration, site_injection, voie_administration) VALUES
(1, 1, 'Tétanos-Diphtérie', 'obligatoire', '2024-01-10', 'bras_gauche', 'intramusculaire'),
(2, 1, 'Grippe saisonnière', 'recommande', '2024-01-12', 'bras_droit', 'intramusculaire'),
(3, 2, 'Hépatite B', 'obligatoire', '2024-01-08', 'bras_gauche', 'intramusculaire');

SELECT 'Tables médicales améliorées créées et peuplées avec succès!' as message;
