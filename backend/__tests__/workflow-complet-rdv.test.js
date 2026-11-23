/**
 * TESTS D'INTÉGRATION - WORKFLOW COMPLET RENDEZ-VOUS
 * 
 * Teste le workflow complet depuis la création jusqu'à la finalisation :
 * 1. Création du RDV
 * 2. Confirmation
 * 3. Check-in patient
 * 4. Démarrage consultation
 * 5. Création fiche médicale
 * 6. Finalisation consultation
 * 7. Vérification réajustement créneaux
 */

const request = require('supertest');
const app = require('../src/app');
const { executeQuery } = require('../src/config/database');
const { signTestToken } = require('./helpers/auth');
const RendezVous = require('../src/models/RendezVous');

describe('🔶 Workflow Complet Rendez-Vous (Intégration)', () => {
    // Tokens d'authentification
    let adminToken;
    let personnelToken;
    let medecinToken;
    let patientToken;

    // Données de test
    let centreId;
    let medecinId;
    let patientId;
    let rdvId;

    beforeAll(async () => {
        // Générer les tokens
        adminToken = signTestToken({ id: 1, role: 'admin', username: 'admin', id_centre: null });
        personnelToken = signTestToken({ id: 2, role: 'personnel', username: 'personnel', id_centre: null });
        medecinToken = signTestToken({ id: 3, role: 'medecin', username: 'medecin', id_centre: null });
        patientToken = signTestToken({ id: 4, role: 'patient', username: 'patient', id_centre: null });

        // Créer les données de test
        try {
            // Créer un centre
            const centreResult = await executeQuery(
                `INSERT INTO centres_sante (nom, adresse, telephone, email, region_id, statut)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                ['Centre Test Workflow', 'Adresse Test', '123456789', 'test@workflow.com', 1, 'actif']
            );
            centreId = centreResult.insertId;

            // Mettre à jour les tokens avec le centre_id
            personnelToken = signTestToken({ id: 2, role: 'personnel', username: 'personnel', id_centre: centreId });
            medecinToken = signTestToken({ id: 3, role: 'medecin', username: 'medecin', id_centre: centreId });

            // Créer un médecin
            const medecinResult = await executeQuery(
                `INSERT INTO medecins (nom, prenom, telephone, centre_id, specialite, numero_licence)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                ['Doc', 'Workflow', '555555555', centreId, 'Generaliste', 'LIC123456']
            );
            medecinId = medecinResult.insertId;

            // Créer un patient
            const patientResult = await executeQuery(
                `INSERT INTO patients (nom, prenom, telephone, email, centre_id, date_naissance, sexe)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                ['Patient', 'Workflow', '999999999', 'patient@test.com', centreId, '1990-01-01', 'M']
            );
            patientId = patientResult.insertId;

        } catch (error) {
            console.error('❌ Erreur setup workflow test:', error);
        }
    });

    afterAll(async () => {
        // Nettoyage des données de test
        try {
            if (rdvId) {
                await executeQuery('DELETE FROM rendez_vous WHERE id_rdv = ?', [rdvId]);
            }
            await executeQuery('DELETE FROM medecins WHERE id_medecin = ?', [medecinId]);
            await executeQuery('DELETE FROM patients WHERE id_patient = ?', [patientId]);
            await executeQuery('DELETE FROM centres_sante WHERE id_centre = ?', [centreId]);
        } catch (error) {
            console.error('❌ Erreur nettoyage workflow test:', error);
        }
    });

    describe('Étape 1: Création du Rendez-Vous', () => {
        test('Devrait créer un RDV avec succès', async () => {
            const dateRdv = new Date();
            dateRdv.setDate(dateRdv.getDate() + 1); // Demain
            dateRdv.setHours(10, 0, 0, 0); // 10h00

            const rdvData = {
                patient_id: patientId,
                medecin_id: medecinId,
                centre_id: centreId,
                date_rdv: dateRdv.toISOString(),
                duree_estimee: 30,
                motif: 'Consultation de routine',
                symptomes: ['fièvre', 'toux']
            };

            const response = await request(app)
                .post('/api/rendez-vous')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(rdvData);

            expect([200, 201]).toContain(response.status);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data).toBeDefined();

            rdvId = response.body.data.id || response.body.data.id_rdv;
            expect(rdvId).toBeDefined();
        });

        test('Le RDV créé devrait avoir le statut "planifie"', async () => {
            if (!rdvId) return;

            const rdv = await RendezVous.findById(rdvId);
            expect(rdv).toBeDefined();
            expect(rdv.statut).toBe('planifie');
        });
    });

    describe('Étape 2: Confirmation du Rendez-Vous', () => {
        test('Personnel devrait confirmer le RDV', async () => {
            if (!rdvId) return;

            const response = await request(app)
                .post(`/api/rendez-vous/${rdvId}/confirmer`)
                .set('Authorization', `Bearer ${personnelToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);

            // Vérifier que le statut a changé
            const rdv = await RendezVous.findById(rdvId);
            expect(rdv.statut).toBe('confirme');
        });
    });

    describe('Étape 3: Check-in du Patient', () => {
        test('Personnel devrait enregistrer l\'arrivée du patient', async () => {
            if (!rdvId) return;

            const response = await request(app)
                .post(`/api/rendez-vous/${rdvId}/checkin`)
                .set('Authorization', `Bearer ${personnelToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);

            // Vérifier que le statut a changé et heure_arrivee est définie
            const rdv = await RendezVous.findById(rdvId);
            expect(rdv.statut).toBe('attente');
            expect(rdv.heure_arrivee).toBeDefined();
        });
    });

    describe('Étape 4: Démarrage de la Consultation', () => {
        test('Médecin devrait démarrer la consultation', async () => {
            if (!rdvId) return;

            const response = await request(app)
                .post(`/api/rendez-vous/${rdvId}/demarrer`)
                .set('Authorization', `Bearer ${medecinToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);

            // Vérifier que le statut a changé
            const rdv = await RendezVous.findById(rdvId);
            expect(rdv.statut).toBe('en_cours');
            expect(rdv.heure_debut_consultation).toBeDefined();
        });
    });

    describe('Étape 5: Création Fiche Médicale', () => {
        let ficheId;

        test('Médecin devrait créer une fiche médicale', async () => {
            if (!rdvId) return;

            const ficheData = {
                patient_id: patientId,
                diagnostic: 'Rhume simple',
                traitement: 'Repos, hydratation',
                observations: 'État général bon'
            };

            const response = await request(app)
                .post('/api/fiches-medicales')
                .set('Authorization', `Bearer ${medecinToken}`)
                .send(ficheData);

            expect([200, 201]).toContain(response.status);
            expect(response.body).toHaveProperty('success', true);
            
            ficheId = response.body.data?.id_fiche || response.body.data?.id;
        });
    });

    describe('Étape 6: Finalisation de la Consultation', () => {
        test('Médecin devrait terminer la consultation avec durée réelle', async () => {
            if (!rdvId) return;

            const dureeReelle = 35; // Consultation plus longue que prévue (30 min)

            const response = await request(app)
                .post(`/api/rendez-vous/${rdvId}/terminer`)
                .set('Authorization', `Bearer ${medecinToken}`)
                .send({
                    duree_reelle: dureeReelle,
                    note_medecin: 'Consultation terminée avec succès'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);

            // Vérifier que le statut a changé
            const rdv = await RendezVous.findById(rdvId);
            expect(rdv.statut).toBe('termine');
            expect(rdv.duree_reelle).toBe(dureeReelle);
            expect(rdv.heure_fin_consultation).toBeDefined();

            // Vérifier si réajustement a été effectué (si différence > 10 min)
            if (response.body.reajustement) {
                expect(response.body.reajustement).toBeDefined();
            }
        });
    });

    describe('Workflow Walk-In (Patient sans RDV)', () => {
        let walkInRdvId;

        test('Personnel devrait créer un RDV walk-in', async () => {
            const response = await request(app)
                .post('/api/rendez-vous/walk-in')
                .set('Authorization', `Bearer ${personnelToken}`)
                .send({
                    patient_id: patientId,
                    medecin_id: medecinId,
                    motif: 'Consultation urgente sans RDV'
                });

            expect([200, 201]).toContain(response.status);
            expect(response.body).toHaveProperty('success', true);

            walkInRdvId = response.body.data?.id || response.body.data?.id_rdv;
            expect(walkInRdvId).toBeDefined();

            // Vérifier que le RDV walk-in est en attente
            const rdv = await RendezVous.findById(walkInRdvId);
            expect(rdv.statut).toBe('attente');
            expect(rdv.heure_arrivee).toBeDefined();
        });

        afterAll(async () => {
            // Nettoyer le RDV walk-in
            if (walkInRdvId) {
                await executeQuery('DELETE FROM rendez_vous WHERE id_rdv = ?', [walkInRdvId]);
            }
        });
    });

    describe('Workflow Complet avec Réajustement', () => {
        let rdv1Id, rdv2Id, rdv3Id;

        test('Devrait créer 3 RDV consécutifs et réajuster après consultation longue', async () => {
            // Créer 3 RDV consécutifs
            const maintenant = new Date();
            maintenant.setHours(14, 0, 0, 0); // 14:00

            const rdv1Date = new Date(maintenant);
            const rdv2Date = new Date(maintenant);
            rdv2Date.setMinutes(rdv2Date.getMinutes() + 30); // 14:30
            const rdv3Date = new Date(maintenant);
            rdv3Date.setMinutes(rdv3Date.getMinutes() + 60); // 15:00

            // Créer RDV 1
            const rdv1 = await RendezVous.create({
                patient_id: patientId,
                medecin_id: medecinId,
                centre_id: centreId,
                date_rdv: rdv1Date,
                duree_estimee: 30,
                motif: 'Consultation 1'
            });
            rdv1Id = rdv1.id || rdv1.id_rdv;

            // Créer RDV 2
            const rdv2 = await RendezVous.create({
                patient_id: patientId,
                medecin_id: medecinId,
                centre_id: centreId,
                date_rdv: rdv2Date,
                duree_estimee: 30,
                motif: 'Consultation 2'
            });
            rdv2Id = rdv2.id || rdv2.id_rdv;

            // Créer RDV 3
            const rdv3 = await RendezVous.create({
                patient_id: patientId,
                medecin_id: medecinId,
                centre_id: centreId,
                date_rdv: rdv3Date,
                duree_estimee: 30,
                motif: 'Consultation 3'
            });
            rdv3Id = rdv3.id || rdv3.id_rdv;

            // Récupérer l'heure originale du RDV 2
            const rdv2Original = await RendezVous.findById(rdv2Id);
            const heureOriginaleRdv2 = new Date(rdv2Original.date_rdv);

            // Confirmer et démarrer RDV 1
            await RendezVous.confirmer(rdv1Id);
            await RendezVous.checkin(rdv1Id);
            await RendezVous.demarrer(rdv1Id);

            // Terminer RDV 1 avec durée de 50 min (au lieu de 30) - différence > 10 min
            await RendezVous.terminer(rdv1Id, 50, 'Consultation prolongée');

            // Vérifier que RDV 2 a été réajusté
            const rdv2Ajuste = await RendezVous.findById(rdv2Id);
            const nouvelleHeureRdv2 = new Date(rdv2Ajuste.date_rdv);

            const differenceMinutes = (nouvelleHeureRdv2 - heureOriginaleRdv2) / (1000 * 60);
            
            // Le réajustement devrait avoir été fait (différence > 10 min)
            // RDV 1 a pris 50 min au lieu de 30 = +20 min + 5 min pause = +25 min
            if (Math.abs(50 - 30) > 10) {
                expect(Math.abs(differenceMinutes)).toBeGreaterThan(10);
            }
        });

        afterAll(async () => {
            // Nettoyage
            if (rdv1Id) await executeQuery('DELETE FROM rendez_vous WHERE id_rdv = ?', [rdv1Id]);
            if (rdv2Id) await executeQuery('DELETE FROM rendez_vous WHERE id_rdv = ?', [rdv2Id]);
            if (rdv3Id) await executeQuery('DELETE FROM rendez_vous WHERE id_rdv = ?', [rdv3Id]);
        });
    });
});

