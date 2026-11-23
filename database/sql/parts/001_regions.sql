-- Création de la table des régions
-- Exécuter ce script en premier

CREATE TABLE IF NOT EXISTS regions (
    id_region INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL UNIQUE,
    population INT DEFAULT 0,
    code_region VARCHAR(10) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertion des régions de base (exemple pour le Sénégal)
INSERT INTO regions (nom, population, code_region) VALUES
('Dakar', 3500000, 'DK'),
('Thiès', 1800000, 'TH'),
('Saint-Louis', 900000, 'SL'),
('Kaolack', 1200000, 'KL'),
('Ziguinchor', 600000, 'ZG'),
('Kolda', 800000, 'KD'),
('Tambacounda', 700000, 'TB'),
('Kaffrine', 600000, 'KF'),
('Fatick', 500000, 'FT'),
('Louga', 800000, 'LG'),
('Matam', 500000, 'MT'),
('Sédhiou', 400000, 'SD'),
('Kédougou', 300000, 'KG');

SELECT 'Table regions créée et peuplée avec succès!' as message;
