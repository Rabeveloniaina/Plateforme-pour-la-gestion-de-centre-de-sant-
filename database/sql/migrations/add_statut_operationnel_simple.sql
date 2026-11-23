-- Migration SIMPLIFIÉE pour ajouter le champ statut_operationnel à la table medecins
-- Version compatible avec toutes les versions de MySQL
-- À exécuter dans votre client MySQL (phpMyAdmin, MySQL Workbench, etc.)

USE sante_db;

-- Ajouter la colonne statut_operationnel
ALTER TABLE medecins 
ADD COLUMN statut_operationnel ENUM('disponible', 'en_consultation', 'pause', 'indisponible') 
DEFAULT 'disponible' 
AFTER statut;

-- Mettre à jour tous les médecins actifs pour avoir le statut 'disponible' par défaut
UPDATE medecins 
SET statut_operationnel = 'disponible' 
WHERE statut = 'actif';

-- Ajouter un index pour améliorer les performances
CREATE INDEX idx_statut_operationnel ON medecins(statut_operationnel);

SELECT 'Migration add_statut_operationnel terminée avec succès!' as message;

