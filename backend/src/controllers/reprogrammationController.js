/**
 * Contrôleur pour la gestion des reprogrammations automatiques
 */

const ReprogrammationService = require('../services/reprogrammationService');
const DataIntegrityValidators = require('../validators/dataIntegrityValidators');

class ReprogrammationController {
    // Détecter les retards
    static async detecterRetards(req, res) {
        try {
            const user = req.user;
            const centre_id = user.id_centre || req.query.centre_id;
            
            const retards = await ReprogrammationService.detecterRetards(centre_id);
            
            res.json({
                success: true,
                data: retards,
                count: retards.length
            });
        } catch (error) {
            console.error('Erreur détection retards:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la détection des retards',
                error: error.message
            });
        }
    }

    // Détecter les absences
    static async detecterAbsences(req, res) {
        try {
            const user = req.user;
            const centre_id = user.id_centre || req.query.centre_id;
            
            const absences = await ReprogrammationService.detecterAbsences(centre_id);
            
            res.json({
                success: true,
                data: absences,
                count: absences.length
            });
        } catch (error) {
            console.error('Erreur détection absences:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la détection des absences',
                error: error.message
            });
        }
    }

    // Marquer comme absent
    static async marquerAbsent(req, res) {
        try {
            const { id } = req.params;
            
            const result = await ReprogrammationService.marquerAbsent(parseInt(id));
            
            res.json({
                success: true,
                message: result.message
            });
        } catch (error) {
            console.error('Erreur marquage absent:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors du marquage absent',
                error: error.message
            });
        }
    }

    // Proposer reprogrammation
    static async proposerReprogrammation(req, res) {
        try {
            const { id } = req.params;
            const { nouvelle_date } = req.body;
            
            const nouvelleDate = nouvelle_date ? new Date(nouvelle_date) : null;
            const result = await ReprogrammationService.proposerReprogrammation(
                parseInt(id),
                nouvelleDate
            );
            
            res.json(result);
        } catch (error) {
            console.error('Erreur proposition reprogrammation:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la proposition de reprogrammation',
                error: error.message
            });
        }
    }

    // Reprogrammer un rendez-vous
    static async reprogrammer(req, res) {
        try {
            const { id } = req.params;
            const { nouvelle_date } = req.body;
            
            console.log('🔄 Reprogrammation RDV:', {
                rdv_id: id,
                nouvelle_date: nouvelle_date,
                body: req.body,
                params: req.params
            });
            
            if (!nouvelle_date) {
                return res.status(400).json({
                    success: false,
                    message: 'nouvelle_date est requise'
                });
            }
            
            // Parser la date en heure LOCALE (pas UTC)
            // Format attendu: "YYYY-MM-DDTHH:mm" ou "YYYY-MM-DDTHH:mm:ss"
            let dateStr = nouvelle_date;
            if (dateStr && dateStr.length === 16 && dateStr.includes('T')) {
                dateStr = dateStr + ':00';
            }
            
            // Extraire les composants de la date (en LOCAL, pas UTC)
            const dateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/);
            if (!dateMatch) {
                return res.status(400).json({
                    success: false,
                    message: 'Format de date invalide. Format attendu: YYYY-MM-DDTHH:mm'
                });
            }
            
            // Créer une date en heure LOCALE (pas UTC)
            const [, year, month, day, hours, minutes, seconds] = dateMatch;
            const nouvelleDate = new Date(
                parseInt(year),
                parseInt(month) - 1, // Les mois sont 0-indexés
                parseInt(day),
                parseInt(hours),
                parseInt(minutes),
                parseInt(seconds || '0')
            );
            
            console.log('📅 Nouvelle date parsée (LOCAL):', nouvelleDate);
            console.log('📅 Heure locale:', nouvelleDate.toLocaleString('fr-FR'));
            
            if (isNaN(nouvelleDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Format de date invalide'
                });
            }

            // Récupérer la date originale du RDV pour la validation
            const RendezVous = require('../models/RendezVous');
            const rdvOriginal = await RendezVous.findById(parseInt(id));
            const dateOriginale = rdvOriginal ? new Date(rdvOriginal.date_rdv) : null;

            // Validation d'intégrité des données pour le réajustement
            const reajustementValidation = DataIntegrityValidators.validateReajustementRendezVous(
                nouvelleDate,
                dateOriginale
            );
            if (!reajustementValidation.valid) {
                return res.status(400).json({
                    success: false,
                    message: reajustementValidation.message
                });
            }
            
            const result = await ReprogrammationService.reprogrammer(
                parseInt(id),
                nouvelleDate
            );
            
            console.log('✅ Reprogrammation réussie:', result);
            
            res.json({
                success: true,
                message: result.message,
                nouvelle_date: result.nouvelle_date
            });
        } catch (error) {
            console.error('❌ Erreur reprogrammation:', error);
            console.error('Stack trace:', error.stack);
            res.status(500).json({
                success: false,
                message: error.message || 'Erreur lors de la reprogrammation',
                error: error.message
            });
        }
    }
}

module.exports = ReprogrammationController;

