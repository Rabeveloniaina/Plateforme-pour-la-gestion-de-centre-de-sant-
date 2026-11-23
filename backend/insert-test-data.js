const mysql = require('mysql2/promise');

async function insertTestData() {
    let connection;
    try {
        // Utiliser la même configuration que l'application
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'sante_db'
        });

        console.log('🔗 Connexion à la base de données établie');

        // 1. Créer un centre de santé
        await connection.execute(`
            INSERT IGNORE INTO centres_sante (id_centre, nom, adresse, telephone, email, region_id, statut) 
            VALUES (1, 'Centre de Santé Principal', 'Dakar Centre', '33 123 45 67', 'centre1@sante.sn', 1, 'actif')
        `);
        console.log('✅ Centre de santé créé');

        // 2. Mettre à jour l'utilisateur personnel1 avec le centre
        const [updateResult] = await connection.execute(`
            UPDATE users SET id_centre = 1, region_id = 1 WHERE nom_utilisateur = 'personnel1'
        `);
        console.log('✅ Utilisateur personnel1 mis à jour:', updateResult.affectedRows, 'lignes modifiées');

        // 3. Créer un médecin
        await connection.execute(`
            INSERT IGNORE INTO medecins (id_medecin, nom, prenom, specialite, centre_id, telephone, email, statut) 
            VALUES (1, 'Diallo', 'Aminata', 'Médecine générale', 1, '77 111 11 11', 'aminata@centre1.sn', 'actif')
        `);
        console.log('✅ Médecin créé');

        // 4. Créer un patient
        await connection.execute(`
            INSERT IGNORE INTO patients (id_patient, nom, prenom, date_naissance, sexe, telephone, email, centre_id, region_id) 
            VALUES (1, 'Ba', 'Fatou', '1990-01-15', 'F', '77 333 33 33', 'fatou@patient.sn', 1, 1)
        `);
        console.log('✅ Patient créé');

        // 5. Créer des RDV pour aujourd'hui
        const today = new Date().toISOString().split('T')[0];
        await connection.execute(`
            INSERT IGNORE INTO rendez_vous (id_rdv, patient_id, medecin_id, date_rdv, heure_rdv, motif, statut, centre_id) 
            VALUES 
            (1, 1, 1, ?, '09:00:00', 'Consultation générale', 'confirme', 1),
            (2, 1, 1, ?, '10:00:00', 'Contrôle tension', 'confirme', 1),
            (3, 1, 1, ?, '11:00:00', 'Consultation cardiaque', 'en_attente', 1),
            (4, 1, 1, ?, '14:00:00', 'Suivi traitement', 'en_cours', 1),
            (5, 1, 1, ?, '15:00:00', 'Vaccination', 'termine', 1)
        `, [today, today, today, today, today]);
        console.log('✅ Rendez-vous créés pour', today);

        // 6. Vérifier les données
        const [rdvStats] = await connection.execute(`
            SELECT 
                COUNT(*) as total_rdv,
                COUNT(CASE WHEN statut='confirme' THEN 1 END) as confirmes,
                COUNT(CASE WHEN statut='en_attente' THEN 1 END) as en_attente,
                COUNT(CASE WHEN statut='en_cours' THEN 1 END) as en_cours,
                COUNT(CASE WHEN statut='termine' THEN 1 END) as termines
            FROM rendez_vous
            WHERE centre_id = 1 AND DATE(date_rdv) = ?
        `, [today]);

        console.log('\n📊 Vérification des données:');
        console.log('RDV total:', rdvStats[0].total_rdv);
        console.log('Confirmés:', rdvStats[0].confirmes);
        console.log('En attente:', rdvStats[0].en_attente);
        console.log('En cours:', rdvStats[0].en_cours);
        console.log('Terminés:', rdvStats[0].termines);

        console.log('\n🎉 Données de test insérées avec succès !');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

insertTestData();
