-- Création de la table des prescriptions
-- Exécuter après 006_fiches_medicales.sql

CREATE TABLE IF NOT EXISTS prescriptions (
    id_prescription INT AUTO_INCREMENT PRIMARY KEY,
    fiche_medicale_id INT NOT NULL,
    medicament_id INT NOT NULL,
    dosage_prescrit VARCHAR(100) NOT NULL,
    frequence VARCHAR(50) NOT NULL,
    duree_traitement INT NOT NULL COMMENT 'Durée en jours',
    quantite_totale INT NOT NULL,
    instructions_specifiques TEXT,
    moment_prise ENUM('matin', 'midi', 'soir', 'selon_besoin', 'avant_repas', 'apres_repas') DEFAULT 'selon_besoin',
    date_debut DATE NOT NULL,
    date_fin DATE,
    statut ENUM('active', 'terminee', 'arretee', 'modifiee') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (fiche_medicale_id) REFERENCES fiches_medicales(id_fiche) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (medicament_id) REFERENCES medicaments(id_medicament) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_fiche (fiche_medicale_id),
    INDEX idx_medicament (medicament_id),
    INDEX idx_statut (statut),
    INDEX idx_date_debut (date_debut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertion de quelques prescriptions d'exemple
INSERT INTO prescriptions (fiche_medicale_id, medicament_id, dosage_prescrit, frequence, duree_traitement, quantite_totale, instructions_specifiques, moment_prise, date_debut, date_fin, statut) VALUES
(1, 1, '500mg', '3 fois par jour', 7, 21, 'Prendre avec un grand verre d\'eau', 'apres_repas', '2024-01-15', '2024-01-22', 'terminee'),
(1, 2, '10mg', '1 fois par jour', 30, 30, 'Prendre le matin à jeun', 'matin', '2024-01-15', '2024-02-14', 'active'),
(2, 3, '250mg', '2 fois par jour', 10, 20, 'Prendre avec de la nourriture', 'apres_repas', '2024-01-20', '2024-01-30', 'terminee');

SELECT 'Table prescriptions créée et peuplée avec succès!' as message;
