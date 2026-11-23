/**
 * Tests pour le système de gestion du statut opérationnel des médecins
 */

const request = require('supertest');
const app = require('../src/app');
const { signTestToken } = require('./helpers/auth');
const { executeQuery } = require('../src/config/database');

describe('Gestion du statut opérationnel des médecins', () => {
    let adminToken;
    let medecinToken;
    let medecinUserId;
    let medecinId;

    beforeAll(async () => {
        // Nettoyer d'abord si existe déjà
        await executeQuery('DELETE FROM utilisateurs WHERE email LIKE ?', ['test_medecin%@test.com']);
        
        // Créer un token admin pour les tests
        adminToken = signTestToken({ id: 1, role: 'admin_centre', id_centre: 1 });
        
        // Créer un utilisateur médecin pour les tests avec un nom unique
        const timestamp = Date.now();
        const userResult = await executeQuery(`
            INSERT INTO utilisateurs (nom_utilisateur, email, mot_de_passe, role, statut)
            VALUES (?, ?, '$2b$10$dummy', 'medecin', 'actif')
        `, [`test_medecin_${timestamp}`, `test_medecin_${timestamp}@test.com`]);
        medecinUserId = userResult.insertId;
        
        // Créer un médecin associé
        const medecinResult = await executeQuery(`
            INSERT INTO medecins (user_id, nom, prenom, specialite, centre_id, statut, statut_operationnel)
            VALUES (?, 'Test', 'Medecin', 'Generaliste', 1, 'actif', 'disponible')
        `, [medecinUserId]);
        medecinId = medecinResult.insertId;
        
        medecinToken = signTestToken({ id: medecinUserId, role: 'medecin', id_centre: 1 });
    });

    afterAll(async () => {
        // Nettoyer les données de test dans le bon ordre
        if (medecinId) {
            await executeQuery('DELETE FROM medecins WHERE id_medecin = ?', [medecinId]);
        }
        if (medecinUserId) {
            await executeQuery('DELETE FROM utilisateurs WHERE id_user = ?', [medecinUserId]);
        }
        // Nettoyer tous les utilisateurs de test restants
        await executeQuery('DELETE FROM utilisateurs WHERE email LIKE ?', ['test_medecin%@test.com']);
    });

    describe('GET /api/medecins/:id/statut-operationnel', () => {
        it('devrait récupérer le statut opérationnel d\'un médecin', async () => {
            const response = await request(app)
                .get(`/api/medecins/${medecinUserId}/statut-operationnel`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data).toHaveProperty('statut_operationnel');
            expect(['disponible', 'en_consultation', 'pause', 'indisponible']).toContain(
                response.body.data.statut_operationnel
            );
        });

        it('devrait refuser l\'accès sans authentification', async () => {
            await request(app)
                .get(`/api/medecins/${medecinUserId}/statut-operationnel`)
                .expect(401);
        });
    });

    describe('PUT /api/medecins/:id/statut-operationnel', () => {
        it('devrait mettre à jour le statut opérationnel', async () => {
            const response = await request(app)
                .put(`/api/medecins/${medecinUserId}/statut-operationnel`)
                .set('Authorization', `Bearer ${medecinToken}`)
                .send({ statut_operationnel: 'en_consultation' })
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data).toHaveProperty('statut_operationnel', 'en_consultation');
        });

        it('devrait refuser un statut invalide', async () => {
            await request(app)
                .put(`/api/medecins/${medecinUserId}/statut-operationnel`)
                .set('Authorization', `Bearer ${medecinToken}`)
                .send({ statut_operationnel: 'statut_invalide' })
                .expect(400);
        });

        it('devrait permettre au médecin de modifier son propre statut', async () => {
            const response = await request(app)
                .put(`/api/medecins/${medecinUserId}/statut-operationnel`)
                .set('Authorization', `Bearer ${medecinToken}`)
                .send({ statut_operationnel: 'pause' })
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });

    describe('GET /api/medecins/:id/horaires', () => {
        it('devrait récupérer les horaires d\'un médecin', async () => {
            const response = await request(app)
                .get(`/api/medecins/${medecinUserId}/horaires`)
                .set('Authorization', `Bearer ${medecinToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data).toBeDefined();
        });
    });

    describe('PUT /api/medecins/:id/horaires', () => {
        it('devrait mettre à jour les horaires d\'un médecin', async () => {
            const horaires = {
                lundi: { actif: true, debut: '08:00', fin: '17:00', pause_debut: '12:00', pause_fin: '13:00' },
                mardi: { actif: true, debut: '08:00', fin: '17:00', pause_debut: '', pause_fin: '' },
                mercredi: { actif: true, debut: '08:00', fin: '17:00', pause_debut: '', pause_fin: '' },
                jeudi: { actif: true, debut: '08:00', fin: '17:00', pause_debut: '', pause_fin: '' },
                vendredi: { actif: true, debut: '08:00', fin: '17:00', pause_debut: '', pause_fin: '' },
                samedi: { actif: false, debut: '08:00', fin: '17:00', pause_debut: '', pause_fin: '' },
                dimanche: { actif: false, debut: '08:00', fin: '17:00', pause_debut: '', pause_fin: '' }
            };

            const response = await request(app)
                .put(`/api/medecins/${medecinUserId}/horaires`)
                .set('Authorization', `Bearer ${medecinToken}`)
                .send(horaires)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
        });
    });

    describe('PUT /api/medecins/:id/gestion-dynamique', () => {
        it('devrait activer/désactiver la gestion dynamique', async () => {
            const response = await request(app)
                .put(`/api/medecins/${medecinUserId}/gestion-dynamique`)
                .set('Authorization', `Bearer ${medecinToken}`)
                .send({ active: true })
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
        });
    });
});

