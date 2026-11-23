/**
 * Tests pour le système de gestion des documents médicaux
 */

const request = require('supertest');
const app = require('../src/app');
const { signTestToken } = require('./helpers/auth');
const { executeQuery } = require('../src/config/database');
const fs = require('fs');
const path = require('path');

describe('Gestion des documents médicaux', () => {
    let adminToken;
    let medecinToken;
    let patientToken;
    let patientId;
    let medecinId;
    let documentId;
    const testUploadDir = path.join(__dirname, '../uploads');

    beforeAll(async () => {
        // Créer les tokens
        adminToken = signTestToken({ id: 1, role: 'admin_centre', id_centre: 1 });
        medecinToken = signTestToken({ id: 2, role: 'medecin', id_centre: 1 });
        patientToken = signTestToken({ id: 3, role: 'patient' });

        // Nettoyer d'abord pour éviter les doublons
        await executeQuery(`DELETE FROM patients WHERE user_id IN (SELECT id_user FROM utilisateurs WHERE nom_utilisateur = 'test_patient_doc')`);
        await executeQuery(`DELETE FROM utilisateurs WHERE nom_utilisateur = 'test_patient_doc'`);

        // Créer un patient de test
        const userResult = await executeQuery(`
            INSERT INTO utilisateurs (nom_utilisateur, email, mot_de_passe, role, statut)
            VALUES ('test_patient_doc', 'test_patient_doc@test.com', '$2b$10$dummy', 'patient', 'actif')
        `);
        const userId = userResult.insertId;

        const patientResult = await executeQuery(`
            INSERT INTO patients (user_id, nom, prenom, date_naissance, telephone, statut)
            VALUES (?, 'Test', 'PatientDoc', '1990-01-01', '123456789', 'actif')
        `, [userId]);
        patientId = patientResult.insertId;

        // Récupérer un médecin existant
        const medecins = await executeQuery('SELECT id_medecin FROM medecins WHERE statut = "actif" LIMIT 1');
        if (medecins && medecins.length > 0) {
            medecinId = medecins[0].id_medecin;
        }

        // Créer le dossier uploads s'il n'existe pas
        if (!fs.existsSync(testUploadDir)) {
            fs.mkdirSync(testUploadDir, { recursive: true });
        }
    });

    afterAll(async () => {
        // Nettoyer les documents de test
        if (documentId) {
            await executeQuery('DELETE FROM documents_medicaux WHERE id_document = ?', [documentId]);
        }
        if (patientId) {
            await executeQuery('DELETE FROM patients WHERE id_patient = ?', [patientId]);
            await executeQuery('DELETE FROM utilisateurs WHERE email = ?', ['test_patient_doc@test.com']);
        }
    });

    describe('POST /api/documents/upload', () => {
        it('devrait refuser l\'upload sans authentification', async () => {
            await request(app)
                .post('/api/documents/upload')
                .expect(401);
        });

        it('devrait refuser l\'upload sans fichier', async () => {
            await request(app)
                .post('/api/documents/upload')
                .set('Authorization', `Bearer ${medecinToken}`)
                .expect(400);
        });
    });

    describe('GET /api/documents', () => {
        it('devrait récupérer les documents d\'un patient', async () => {
            const response = await request(app)
                .get(`/api/documents?patient_id=${patientId}`)
                .set('Authorization', `Bearer ${medecinToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data).toBeInstanceOf(Array);
        });

        it('devrait refuser l\'accès sans authentification', async () => {
            await request(app)
                .get(`/api/documents?patient_id=${patientId}`)
                .expect(401);
        });
    });

    describe('GET /api/documents/:id', () => {
        it('devrait retourner 404 pour un document inexistant', async () => {
            await request(app)
                .get('/api/documents/99999')
                .set('Authorization', `Bearer ${medecinToken}`)
                .expect(404);
        });
    });

    describe('DELETE /api/documents/:id', () => {
        it('devrait refuser la suppression sans authentification', async () => {
            await request(app)
                .delete('/api/documents/1')
                .expect(401);
        });

        it('devrait retourner 404 pour un document inexistant', async () => {
            await request(app)
                .delete('/api/documents/99999')
                .set('Authorization', `Bearer ${medecinToken}`)
                .expect(404);
        });
    });

    describe('Permissions et autorisations', () => {
        it('devrait permettre au médecin d\'accéder aux documents', async () => {
            const response = await request(app)
                .get(`/api/documents?patient_id=${patientId}`)
                .set('Authorization', `Bearer ${medecinToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('devrait permettre au patient d\'accéder à ses propres documents', async () => {
            const response = await request(app)
                .get(`/api/documents?patient_id=${patientId}`)
                .set('Authorization', `Bearer ${patientToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });
});

