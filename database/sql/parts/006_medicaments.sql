-- Création de la table des médicaments
-- Exécuter après 006_fiches_medicales.sql et avant 007_prescriptions.sql

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

-- Insertion de médicaments d'exemple
INSERT INTO medicaments (nom_commercial, denomination_commune, forme_pharmaceutique, dosage, unite_dosage, fabricant) VALUES
('Paracétamol 500mg', 'Paracétamol', 'comprime', '500', 'mg', 'Laboratoire Générique'),
('Doliprane 1000mg', 'Paracétamol', 'comprime', '1000', 'mg', 'Sanofi'),
('Amoxicilline 250mg', 'Amoxicilline', 'gelule', '250', 'mg', 'Laboratoire Beta'),
('Ventoline', 'Salbutamol', 'spray', '100', 'mcg/dose', 'GSK'),
('Aspirine 100mg', 'Acide acétylsalicylique', 'comprime', '100', 'mg', 'Bayer'),
('Metformine 850mg', 'Metformine', 'comprime', '850', 'mg', 'Laboratoire Alpha'),
('Oméprazole 20mg', 'Oméprazole', 'gelule', '20', 'mg', 'Laboratoire Gamma'),
('Ibuprofène 400mg', 'Ibuprofène', 'comprime', '400', 'mg', 'Laboratoire Delta'),
('Amoxicilline 500mg', 'Amoxicilline', 'gelule', '500', 'mg', 'Laboratoire Beta'),
('Ciprofloxacine 500mg', 'Ciprofloxacine', 'comprime', '500', 'mg', 'Laboratoire Epsilon'),
('Doxycycline 100mg', 'Doxycycline', 'gelule', '100', 'mg', 'Laboratoire Zeta'),
('Azithromycine 500mg', 'Azithromycine', 'comprime', '500', 'mg', 'Laboratoire Eta'),
('Clarithromycine 500mg', 'Clarithromycine', 'comprime', '500', 'mg', 'Laboratoire Theta'),
('Ceftriaxone 1g', 'Ceftriaxone', 'injection', '1', 'g', 'Laboratoire Iota'),
('Gentamicine 80mg', 'Gentamicine', 'injection', '80', 'mg', 'Laboratoire Kappa'),
('Insuline rapide', 'Insuline', 'injection', '100', 'UI/ml', 'Laboratoire Lambda'),
('Insuline lente', 'Insuline', 'injection', '100', 'UI/ml', 'Laboratoire Lambda'),
('Atorvastatine 20mg', 'Atorvastatine', 'comprime', '20', 'mg', 'Laboratoire Mu'),
('Simvastatine 40mg', 'Simvastatine', 'comprime', '40', 'mg', 'Laboratoire Nu'),
('Amlodipine 5mg', 'Amlodipine', 'comprime', '5', 'mg', 'Laboratoire Xi'),
('Lisinopril 10mg', 'Lisinopril', 'comprime', '10', 'mg', 'Laboratoire Omicron'),
('Hydrochlorothiazide 25mg', 'Hydrochlorothiazide', 'comprime', '25', 'mg', 'Laboratoire Pi');

SELECT 'Table medicaments créée et peuplée avec succès!' as message;

