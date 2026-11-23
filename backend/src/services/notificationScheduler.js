/**
 * SYSTÈME DE RAPPELS AUTOMATIQUES
 * Envoie des rappels de RDV automatiquement chaque jour
 */

// node-cron est optionnel - le scheduler fonctionnera en mode dégradé sans
let cron = null;
try {
    cron = require('node-cron');
} catch (error) {
    console.warn('⚠️  node-cron non disponible - Les notifications automatiques ne fonctionneront pas');
    console.warn('   Pour activer: npm install node-cron');
}

const { executeQuery } = require('../config/database');
const { notifyRdv } = require('./notificationService');

class NotificationScheduler {
    constructor() {
        this.job = null;
        this.isRunning = false;
    }

    // Démarrer le scheduler
    start() {
        if (this.isRunning) {
            console.log('⚠️  Scheduler déjà en cours d\'exécution');
            return;
        }

        // Vérifier si node-cron est disponible
        if (!cron) {
            console.warn('⚠️  node-cron non installé - Scheduler non démarré');
            console.warn('   Pour activer les notifications automatiques: npm install node-cron');
            console.warn('   Les notifications manuelles restent disponibles via l\'API');
            return;
        }

        // Vérifier si les notifications sont activées
        if (process.env.NOTIFICATIONS_ENABLED !== 'true') {
            console.log('ℹ️  Notifications désactivées - Scheduler non démarré');
            return;
        }

        // Heure d'envoi des rappels (par défaut 09:00)
        const rappelHeure = process.env.RAPPEL_HEURE || '09:00';
        const [heure, minute] = rappelHeure.split(':');
        
        // Cron expression: tous les jours à l'heure définie
        const cronExpression = `${minute} ${heure} * * *`;
        
        this.job = cron.schedule(cronExpression, async () => {
            console.log('🔔 Exécution du scheduler de rappels...');
            await this.envoyerRappelsJournaliers();
        });

        this.isRunning = true;
        console.log(`✅ Scheduler de rappels démarré - Envoi quotidien à ${rappelHeure}`);
        
        // Option: exécuter immédiatement au démarrage (pour tests)
        if (process.env.NODE_ENV === 'development') {
            console.log('🔧 Mode développement: Exécution immédiate du scheduler pour test');
            this.envoyerRappelsJournaliers();
        }
    }

    // Arrêter le scheduler
    stop() {
        if (this.job) {
            this.job.stop();
            this.isRunning = false;
            console.log('🛑 Scheduler de rappels arrêté');
        }
    }

    // Envoyer les rappels de RDV du jour suivant
    async envoyerRappelsJournaliers() {
        try {
            // Nombre de jours avant pour envoyer le rappel (par défaut 1 jour)
            const joursAvant = parseInt(process.env.RAPPEL_JOURS_AVANT || '1');
            
            console.log(`📅 Recherche des RDV dans ${joursAvant} jour(s)...`);
            
            // Récupérer les RDV de demain (ou J+N selon config) qui n'ont pas été rappelés
            const query = `
                SELECT 
                    rv.id_rdv,
                    rv.date_rdv,
                    rv.statut,
                    p.id_patient,
                    p.nom as patient_nom,
                    p.prenom as patient_prenom,
                    p.email as patient_email,
                    p.telephone as patient_telephone,
                    m.nom as medecin_nom,
                    m.prenom as medecin_prenom,
                    m.specialite,
                    c.nom as centre_nom,
                    c.adresse as centre_adresse
                FROM rendez_vous rv
                JOIN patients p ON rv.patient_id = p.id_patient
                JOIN medecins m ON rv.medecin_id = m.id_medecin
                JOIN centres_sante c ON rv.centre_id = c.id_centre
                WHERE DATE(rv.date_rdv) = DATE(NOW()) + INTERVAL ? DAY
                AND rv.statut IN ('attente', 'confirme')
                AND NOT EXISTS (
                    SELECT 1 FROM notifications n
                    WHERE n.patient_id = p.id_patient
                    AND n.type = 'rappel_rdv'
                    AND DATE(n.created_at) = CURDATE()
                    AND n.rdv_id = rv.id_rdv
                )
            `;
            
            const rdvs = await executeQuery(query, [joursAvant]);
            
            console.log(`📋 ${rdvs.length} rendez-vous trouvé(s) nécessitant un rappel`);
            
            if (rdvs.length === 0) {
                return { sent: 0, failed: 0 };
            }
            
            let sent = 0;
            let failed = 0;
            
            // Envoyer un rappel pour chaque RDV
            for (const rdv of rdvs) {
                try {
                    const patient = {
                        id_patient: rdv.id_patient,
                        nom: rdv.patient_nom,
                        prenom: rdv.patient_prenom,
                        email: rdv.patient_email,
                        telephone: rdv.patient_telephone
                    };
                    
                    const rdvInfo = {
                        id_rdv: rdv.id_rdv,
                        date_rdv: rdv.date_rdv,
                        medecin_nom: `${rdv.medecin_prenom} ${rdv.medecin_nom}`,
                        specialite: rdv.specialite,
                        centre_nom: rdv.centre_nom,
                        centre_adresse: rdv.centre_adresse
                    };
                    
                    // Envoyer le rappel
                    const results = await notifyRdv(patient, rdvInfo, 'rappel');
                    
                    // Enregistrer la notification en base
                    await this.enregistrerNotification(rdv.id_patient, rdv.id_rdv, results);
                    
                    if (results.email || results.sms) {
                        sent++;
                        console.log(`✅ Rappel envoyé pour RDV #${rdv.id_rdv} - Patient: ${patient.prenom} ${patient.nom}`);
                    } else {
                        failed++;
                        console.log(`❌ Échec envoi rappel RDV #${rdv.id_rdv} - Aucun canal disponible`);
                    }
                    
                } catch (error) {
                    failed++;
                    console.error(`❌ Erreur envoi rappel RDV #${rdv.id_rdv}:`, error.message);
                }
                
                // Petite pause entre chaque envoi pour éviter le rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            console.log(`✅ Rappels envoyés: ${sent} | ❌ Échecs: ${failed}`);
            
            return { sent, failed, total: rdvs.length };
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'envoi des rappels journaliers:', error);
            return { sent: 0, failed: 0, error: error.message };
        }
    }

