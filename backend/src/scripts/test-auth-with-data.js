/**
 * Script pour tester l'authentification avec les données existantes dans la base
 */

const { executeQuery } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_jwt_par_defaut_changez_en_production';

async function testAuth() {
    try {
        console.log('🔐 Test de l\'authentification avec les données existantes\n');

        // Récupérer un utilisateur de test
        const users = await executeQuery(
            'SELECT id_user, nom_utilisateur, email, mot_de_passe, role FROM utilisateurs LIMIT 5'
        );

        if (users.length === 0) {
            console.log('❌ Aucun utilisateur trouvé dans la base de données');
            console.log('💡 Créez des utilisateurs de test avec le script insert-test-data.js');
            return;
        }

        console.log(`✅ ${users.length} utilisateur(s) trouvé(s)\n`);

        // Tester avec le premier utilisateur
        const user = users[0];
        console.log(`📋 Test avec l'utilisateur: ${user.nom_utilisateur} (${user.email})`);
        console.log(`   Rôle: ${user.role}`);
        console.log(`   ID: ${user.id_user}\n`);

        // Simuler une connexion (on ne peut pas tester le mot de passe sans le connaître)
        // Mais on peut créer un token JWT pour tester les routes protégées
        const token = jwt.sign(
            {
                id: user.id_user,
                username: user.nom_utilisateur,
                role: user.role,
                email: user.email
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('✅ Token JWT généré avec succès');
        console.log(`📝 Token: ${token.substring(0, 50)}...\n`);

        // Tester une requête avec le token
        const axios = require('axios');
        const API_BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

        console.log('🧪 Test d\'une requête authentifiée...\n');

        try {
            const response = await axios.get(`${API_BASE_URL}/patients`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('✅ Requête authentifiée réussie !');
            console.log(`   Status: ${response.status}`);
            console.log(`   Patients: ${response.data.data?.length || 0}\n`);
        } catch (error) {
            if (error.response) {
                console.log(`⚠️  Erreur HTTP ${error.response.status}: ${error.response.data.message || error.message}`);
            } else {
                console.log(`❌ Erreur: ${error.message}`);
                console.log('💡 Assurez-vous que le serveur backend est démarré');
            }
        }

        // Afficher les instructions
        console.log('\n📋 Instructions pour tester manuellement:');
        console.log('1. Utilisez ce token dans vos requêtes:');
        console.log(`   Authorization: Bearer ${token}\n`);
        console.log('2. Ou testez avec curl:');
        console.log(`   curl -H "Authorization: Bearer ${token}" ${API_BASE_URL}/patients\n`);

    } catch (error) {
        console.error('❌ Erreur lors du test:', error.message);
        process.exit(1);
    }
}

// Exécution
if (require.main === module) {
    testAuth().then(() => {
        process.exit(0);
    }).catch(error => {
        console.error('❌ Erreur:', error);
        process.exit(1);
    });
}

module.exports = { testAuth };

