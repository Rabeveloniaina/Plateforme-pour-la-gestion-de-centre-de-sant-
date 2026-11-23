/**
 * Service de reprogrammation automatique des rendez-vous
 * Gère les retards et absences
 */

const { executeQuery } = require('../config/database');
const { notifyRdv } = require('./notificationService');
const { formatDateTimeForMySQL } = require('../utils/dateFormatter');

class ReprogrammationService {
    // Seuils pour considérer un retard
    static SEUIL_RETARD_MINUTES = 15; // Patient considéré en retard après 15 min
    static DELAI_REPROGRAMMATION_JOURS = 7; // Reprogrammer dans les 7 prochains jours

    /**
     * Détecter les rendez-vous en retard (non arrivés)
     * @param {number} centre_id - ID du centre (optionnel)
     * @returns {Array} Liste des RDV en retard
     */
    static async detecterRetards(centre_id = null) {
        const maintenant = new Date();
        const seuil = new Date(maintenant.getTime() - this.SEUIL_RETARD_MINUTES * 60000);
        
        let query = `
            SELECT 
                rv.id_rdv,
                rv.date_rdv,
                rv.statut,
                rv.patient_id,
                rv.medecin_id,
                rv.centre_id,
                p.nom as patient_nom,
                p.prenom as patient_prenom,
                p.telephone,
                p.email,
                m.nom as medecin_nom,
                m.prenom as medecin_prenom,
                cs.nom as centre_nom,
                TIMESTAMPDIFF(MINUTE, rv.date_rdv, NOW()) as retard_minutes
            FROM rendez_vous rv
            JOIN patients p ON rv.patient_id = p.id_patient
            JOIN medecins m ON rv.medecin_id = m.id_medecin
            JOIN centres_sante cs ON rv.centre_id = cs.id_centre
            WHERE rv.statut IN ('attente', 'confirme')
            AND rv.date_rdv < ?
            AND rv.date_rdv >= DATE_SUB(NOW(), INTERVAL 1 DAY)
            AND rv.heure_arrivee IS NULL
            AND NOT EXISTS (
                SELECT 1 FROM notifications n
                WHERE n.rdv_id = rv.id_rdv
                AND n.type = 'retard'
                AND DATE(n.created_at) = CURDATE()
            )
        `;
        
        const params = [formatDateTimeForMySQL(maintenant)];
        
        if (centre_id) {
            query += ` AND rv.centre_id = ?`;
            params.push(centre_id);
        }
        
        try {
            return await executeQuery(query, params);
        } catch (error) {
            console.error('Erreur détection retards:', error);
            return [];
        }
    }

    /**
     * Détecter les absences (RDV passés sans arrivée)
     * @param {number} centre_id - ID du centre (optionnel)
     * @returns {Array} Liste des RDV absents
     */
    static async detecterAbsences(centre_id = null) {
        const maintenant = new Date();
        const hier = new Date(maintenant);
        hier.setDate(hier.getDate() - 1);
        
        let query = `
            SELECT 
                rv.id_rdv,
                rv.date_rdv,
                rv.statut,
                rv.patient_id,
                rv.medecin_id,
                rv.centre_id,
                p.nom as patient_nom,
                p.prenom as patient_prenom,
                p.telephone,
                p.email,
                m.nom as medecin_nom,
                m.prenom as medecin_prenom,
                cs.nom as centre_nom
            FROM rendez_vous rv
            JOIN patients p ON rv.patient_id = p.id_patient
            JOIN medecins m ON rv.medecin_id = m.id_medecin
            JOIN centres_sante cs ON rv.centre_id = cs.id_centre
            WHERE rv.statut IN ('attente', 'confirme')
            AND DATE(rv.date_rdv) < CURDATE()
            AND rv.heure_arrivee IS NULL
            AND rv.statut != 'absent'
            AND NOT EXISTS (
                SELECT 1 FROM notifications n
                WHERE n.rdv_id = rv.id_rdv
                AND n.type = 'absence'
                AND DATE(n.created_at) = CURDATE()
            )
        `;
        
        const params = [];
        
        if (centre_id) {
            query += ` AND rv.centre_id = ?`;
            params.push(centre_id);
        }
        
        try {
            return await executeQuery(query, params);
        } catch (error) {
            console.error('Erreur détection absences:', error);
            return [];
        }
    }

