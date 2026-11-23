/**
 * Script pour ajouter la colonne statut_operationnel à la table medecins
 * Exécuter avec: node src/scripts/add-statut-operationnel.js
 */

require('dotenv').config();
const { executeQuery } = require('../config/database');

async function addStatutOperationnel() {
    try {
        console.log('🔧 Début de la migration: ajout de statut_operationnel...\n');

        // Récupérer le nom de la base de données depuis les variables d'environnement
        const dbName = process.env.DB_NAME || 'sante_db';

        // Vérifier si la colonne existe déjà
        const checkColumn = await executeQuery(`
            SELECT COUNT(*) as count
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ?
            AND TABLE_NAME = 'medecins' 
            AND COLUMN_NAME = 'statut_operationnel'
        `, [dbName]);

        if (checkColumn[0].count > 0) {
            console.log('✅ La colonne statut_operationnel existe déjà.');
            console.log('✅ Migration déjà effectuée.\n');
            return;
        }

        // Ajouter la colonne
        console.log('📝 Ajout de la colonne statut_operationnel...');
        await executeQuery(`
            ALTER TABLE medecins 
            ADD COLUMN statut_operationnel ENUM('disponible', 'en_consultation', 'pause', 'indisponible') 
            DEFAULT 'disponible' 
            AFTER statut
        `);
        console.log('✅ Colonne ajoutée avec succès.\n');

        // Mettre à jour les médecins actifs
        console.log('📝 Mise à jour des médecins actifs...');
        const updateResult = await executeQuery(`
            UPDATE medecins 
            SET statut_operationnel = 'disponible' 
            WHERE statut = 'actif' AND (statut_operationnel IS NULL OR statut_operationnel = '')
        `);
        console.log(`✅ ${updateResult.affectedRows} médecins mis à jour.\n`);

        // Vérifier si l'index existe
        const checkIndex = await executeQuery(`
            SELECT COUNT(*) as count
            FROM INFORMATION_SCHEMA.STATISTICS 
            WHERE TABLE_SCHEMA = ?
            AND TABLE_NAME = 'medecins' 
            AND INDEX_NAME = 'idx_statut_operationnel'
        `, [dbName]);

        if (checkIndex[0].count === 0) {
            // Ajouter l'index
            console.log('📝 Ajout de l\'index idx_statut_operationnel...');
            await executeQuery(`
                CREATE INDEX idx_statut_operationnel ON medecins(statut_operationnel)
            `);
            console.log('✅ Index ajouté avec succès.\n');
        } else {
            console.log('✅ L\'index idx_statut_operationnel existe déjà.\n');
        }

        console.log('🎉 Migration terminée avec succès !');
        console.log('✅ La colonne statut_operationnel est maintenant disponible.\n');

    } catch (error) {
        console.error('❌ Erreur lors de la migration:', error.message);
        
        // Si l'erreur est "Duplicate column name", la colonne existe déjà
        if (error.message.includes('Duplicate column name') || error.code === 'ER_DUP_FIELDNAME') {
            console.log('ℹ️  La colonne existe déjà. Aucune action nécessaire.\n');
            return;
        }
        
        // Si l'erreur est "Duplicate key name", l'index existe déjà
        if (error.message.includes('Duplicate key name') || error.code === 'ER_DUP_KEYNAME') {
            console.log('ℹ️  L\'index existe déjà. Aucune action nécessaire.\n');
            return;
        }
        
        throw error;
    }
}

// Exécuter la migration
addStatutOperationnel()
    .then(() => {
        console.log('✅ Script terminé.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Erreur fatale:', error);
        process.exit(1);
    });

