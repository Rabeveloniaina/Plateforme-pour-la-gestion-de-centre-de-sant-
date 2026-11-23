-- Migration pour ajouter le champ statut_operationnel à la table medecins
-- Ce champ permet de gérer le statut opérationnel du médecin en temps réel

-- Vérifier si la colonne existe déjà et l'ajouter si elle n'existe pas
SET @column_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'medecins' 
    AND COLUMN_NAME = 'statut_operationnel'
);

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE medecins 
     ADD COLUMN statut_operationnel ENUM(\'disponible\', \'en_consultation\', \'pause\', \'indisponible\') 
     DEFAULT \'disponible\' 
     AFTER statut',
    'SELECT \'La colonne statut_operationnel existe déjà\' as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Mettre à jour tous les médecins actifs pour avoir le statut 'disponible' par défaut
UPDATE medecins 
SET statut_operationnel = 'disponible' 
WHERE statut = 'actif' AND (statut_operationnel IS NULL OR statut_operationnel = '');

-- Vérifier si l'index existe déjà et l'ajouter si nécessaire
SET @index_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'medecins' 
    AND INDEX_NAME = 'idx_statut_operationnel'
);

SET @sql_index = IF(@index_exists = 0,
    'CREATE INDEX idx_statut_operationnel ON medecins(statut_operationnel)',
    'SELECT \'L\'index idx_statut_operationnel existe déjà\' as message'
);

PREPARE stmt_index FROM @sql_index;
EXECUTE stmt_index;
DEALLOCATE PREPARE stmt_index;

SELECT 'Migration add_statut_operationnel terminée avec succès!' as message;

