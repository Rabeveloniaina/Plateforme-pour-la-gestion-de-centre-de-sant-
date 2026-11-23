const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function fixTestUsersCentres() {
    try {
        // Connexion à la base de données
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'sante_db'
        });

        console.log('🔗 Connexion à la base de données établie');

        // 1. Créer des régions si elles n'existent pas
        const regions = [
            { id: 1, nom: 'Dakar', code_region: 'DK' },
            { id: 2, nom: 'Thiès', code_region: 'TH' },
            { id: 3, nom: 'Saint-Louis', code_region: 'SL' }
        ];

        for (const region of regions) {
            await connection.execute(`
                INSERT IGNORE INTO regions (id_region, nom, code_region) 
                VALUES (?, ?, ?)
            `, [region.id, region.nom, region.code_region]);
        }
        console.log('✅ Régions créées/vérifiées');

        // 2. Créer des centres de santé
        const centres = [
            { id: 1, nom: 'Centre de Santé Principal', adresse: 'Dakar Centre', telephone: '33 123 45 67', email: 'centre1@sante.sn', region_id: 1 },
            { id: 2, nom: 'Centre de Santé Secondaire', adresse: 'Thiès Ville', telephone: '33 234 56 78', email: 'centre2@sante.sn', region_id: 2 },
            { id: 3, nom: 'Centre de Santé Nord', adresse: 'Saint-Louis', telephone: '33 345 67 89', email: 'centre3@sante.sn', region_id: 3 }
        ];

        for (const centre of centres) {
            await connection.execute(`
                INSERT IGNORE INTO centres_sante (id_centre, nom, adresse, telephone, email, region_id, statut) 
                VALUES (?, ?, ?, ?, ?, ?, 'actif')
            `, [centre.id, centre.nom, centre.adresse, centre.telephone, centre.email, centre.region_id]);
        }
        console.log('✅ Centres de santé créés/vérifiés');

        // 3. Mettre à jour les utilisateurs avec des centres
        const userUpdates = [
            { username: 'admin', role: 'ministere', centre_id: null },
            { username: 'admin_centre', role: 'admin_centre', centre_id: 1 },
            { username: 'medecin1', role: 'medecin', centre_id: 1 },
            { username: 'personnel1', role: 'personnel', centre_id: 1 },
            { username: 'patient1', role: 'patient', centre_id: 1 }
        ];

        for (const userUpdate of userUpdates) {
            if (userUpdate.centre_id) {
                await connection.execute(`
                    UPDATE users SET id_centre = ?, region_id = ? 
                    WHERE nom_utilisateur = ?
                `, [userUpdate.centre_id, 1, userUpdate.username]);
            }
            console.log(`✅ Utilisateur ${userUpdate.username} mis à jour avec centre ${userUpdate.centre_id}`);
        }

        // 4. Créer des médecins
        const medecins = [
            { nom: 'Diallo', prenom: 'Aminata', specialite: 'Médecine générale', centre_id: 1, telephone: '77 111 11 11', email: 'aminata@centre1.sn' },
            { nom: 'Ndiaye', prenom: 'Moussa', specialite: 'Cardiologie', centre_id: 1, telephone: '77 222 22 22', email: 'moussa@centre1.sn' }
        ];

        for (const medecin of medecins) {
            await connection.execute(`
                INSERT IGNORE INTO medecins (nom, prenom, specialite, centre_id, telephone, email, statut) 
                VALUES (?, ?, ?, ?, ?, ?, 'actif')
            `, [medecin.nom, medecin.prenom, medecin.specialite, medecin.centre_id, medecin.telephone, medecin.email]);
        }
        console.log('✅ Médecins créés/vérifiés');

        // 5. Créer des patients
        const patients = [
            { nom: 'Ba', prenom: 'Fatou', date_naissance: '1990-01-15', sexe: 'F', telephone: '77 333 33 33', email: 'fatou@patient.sn', centre_id: 1, region_id: 1 },
            { nom: 'Sow', prenom: 'Ibrahima', date_naissance: '1985-05-20', sexe: 'M', telephone: '77 444 44 44', email: 'ibrahima@patient.sn', centre_id: 1, region_id: 1 },
            { nom: 'Faye', prenom: 'Aïcha', date_naissance: '1992-08-10', sexe: 'F', telephone: '77 555 55 55', email: 'aicha@patient.sn', centre_id: 1, region_id: 1 }
        ];

        for (const patient of patients) {
            await connection.execute(`
                INSERT IGNORE INTO patients (nom, prenom, date_naissance, sexe, telephone, email, centre_id, region_id) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [patient.nom, patient.prenom, patient.date_naissance, patient.sexe, patient.telephone, patient.email, patient.centre_id, patient.region_id]);
        }
        console.log('✅ Patients créés/vérifiés');

        // 6. Créer des rendez-vous pour aujourd'hui
        const today = new Date().toISOString().split('T')[0];
        const rdv = [
            { patient_id: 1, medecin_id: 1, date_rdv: today, heure_rdv: '09:00:00', motif: 'Consultation générale', statut: 'confirme', centre_id: 1 },
            { patient_id: 2, medecin_id: 1, date_rdv: today, heure_rdv: '10:00:00', motif: 'Contrôle tension', statut: 'confirme', centre_id: 1 },
            { patient_id: 3, medecin_id: 2, date_rdv: today, heure_rdv: '11:00:00', motif: 'Consultation cardiaque', statut: 'en_attente', centre_id: 1 },
            { patient_id: 1, medecin_id: 2, date_rdv: today, heure_rdv: '14:00:00', motif: 'Suivi traitement', statut: 'en_cours', centre_id: 1 },
            { patient_id: 2, medecin_id: 1, date_rdv: today, heure_rdv: '15:00:00', motif: 'Vaccination', statut: 'termine', centre_id: 1 }
        ];

        for (const rdvItem of rdv) {
            await connection.execute(`
                INSERT IGNORE INTO rendez_vous (patient_id, medecin_id, date_rdv, heure_rdv, motif, statut, centre_id) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [rdvItem.patient_id, rdvItem.medecin_id, rdvItem.date_rdv, rdvItem.heure_rdv, rdvItem.motif, rdvItem.statut, rdvItem.centre_id]);
        }
        console.log('✅ Rendez-vous créés/vérifiés');

        // 7. Vérifier les données
        const [rdvCount] = await connection.execute(`
            SELECT COUNT(*) as total FROM rendez_vous WHERE centre_id = 1 AND DATE(date_rdv) = ?
        `, [today]);
        
        const [centreCount] = await connection.execute(`
            SELECT COUNT(*) as total FROM centres_sante
        `);

        console.log(`\n📊 Vérification des données:`);
        console.log(`- RDV aujourd'hui centre 1: ${rdvCount[0].total}`);
        console.log(`- Centres de santé: ${centreCount[0].total}`);

        await connection.end();
        console.log('\n🎉 Script de correction terminé avec succès !');
        console.log('\n📋 Comptes de test mis à jour :');
        console.log('- admin / admin123 (ministere) - pas de centre');
        console.log('- admin_centre / admin123 (admin_centre) - centre 1');
        console.log('- medecin1 / admin123 (medecin) - centre 1');
        console.log('- personnel1 / admin123 (personnel) - centre 1');
        console.log('- patient1 / admin123 (patient) - centre 1');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    }
}

fixTestUsersCentres();
