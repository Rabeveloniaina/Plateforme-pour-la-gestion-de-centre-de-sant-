-- Migration pour ajouter le support des notifications in-app
-- Date: 2025-11-19

-- Ajouter le type 'in_app' dans l'ENUM des types
ALTER TABLE notifications 
MODIFY COLUMN type ENUM('SMS', 'email', 'push', 'in_app', 'retard', 'absence', 'reprogramme', 'confirmation', 'rappel', 'annulation') NOT NULL;

-- Ajouter le champ 'lu' pour tracker si la notification a été lue
ALTER TABLE notifications 
ADD COLUMN lu BOOLEAN DEFAULT FALSE AFTER statut;

-- Ajouter un index sur le champ 'lu' pour optimiser les requêtes
ALTER TABLE notifications 
ADD INDEX idx_lu (lu);

-- Ajouter un index composé pour les requêtes de notifications non lues par patient
ALTER TABLE notifications 
ADD INDEX idx_patient_lu (patient_id, lu);

-- Ajouter un index composé pour les requêtes de notifications non lues par médecin
ALTER TABLE notifications 
ADD INDEX idx_medecin_lu (medecin_id, lu);

SELECT 'Migration des notifications in-app effectuée avec succès!' as message;
