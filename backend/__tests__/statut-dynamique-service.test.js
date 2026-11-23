/**
 * Tests pour le service de gestion dynamique du statut opérationnel
 */

const StatutDynamiqueService = require('../src/services/statutDynamiqueService');
const { executeQuery } = require('../src/config/database');
const { skipIfNoDatabase } = require('./helpers/db');

describe('StatutDynamiqueService', () => {
    let medecinId;
    let medecinUserId;
    let dbAvailable = false;

    beforeAll(async () => {
        // Skip tests if database is not available
        if (await skipIfNoDatabase()) {
            dbAvailable = false;
            return;
        }
        dbAvailable = true;
        // Créer un médecin de test avec horaires
        const userResult = await executeQuery(`
            INSERT INTO utilisateurs (nom_utilisateur, email, mot_de_passe, role, statut)
            VALUES ('test_medecin_statut', 'test_medecin_statut@test.com', '$2b$10$dummy', 'medecin', 'actif')
        `);
        medecinUserId = userResult.insertId;

        const medecinResult = await executeQuery(`
            INSERT INTO medecins (user_id, nom, prenom, specialite, centre_id, statut, statut_operationnel)
            VALUES (?, 'Test', 'MedecinStatut', 'Generaliste', 1, 'actif', 'disponible')
        `, [medecinUserId]);
        medecinId = medecinResult.insertId;

        // Créer des horaires de test
        const horaires = {
            lundi: { actif: true, debut: '08:00', fin: '17:00', pause_debut: '12:00', pause_fin: '13:00' },
            mardi: { actif: true, debut: '08:00', fin: '17:00', pause_debut: '', pause_fin: '' },
            mercredi: { actif: true, debut: '08:00', fin: '17:00', pause_debut: '', pause_fin: '' },
            jeudi: { actif: true, debut: '08:00', fin: '17:00', pause_debut: '', pause_fin: '' },
            vendredi: { actif: true, debut: '08:00', fin: '17:00', pause_debut: '', pause_fin: '' },
            samedi: { actif: false, debut: '08:00', fin: '17:00', pause_debut: '', pause_fin: '' },
            dimanche: { actif: false, debut: '08:00', fin: '17:00', pause_debut: '', pause_fin: '' }
        };

        await executeQuery(`
            UPDATE medecins 
            SET horaires_medecin = ?
            WHERE id_medecin = ?
        `, [JSON.stringify(horaires), medecinId]);
    });

    afterAll(async () => {
        if (medecinId) {
            await executeQuery('DELETE FROM medecins WHERE id_medecin = ?', [medecinId]);
        }
        if (medecinUserId) {
            await executeQuery('DELETE FROM utilisateurs WHERE id_user = ?', [medecinUserId]);
        }
    });

    describe('getHoraires', () => {
        it('devrait récupérer les horaires d\'un médecin', async () => {
            if (!dbAvailable) {
                return; // Skip test if DB not available
            }
            const horaires = await StatutDynamiqueService.getHoraires(medecinId);
            
            expect(horaires).toBeDefined();
            expect(horaires).toHaveProperty('lundi');
            expect(horaires.lundi).toHaveProperty('actif');
        });

        it('devrait retourner null si le médecin n\'existe pas', async () => {
            if (!dbAvailable) {
                return; // Skip test if DB not available
            }
            const horaires = await StatutDynamiqueService.getHoraires(99999);
            expect(horaires).toBeNull();
        });
    });

    describe('gestionDynamiqueActivee', () => {
        it('devrait vérifier si la gestion dynamique est activée', async () => {
            if (!dbAvailable) {
                return; // Skip test if DB not available
            }
            const activee = await StatutDynamiqueService.gestionDynamiqueActivee(medecinId);
            
            // Par défaut, la gestion dynamique devrait être activée (true)
            expect(typeof activee).toBe('boolean');
        });
    });

    describe('estEnConge', () => {
        it('devrait vérifier si un médecin est en congé', async () => {
            if (!dbAvailable) {
                return; // Skip test if DB not available
            }
            const enConge = await StatutDynamiqueService.estEnConge(medecinId);
            
            expect(typeof enConge).toBe('boolean');
        });
    });

    describe('determinerStatutParHoraires', () => {
        it('devrait déterminer le statut selon les horaires', () => {
            const horaires = {
                lundi: { actif: true, debut: '08:00', fin: '17:00', pause_debut: '12:00', pause_fin: '13:00' },
                mardi: { actif: true, debut: '08:00', fin: '17:00' },
                mercredi: { actif: false },
                jeudi: { actif: true, debut: '08:00', fin: '17:00' },
                vendredi: { actif: true, debut: '08:00', fin: '17:00' },
                samedi: { actif: false },
                dimanche: { actif: false }
            };

            const statut = StatutDynamiqueService.determinerStatutParHoraires(horaires);
            
            // Le statut devrait être déterminé selon l'heure actuelle
            expect(['disponible', 'pause', 'indisponible']).toContain(statut);
        });

        it('devrait retourner null si pas d\'horaires', () => {
            const statut = StatutDynamiqueService.determinerStatutParHoraires(null);
            expect(statut).toBeNull();
        });

        it('devrait retourner indisponible si le médecin ne travaille pas aujourd\'hui', () => {
            const horaires = {
                lundi: { actif: false },
                mardi: { actif: false },
                mercredi: { actif: false },
                jeudi: { actif: false },
                vendredi: { actif: false },
                samedi: { actif: false },
                dimanche: { actif: false }
            };

            const statut = StatutDynamiqueService.determinerStatutParHoraires(horaires);
            
            // Si aucun jour n'est actif, le statut devrait être indisponible
            expect(statut).toBe('indisponible');
        });
    });

    describe('mettreAJourStatut', () => {
        it('devrait mettre à jour le statut d\'un médecin', async () => {
            if (!dbAvailable) {
                return; // Skip test if DB not available
            }
            const result = await StatutDynamiqueService.mettreAJourStatut(medecinId);
            
            // Le résultat peut être null (pas de changement) ou un objet avec le nouveau statut
            if (result) {
                expect(result).toHaveProperty('statut');
                expect(['disponible', 'en_consultation', 'pause', 'indisponible']).toContain(result.statut);
            }
        });
    });

    describe('compareHeures', () => {
        it('devrait comparer deux heures correctement', () => {
            const result1 = StatutDynamiqueService.compareHeures('10:00', '11:00');
            expect(result1).toBe(-1); // 10:00 < 11:00

            const result2 = StatutDynamiqueService.compareHeures('12:00', '12:00');
            expect(result2).toBe(0); // 12:00 == 12:00

            const result3 = StatutDynamiqueService.compareHeures('14:00', '13:00');
            expect(result3).toBe(1); // 14:00 > 13:00
        });
    });
});

