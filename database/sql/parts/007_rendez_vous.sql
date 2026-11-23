-- Création de la table des rendez-vous
-- Exécuter après 006_fiches_medicales.sql

CREATE TABLE IF NOT EXISTS rendez_vous (
    id_rdv INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    medecin_id INT NOT NULL,
    centre_id INT NOT NULL,
    date_rdv DATETIME NOT NULL,
    statut ENUM('attente', 'confirme', 'annule', 'termine', 'absent') DEFAULT 'attente',
    symptomes JSON,
    orientation ENUM('generaliste', 'specialiste', 'auto') DEFAULT 'generaliste',
    note_medecin TEXT,
    note_patient TEXT,
    duree_estimee INT DEFAULT 30,
    duree_reelle INT,
    heure_arrivee TIME,
    heure_debut_consultation TIME,
    heure_fin_consultation TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id_patient) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (medecin_id) REFERENCES medecins(id_medecin) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (centre_id) REFERENCES centres_sante(id_centre) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_patient (patient_id),
    INDEX idx_medecin (medecin_id),
    INDEX idx_centre (centre_id),
    INDEX idx_date_statut (date_rdv, statut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertion de quelques rendez-vous d'exemple
INSERT INTO rendez_vous (patient_id, medecin_id, centre_id, date_rdv, statut, symptomes, duree_estimee) VALUES
(1, 1, 1, '2024-01-15 09:00:00', 'confirme', '{"symptomes": ["fièvre", "toux"], "intensite": "moderee"}', 30),
(2, 1, 1, '2024-01-15 09:30:00', 'attente', '{"symptomes": ["maux de tête"], "intensite": "legere"}', 20),
(3, 2, 3, '2024-01-15 10:00:00', 'confirme', '{"symptomes": ["fatigue"], "intensite": "moderee"}', 45),
(4, 3, 4, '2024-01-15 14:00:00', 'attente', '{"symptomes": ["douleur thoracique"], "intensite": "severe"}', 60);

SELECT 'Table rendez_vous créée et peuplée avec succès!' as message;