    // Enregistrer la notification en base de données
    async enregistrerNotification(patientId, rdvId, results) {
        try {
            const type = 'rappel_rdv';
            const message = `Rappel: Vous avez un rendez-vous demain`;
            
            // Email
            if (results.email) {
                await executeQuery(`
                    INSERT INTO notifications (patient_id, rdv_id, type, message, canal, statut, date_envoi)
                    VALUES (?, ?, ?, ?, 'email', 'envoye', NOW())
                `, [patientId, rdvId, type, message]);
            }
            
            // SMS
            if (results.sms) {
                await executeQuery(`
                    INSERT INTO notifications (patient_id, rdv_id, type, message, canal, statut, date_envoi)
                    VALUES (?, ?, ?, ?, 'sms', 'envoye', NOW())
                `, [patientId, rdvId, type, message]);
            }
            
            // Si aucun canal n'a fonctionné
            if (!results.email && !results.sms) {
                await executeQuery(`
                    INSERT INTO notifications (patient_id, rdv_id, type, message, canal, statut)
                    VALUES (?, ?, ?, ?, 'aucun', 'echoue')
                `, [patientId, rdvId, type, message]);
            }
            
        } catch (error) {
            console.error('❌ Erreur enregistrement notification en base:', error.message);
        }
    }

    // Envoyer les rappels de prescriptions qui expirent
    async envoyerRappelsPrescriptions() {
        try {
            console.log('💊 Recherche des prescriptions expirant bientôt...');
            
            const query = `
                SELECT 
                    pr.id_prescription,
                    pr.date_fin,
                    pr.dosage_prescrit,
                    pr.frequence,
                    m.nom_commercial as medicament_nom,
                    p.id_patient,
                    p.nom as patient_nom,
                    p.prenom as patient_prenom,
                    p.email as patient_email,
                    p.telephone as patient_telephone
                FROM prescriptions pr
                JOIN medicaments m ON pr.medicament_id = m.id_medicament
                JOIN fiches_medicales fm ON pr.fiche_medicale_id = fm.id_fiche
                JOIN patients p ON fm.patient_id = p.id_patient
                WHERE pr.statut = 'active'
                AND pr.date_fin BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
                AND NOT EXISTS (
                    SELECT 1 FROM notifications n
                    WHERE n.patient_id = p.id_patient
                    AND n.type = 'prescription_expiration'
                    AND n.prescription_id = pr.id_prescription
                    AND DATE(n.created_at) = CURDATE()
                )
            `;
            
            const prescriptions = await executeQuery(query);
            
            console.log(`💊 ${prescriptions.length} prescription(s) expirant bientôt`);
            
            // TODO: Envoyer les notifications
            // (Similaire à envoyerRappelsJournaliers)
            
            return { sent: 0, total: prescriptions.length };
            
        } catch (error) {
            console.error('❌ Erreur rappels prescriptions:', error);
            return { sent: 0, failed: 0, error: error.message };
        }
    }

    // Envoyer les rappels de vaccinations
    async envoyerRappelsVaccinations() {
        try {
            console.log('💉 Recherche des vaccinations à rappeler...');
            
            const query = `
                SELECT 
                    v.id_vaccination,
                    v.nom_vaccin,
                    v.type_vaccin,
                    v.date_rappel_prevu,
                    p.id_patient,
                    p.nom as patient_nom,
                    p.prenom as patient_prenom,
                    p.email as patient_email,
                    p.telephone as patient_telephone
                FROM vaccinations v
                JOIN patients p ON v.patient_id = p.id_patient
                WHERE v.date_rappel_prevu BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 14 DAY)
                AND v.statut = 'administre'
                AND NOT EXISTS (
                    SELECT 1 FROM notifications n
                    WHERE n.patient_id = p.id_patient
                    AND n.type = 'vaccination_rappel'
                    AND n.vaccination_id = v.id_vaccination
                    AND DATE(n.created_at) = CURDATE()
                )
            `;
            
            const vaccinations = await executeQuery(query);
            
            console.log(`💉 ${vaccinations.length} vaccination(s) à rappeler`);
            
            // TODO: Envoyer les notifications
            
            return { sent: 0, total: vaccinations.length };
            
        } catch (error) {
            console.error('❌ Erreur rappels vaccinations:', error);
            return { sent: 0, failed: 0, error: error.message };
        }
    }

    // Test manuel du scheduler
    async testRappels() {
        console.log('🧪 TEST MANUEL DU SCHEDULER\n');
        
        const rdvResults = await this.envoyerRappelsJournaliers();
        console.log('\nRésultats RDV:', rdvResults);
        
        const prescResults = await this.envoyerRappelsPrescriptions();
        console.log('\nRésultats Prescriptions:', prescResults);
        
        const vaccResults = await this.envoyerRappelsVaccinations();
        console.log('\nRésultats Vaccinations:', vaccResults);
        
        return {
            rdv: rdvResults,
            prescriptions: prescResults,
            vaccinations: vaccResults
        };
    }
}

// Instance unique (singleton)
const scheduler = new NotificationScheduler();

module.exports = scheduler;

