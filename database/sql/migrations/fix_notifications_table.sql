-- Migration pour corriger la table notifications
-- Ajouter les types manquants et la colonne rdv_id

-- 1. Modifier le type ENUM pour inclure les nouveaux types de notifications
ALTER TABLE notifications
MODIFY COLUMN type ENUM('SMS', 'email', 'push', 'retard', 'absence', 'reprogramme', 'confirmation', 'rappel', 'annulation') NOT NULL;

-- 2. Ajouter la colonne rdv_id si elle n'existe pas
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS rdv_id INT NULL AFTER patient_id,
ADD CONSTRAINT fk_notifications_rdv FOREIGN KEY (rdv_id) REFERENCES rendez_vous(id_rdv) ON DELETE SET NULL ON UPDATE CASCADE;

-- 3. Ajouter un index sur rdv_id pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_rdv_id ON notifications(rdv_id);

-- 4. Ajouter un index composite pour les recherches par RDV et type
CREATE INDEX IF NOT EXISTS idx_rdv_type ON notifications(rdv_id, type);

SELECT 'Migration de la table notifications terminée avec succès!' as message;

