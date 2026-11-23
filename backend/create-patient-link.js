const mysql = require('mysql2/promise');

async function createPatientLink() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'sante_db'
        });

        console.log('🔗 Connexion à la base de données établie');

        // 1. Récupérer l'utilisateur patient1
        const [users] = await connection.execute(
            'SELECT id_user, nom_utilisateur, role FROM utilisateurs WHERE nom_utilisateur = ?',
            ['patient1']
        );

        if (users.length === 0) {
            console.log('❌ Utilisateur patient1 non trouvé');
            await connection.end();
            return;
        }

        const patientUser = users[0];
        console.log('✅ Utilisateur trouvé:', patientUser);

        // 2. Vérifier si un patient existe déjà pour cet utilisateur
        const [existingPatients] = await connection.execute(
            'SELECT id_patient FROM patients WHERE id_patient = ?',
            [patientUser.id_user]
        );

        if (existingPatients.length > 0) {
            console.log(`ℹ️  Un patient existe déjà avec id_patient = ${patientUser.id_user}`);
            await connection.end();
            return;
        }

        // 3. Récupérer un centre de santé et une région pour le patient
        const [centres] = await connection.execute(
            'SELECT id_centre, region_id FROM centres_sante LIMIT 1'
        );

        if (centres.length === 0) {
            console.log('❌ Aucun centre de santé trouvé. Veuillez exécuter insert-regions-test.js d\'abord.');
            await connection.end();
            return;
        }

        const centre = centres[0];
        console.log('✅ Centre de santé trouvé:', centre);

        // 4. Créer l'enregistrement patient avec le même ID que l'utilisateur
        await connection.execute(`
            INSERT INTO patients (id_patient, nom, prenom, date_naissance, sexe, adresse, telephone, email, centre_id, region_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            patientUser.id_user,           // id_patient = id_user
            'Patient',                      // nom
            'Test',                         // prenom
            '1990-01-01',                   // date_naissance
            'M',                            // sexe
            'Adresse Test',                 // adresse
            '0123456789',                   // telephone
            'patient1@sante.sn',            // email
            centre.id_centre,               // centre_id
            centre.region_id                // region_id
        ]);

        console.log(`✅ Patient créé avec id_patient = ${patientUser.id_user}`);

        // 5. Vérification
        const [verif] = await connection.execute(
            'SELECT p.*, cs.nom as centre_nom, r.nom as region_nom FROM patients p LEFT JOIN centres_sante cs ON p.centre_id = cs.id_centre LEFT JOIN regions r ON p.region_id = r.id_region WHERE p.id_patient = ?',
            [patientUser.id_user]
        );

        if (verif.length > 0) {
            console.log('\n✅ VÉRIFICATION - Patient créé :');
            console.log(verif[0]);
        }

        await connection.end();
        console.log('\n🎉 Script terminé avec succès !');
        console.log(`\n📋 Vous pouvez maintenant vous connecter avec :`);
        console.log(`   Username: patient1`);
        console.log(`   Password: admin123`);
        console.log(`   ID Patient: ${patientUser.id_user}`);

    } catch (error) {
        console.error('❌ Erreur:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

createPatientLink();

