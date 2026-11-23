/**
 * Script de correction automatique des liens utilisateurs ↔ médecins
 * 
 * Fonctionnalités:
 * 1. Lier automatiquement les médecins existants aux utilisateurs (par email)
 * 2. Créer des médecins pour les utilisateurs medecin sans enregistrement
 * 3. Identifier les incohérences
 */

const { executeQuery } = require('../src/config/database');

async function fixMedecinsLinks() {
    try {
        console.log('🔧 Démarrage de la correction des liens utilisateurs ↔ médecins\n');

        // 1. Vérifier les utilisateurs médecins sans enregistrement dans medecins
        console.log('📋 Étape 1: Vérification des utilisateurs médecins...');
        const utilisateursMedecins = await executeQuery(`
            SELECT u.id_user, u.nom_utilisateur, u.email, u.id_centre
            FROM utilisateurs u
            LEFT JOIN medecins m ON u.id_user = m.user_id
            WHERE u.role = 'medecin' AND m.user_id IS NULL
        `);

        console.log(`   ℹ️  Trouvé ${utilisateursMedecins.length} utilisateur(s) médecin sans enregistrement médecin\n`);

        if (utilisateursMedecins.length > 0) {
            console.log('📝 Création des enregistrements médecins manquants...');
            
            for (const user of utilisateursMedecins) {
                // Créer un enregistrement médecin minimal
                const numeroLicence = `AUTO-${Date.now()}-${user.id_user}`;
                
                await executeQuery(`
                    INSERT INTO medecins (
                        nom, prenom, sexe, date_naissance, specialite,
                        numero_licence, telephone, email, centre_id, user_id, statut
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    'À compléter',
                    'À compléter',
                    'M',
                    '1990-01-01',
                    'Médecine Générale',
                    numeroLicence,
                    '0000000000',
                    user.email || `user${user.id_user}@temp.local`,
                    user.id_centre || 1,
                    user.id_user,
                    'actif'
                ]);

                console.log(`   ✅ Médecin créé pour utilisateur ${user.nom_utilisateur} (id_user=${user.id_user})`);
            }
        }

        // 2. Tenter de lier les médecins orphelins par email
        console.log('\n📋 Étape 2: Liaison des médecins orphelins par email...');
        const result = await executeQuery(`
            UPDATE medecins m
            INNER JOIN utilisateurs u ON m.email = u.email
            SET m.user_id = u.id_user
            WHERE u.role = 'medecin' AND m.user_id IS NULL
        `);

        console.log(`   ✅ ${result.affectedRows} médecin(s) lié(s) automatiquement par email\n`);

        // 3. Rapport final
        console.log('📊 Rapport final:\n');

        const medecinsLies = await executeQuery(`
            SELECT 
                u.id_user,
                u.nom_utilisateur,
                u.email as user_email,
                m.id_medecin,
                CONCAT(m.nom, ' ', m.prenom) as nom_complet,
                m.specialite,
                c.nom as centre_nom
            FROM utilisateurs u
            INNER JOIN medecins m ON u.id_user = m.user_id
            LEFT JOIN centres_sante c ON m.centre_id = c.id_centre
            WHERE u.role = 'medecin'
            ORDER BY u.id_user
        `);

        console.log(`   ✅ ${medecinsLies.length} médecin(s) correctement lié(s):`);
        console.table(medecinsLies);

        const medecinsOrphelins = await executeQuery(`
            SELECT 
                m.id_medecin,
                CONCAT(m.nom, ' ', m.prenom) as nom_complet,
                m.email,
                m.specialite
            FROM medecins m
            WHERE m.user_id IS NULL
        `);

        if (medecinsOrphelins.length > 0) {
            console.log(`\n   ⚠️  ${medecinsOrphelins.length} médecin(s) toujours sans compte utilisateur:`);
            console.table(medecinsOrphelins);
            console.log('   💡 Action requise: Créer des comptes utilisateurs pour ces médecins ou les supprimer.\n');
        } else {
            console.log('\n   ✅ Tous les médecins sont liés à un compte utilisateur!\n');
        }

        console.log('✅ Correction terminée avec succès!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Erreur lors de la correction:', error);
        process.exit(1);
    }
}

// Exécuter si appelé directement
if (require.main === module) {
    fixMedecinsLinks();
}

module.exports = { fixMedecinsLinks };

