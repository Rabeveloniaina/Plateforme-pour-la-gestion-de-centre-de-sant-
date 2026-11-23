/**
 * Middleware de sécurité par centre
 * Vérifie que l'utilisateur a accès aux données du centre demandé
 */

const { executeQuery } = require('../config/database');

class CentreSecurity {
    /**
     * Vérifier l'accès au centre pour les opérations CRUD
     */
    static async checkCentreAccess(req, res, next) {
        try {
            const user = req.user;
            const centreId = req.params.centre_id || req.body.centre_id || req.query.centre_id;

            // Le ministère a accès à tous les centres
            if (user.role === 'ministere') {
                return next();
            }

            // Vérifier que l'utilisateur est lié à un centre
            if (!user.id_centre) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé: Utilisateur non lié à un centre'
                });
            }

            // Si un centre_id est spécifié, vérifier l'accès
            if (centreId && parseInt(centreId) !== user.id_centre) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé: Vous ne pouvez accéder qu\'aux données de votre centre'
                });
            }

            // Ajouter le centre_id de l'utilisateur aux paramètres de la requête
            req.userCentreId = user.id_centre;
            next();

        } catch (error) {
            console.error('❌ Erreur vérification accès centre:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur de sécurité',
                error: error.message
            });
        }
    }

    /**
     * Vérifier l'accès aux patients (doit être du même centre)
     */
    static async checkPatientAccess(req, res, next) {
        try {
            const user = req.user;
            const patientId = req.params.id || req.params.patient_id;

            // Le ministère a accès à tous les patients
            if (user.role === 'ministere') {
                return next();
            }

            // Vérifier que l'utilisateur est lié à un centre
            if (!user.id_centre) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé: Utilisateur non lié à un centre'
                });
            }

            // Si un patient_id est spécifié, vérifier qu'il appartient au même centre
            if (patientId) {
                const patient = await executeQuery(
                    'SELECT centre_id FROM patients WHERE id_patient = ?',
                    [patientId]
                );

                if (patient.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'Patient non trouvé'
                    });
                }

                if (patient[0].centre_id !== user.id_centre) {
                    return res.status(403).json({
                        success: false,
                        message: 'Accès refusé: Ce patient n\'appartient pas à votre centre'
                    });
                }
            }

            // Ajouter le centre_id de l'utilisateur aux paramètres de la requête
            req.userCentreId = user.id_centre;
            next();

        } catch (error) {
            console.error('❌ Erreur vérification accès patient:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur de sécurité',
                error: error.message
            });
        }
    }

    /**
     * Vérifier l'accès aux rendez-vous (doit être du même centre)
     */
    static async checkRendezVousAccess(req, res, next) {
        try {
            const user = req.user;
            const rdvId = req.params.id || req.params.rdv_id;

            // Le ministère a accès à tous les RDV
            if (user.role === 'ministere') {
                return next();
            }

            // Vérifier que l'utilisateur est lié à un centre
            if (!user.id_centre) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé: Utilisateur non lié à un centre'
                });
            }

            // Si un rdv_id est spécifié, vérifier qu'il appartient au même centre
            if (rdvId) {
                const rdv = await executeQuery(
                    'SELECT centre_id FROM rendez_vous WHERE id_rdv = ?',
                    [rdvId]
                );

                if (rdv.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'Rendez-vous non trouvé'
                    });
                }

                if (rdv[0].centre_id !== user.id_centre) {
                    return res.status(403).json({
                        success: false,
                        message: 'Accès refusé: Ce rendez-vous n\'appartient pas à votre centre'
                    });
                }
            }

            // Ajouter le centre_id de l'utilisateur aux paramètres de la requête
            req.userCentreId = user.id_centre;
            next();

        } catch (error) {
            console.error('❌ Erreur vérification accès RDV:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur de sécurité',
                error: error.message
            });
        }
    }

    /**
     * Vérifier l'accès aux médecins (doit être du même centre)
     */
    static async checkMedecinAccess(req, res, next) {
        try {
            const user = req.user;
            const medecinId = req.params.id || req.params.medecin_id;

            // Le ministère a accès à tous les médecins
            if (user.role === 'ministere') {
                return next();
            }

            // Vérifier que l'utilisateur est lié à un centre
            if (!user.id_centre) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé: Utilisateur non lié à un centre'
                });
            }

            // Si un medecin_id est spécifié, vérifier qu'il appartient au même centre
            if (medecinId) {
                const medecin = await executeQuery(
                    'SELECT centre_id FROM medecins WHERE id_medecin = ?',
                    [medecinId]
                );

                if (medecin.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'Médecin non trouvé'
                    });
                }

                if (medecin[0].centre_id !== user.id_centre) {
                    return res.status(403).json({
                        success: false,
                        message: 'Accès refusé: Ce médecin n\'appartient pas à votre centre'
                    });
                }
            }

            // Ajouter le centre_id de l'utilisateur aux paramètres de la requête
            req.userCentreId = user.id_centre;
            next();

        } catch (error) {
            console.error('❌ Erreur vérification accès médecin:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur de sécurité',
                error: error.message
            });
        }
    }

    /**
     * Vérifier l'accès aux fiches médicales (doit être du même centre)
     */
    static async checkFicheMedicaleAccess(req, res, next) {
        try {
            const user = req.user;
            const ficheId = req.params.id || req.params.fiche_id;

            // Le ministère a accès à toutes les fiches
            if (user.role === 'ministere') {
                return next();
            }

            // Vérifier que l'utilisateur est lié à un centre
            if (!user.id_centre) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé: Utilisateur non lié à un centre'
                });
            }

            // Si une fiche_id est spécifiée, vérifier qu'elle appartient au même centre
            if (ficheId) {
                const fiche = await executeQuery(`
                    SELECT p.centre_id 
                    FROM fiches_medicales f 
                    JOIN patients p ON f.patient_id = p.id_patient 
                    WHERE f.id_fiche = ?
                `, [ficheId]);

                if (fiche.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'Fiche médicale non trouvée'
                    });
                }

                if (fiche[0].centre_id !== user.id_centre) {
                    return res.status(403).json({
                        success: false,
                        message: 'Accès refusé: Cette fiche médicale n\'appartient pas à votre centre'
                    });
                }
            }

            // Ajouter le centre_id de l'utilisateur aux paramètres de la requête
            req.userCentreId = user.id_centre;
            next();

        } catch (error) {
            console.error('❌ Erreur vérification accès fiche médicale:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur de sécurité',
                error: error.message
            });
        }
    }

    /**
     * Vérifier l'accès aux statistiques (filtrage par centre)
     */
    static async checkStatistiqueAccess(req, res, next) {
        try {
            const user = req.user;

            // Le ministère a accès à toutes les statistiques
            if (user.role === 'ministere') {
                return next();
            }

            // Vérifier que l'utilisateur est lié à un centre
            if (!user.id_centre) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé: Utilisateur non lié à un centre'
                });
            }

            // Ajouter le centre_id de l'utilisateur aux paramètres de la requête
            req.userCentreId = user.id_centre;
            next();

        } catch (error) {
            console.error('❌ Erreur vérification accès statistiques:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur de sécurité',
                error: error.message
            });
        }
    }
}

module.exports = CentreSecurity;
