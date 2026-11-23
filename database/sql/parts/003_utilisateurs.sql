-- Création de la table des utilisateurs
-- Exécuter après 002_centres.sql

CREATE TABLE IF NOT EXISTS utilisateurs (
    id_user INT AUTO_INCREMENT PRIMARY KEY,
    nom_utilisateur VARCHAR(50) NOT NULL UNIQUE,
    mot_de_passe VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE,
    role ENUM('patient', 'medecin', 'admin', 'personnel') NOT NULL,
    statut ENUM('actif', 'inactif', 'suspendu') DEFAULT 'actif',
    derniere_connexion TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_role (role),
    INDEX idx_statut (statut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertion d'un administrateur par défaut
INSERT INTO utilisateurs (nom_utilisateur, mot_de_passe, email, role) VALUES
('admin', '$2b$10$rQZ8K9vX3mN2pL1qR4sT5uV6wX7yZ8aB9cC0dE1fG2hI3jJ4kL5mN6oP7', 'admin@sante.sn', 'admin');

SELECT 'Table utilisateurs créée avec succès!' as message;
