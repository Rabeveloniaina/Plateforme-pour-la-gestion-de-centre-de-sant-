-- Création de la table des statistiques
-- Exécuter après 007_rendez_vous.sql

CREATE TABLE IF NOT EXISTS statistiques (
    id_stat INT AUTO_INCREMENT PRIMARY KEY,
    centre_id INT NULL,
    region_id INT NULL,
    periode VARCHAR(20) NOT NULL, -- 'jour', 'semaine', 'mois', 'annee'
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    nb_consultations INT DEFAULT 0,
    nb_patients INT DEFAULT 0,
    nb_rdv INT DEFAULT 0,
    nb_sans_rdv INT DEFAULT 0,
    temps_moyen_consultation DECIMAL(5,2) DEFAULT 0.00,
    taux_respect_rdv DECIMAL(5,2) DEFAULT 0.00,
    maladies_tendance JSON,
    couverture_vaccinale JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (centre_id) REFERENCES centres_sante(id_centre) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (region_id) REFERENCES regions(id_region) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_centre (centre_id),
    INDEX idx_region (region_id),
    INDEX idx_periode (periode, date_debut, date_fin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertion de quelques statistiques d'exemple
INSERT INTO statistiques (centre_id, region_id, periode, date_debut, date_fin, nb_consultations, nb_patients, nb_rdv, temps_moyen_consultation) VALUES
(1, 1, 'jour', '2024-01-15', '2024-01-15', 45, 40, 35, 28.5),
(3, 2, 'jour', '2024-01-15', '2024-01-15', 32, 30, 28, 32.0),
(4, 3, 'jour', '2024-01-15', '2024-01-15', 28, 25, 22, 35.0);

SELECT 'Table statistiques créée et peuplée avec succès!' as message;
