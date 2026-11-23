-- Migration: Ajouter les colonnes type_rdv et priorite à la table rendez_vous
-- Date: 2024
-- Description: Ajoute la gestion des types de RDV (normal/walk-in) et des priorités

-- Ajouter la colonne type_rdv
ALTER TABLE rendez_vous 
ADD COLUMN IF NOT EXISTS type_rdv ENUM('normal', 'walk_in', 'urgence') DEFAULT 'normal'
AFTER statut;

-- Ajouter la colonne priorite
ALTER TABLE rendez_vous 
ADD COLUMN IF NOT EXISTS priorite ENUM('normale', 'urgente') DEFAULT 'normale'
AFTER type_rdv;

-- Ajouter des index pour améliorer les performances
ALTER TABLE rendez_vous
ADD INDEX IF NOT EXISTS idx_type_rdv (type_rdv);

ALTER TABLE rendez_vous
ADD INDEX IF NOT EXISTS idx_priorite (priorite);

-- Mettre à jour les RDV existants (optionnel)
-- Tous les RDV existants sont considérés comme des RDV normaux avec priorité normale
UPDATE rendez_vous 
SET type_rdv = 'normal', priorite = 'normale'
WHERE type_rdv IS NULL OR priorite IS NULL;

SELECT 'Migration add_type_rdv_priorite terminée avec succès!' as message;

