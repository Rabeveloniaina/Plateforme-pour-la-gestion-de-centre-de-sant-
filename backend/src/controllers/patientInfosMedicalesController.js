const PatientInfosMedicales = require('../models/PatientInfosMedicales');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

class PatientInfosMedicalesController {
    // Récupérer les informations médicales du patient connecté
    static async getMyInfos(req, res) {
        try {
            const patientId = req.user.id_patient || req.user.id;

            if (!patientId) {
                return res.status(400).json(errorResponse('ID patient manquant'));
            }

            const infos = await PatientInfosMedicales.findByPatientId(patientId);

            return res.json(successResponse(infos, 'Informations médicales récupérées'));
        } catch (error) {
            console.error('Erreur getMyInfos:', error);
            return res.status(500).json(errorResponse(error.message));
        }
    }

    // Récupérer les informations médicales d'un patient spécifique
    static async getByPatientId(req, res) {
        try {
            const { patient_id } = req.params;

            const infos = await PatientInfosMedicales.findByPatientId(patient_id);

            return res.json(successResponse(infos, 'Informations médicales récupérées'));
        } catch (error) {
            console.error('Erreur getByPatientId:', error);
            return res.status(500).json(errorResponse(error.message));
        }
    }

    // Créer ou mettre à jour les informations médicales
    static async createOrUpdate(req, res) {
        try {
            const patientId = req.user.id_patient || req.user.id;

            if (!patientId) {
                return res.status(400).json(errorResponse('ID patient manquant'));
            }

            const infosData = req.body;

            // Valider les données
            if (!infosData || typeof infosData !== 'object') {
                return res.status(400).json(errorResponse('Données invalides'));
            }

            const infos = await PatientInfosMedicales.createOrUpdate(patientId, infosData);

            return res.json(successResponse(infos, 'Informations médicales enregistrées'));
        } catch (error) {
            console.error('Erreur createOrUpdate:', error);
            
            // Vérifier si c'est une erreur de foreign key
            if (error.message.includes('foreign key constraint')) {
                return res.status(400).json(errorResponse('Patient introuvable. Veuillez vous assurer que votre compte patient existe.'));
            }
            
            return res.status(500).json(errorResponse(error.message));
        }
    }

    // Supprimer les informations médicales
    static async delete(req, res) {
        try {
            const { id } = req.params;
            const patientId = req.user.id_patient || req.user.id;

            // Vérifier que l'utilisateur supprime bien ses propres informations
            const infos = await PatientInfosMedicales.findById(id);
            
            if (!infos) {
                return res.status(404).json(errorResponse('Informations médicales non trouvées'));
            }

            if (infos.patient_id !== patientId && req.user.role !== 'medecin' && req.user.role !== 'admin') {
                return res.status(403).json(errorResponse('Non autorisé'));
            }

            await PatientInfosMedicales.delete(id);

            return res.json(successResponse(null, 'Informations médicales supprimées'));
        } catch (error) {
            console.error('Erreur delete:', error);
            return res.status(500).json(errorResponse(error.message));
        }
    }

    // Mettre à jour un champ spécifique
    static async updateField(req, res) {
        try {
            const patientId = req.user.id_patient || req.user.id;
            const { field, value } = req.body;

            if (!field) {
                return res.status(400).json(errorResponse('Champ manquant'));
            }

            const infos = await PatientInfosMedicales.updateField(patientId, field, value);

            return res.json(successResponse(infos, 'Champ mis à jour'));
        } catch (error) {
            console.error('Erreur updateField:', error);
            return res.status(500).json(errorResponse(error.message));
        }
    }
}

module.exports = PatientInfosMedicalesController;

