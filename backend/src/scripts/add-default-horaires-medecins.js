/**
 * Script pour ajouter des horaires par défaut à tous les médecins actifs
 * qui n'ont pas encore d'horaires configurés
 */

require('dotenv').config();
const { executeQuery } = require('../config/database');

// Horaires par défaut : 8h-17h du lundi au vendredi, 8h-12h le samedi
const horairesParDefaut = {
    lundi: { actif: true, debut: '08:00', fin: '17:00' },
    mardi: { actif: true, debut: '08:00', fin: '17:00' },
    mercredi: { actif: true, debut: '08:00', fin: '17:00' },
    jeudi: { actif: true, debut: '08:00', fin: '17:00' },
    vendredi: { actif: true, debut: '08:00', fin: '17:00' },
    samedi: { actif: true, debut: '08:00', fin: '12:00' },
    dimanche: { actif: false, debut: '08:00', fin: '17:00' }
};

async function addDefaultHorairesMedecins() {
    try {
        console.log('🔧 Début de l\'ajout des horaires par défaut aux médecins actifs...\n');

        // 1. Vérifier si la colonne horaires_medecin existe
        const dbName = process.env.DB_NAME || 'sante_db';
        const checkColumn = await executeQuery(`
            SELECT COUNT(*) as count
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ?
            AND TABLE_NAME = 'medecins' 
            AND COLUMN_NAME = 'horaires_medecin'
        `, [dbName]);

        if (checkColumn[0].count === 0) {
            console.log('❌ La colonne horaires_medecin n\'existe pas. Veuillez d\'abord exécuter la migration add-horaires-medecin.sql');
            process.exit(1);
        }

        // 2. Récupérer tous les médecins actifs sans horaires configurés
        const medecinsSansHoraires = await executeQuery(`
            SELECT id_medecin, nom, prenom, specialite, centre_id, horaires_medecin
            FROM medecins
            WHERE statut = 'actif'
            AND (
                horaires_medecin IS NULL 
                OR horaires_medecin = 'null'
                OR horaires_medecin = ''
                OR horaires_medecin = '{}'
                OR JSON_LENGTH(horaires_medecin) = 0
            )
        `);

        console.log(`📊 Médecins actifs sans horaires: ${medecinsSansHoraires.length}\n`);

        if (medecinsSansHoraires.length === 0) {
            console.log('✅ Tous les médecins actifs ont déjà des horaires configurés.\n');
            return;
        }

        // 3. Ajouter les horaires par défaut à chaque médecin
        let successCount = 0;
        let errorCount = 0;

        for (const medecin of medecinsSansHoraires) {
            try {
                await executeQuery(`
                    UPDATE medecins 
                    SET horaires_medecin = ?
                    WHERE id_medecin = ?
                `, [JSON.stringify(horairesParDefaut), medecin.id_medecin]);

                console.log(`✅ Horaires ajoutés à Dr. ${medecin.prenom} ${medecin.nom} (${medecin.specialite}) - Centre ${medecin.centre_id}`);
                successCount++;
            } catch (error) {
                console.error(`❌ Erreur pour Dr. ${medecin.prenom} ${medecin.nom}:`, error.message);
                errorCount++;
            }
        }

        console.log(`\n📊 Résumé:`);
        console.log(`   ✅ Succès: ${successCount}`);
        console.log(`   ❌ Erreurs: ${errorCount}`);
        console.log(`   📝 Total: ${medecinsSansHoraires.length}\n`);

        console.log('🎉 Script terminé avec succès !\n');

    } catch (error) {
        console.error('❌ Erreur lors de l\'exécution du script:', error);
        process.exit(1);
    }
}

// Exécuter le script
if (require.main === module) {
    addDefaultHorairesMedecins()
        .then(() => {
            console.log('✅ Script terminé');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Erreur:', error);
            process.exit(1);
        });
}

module.exports = { addDefaultHorairesMedecins, horairesParDefaut };