    /**
     * Marquer un rendez-vous comme absent
     * @param {number} rdv_id - ID du rendez-vous
     * @returns {Object} Résultat de l'opération
     */
    static async marquerAbsent(rdv_id) {
        try {
            // Mettre à jour le statut
            await executeQuery(
                `UPDATE rendez_vous SET statut = 'absent' WHERE id_rdv = ?`,
                [rdv_id]
            );
            
            // Créer une notification
            const rdv = await executeQuery(
                `SELECT rv.*, p.*, m.nom as medecin_nom, m.prenom as medecin_prenom,
                        cs.nom as centre_nom
                 FROM rendez_vous rv
                 JOIN patients p ON rv.patient_id = p.id_patient
                 JOIN medecins m ON rv.medecin_id = m.id_medecin
                 JOIN centres_sante cs ON rv.centre_id = cs.id_centre
                 WHERE rv.id_rdv = ?`,
                [rdv_id]
            );
            
            if (rdv[0]) {
                // Envoyer notification
                await notifyRdv(
                    {
                        id_patient: rdv[0].patient_id,
                        nom: rdv[0].patient_nom,
                        prenom: rdv[0].patient_prenom,
                        telephone: rdv[0].telephone,
                        email: rdv[0].email
                    },
                    {
                        id_rdv: rdv_id,
                        date_rdv: rdv[0].date_rdv,
                        centre_nom: rdv[0].centre_nom,
                        medecin_nom: `${rdv[0].medecin_prenom} ${rdv[0].medecin_nom}`
                    },
                    'absence'
                );
                
                // Créer enregistrement notification dans BD
                await executeQuery(
                    `INSERT INTO notifications (patient_id, type, message, rdv_id)
                     VALUES (?, 'absence', ?, ?)`,
                    [
                        rdv[0].patient_id,
                        `Vous n'êtes pas venu à votre rendez-vous du ${new Date(rdv[0].date_rdv).toLocaleDateString('fr-FR')}`,
                        rdv_id
                    ]
                );
            }
            
            return { success: true, message: 'Rendez-vous marqué comme absent' };
        } catch (error) {
            console.error('Erreur marquage absent:', error);
            throw new Error(`Erreur lors du marquage absent: ${error.message}`);
        }
    }

    /**
     * Proposer une reprogrammation automatique
     * @param {number} rdv_id - ID du rendez-vous à reprogrammer
     * @param {Date} nouvelleDate - Nouvelle date proposée (optionnel)
     * @returns {Object} { success, nouvelle_date_proposee, creneaux_disponibles }
     */
    static async proposerReprogrammation(rdv_id, nouvelleDate = null) {
        try {
            // Récupérer les infos du RDV
            const rdv = await executeQuery(
                `SELECT rv.*, m.id_medecin, m.specialite, cs.id_centre
                 FROM rendez_vous rv
                 JOIN medecins m ON rv.medecin_id = m.id_medecin
                 JOIN centres_sante cs ON rv.centre_id = cs.id_centre
                 WHERE rv.id_rdv = ?`,
                [rdv_id]
            );
            
            if (!rdv[0]) {
                throw new Error('Rendez-vous non trouvé');
            }
            
            const rdvData = rdv[0];
            
            // Si pas de date proposée, chercher un créneau disponible
            if (!nouvelleDate) {
                nouvelleDate = await this.trouverCreneauDisponible(
                    rdvData.medecin_id,
                    rdvData.centre_id,
                    this.DELAI_REPROGRAMMATION_JOURS
                );
            }
            
            // Si aucun créneau trouvé
            if (!nouvelleDate) {
                return {
                    success: false,
                    message: 'Aucun créneau disponible trouvé',
                    creneaux_disponibles: []
                };
            }
            
            return {
                success: true,
                nouvelle_date_proposee: nouvelleDate,
                creneaux_disponibles: await this.getCreneauxDisponibles(
                    rdvData.medecin_id,
                    rdvData.centre_id
                )
            };
        } catch (error) {
            console.error('Erreur proposition reprogrammation:', error);
            throw new Error(`Erreur lors de la proposition: ${error.message}`);
        }
    }

