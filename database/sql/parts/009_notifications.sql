-- Création de la table des notifications
-- Exécuter après 008_statistiques.sql

CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NULL,
    medecin_id INT NULL,
    type ENUM('SMS', 'email', 'push', 'in_app', 'retard', 'absence', 'reprogramme', 'confirmation', 'rappel', 'annulation') NOT NULL,
    titre VARCHAR(255),
    message TEXT NOT NULL,
    statut ENUM('en_attente', 'envoye', 'echoue') DEFAULT 'en_attente',
    lu BOOLEAN DEFAULT FALSE,
    date_envoi TIMESTAMP NULL,
    tentatives INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id_patient) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (medecin_id) REFERENCES medecins(id_medecin) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_patient (patient_id),
    INDEX idx_medecin (medecin_id),
    INDEX idx_statut (statut),
    INDEX idx_type (type),
    INDEX idx_lu (lu),
    INDEX idx_patient_lu (patient_id, lu),
    INDEX idx_medecin_lu (medecin_id, lu)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Insertion de quelques notifications d'exemple
INSERT INTO notifications (patient_id, type, message, statut) VALUES
(1, 'SMS', 'Rappel: RDV demain 15/01 à 09h00 avec Dr. Diallo', 'envoye'),
(2, 'email', 'Confirmation de votre RDV du 15/01 à 09h30', 'envoye'),
(3, 'SMS', 'Votre RDV du 15/01 à 10h00 est confirmé', 'en_attente');

SELECT 'Table notifications créée et peuplée avec succès!' as message;
