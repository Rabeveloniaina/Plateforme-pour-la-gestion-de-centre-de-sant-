/**
 * Script de validation de la structure des données médecins
 * 
 * Vérifie:
 * - Tous les utilisateurs medecin ont un enregistrement dans medecins
 * - Tous les medecins actifs ont un user_id valide
 * - Cohérence des données (email, centre_id)
 * - Intégrité référentielle
 */

const { executeQuery } = require('../src/config/database');

async function validateMedecinsStructure() {
    console.log('🔍 VALIDATION DE LA STRUCTURE MÉDECINS\n');
    console.log('='.repeat(60) + '\n');

    let errorsFound = 0;
    let warningsFound = 0;

    try {
        // TEST 1: Utilisateurs médecin sans enregistrement dans medecins
        console.log('📋 Test 1: Utilisateurs médecin sans enregistrement médecin');
        const usersSansmedecin = await executeQuery(`
            SELECT u.id_user, u.nom_utilisateur, u.email
            FROM utilisateurs u
            LEFT JOIN medecins m ON u.id_user = m.user_id
            WHERE u.role = 'medecin' AND m.user_id IS NULL
        `);

        if (usersSansmedecin.length > 0) {
            console.log(`   ❌ ERREUR: ${usersSansmedecin.length} utilisateur(s) médecin sans enregistrement`);
            console.table(usersSansmedecin);
            errorsFound += usersSansmedecin.length;
        } else {
            console.log('   ✅ OK: Tous les utilisateurs médecin ont un enregistrement médecin');
        }

        // TEST 2: Médecins actifs sans user_id
        console.log('\n📋 Test 2: Médecins actifs sans compte utilisateur');
        const medecinsSansUser = await executeQuery(`
            SELECT m.id_medecin, CONCAT(m.nom, ' ', m.prenom) as nom_complet, m.email, m.statut
            FROM medecins m
            WHERE m.user_id IS NULL AND m.statut = 'actif'
        `);

        if (medecinsSansUser.length > 0) {
            console.log(`   ⚠️  ATTENTION: ${medecinsSansUser.length} médecin(s) actif(s) sans compte utilisateur`);
            console.table(medecinsSansUser);
            warningsFound += medecinsSansUser.length;
        } else {
            console.log('   ✅ OK: Tous les médecins actifs ont un compte utilisateur');
        }

        // TEST 3: Médecins avec user_id invalide
        console.log('\n📋 Test 3: Médecins avec user_id invalide');
        const medecinsUserInvalide = await executeQuery(`
            SELECT m.id_medecin, m.user_id, CONCAT(m.nom, ' ', m.prenom) as nom_complet
            FROM medecins m
            LEFT JOIN utilisateurs u ON m.user_id = u.id_user
            WHERE m.user_id IS NOT NULL AND u.id_user IS NULL
        `);

        if (medecinsUserInvalide.length > 0) {
            console.log(`   ❌ ERREUR: ${medecinsUserInvalide.length} médecin(s) avec user_id invalide`);
            console.table(medecinsUserInvalide);
            errorsFound += medecinsUserInvalide.length;
        } else {
            console.log('   ✅ OK: Tous les user_id sont valides');
        }

        // TEST 4: Incohérence email entre utilisateur et médecin
        console.log('\n📋 Test 4: Cohérence des emails utilisateur ↔ médecin');
        const emailsInconsistants = await executeQuery(`
            SELECT 
                u.id_user,
                u.nom_utilisateur,
                u.email as user_email,
                m.id_medecin,
                m.email as medecin_email
            FROM utilisateurs u
            INNER JOIN medecins m ON u.id_user = m.user_id
            WHERE u.role = 'medecin' 
              AND u.email IS NOT NULL 
              AND m.email IS NOT NULL
              AND u.email != m.email
        `);

        if (emailsInconsistants.length > 0) {
            console.log(`   ⚠️  ATTENTION: ${emailsInconsistants.length} incohérence(s) d'email détectée(s)`);
            console.table(emailsInconsistants);
            warningsFound += emailsInconsistants.length;
        } else {
            console.log('   ✅ OK: Tous les emails sont cohérents');
        }

        // TEST 5: Utilisateurs avec role='medecin' mais user_id lié à un autre médecin
        console.log('\n📋 Test 5: Doublons de liaison');
        const doublons = await executeQuery(`
            SELECT 
                m.user_id,
                COUNT(*) as nb_medecins,
                GROUP_CONCAT(m.id_medecin) as medecins_ids
            FROM medecins m
            WHERE m.user_id IS NOT NULL
            GROUP BY m.user_id
            HAVING COUNT(*) > 1
        `);

        if (doublons.length > 0) {
            console.log(`   ❌ ERREUR: ${doublons.length} utilisateur(s) lié(s) à plusieurs médecins`);
            console.table(doublons);
            errorsFound += doublons.length;
        } else {
            console.log('   ✅ OK: Pas de doublons de liaison');
        }

        // STATISTIQUES GLOBALES
        console.log('\n' + '='.repeat(60));
        console.log('📊 STATISTIQUES GLOBALES\n');

        const stats = await executeQuery(`
            SELECT 
                (SELECT COUNT(*) FROM utilisateurs WHERE role = 'medecin') as total_users_medecin,
                (SELECT COUNT(*) FROM medecins) as total_medecins,
                (SELECT COUNT(*) FROM medecins WHERE user_id IS NOT NULL) as medecins_lies,
                (SELECT COUNT(*) FROM medecins WHERE user_id IS NULL) as medecins_orphelins,
                (SELECT COUNT(*) FROM medecins WHERE statut = 'actif') as medecins_actifs
        `);

        console.table(stats);

        // RÉSUMÉ FINAL
        console.log('\n' + '='.repeat(60));
        console.log('📋 RÉSUMÉ DE LA VALIDATION\n');

        if (errorsFound === 0 && warningsFound === 0) {
            console.log('   ✅ PARFAIT! Aucune erreur ni avertissement détecté.');
            console.log('   👍 La structure des données médecins est cohérente et complète.\n');
        } else {
            if (errorsFound > 0) {
                console.log(`   ❌ ${errorsFound} ERREUR(S) CRITIQUE(S) détectée(s)`);
                console.log('   → Action requise: Exécuter le script fix-medecins-links.js\n');
            }
            if (warningsFound > 0) {
                console.log(`   ⚠️  ${warningsFound} AVERTISSEMENT(S) détecté(s)`);
                console.log('   → Recommandation: Vérifier manuellement les incohérences\n');
            }
        }

        process.exit(errorsFound > 0 ? 1 : 0);

    } catch (error) {
        console.error('\n❌ Erreur lors de la validation:', error);
        process.exit(1);
    }
}

// Exécuter si appelé directement
if (require.main === module) {
    validateMedecinsStructure();
}

module.exports = { validateMedecinsStructure };

