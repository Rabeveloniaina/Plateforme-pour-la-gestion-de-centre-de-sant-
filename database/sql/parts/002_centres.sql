-- Création de la table des centres de santé
-- Exécuter après 001_regions.sql

CREATE TABLE IF NOT EXISTS centres_sante (
    id_centre INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(200) NOT NULL,
    adresse TEXT NOT NULL,
    region_id INT NOT NULL,
    capacite_max INT DEFAULT 100,
    telephone VARCHAR(20),
    email VARCHAR(100),
    type_centre ENUM('poste_sante', 'centre_sante', 'hopital', 'clinique') DEFAULT 'centre_sante',
    statut ENUM('actif', 'inactif', 'maintenance') DEFAULT 'actif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (region_id) REFERENCES regions(id_region) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_region (region_id),
    INDEX idx_statut (statut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertion de quelques centres de santé d'exemple
INSERT INTO centres_sante (nom, adresse, region_id, capacite_max, telephone, email, type_centre) VALUES
('Centre de Santé Principal Dakar', '123 Avenue Cheikh Anta Diop, Dakar', 1, 200, '+221338123456', 'csdakar@sante.sn', 'centre_sante'),
('Poste de Santé Médina', '45 Rue de la Médina, Dakar', 1, 80, '+221338123457', 'psmedina@sante.sn', 'poste_sante'),
('Centre de Santé Thiès', '78 Boulevard de Thiès', 2, 150, '+221339123456', 'csthiès@sante.sn', 'centre_sante'),
('Hôpital Régional Saint-Louis', '12 Route de Saint-Louis', 3, 300, '+221339612345', 'hrsl@sante.sn', 'hopital'),
('Centre de Santé Kaolack', '56 Avenue de Kaolack', 4, 120, '+221339412345', 'cskaolack@sante.sn', 'centre_sante');

SELECT 'Table centres_sante créée et peuplée avec succès!' as message;
