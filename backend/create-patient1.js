const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function createPatient1() {
    let connection;
    try {
        // Connexion à la base de données
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'sante_db'
        });

        console.log('🔗 Connexion à la base de données établie');

        // 1. Vérifier si l'utilisateur existe déjà
        const [existingUsers] = await connection.execute(
            'SELECT id_user FROM utilisateurs WHERE nom_utilisateur = ?',
            ['patient1']
        );

        if (existingUsers.length > 0) {
            console.log('⚠️  L\'utilisateur patient1 existe déjà (ID:', existingUsers[0].id_user + ')');
            
            // Vérifier si le profil patient existe
            const [existingPatients] = await connection.execute(
                'SELECT id_patient FROM patients WHERE user_id = ?',
                [existingUsers[0].id_user]
            );

            if (existingPatients.length > 0) {
                console.log('✅ Le profil patient existe déjà (ID:', existingPatients[0].id_patient + ')');
                console.log('✅ Compte complet déjà créé !');
                await connection.end();
                return;
            } else {
                console.log('⚠️  Utilisateur existe mais profil patient manquant. Création du profil...');
                // Continuer pour créer le profil patient
            }
        }

        // 2. Hasher le mot de passe
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        console.log('✅ Mot de passe hashé');

        // 3. Trouver un centre de santé actif
        const [centres] = await connection.execute(
            'SELECT id_centre, nom, region_id FROM centres_sante WHERE statut = "actif" LIMIT 1'
        );

        if (centres.length === 0) {
            console.log('❌ Aucun centre de santé actif trouvé');
            console.log('📝 Création d\'un centre de santé par défaut...');
            
            // Créer une région par défaut si nécessaire
            const [regions] = await connection.execute(
                'SELECT id_region FROM regions LIMIT 1'
            );
            
            let regionId = 1;
            if (regions.length > 0) {
                regionId = regions[0].id_region;
            } else {
                // Créer une région par défaut
                const [regionResult] = await connection.execute(
                    'INSERT INTO regions (nom, code_region) VALUES (?, ?)',
                    ['Dakar', 'DK']
                );
                regionId = regionResult.insertId;
                console.log('✅ Région créée (ID:', regionId + ')');
            }

            // Créer un centre par défaut
            const [centreResult] = await connection.execute(
                'INSERT INTO centres_sante (nom, adresse, region_id, telephone, email, statut) VALUES (?, ?, ?, ?, ?, ?)',
                ['Centre de Santé Principal', 'Adresse par défaut', regionId, '33 123 45 67', 'centre@default.sn', 'actif']
            );
            centres.push({ id_centre: centreResult.insertId, region_id: regionId });
            console.log('✅ Centre de santé créé (ID:', centreResult.insertId + ')');
        }

        const centre = centres[0];
        console.log('✅ Centre de santé trouvé:', centre.nom, '(ID:', centre.id_centre + ')');

        // 4. Créer ou mettre à jour l'utilisateur
        let userId;
        if (existingUsers.length > 0) {
            // Mettre à jour l'utilisateur existant
            userId = existingUsers[0].id_user;
            await connection.execute(
                'UPDATE utilisateurs SET mot_de_passe = ?, email = ?, role = ?, statut = ?, id_centre = ? WHERE id_user = ?',
                [hashedPassword, 'patient1@sante.sn', 'patient', 'actif', centre.id_centre, userId]
            );
            console.log('✅ Utilisateur mis à jour (ID:', userId + ')');
        } else {
            // Créer un nouvel utilisateur
            const [userResult] = await connection.execute(
                'INSERT INTO utilisateurs (nom_utilisateur, mot_de_passe, email, role, statut, id_centre) VALUES (?, ?, ?, ?, ?, ?)',
                ['patient1', hashedPassword, 'patient1@sante.sn', 'patient', 'actif', centre.id_centre]
            );
            userId = userResult.insertId;
            console.log('✅ Utilisateur créé (ID:', userId + ')');
        }

        // 5. Vérifier si le profil patient existe déjà
        const [existingPatients] = await connection.execute(
            'SELECT id_patient FROM patients WHERE user_id = ?',
            [userId]
        );

        if (existingPatients.length > 0) {
            console.log('✅ Profil patient existe déjà (ID:', existingPatients[0].id_patient + ')');
            console.log('✅ Compte complet déjà créé !');
        } else {
            // 6. Créer le profil patient
            const [patientResult] = await connection.execute(
                'INSERT INTO patients (nom, prenom, date_naissance, sexe, adresse, telephone, email, centre_id, region_id, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    'Patient',           // nom
                    'Test',              // prenom
                    '1990-01-15',        // date_naissance
                    'M',                  // sexe
                    'Adresse Test',       // adresse
                    '77 123 45 67',      // telephone
                    'patient1@sante.sn', // email
                    centre.id_centre,     // centre_id
                    centre.region_id,     // region_id
                    userId                // user_id
                ]
            );

            console.log('✅ Profil patient créé (ID:', patientResult.insertId + ')');
        }

        // 7. Vérification finale
        const [verif] = await connection.execute(
            `SELECT 
                u.id_user, u.nom_utilisateur, u.email as user_email, u.role, u.statut,
                p.id_patient, p.nom, p.prenom, p.email as patient_email, p.telephone,
                c.nom as centre_nom, r.nom as region_nom
            FROM utilisateurs u
            LEFT JOIN patients p ON u.id_user = p.user_id
            LEFT JOIN centres_sante c ON p.centre_id = c.id_centre
            LEFT JOIN regions r ON p.region_id = r.id_region
            WHERE u.id_user = ?`,
            [userId]
        );

        if (verif.length > 0) {
            console.log('\n✅ VÉRIFICATION - Compte créé avec succès :');
            console.log('   👤 Utilisateur:');
            console.log('      - ID:', verif[0].id_user);
            console.log('      - Nom d\'utilisateur:', verif[0].nom_utilisateur);
            console.log('      - Email:', verif[0].user_email);
            console.log('      - Rôle:', verif[0].role);
            console.log('      - Statut:', verif[0].statut);
            console.log('   👨‍⚕️ Profil Patient:');
            if (verif[0].id_patient) {
                console.log('      - ID Patient:', verif[0].id_patient);
                console.log('      - Nom:', verif[0].nom, verif[0].prenom);
                console.log('      - Email:', verif[0].patient_email);
                console.log('      - Téléphone:', verif[0].telephone);
                console.log('      - Centre:', verif[0].centre_nom);
                console.log('      - Région:', verif[0].region_nom);
            } else {
                console.log('      - ⚠️  Profil patient non trouvé');
            }
        }

        await connection.end();
        console.log('\n🎉 Script terminé avec succès !');
        console.log('\n📋 Informations de connexion :');
        console.log('   Username: patient1');
        console.log('   Password: admin123');
        console.log('   Role: patient');
        console.log('   User ID:', userId);
        if (verif.length > 0 && verif[0].id_patient) {
            console.log('   Patient ID:', verif[0].id_patient);
        }

    } catch (error) {
        console.error('❌ Erreur:', error.message);
        console.error('Stack:', error.stack);
        if (connection) {
            await connection.end();
        }
        process.exit(1);
    }
}

createPatient1();

