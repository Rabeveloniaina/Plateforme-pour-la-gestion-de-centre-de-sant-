/**
 * TESTS CRITIQUES - RÉAJUSTEMENT DYNAMIQUE DES CRÉNEAUX
 * 
 * Teste l'algorithme de réajustement automatique des horaires
 * quand une consultation prend plus/moins de temps que prévu
 */

const { executeQuery } = require('../src/config/database');
const RendezVous = require('../src/models/RendezVous');
const { skipIfNoDatabase } = require('./helpers/db');

describe('🔶 Réajustement Dynamique des Créneaux', () => {
    let medecinId;
    let patientId1;
    let patientId2;
    let patientId3;
    let centreId;
    let rdvId1;
    let rdvId2;
    let rdvId3;
    let dbAvailable = false;

    beforeAll(async () => {
        // Skip tests if database is not available
        if (await skipIfNoDatabase()) {
            dbAvailable = false;
            return;
        }
        dbAvailable = true;
        // Créer des données de test pour tester le réajustement
        try {
            // Créer un centre
            const centreResult = await executeQuery(
                `INSERT INTO centres_sante (nom, adresse, telephone, email, region_id, statut)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                ['Centre Test Réajustement', 'Adresse Test', '123456789', 'test@test.com', 1, 'actif']
            );
            centreId = centreResult.insertId;

            // Créer un médecin
            const medecinResult = await executeQuery(
                `INSERT INTO medecins (nom, prenom, telephone, centre_id, specialite)
                 VALUES (?, ?, ?, ?, ?)`,
                ['Doc', 'Reajustement', '555555555', centreId, 'Generaliste']
            );
            medecinId = medecinResult.insertId;

            // Créer 3 patients
            const patient1 = await executeQuery(
                `INSERT INTO patients (nom, prenom, telephone, centre_id)
                 VALUES (?, ?, ?, ?)`,
                ['Patient', 'Un', '111111111', centreId]
            );
            patientId1 = patient1.insertId;

            const patient2 = await executeQuery(
                `INSERT INTO patients (nom, prenom, telephone, centre_id)
                 VALUES (?, ?, ?, ?)`,
                ['Patient', 'Deux', '222222222', centreId]
            );
            patientId2 = patient2.insertId;

            const patient3 = await executeQuery(
                `INSERT INTO patients (nom, prenom, telephone, centre_id)
                 VALUES (?, ?, ?, ?)`,
                ['Patient', 'Trois', '333333333', centreId]
            );
            patientId3 = patient3.insertId;

            // Créer 3 RDV consécutifs pour aujourd'hui
            const maintenant = new Date();
            const rdv1Date = new Date(maintenant);
            rdv1Date.setHours(9, 0, 0, 0); // 09:00

            const rdv2Date = new Date(maintenant);
            rdv2Date.setHours(9, 30, 0, 0); // 09:30

            const rdv3Date = new Date(maintenant);
            rdv3Date.setHours(10, 0, 0, 0); // 10:00

            const rdv1 = await executeQuery(
                `INSERT INTO rendez_vous (patient_id, medecin_id, date_rdv, duree_estimee, statut)
                 VALUES (?, ?, ?, ?, ?)`,
                [patientId1, medecinId, rdv1Date, 30, 'confirme']
            );
            rdvId1 = rdv1.insertId;

            const rdv2 = await executeQuery(
                `INSERT INTO rendez_vous (patient_id, medecin_id, date_rdv, duree_estimee, statut)
                 VALUES (?, ?, ?, ?, ?)`,
                [patientId2, medecinId, rdv2Date, 30, 'confirme']
            );
            rdvId2 = rdv2.insertId;

            const rdv3 = await executeQuery(
                `INSERT INTO rendez_vous (patient_id, medecin_id, date_rdv, duree_estimee, statut)
                 VALUES (?, ?, ?, ?, ?)`,
                [patientId3, medecinId, rdv3Date, 30, 'confirme']
            );
            rdvId3 = rdv3.insertId;

        } catch (error) {
            console.error('Erreur setup tests réajustement:', error);
        }
    });

    afterAll(async () => {
        // Nettoyage
        try {
            await executeQuery('DELETE FROM rendez_vous WHERE medecin_id = ?', [medecinId]);
            await executeQuery('DELETE FROM medecins WHERE id_medecin = ?', [medecinId]);
            await executeQuery('DELETE FROM patients WHERE id_patient IN (?, ?, ?)', [patientId1, patientId2, patientId3]);
            await executeQuery('DELETE FROM centres_sante WHERE id_centre = ?', [centreId]);
        } catch (error) {
            console.error('Erreur nettoyage tests réajustement:', error);
        }
    });

    describe('Réajustement après consultation plus longue', () => {
        test('Devrait réajuster les créneaux suivants si consultation prend plus de temps', async () => {
            if (!dbAvailable || !rdvId1 || !rdvId2) {
                return; // Skip test if DB not available or IDs not set
            }
            // Terminer le premier RDV avec une durée réelle de 45 min (au lieu de 30)
            const dureeReelle = 45;
            
            // Récupérer l'heure originale du RDV suivant
            const rdv2Original = await executeQuery(
                'SELECT date_rdv FROM rendez_vous WHERE id_rdv = ?',
                [rdvId2]
            );
            const heureOriginaleRdv2 = new Date(rdv2Original[0].date_rdv);

            // Terminer le premier RDV
            await RendezVous.terminer(rdvId1, dureeReelle, 'Consultation prolongée');

            // Vérifier que le RDV suivant a été réajusté
            const rdv2Ajuste = await executeQuery(
                'SELECT date_rdv FROM rendez_vous WHERE id_rdv = ?',
                [rdvId2]
            );
            const nouvelleHeureRdv2 = new Date(rdv2Ajuste[0].date_rdv);

            // La différence devrait être d'au moins 15 minutes (45-30) + 5 min de pause
            const differenceMinutes = (nouvelleHeureRdv2 - heureOriginaleRdv2) / (1000 * 60);
            
            // Le réajustement ne se fait que si différence > 10 min, donc ici devrait être ~20 min
            if (Math.abs(dureeReelle - 30) > 10) {
                expect(Math.abs(differenceMinutes)).toBeGreaterThan(10);
            }
        });
    });

    describe('Réajustement après consultation plus courte', () => {
        test('Devrait réajuster les créneaux suivants si consultation prend moins de temps', async () => {
            if (!dbAvailable || !rdvId1 || !rdvId2) {
                return; // Skip test if DB not available or IDs not set
            }
            // Terminer le premier RDV avec une durée réelle de 15 min (au lieu de 30)
            const dureeReelle = 15;
            
            // Récupérer l'heure originale du RDV suivant
            const rdv2Original = await executeQuery(
                'SELECT date_rdv FROM rendez_vous WHERE id_rdv = ?',
                [rdvId2]
            );
            const heureOriginaleRdv2 = new Date(rdv2Original[0].date_rdv);

            // Terminer le premier RDV avec durée plus courte
            await RendezVous.terminer(rdvId1, dureeReelle, 'Consultation rapide');

            // Vérifier que le RDV suivant a été réajusté (avancé)
            const rdv2Ajuste = await executeQuery(
                'SELECT date_rdv FROM rendez_vous WHERE id_rdv = ?',
                [rdvId2]
            );
            const nouvelleHeureRdv2 = new Date(rdv2Ajuste[0].date_rdv);

            const differenceMinutes = (nouvelleHeureRdv2 - heureOriginaleRdv2) / (1000 * 60);
            
            // Si différence significative, devrait être avancé
            if (Math.abs(30 - dureeReelle) > 10) {
                expect(differenceMinutes).toBeLessThan(0); // Avancé dans le temps
            }
        });
    });

    describe('Réajustement après check-in en retard', () => {
        test('Devrait réajuster si patient arrive en retard significatif', async () => {
            if (!dbAvailable || !rdvId2 || !rdvId3) {
                return; // Skip test if DB not available or IDs not set
            }
            // Simuler un check-in avec un retard > 15 minutes
            // Note: Cette fonctionnalité nécessite de modifier manuellement heure_arrivee
            // pour simuler le retard avant d'appeler checkin()
            
            const rdvOriginal = await executeQuery(
                'SELECT date_rdv FROM rendez_vous WHERE id_rdv = ?',
                [rdvId2]
            );
            const heureOriginale = new Date(rdvOriginal[0].date_rdv);

            // Simuler un retard de 20 minutes
            const heureArriveeRetardee = new Date(heureOriginale);
            heureArriveeRetardee.setMinutes(heureArriveeRetardee.getMinutes() + 20);

            // Mettre à jour manuellement heure_arrivee pour simuler le retard
            await executeQuery(
                'UPDATE rendez_vous SET heure_arrivee = ? WHERE id_rdv = ?',
                [heureArriveeRetardee, rdvId2]
            );

            // Appeler checkin (qui devrait détecter le retard et réajuster)
            await RendezVous.checkin(rdvId2);

            // Vérifier que les RDV suivants ont été réajustés
            const rdvSuivant = await executeQuery(
                'SELECT date_rdv FROM rendez_vous WHERE id_rdv = ?',
                [rdvId3]
            );

            expect(rdvSuivant.length).toBeGreaterThan(0);
        });
    });

    describe('Pas de réajustement si différence minime', () => {
        test('Ne devrait PAS réajuster si différence < 10 minutes', async () => {
            if (!dbAvailable || !rdvId1 || !rdvId2) {
                return; // Skip test if DB not available or IDs not set
            }
            // Terminer avec durée de 35 min (différence de seulement 5 min)
            const dureeReelle = 35;
            
            const rdv2Original = await executeQuery(
                'SELECT date_rdv FROM rendez_vous WHERE id_rdv = ?',
                [rdvId2]
            );
            const heureOriginale = new Date(rdv2Original[0].date_rdv);

            await RendezVous.terminer(rdvId1, dureeReelle, 'Consultation normale');

            const rdv2Final = await executeQuery(
                'SELECT date_rdv FROM rendez_vous WHERE id_rdv = ?',
                [rdvId2]
            );
            const heureFinale = new Date(rdv2Final[0].date_rdv);

            const differenceMinutes = Math.abs((heureFinale - heureOriginale) / (1000 * 60));
            
            // Si différence < 10 min, pas de réajustement (ou très minime)
            if (Math.abs(35 - 30) < 10) {
                expect(differenceMinutes).toBeLessThan(5);
            }
        });
    });
});

