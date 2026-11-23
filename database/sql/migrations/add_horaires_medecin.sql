-- Migration pour améliorer la gestion des horaires des médecins
-- Cette migration ajoute un champ horaires_medecin pour stocker les horaires de travail

-- Vérifier si la colonne existe déjà et l'ajouter si elle n'existe pas
SET @column_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'medecins' 
    AND COLUMN_NAME = 'horaires_medecin'
);

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE medecins 
     ADD COLUMN horaires_medecin JSON COMMENT \'Horaires de travail du médecin (format: {jour: {debut: "HH:MM", fin: "HH:MM", actif: true/false}})\'',
    'SELECT \'La colonne horaires_medecin existe déjà\' as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter un champ pour activer/désactiver la gestion dynamique du statut
SET @column_exists_auto = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'medecins' 
    AND COLUMN_NAME = 'gestion_dynamique_statut'
);

SET @sql_auto = IF(@column_exists_auto = 0,
    'ALTER TABLE medecins 
     ADD COLUMN gestion_dynamique_statut BOOLEAN DEFAULT TRUE COMMENT \'Active la gestion automatique du statut selon les horaires\'',
    'SELECT \'La colonne gestion_dynamique_statut existe déjà\' as message'
);

PREPARE stmt_auto FROM @sql_auto;
EXECUTE stmt_auto;
DEALLOCATE PREPARE stmt_auto;

SELECT 'Migration add_horaires_medecin terminée avec succès!' as message;

