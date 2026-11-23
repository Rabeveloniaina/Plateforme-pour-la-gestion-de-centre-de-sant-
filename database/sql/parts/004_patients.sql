-- Création de la table des patients
-- Exécuter après 003_utilisateurs.sql

CREATE TABLE IF NOT EXISTS patients (
    id_patient INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    date_naissance DATE NOT NULL,
    sexe ENUM('M', 'F') NOT NULL,
    adresse TEXT NOT NULL,
    telephone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    centre_id INT NOT NULL,
    groupe_sanguin ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
    taux_no_show DECIMAL(5,2) DEFAULT 0.00,
    statut ENUM('actif', 'inactif', 'decede') DEFAULT 'actif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES utilisateurs(id_user) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (centre_id) REFERENCES centres_sante(id_centre) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_centre (centre_id),
    INDEX idx_nom_prenom (nom, prenom),
    INDEX idx_telephone (telephone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertion de quelques patients d'exemple
INSERT INTO patients (nom, prenom, date_naissance, sexe, adresse, telephone, centre_id, groupe_sanguin) VALUES
('Diop', 'Fatou', '1985-03-15', 'F', '123 Rue de la Paix, Dakar', '+221776123456', 1, 'O+'),
('Sall', 'Mamadou', '1990-07-22', 'M', '45 Avenue Cheikh Anta Diop, Dakar', '+221776123457', 1, 'A+'),
('Ndiaye', 'Aissatou', '1978-11-08', 'F', '78 Boulevard de Thiès', '+221776123458', 3, 'B+'),
('Ba', 'Ousmane', '1982-05-30', 'M', '12 Route de Saint-Louis', '+221776123459', 4, 'AB+');

SELECT 'Table patients créée et peuplée avec succès!' as message;
