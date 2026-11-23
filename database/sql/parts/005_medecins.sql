-- Création de la table des médecins
-- Exécuter après 004_patients.sql

CREATE TABLE IF NOT EXISTS medecins (
    id_medecin INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    sexe ENUM('M', 'F') NOT NULL,
    date_naissance DATE NOT NULL,
    specialite VARCHAR(100) NOT NULL,
    experience INT DEFAULT 0,
    diplome VARCHAR(200),
    numero_licence VARCHAR(50) UNIQUE NOT NULL,
    telephone VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    centre_id INT NOT NULL,
    disponibilite JSON,
    statut ENUM('actif', 'inactif', 'conges', 'retraite') DEFAULT 'actif',
    statut_operationnel ENUM('disponible', 'en_consultation', 'pause', 'indisponible') DEFAULT 'disponible',
    horaires_medecin JSON COMMENT 'Horaires de travail du médecin (format: {jour: {debut: "HH:MM", fin: "HH:MM", actif: true/false}})',
    gestion_dynamique_statut BOOLEAN DEFAULT TRUE COMMENT 'Active la gestion automatique du statut selon les horaires',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES utilisateurs(id_user) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (centre_id) REFERENCES centres_sante(id_centre) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_centre (centre_id),
    INDEX idx_specialite (specialite),
    INDEX idx_statut (statut),
    INDEX idx_statut_operationnel (statut_operationnel)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertion de quelques médecins d'exemple
INSERT INTO medecins (nom, prenom, sexe, date_naissance, specialite, experience, numero_licence, telephone, email, centre_id) VALUES
('Diallo', 'Dr. Amadou', 'M', '1975-06-12', 'Médecine Générale', 25, 'MG001', '+221776123460', 'dr.diallo@sante.sn', 1),
('Sow', 'Dr. Fatou', 'F', '1980-09-25', 'Pédiatrie', 20, 'PED001', '+221776123461', 'dr.sow@sante.sn', 1),
('Cissé', 'Dr. Ibrahima', 'M', '1982-03-18', 'Cardiologie', 18, 'CARD001', '+221776123462', 'dr.cisse@sante.sn', 4),
('Thiam', 'Dr. Mariama', 'F', '1978-12-05', 'Gynécologie', 22, 'GYN001', '+221776123463', 'dr.thiam@sante.sn', 3);

SELECT 'Table medecins créée et peuplée avec succès!' as message;
