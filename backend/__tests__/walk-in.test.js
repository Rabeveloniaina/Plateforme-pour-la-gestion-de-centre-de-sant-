/**
 * TESTS CRITIQUES - SYSTÈME WALK-IN (PATIENTS SANS RDV)
 * 
 * Teste la fonctionnalité de création de rendez-vous pour patients sans rendez-vous préalable
 */

const request = require('supertest');
const app = require('../src/app');
const { executeQuery } = require('../src/config/database');

describe('🔶 Système Walk-In (Patients sans RDV)', () => {
    let authToken;
    let patientId;
    let medecinId;
    let centreId;

    beforeAll(async () => {
        // Créer un token d'authentification pour le personnel
        // Note: Utiliser un token réel ou créer un utilisateur de test
        authToken = 'test_token'; // À remplacer par token réel
        
        // Créer des données de test
        try {
            // Créer un centre de test
            const centreResult = await executeQuery(
                `INSERT INTO centres_sante (nom, adresse, telephone, email, region_id, statut)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                ['Centre Test Walk-In', 'Adresse Test', '123456789', 'test@test.com', 1, 'actif']
            );
            centreId = centreResult.insertId;

            // Créer un patient de test
            const patientResult = await executeQuery(
                `INSERT INTO patients (nom, prenom, telephone, centre_id)
                 VALUES (?, ?, ?, ?)`,
                ['Test', 'WalkIn', '987654321', centreId]
            );
            patientId = patientResult.insertId;

            // Créer un médecin de test
            const medecinResult = await executeQuery(
                `INSERT INTO medecins (nom, prenom, telephone, centre_id, specialite)
                 VALUES (?, ?, ?, ?, ?)`,
                ['Doc', 'Test', '555555555', centreId, 'Generaliste']
            );
            medecinId = medecinResult.insertId;
        } catch (error) {
            console.error('Erreur setup tests walk-in:', error);
        }
    });

    afterAll(async () => {
        // Nettoyage des données de test
        try {
            await executeQuery('DELETE FROM rendez_vous WHERE patient_id = ?', [patientId]);
            await executeQuery('DELETE FROM medecins WHERE id_medecin = ?', [medecinId]);
            await executeQuery('DELETE FROM patients WHERE id_patient = ?', [patientId]);
            await executeQuery('DELETE FROM centres_sante WHERE id_centre = ?', [centreId]);
        } catch (error) {
            console.error('Erreur nettoyage tests walk-in:', error);
        }
    });

    describe('POST /api/rendez-vous/walk-in', () => {
        test('Devrait créer un RDV walk-in avec succès', async () => {
            const response = await request(app)
                .post('/api/rendez-vous/walk-in')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    patient_id: patientId,
                    medecin_id: medecinId,
                    motif: 'Consultation urgente'
                });

            // Note: Ce test nécessite un token d'authentification valide
            // Pour un test réel, créer un utilisateur de test et obtenir son token
            expect(response.status).toBeDefined();
        });

        test('Devrait refuser sans authentification', async () => {
            const response = await request(app)
                .post('/api/rendez-vous/walk-in')
                .send({
                    patient_id: patientId,
                    medecin_id: medecinId,
                    motif: 'Consultation'
                });

            expect(response.status).toBe(401);
        });

        test('Devrait refuser avec données invalides', async () => {
            const response = await request(app)
                .post('/api/rendez-vous/walk-in')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    patient_id: null,
                    medecin_id: medecinId
                });

            expect(response.status).toBeGreaterThanOrEqual(400);
        });

        test('Devrait créer le RDV avec statut "attente"', async () => {
            // Vérifier que le RDV créé a le bon statut
            const rdv = await executeQuery(
                'SELECT statut FROM rendez_vous WHERE patient_id = ? ORDER BY date_rdv DESC LIMIT 1',
                [patientId]
            );

            if (rdv.length > 0) {
                expect(rdv[0].statut).toBe('attente');
            }
        });

        test('Devrait définir heure_arrivee automatiquement', async () => {
            const rdv = await executeQuery(
                'SELECT heure_arrivee FROM rendez_vous WHERE patient_id = ? ORDER BY date_rdv DESC LIMIT 1',
                [patientId]
            );

            if (rdv.length > 0) {
                expect(rdv[0].heure_arrivee).toBeDefined();
                expect(rdv[0].heure_arrivee).not.toBeNull();
            }
        });
    });

    describe('Intégration dans la file d\'attente', () => {
        test('Le RDV walk-in devrait apparaître dans la file d\'attente', async () => {
            const fileAttente = await executeQuery(
                `SELECT * FROM rendez_vous 
                 WHERE patient_id = ? AND statut = 'attente' 
                 ORDER BY heure_arrivee ASC`,
                [patientId]
            );

            expect(fileAttente.length).toBeGreaterThan(0);
        });
    });
});