    /**
     * Reprogrammer un rendez-vous
     * @param {number} rdv_id - ID du rendez-vous
     * @param {Date} nouvelleDate - Nouvelle date
     * @returns {Object} Résultat de l'opération
     */
    static async reprogrammer(rdv_id, nouvelleDate) {
        try {
            // Récupérer les infos du RDV
            const rdv = await executeQuery(
                `SELECT rv.*, p.*, m.nom as medecin_nom, m.prenom as medecin_prenom,
                        cs.nom as centre_nom
                 FROM rendez_vous rv
                 JOIN patients p ON rv.patient_id = p.id_patient
                 JOIN medecins m ON rv.medecin_id = m.id_medecin
                 JOIN centres_sante cs ON rv.centre_id = cs.id_centre
                 WHERE rv.id_rdv = ?`,
                [rdv_id]
            );
            
            if (!rdv[0]) {
                throw new Error('Rendez-vous non trouvé');
            }
            
            const rdvData = rdv[0];
            
            // Formater la date en LOCAL (pas UTC) pour MySQL
            const nouvelleDateStr = formatDateTimeForMySQL(nouvelleDate);
            console.log('📅 Date formatée pour MySQL (LOCAL):', nouvelleDateStr);
            
            // Calculer le décalage en minutes
            const ancienneDateRdv = new Date(rdvData.date_rdv);
            const decalageMinutes = (nouvelleDate.getTime() - ancienneDateRdv.getTime()) / (1000 * 60);
            
            console.log(`⏰ Décalage de reprogrammation: ${Math.round(decalageMinutes)} minutes`);
            
            // Vérifier les chevauchements avec d'autres RDV du même médecin
            const dureeEstimee = rdvData.duree_estimee || 15;
            const dateFinNouvelle = new Date(nouvelleDate.getTime() + dureeEstimee * 60 * 1000);
            const dateFinNouvelleStr = formatDateTimeForMySQL(dateFinNouvelle);
            
            const chevauchements = await executeQuery(
                `SELECT id_rdv, date_rdv, duree_estimee,
                        CONCAT(p.prenom, ' ', p.nom) as patient_nom
                 FROM rendez_vous rv
                 LEFT JOIN patients p ON rv.patient_id = p.id_patient
                 WHERE rv.medecin_id = ?
                   AND rv.id_rdv != ?
                   AND rv.statut NOT IN ('annule', 'termine', 'absent')
                   AND (
                       (rv.date_rdv < ? AND DATE_ADD(rv.date_rdv, INTERVAL COALESCE(rv.duree_estimee, 15) MINUTE) > ?)
                       OR (rv.date_rdv >= ? AND rv.date_rdv < ?)
                   )`,
                [rdvData.medecin_id, rdv_id, dateFinNouvelleStr, nouvelleDateStr, nouvelleDateStr, dateFinNouvelleStr]
            );
            
            if (chevauchements.length > 0) {
                const conflitInfo = chevauchements[0];
                const conflitDate = new Date(conflitInfo.date_rdv).toLocaleString('fr-FR');
                throw new Error(`Chevauchement détecté avec le RDV de ${conflitInfo.patient_nom} prévu à ${conflitDate}. Veuillez choisir un autre horaire.`);
            }
            
            console.log('✅ Aucun chevauchement détecté');
            
            // Mettre à jour le rendez-vous
            await executeQuery(
                `UPDATE rendez_vous 
                 SET date_rdv = ?, 
                     statut = 'confirme',
                     note_medecin = CONCAT(COALESCE(note_medecin, ''), '\nReprogrammé le ', NOW())
                 WHERE id_rdv = ?`,
                [nouvelleDateStr, rdv_id]
            );
            
            // Réajuster les RDV suivants pour éviter les chevauchements
            let rdvAjustes = 0;
            console.log(`🔄 Réajustement automatique des RDV suivants du médecin ${rdvData.medecin_id}`);
            
            // Récupérer tous les RDV du même médecin le même jour (y compris celui qu'on vient de modifier)
            const tousRdvJour = await executeQuery(
                `SELECT id_rdv, date_rdv, duree_estimee, 
                        CONCAT(p.prenom, ' ', p.nom) as patient_nom
                 FROM rendez_vous rv
                 LEFT JOIN patients p ON rv.patient_id = p.id_patient
                 WHERE rv.medecin_id = ?
                   AND DATE(rv.date_rdv) = DATE(?)
                   AND rv.statut IN ('attente', 'confirme', 'en_cours')
                 ORDER BY rv.date_rdv ASC`,
                [rdvData.medecin_id, nouvelleDateStr]
            );
            
            console.log(`📋 ${tousRdvJour.length} RDV trouvés pour ce jour`);
            
            // Vérifier et réajuster les chevauchements en cascade
            let dernierRdvFin = null;
            for (let i = 0; i < tousRdvJour.length; i++) {
                const rdvCourant = tousRdvJour[i];
                const rdvDebut = new Date(rdvCourant.date_rdv);
                const rdvDuree = rdvCourant.duree_estimee || 15;
                const rdvFin = new Date(rdvDebut.getTime() + rdvDuree * 60 * 1000);
                
                // Si c'est le premier RDV ou si il n'y a pas de chevauchement avec le précédent
                if (i === 0 || !dernierRdvFin || rdvDebut >= dernierRdvFin) {
                    dernierRdvFin = rdvFin;
                    console.log(`  ✅ RDV ${rdvCourant.id_rdv} (${rdvCourant.patient_nom}): OK à ${rdvDebut.toLocaleTimeString('fr-FR')}`);
                    continue;
                }
                
                // Chevauchement détecté : décaler ce RDV et tous les suivants
                const pauseMinutes = 5; // 5 minutes de pause entre consultations
                const nouveauDebut = new Date(dernierRdvFin.getTime() + pauseMinutes * 60 * 1000);
                const nouveauDebutStr = formatDateTimeForMySQL(nouveauDebut);
                
                console.log(`  ⚠️ Chevauchement RDV ${rdvCourant.id_rdv}: ${rdvDebut.toLocaleTimeString('fr-FR')} → ${nouveauDebut.toLocaleTimeString('fr-FR')}`);
                
                // Mettre à jour le RDV
                await executeQuery(
                    `UPDATE rendez_vous 
                     SET date_rdv = ?,
                         note_medecin = CONCAT(COALESCE(note_medecin, ''), '\n⏰ Réajusté auto le ', NOW(), ' pour éviter chevauchement')
                     WHERE id_rdv = ?`,
                    [nouveauDebutStr, rdvCourant.id_rdv]
                );
                
                // Mettre à jour la fin pour le prochain RDV
                dernierRdvFin = new Date(nouveauDebut.getTime() + rdvDuree * 60 * 1000);
                rdvAjustes++;
                
                console.log(`  ✅ RDV ${rdvCourant.id_rdv} réajusté à ${nouveauDebut.toLocaleTimeString('fr-FR')}`);
            }
            
            // Envoyer notification
            await notifyRdv(
                {
                    id_patient: rdvData.patient_id,
                    nom: rdvData.nom,
                    prenom: rdvData.prenom,
                    telephone: rdvData.telephone,
                    email: rdvData.email
                },
                {
                    id_rdv: rdv_id,
                    date_rdv: nouvelleDateStr,
                    centre_nom: rdvData.centre_nom,
                    medecin_nom: `${rdvData.medecin_prenom} ${rdvData.medecin_nom}`
                },
                'reprogramme'
            );
            
            // Créer enregistrement notification
            await executeQuery(
                `INSERT INTO notifications (patient_id, type, message, rdv_id)
                 VALUES (?, 'reprogramme', ?, ?)`,
                [
                    rdvData.patient_id,
                    `Votre rendez-vous a été reprogrammé au ${new Date(nouvelleDate).toLocaleDateString('fr-FR')} à ${new Date(nouvelleDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
                    rdv_id
                ]
            );
            
            const message = rdvAjustes > 0 
                ? `Rendez-vous reprogrammé avec succès. ${rdvAjustes} rendez-vous suivant(s) réajusté(s) automatiquement.`
                : 'Rendez-vous reprogrammé avec succès';
            
            return { 
                success: true, 
                message: message,
                nouvelle_date: nouvelleDateStr,
                rdv_ajustes: rdvAjustes
            };
        } catch (error) {
            console.error('Erreur reprogrammation:', error);
            throw new Error(`Erreur lors de la reprogrammation: ${error.message}`);
        }
    }

    /**
     * Trouver un créneau disponible pour un médecin
     * @param {number} medecin_id - ID du médecin
     * @param {number} centre_id - ID du centre
     * @param {number} joursMax - Nombre de jours max à chercher
     * @returns {Date|null} Date disponible ou null
     */
    static async trouverCreneauDisponible(medecin_id, centre_id, joursMax = 7) {
        try {
            const maintenant = new Date();
            maintenant.setHours(9, 0, 0, 0); // Commencer à 9h
            
            for (let jour = 1; jour <= joursMax; jour++) {
                const dateTest = new Date(maintenant);
                dateTest.setDate(dateTest.getDate() + jour);
                
                // Ignorer les weekends (samedi=6, dimanche=0)
                if (dateTest.getDay() === 0 || dateTest.getDay() === 6) {
                    continue;
                }
                
                // Tester les créneaux de la journée (9h à 17h, toutes les 30 min)
                for (let heure = 9; heure < 17; heure++) {
                    for (let minute = 0; minute < 60; minute += 30) {
                        const creneau = new Date(dateTest);
                        creneau.setHours(heure, minute, 0, 0);
                        
                        // Vérifier si le créneau est disponible
                        const occupes = await executeQuery(
                            `SELECT COUNT(*) as count FROM rendez_vous
                             WHERE medecin_id = ?
                             AND centre_id = ?
                             AND DATE(date_rdv) = DATE(?)
                             AND TIME(date_rdv) BETWEEN TIME(DATE_SUB(?, INTERVAL 29 MINUTE)) AND TIME(DATE_ADD(?, INTERVAL 29 MINUTE))
                             AND statut NOT IN ('annule', 'absent')`,
                            [medecin_id, centre_id, creneau, creneau, creneau]
                        );
                        
                        if (occupes[0].count === 0) {
                            return creneau;
                        }
                    }
                }
            }
            
            return null;
        } catch (error) {
            console.error('Erreur recherche créneau:', error);
            return null;
        }
    }

    /**
     * Obtenir les créneaux disponibles pour un médecin
     * @param {number} medecin_id - ID du médecin
     * @param {number} centre_id - ID du centre
     * @param {number} jours - Nombre de jours à vérifier
     * @returns {Array} Liste des créneaux disponibles
     */
    static async getCreneauxDisponibles(medecin_id, centre_id, jours = 7) {
        const creneaux = [];
        
        try {
            const maintenant = new Date();
            maintenant.setHours(9, 0, 0, 0);
            
            for (let jour = 1; jour <= jours; jour++) {
                const dateTest = new Date(maintenant);
                dateTest.setDate(dateTest.getDate() + jour);
                
                // Ignorer weekends
                if (dateTest.getDay() === 0 || dateTest.getDay() === 6) {
                    continue;
                }
                
                for (let heure = 9; heure < 17; heure++) {
                    for (let minute = 0; minute < 60; minute += 30) {
                        const creneau = new Date(dateTest);
                        creneau.setHours(heure, minute, 0, 0);
                        
                        const occupes = await executeQuery(
                            `SELECT COUNT(*) as count FROM rendez_vous
                             WHERE medecin_id = ?
                             AND centre_id = ?
                             AND DATE(date_rdv) = DATE(?)
                             AND TIME(date_rdv) BETWEEN TIME(DATE_SUB(?, INTERVAL 29 MINUTE)) AND TIME(DATE_ADD(?, INTERVAL 29 MINUTE))
                             AND statut NOT IN ('annule', 'absent')`,
                            [medecin_id, centre_id, creneau, creneau, creneau]
                        );
                        
                        if (occupes[0].count === 0 && creneaux.length < 5) {
                            creneaux.push(creneau);
                        }
                    }
                }
            }
            
            return creneaux.slice(0, 5); // Limiter à 5 propositions
        } catch (error) {
            console.error('Erreur récupération créneaux:', error);
            return [];
        }
    }
}

module.exports = ReprogrammationService;

