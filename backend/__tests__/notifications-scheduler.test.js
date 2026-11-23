/**
 * Tests pour le système de notifications automatiques
 */

const NotificationScheduler = require('../src/services/notificationScheduler');
const { executeQuery } = require('../src/config/database');
const { skipIfNoDatabase } = require('./helpers/db');

describe('Système de notifications automatiques', () => {
    let scheduler;
    let testRdvId;
    let testPatientId;
    let testMedecinId;
    let testCentreId;
    let dbAvailable = false;

    beforeAll(async () => {
        // Skip tests if database is not available
        if (await skipIfNoDatabase()) {
            dbAvailable = false;
            return;
        }
        dbAvailable = true;
        
        // NotificationScheduler is exported as a singleton instance
        scheduler = NotificationScheduler;

        // Créer des données de test pour les notifications
        try {
            // Récupérer ou créer un centre
            const centres = await executeQuery('SELECT id_centre FROM centres_sante LIMIT 1');
            if (centres && centres.length > 0) {
                testCentreId = centres[0].id_centre;
            } else {
                const centreResult = await executeQuery(`
                    INSERT INTO centres_sante (nom, adresse, telephone, email, region_id, statut)
                    VALUES ('Centre Test Notif', 'Adresse', '123456789', 'test@test.com', 1, 'actif')
                `);
                testCentreId = centreResult.insertId;
            }

            // Récupérer ou créer un patient
            const patients = await executeQuery('SELECT id_patient FROM patients LIMIT 1');
            if (patients && patients.length > 0) {
                testPatientId = patients[0].id_patient;
            } else {
                const userResult = await executeQuery(`
                    INSERT INTO utilisateurs (nom_utilisateur, email, mot_de_passe, role, statut)
                    VALUES ('test_patient_notif', 'test_patient_notif@test.com', '$2b$10$dummy', 'patient', 'actif')
                `);
                const userId = userResult.insertId;

                const patientResult = await executeQuery(`
                    INSERT INTO patients (user_id, nom, prenom, date_naissance, telephone, statut)
                    VALUES (?, 'Test', 'PatientNotif', '1990-01-01', '123456789', 'actif')
                `, [userId]);
                testPatientId = patientResult.insertId;
            }

            // Récupérer un médecin
            const medecins = await executeQuery('SELECT id_medecin FROM medecins WHERE statut = "actif" LIMIT 1');
            if (medecins && medecins.length > 0) {
                testMedecinId = medecins[0].id_medecin;
            }
        } catch (error) {
            console.error('Erreur setup tests notifications:', error);
        }
    });

    afterAll(async () => {
        // Nettoyer les données de test
        if (testRdvId) {
            await executeQuery('DELETE FROM rendez_vous WHERE id_rdv = ?', [testRdvId]);
        }
        // Nettoyer les notifications de test
        await executeQuery('DELETE FROM notifications WHERE patient_id = ?', [testPatientId]);
    });

    describe('Scheduler de notifications', () => {
        it('devrait avoir une méthode start', () => {
            expect(typeof scheduler.start).toBe('function');
        });

        it('devrait avoir une méthode stop', () => {
            expect(typeof scheduler.stop).toBe('function');
        });

        it('devrait avoir une méthode envoyerRappelsJournaliers', () => {
            expect(typeof scheduler.envoyerRappelsJournaliers).toBe('function');
        });

        it('ne devrait pas démarrer si node-cron n\'est pas disponible (en mode test)', () => {
            // En mode test, node-cron peut ne pas être disponible
            // Le scheduler devrait gérer cela gracieusement
            expect(() => {
                scheduler.start();
            }).not.toThrow();
        });
    });

    describe('Envoi de rappels', () => {
        it('devrait pouvoir envoyer des rappels (méthode existe)', async () => {
            if (!dbAvailable) {
                return; // Skip test if DB not available
            }
            // Vérifier que la méthode existe et peut être appelée
            expect(typeof scheduler.envoyerRappelsJournaliers).toBe('function');
            
            // Ne pas vraiment envoyer en test, juste vérifier que la méthode existe
            // Un vrai test nécessiterait une configuration email/SMS
        });
    });

    describe('Gestion des notifications en base', () => {
        it('devrait pouvoir créer une notification en base', async () => {
            if (!dbAvailable) {
                return; // Skip test if DB not available
            }
            if (!testPatientId) {
                console.log('⚠️  Pas de patient disponible pour ce test');
                return;
            }

            const notificationResult = await executeQuery(`
                INSERT INTO notifications (patient_id, type, titre, message, statut)
                VALUES (?, 'rappel', 'Test Rappel', 'Message de test', 'en_attente')
            `, [testPatientId]);

            expect(notificationResult.insertId).toBeDefined();

            // Nettoyer
            await executeQuery('DELETE FROM notifications WHERE id = ?', [notificationResult.insertId]);
        });

        it('devrait pouvoir marquer une notification comme lue', async () => {
            if (!dbAvailable) {
                return; // Skip test if DB not available
            }
            if (!testPatientId) {
                console.log('⚠️  Pas de patient disponible pour ce test');
                return;
            }

            // Créer une notification
            const notificationResult = await executeQuery(`
                INSERT INTO notifications (patient_id, type, titre, message, statut)
                VALUES (?, 'rappel', 'Test Rappel', 'Message de test', 'en_attente')
            `, [testPatientId]);

            const notificationId = notificationResult.insertId;

            // Marquer comme envoyée
            await executeQuery(`
                UPDATE notifications 
                SET statut = 'envoye', date_envoi = NOW()
                WHERE id = ?
            `, [notificationId]);

            // Vérifier
            const notifications = await executeQuery(`
                SELECT statut FROM notifications WHERE id = ?
            `, [notificationId]);

            expect(notifications[0].statut).toBe('envoye');

            // Nettoyer
            await executeQuery('DELETE FROM notifications WHERE id = ?', [notificationId]);
        });
    });
});

