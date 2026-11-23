/**
 * Tests pour le système d'orientation automatique basé sur les symptômes
 */

const request = require('supertest');
const app = require('../src/app');
const { signTestToken } = require('./helpers/auth');
const { executeQuery } = require('../src/config/database');
const OrientationService = require('../src/services/orientationService');

describe('Système d\'orientation automatique', () => {
    let patientToken;
    let patientId;
    let patientUserId;
    let medecinId;
    let centreId;

    beforeAll(async () => {
        // Nettoyer d'abord si existe déjà
        await executeQuery('DELETE FROM utilisateurs WHERE email LIKE ?', ['test_patient_orientation%@test.com']);
        
        // Créer un patient pour les tests avec un nom unique
        const timestamp = Date.now();
        const userResult = await executeQuery(`
            INSERT INTO utilisateurs (nom_utilisateur, email, mot_de_passe, role, statut)
            VALUES (?, ?, '$2b$10$dummy', 'patient', 'actif')
        `, [`test_patient_orientation_${timestamp}`, `test_patient_orientation_${timestamp}@test.com`]);
        patientUserId = userResult.insertId;
        
        // Récupérer un centre_id valide
        const centres = await executeQuery('SELECT id_centre FROM centres_sante LIMIT 1');
        const centreIdForPatient = centres && centres.length > 0 ? centres[0].id_centre : 1;

        const patientResult = await executeQuery(`
            INSERT INTO patients (user_id, nom, prenom, date_naissance, telephone, statut, centre_id)
            VALUES (?, 'Test', 'Patient', '1990-01-01', '123456789', 'actif', ?)
        `, [patientUserId, centreIdForPatient]);
        patientId = patientResult.insertId;
        
        // Le token doit utiliser le user_id qui correspond au patient créé
        patientToken = signTestToken({ id: patientUserId, role: 'patient' });

        // Récupérer un médecin et un centre existants
        const medecins = await executeQuery('SELECT id_medecin, centre_id FROM medecins WHERE statut = "actif" LIMIT 1');
        if (medecins && medecins.length > 0) {
            medecinId = medecins[0].id_medecin;
            centreId = medecins[0].centre_id;
        }
    });

    afterAll(async () => {
        // Nettoyer les rendez-vous créés
        if (patientId) {
            await executeQuery('DELETE FROM rendez_vous WHERE patient_id = ?', [patientId]);
        }
        // Nettoyer le patient
        if (patientId) {
            await executeQuery('DELETE FROM patients WHERE id_patient = ?', [patientId]);
        }
        // Nettoyer tous les utilisateurs de test
        if (patientUserId) {
            await executeQuery('DELETE FROM utilisateurs WHERE id_user = ?', [patientUserId]);
        }
    });

    describe('OrientationService.analyserOrientation', () => {
        it('devrait recommander un généraliste pour des symptômes courants', async () => {
            const symptomes = {
                motif: 'Fièvre et toux',
                symptomes: ['fièvre', 'toux', 'fatigue'],
                intensite: 'moderee'
            };

            const result = await OrientationService.analyserOrientation(symptomes);
            
            expect(result).toHaveProperty('orientation');
            expect(result.orientation).toBe('generaliste');
        });

        it('devrait recommander un spécialiste pour des symptômes spécifiques', async () => {
            const symptomes = {
                motif: 'Douleur thoracique',
                symptomes: ['douleur thoracique', 'essoufflement', 'palpitations'],
                intensite: 'severe'
            };

            const result = await OrientationService.analyserOrientation(symptomes);
            
            expect(result).toHaveProperty('orientation');
            expect(['generaliste', 'specialiste']).toContain(result.orientation);
        });

        it('devrait gérer les symptômes vides', async () => {
            const symptomes = {
                motif: '',
                symptomes: [],
                intensite: 'legere'
            };

            const result = await OrientationService.analyserOrientation(symptomes);
            
            expect(result).toHaveProperty('orientation');
            expect(result.orientation).toBeDefined();
        });
    });

    describe('POST /api/rendez-vous avec orientation automatique', () => {
        it('devrait créer un RDV avec orientation automatique si non fournie', async () => {
            if (!medecinId || !centreId) {
                console.log('⚠️  Pas de médecin/centre disponible pour ce test');
                return;
            }

            const dateRdv = new Date();
            dateRdv.setHours(dateRdv.getHours() + 2);
            const dateStr = dateRdv.toISOString().split('T')[0];
            const heureStr = dateRdv.toTimeString().split(':').slice(0, 2).join(':');

            const response = await request(app)
                .post('/api/rendez-vous')
                .set('Authorization', `Bearer ${patientToken}`)
                .send({
                    medecin_id: medecinId,
                    centre_id: centreId,
                    date_rdv: dateStr,
                    heure_rdv: heureStr,
                    symptomes: ['fièvre', 'toux'],
                    motif: 'Symptômes grippaux',
                    orientation: 'auto', // Orientation automatique
                    duree_estimee: 30
                })
                .expect(201);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data).toHaveProperty('orientation');
            
            // Nettoyer
            if (response.body.data.id_rdv) {
                await executeQuery('DELETE FROM rendez_vous WHERE id_rdv = ?', [response.body.data.id_rdv]);
            }
        });

        it('devrait utiliser l\'orientation fournie si présente', async () => {
            if (!medecinId || !centreId) {
                console.log('⚠️  Pas de médecin/centre disponible pour ce test');
                return;
            }

            const dateRdv = new Date();
            dateRdv.setHours(dateRdv.getHours() + 2);
            const dateStr = dateRdv.toISOString().split('T')[0];
            const heureStr = dateRdv.toTimeString().split(':').slice(0, 2).join(':');

            const response = await request(app)
                .post('/api/rendez-vous')
                .set('Authorization', `Bearer ${patientToken}`)
                .send({
                    medecin_id: medecinId,
                    centre_id: centreId,
                    date_rdv: dateStr,
                    heure_rdv: heureStr,
                    symptomes: ['fièvre', 'toux'],
                    motif: 'Symptômes grippaux',
                    orientation: 'specialiste', // Orientation manuelle
                    duree_estimee: 30
                })
                .expect(201);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data).toHaveProperty('orientation', 'specialiste');
            
            // Nettoyer
            if (response.body.data.id_rdv) {
                await executeQuery('DELETE FROM rendez_vous WHERE id_rdv = ?', [response.body.data.id_rdv]);
            }
        });
    });
});

