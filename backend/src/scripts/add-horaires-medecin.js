/**
 * Script pour ajouter les colonnes horaires_medecin et gestion_dynamique_statut
 * Exécuter avec: node src/scripts/add-horaires-medecin.js
 */

require('dotenv').config();
const { executeQuery } = require('../config/database');

async function addHorairesMedecin() {
    try {
        console.log('🔧 Début de la migration: ajout des colonnes horaires...\n');

        const dbName = process.env.DB_NAME || 'sante_db';

        // Vérifier si horaires_medecin existe
        const checkHoraires = await executeQuery(`
            SELECT COUNT(*) as count
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ?
            AND TABLE_NAME = 'medecins' 
            AND COLUMN_NAME = 'horaires_medecin'
        `, [dbName]);

        if (checkHoraires[0].count === 0) {
            console.log('📝 Ajout de la colonne horaires_medecin...');
            await executeQuery(`
                ALTER TABLE medecins 
                ADD COLUMN horaires_medecin JSON COMMENT 'Horaires de travail du médecin'
            `);
            console.log('✅ Colonne horaires_medecin ajoutée.\n');
        } else {
            console.log('✅ La colonne horaires_medecin existe déjà.\n');
        }

        // Vérifier si gestion_dynamique_statut existe
        const checkGestion = await executeQuery(`
            SELECT COUNT(*) as count
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ?
            AND TABLE_NAME = 'medecins' 
            AND COLUMN_NAME = 'gestion_dynamique_statut'
        `, [dbName]);

        if (checkGestion[0].count === 0) {
            console.log('📝 Ajout de la colonne gestion_dynamique_statut...');
            await executeQuery(`
                ALTER TABLE medecins 
                ADD COLUMN gestion_dynamique_statut BOOLEAN DEFAULT TRUE COMMENT 'Active la gestion automatique du statut selon les horaires'
            `);
            console.log('✅ Colonne gestion_dynamique_statut ajoutée.\n');
        } else {
            console.log('✅ La colonne gestion_dynamique_statut existe déjà.\n');
        }

        console.log('🎉 Migration terminée avec succès !\n');

    } catch (error) {
        console.error('❌ Erreur lors de la migration:', error.message);
        
        if (error.message.includes('Duplicate column name') || error.code === 'ER_DUP_FIELDNAME') {
            console.log('ℹ️  Les colonnes existent déjà. Aucune action nécessaire.\n');
            return;
        }
        
        throw error;
    }
}

// Exécuter la migration
addHorairesMedecin()
    .then(() => {
        console.log('✅ Script terminé.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Erreur fatale:', error);
        process.exit(1);
    });

