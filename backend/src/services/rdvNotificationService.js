const Notification = require('../models/Notification');

/**
 * Service pour gérer les notifications in-app liées aux rendez-vous
 */
class RdvNotificationService {
    /**
     * Créer une notification in-app pour un patient
     */
    static async createInAppNotification({ patient_id, medecin_id = null, titre, message, type = 'in_app' }) {
        try {
            const notification = await Notification.create({
                patient_id,
                medecin_id,
                type,
                titre,
                message,
                statut: 'envoye', // Les notifications in-app sont immédiatement "envoyées"
                lu: false
            });

            console.log(`✅ Notification in-app créée pour le patient ${patient_id}: ${titre}`);
            return notification;
        } catch (error) {
            console.error('❌ Erreur création notification in-app:', error);
            throw error;
        }
    }

    /**
     * Notification de confirmation de rendez-vous
     */
    static async notifyRdvConfirme(patient, rdv) {
        const dateRdv = new Date(rdv.date_rdv).toLocaleString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const titre = '✅ Rendez-vous confirmé';
        const message = `Votre rendez-vous du ${dateRdv} a été confirmé.${rdv.medecin_nom ? ` Médecin: Dr. ${rdv.medecin_nom}` : ''}${rdv.centre_nom ? ` Centre: ${rdv.centre_nom}` : ''}`;

        return await this.createInAppNotification({
            patient_id: patient.id_patient || patient.patient_id,
            medecin_id: rdv.medecin_id || null,
            titre,
            message,
            type: 'confirmation'
        });
    }

    /**
     * Notification d'annulation de rendez-vous
     */
    static async notifyRdvAnnule(patient, rdv, raison = null) {
        const dateRdv = new Date(rdv.date_rdv).toLocaleString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const titre = '❌ Rendez-vous annulé';
        let message = `Votre rendez-vous du ${dateRdv} a été annulé.`;

        if (raison) {
            message += ` Raison: ${raison}`;
        }

        message += ` Veuillez contacter le centre pour reprogrammer.`;

        return await this.createInAppNotification({
            patient_id: patient.id_patient || patient.patient_id,
            medecin_id: rdv.medecin_id || null,
            titre,
            message,
            type: 'annulation'
        });
    }

    /**
     * Notification de modification de rendez-vous
     */
    static async notifyRdvModifie(patient, rdv, ancienneDate = null) {
        const nouvelleDate = new Date(rdv.date_rdv).toLocaleString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const titre = '📅 Rendez-vous modifié';
        let message = `Votre rendez-vous a été reprogrammé pour le ${nouvelleDate}.`;

        if (ancienneDate) {
            const ancienneDateFormatted = new Date(ancienneDate).toLocaleString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            message = `Votre rendez-vous du ${ancienneDateFormatted} a été reprogrammé pour le ${nouvelleDate}.`;
        }

        if (rdv.medecin_nom) {
            message += ` Médecin: Dr. ${rdv.medecin_nom}`;
        }

        return await this.createInAppNotification({
            patient_id: patient.id_patient || patient.patient_id,
            medecin_id: rdv.medecin_id || null,
            titre,
            message,
            type: 'reprogramme'
        });
    }

    /**
     * Notification de rappel de rendez-vous (24h avant)
     */
    static async notifyRdvRappel(patient, rdv) {
        const dateRdv = new Date(rdv.date_rdv).toLocaleString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const titre = '⏰ Rappel de rendez-vous';
        const message = `N'oubliez pas votre rendez-vous demain: ${dateRdv}.${rdv.medecin_nom ? ` Médecin: Dr. ${rdv.medecin_nom}` : ''}${rdv.centre_nom ? ` Centre: ${rdv.centre_nom}` : ''}`;

        return await this.createInAppNotification({
            patient_id: patient.id_patient || patient.patient_id,
            medecin_id: rdv.medecin_id || null,
            titre,
            message,
            type: 'rappel'
        });
    }

    /**
     * Notification de retard de patient
     */
    static async notifyPatientRetard(patient, rdv) {
        const titre = '⚠️ Retard signalé';
        const message = `Votre retard pour le rendez-vous a été signalé. Merci de vous présenter dès que possible.`;

        return await this.createInAppNotification({
            patient_id: patient.id_patient || patient.patient_id,
            medecin_id: rdv.medecin_id || null,
            titre,
            message,
            type: 'retard'
        });
    }

    /**
     * Notification d'absence de patient
     */
    static async notifyPatientAbsent(patient, rdv) {
        const titre = '❗ Absence constatée';
        const message = `Votre absence au rendez-vous a été constatée. Veuillez contacter le centre pour reprogrammer.`;

        return await this.createInAppNotification({
            patient_id: patient.id_patient || patient.patient_id,
            medecin_id: rdv.medecin_id || null,
            titre,
            message,
            type: 'absence'
        });
    }
}

module.exports = RdvNotificationService;
