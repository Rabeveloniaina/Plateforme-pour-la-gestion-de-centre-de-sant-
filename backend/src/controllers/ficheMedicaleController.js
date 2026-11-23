const FicheMedicale = require('../models/FicheMedicale');
const Prescription = require('../models/Prescription');

class FicheMedicaleController {
    // Récupérer la fiche médicale du patient connecté
    static async getMyRecord(req, res) {
        try {
            const user = req.user;
            console.log('🏥 GET /fiches-medicales/me - Utilisateur:', { id: user.id, role: user.role });
            const { executeQuery } = require('../config/database');
            
            // Récupérer la fiche médicale de base du patient
            const query = `
                SELECT * FROM patients_infos_medicales 
                WHERE patient_id = ? 
                LIMIT 1
            `;
            
            const fiches = await executeQuery(query, [user.id]);
            console.log(`✅ Fiche médicale récupérée: ${fiches.length > 0 ? 'Existante' : 'Aucune'}`);
            
            res.json({
                success: true,
                data: fiches[0] || null
            });
            
        } catch (error) {
            console.error('❌ Erreur récupération fiche médicale:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération de la fiche médicale',
                error: error.message
            });
        }
    }

    // Créer une nouvelle fiche médicale
    static async create(req, res) {
        try {
            const user = req.user;
            const ficheData = req.body;
            const { executeQuery } = require('../config/database');
            
            // Si c'est un patient, créer une fiche médicale de BASE
            if (user.role === 'patient') {
                console.log('📝 Création fiche médicale patient:', { 
                    patient_id: user.id, 
                    data: ficheData 
                });
                
                const query = `
                    INSERT INTO patients_infos_medicales (
                        patient_id, groupe_sanguin, poids, taille, tension, 
                        allergies, antecedents, maladies_chroniques, 
                        medicaments_actuels, contacts_urgence, infos_complementaires
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                
                const infosComp = ficheData.infos_complementaires || {};
                
                const params = [
                    user.id,
                    ficheData.groupe_sanguin || null,
                    ficheData.poids || null,
                    ficheData.taille || null,
                    ficheData.tension || null,
                    ficheData.allergies || null,
                    ficheData.antecedents || null,
                    infosComp.maladies_chroniques || null,
                    infosComp.medicaments_actuels || null,
                    infosComp.contacts_urgence || null,
                    JSON.stringify(infosComp)
                ];
                
                console.log('📊 Paramètres SQL:', params);
                
                const result = await executeQuery(query, params);
                
                console.log('✅ Fiche créée avec ID:', result.insertId);
                
                return res.status(201).json({
                    success: true,
                    message: 'Fiche médicale de base créée avec succès',
                    data: { id_fiche: result.insertId, patient_id: user.id }
                });
            }
            
            // Pour les médecins/admins : fiche de consultation
            const requiredFields = ['patient_id', 'medecin_id', 'date_consultation', 'motif_consultation'];
            const missingFields = requiredFields.filter(field => !ficheData[field]);
            
            if (missingFields.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Champs manquants: ${missingFields.join(', ')}`
                });
            }
            
            const fiche = await FicheMedicale.create(ficheData);
            
            res.status(201).json({
                success: true,
                message: 'Fiche médicale créée avec succès',
                data: fiche
            });
            
        } catch (error) {
            console.error('❌ Erreur création fiche médicale:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la création de la fiche médicale',
                error: error.message
            });
        }
    }

    // Récupérer une fiche médicale par ID
    static async getById(req, res) {
        try {
            const { id } = req.params;
            const fiche = await FicheMedicale.findById(id);
            
            if (!fiche) {
                return res.status(404).json({
                    success: false,
                    message: 'Fiche médicale non trouvée'
                });
            }

            // Récupérer les prescriptions associées
            const prescriptions = await Prescription.findByFicheMedicaleId(id);
            fiche.prescriptions = prescriptions;
            
            res.json({
                success: true,
                data: fiche
            });
            
        } catch (error) {
            console.error('❌ Erreur récupération fiche médicale:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération de la fiche médicale',
                error: error.message
            });
        }
    }

    // Récupérer toutes les fiches médicales d'un patient
    static async getByPatientId(req, res) {
        try {
            const { patient_id } = req.params;
            const { page = 1, limit = 50 } = req.query;
            
            const offset = (page - 1) * limit;
            const fiches = await FicheMedicale.findByPatientId(patient_id, parseInt(limit), offset);
            const total = await FicheMedicale.count({ patient_id });
            
            res.json({
                success: true,
                data: fiches,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
            
        } catch (error) {
            console.error('❌ Erreur récupération fiches patient:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des fiches du patient',
                error: error.message
            });
        }
    }

    // Récupérer toutes les fiches médicales d'un médecin
    static async getByMedecinId(req, res) {
        try {
            const { medecin_id } = req.params;
            const { 
                page = 1, 
                limit = 50, 
                date_debut, 
                date_fin, 
                statut 
            } = req.query;
            
            const offset = (page - 1) * limit;
            const filters = { date_debut, date_fin, statut };
            
            const fiches = await FicheMedicale.findByMedecinId(medecin_id, parseInt(limit), offset, filters);
            const total = await FicheMedicale.count({ medecin_id, ...filters });
            
            res.json({
                success: true,
                data: fiches,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
            
        } catch (error) {
            console.error('❌ Erreur récupération fiches médecin:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des fiches du médecin',
                error: error.message
            });
        }
    }

    // Mettre à jour une fiche médicale
    static async update(req, res) {
        try {
            const { id } = req.params;
            const user = req.user;
            const updateData = req.body;
            const { executeQuery } = require('../config/database');
            
            // Si c'est un patient, mettre à jour sa fiche médicale de BASE
            if (user.role === 'patient') {
                const infosComp = updateData.infos_complementaires || {};
                
                const query = `
                    UPDATE patients_infos_medicales SET
                        groupe_sanguin = ?,
                        poids = ?,
                        taille = ?,
                        tension = ?,
                        allergies = ?,
                        antecedents = ?,
                        maladies_chroniques = ?,
                        medicaments_actuels = ?,
                        contacts_urgence = ?,
                        infos_complementaires = ?
                    WHERE id_info = ? AND patient_id = ?
                `;
                
                const params = [
                    updateData.groupe_sanguin || null,
                    updateData.poids || null,
                    updateData.taille || null,
                    updateData.tension || null,
                    updateData.allergies || null,
                    updateData.antecedents || null,
                    infosComp.maladies_chroniques || null,
                    infosComp.medicaments_actuels || null,
                    infosComp.contacts_urgence || null,
                    JSON.stringify(infosComp),
                    id,
                    user.id
                ];
                
                const result = await executeQuery(query, params);
                
                if (result.affectedRows === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'Fiche médicale non trouvée ou non autorisée'
                    });
                }
                
                return res.json({
                    success: true,
                    message: 'Fiche médicale mise à jour avec succès'
                });
            }
            
            // Pour les médecins/admins
            const existingFiche = await FicheMedicale.findById(id);
            if (!existingFiche) {
                return res.status(404).json({
                    success: false,
                    message: 'Fiche médicale non trouvée'
                });
            }
            
            const fiche = await FicheMedicale.update(id, updateData);
            
            res.json({
                success: true,
                message: 'Fiche médicale mise à jour avec succès',
                data: fiche
            });
            
        } catch (error) {
            console.error('❌ Erreur mise à jour fiche médicale:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la mise à jour de la fiche médicale',
                error: error.message
            });
        }
    }

    // Supprimer une fiche médicale
    static async delete(req, res) {
        try {
            const { id } = req.params;
            const user = req.user;
            const { executeQuery } = require('../config/database');
            
            // Si c'est un patient, supprimer sa fiche médicale de BASE
            if (user.role === 'patient') {
                console.log('🗑️ Suppression fiche médicale patient:', { 
                    id_info: id, 
                    patient_id: user.id 
                });
                
                // Vérifier que la fiche appartient bien au patient
                const checkQuery = `
                    SELECT * FROM patients_infos_medicales 
                    WHERE id_info = ? AND patient_id = ?
                `;
                
                const fiches = await executeQuery(checkQuery, [id, user.id]);
                
                if (fiches.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'Fiche médicale non trouvée ou non autorisée'
                    });
                }
                
                // Supprimer la fiche
                const deleteQuery = `
                    DELETE FROM patients_infos_medicales 
                    WHERE id_info = ? AND patient_id = ?
                `;
                
                await executeQuery(deleteQuery, [id, user.id]);
                
                console.log('✅ Fiche médicale supprimée avec succès');
                
                return res.json({
                    success: true,
                    message: 'Fiche médicale supprimée avec succès'
                });
            }
            
            // Pour les admins : supprimer une fiche de consultation
            const existingFiche = await FicheMedicale.findById(id);
            if (!existingFiche) {
                return res.status(404).json({
                    success: false,
                    message: 'Fiche médicale non trouvée'
                });
            }
            
            const result = await FicheMedicale.delete(id);
            
            res.json({
                success: true,
                message: result.message
            });
            
        } catch (error) {
            console.error('❌ Erreur suppression fiche médicale:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la suppression de la fiche médicale',
                error: error.message
            });
        }
    }

    // Récupérer toutes les fiches médicales
    static async getAll(req, res) {
        try {
            const { 
                page = 1, 
                limit = 50, 
                date_debut, 
                date_fin, 
                statut,
                search,
                medecin_id,
                patient_id
            } = req.query;
            
            const offset = (page - 1) * limit;
            const filters = { date_debut, date_fin, statut, search, medecin_id, patient_id };
            
            const fiches = await FicheMedicale.findAll(parseInt(limit), offset, filters);
            const total = await FicheMedicale.count(filters);
            
            res.json({
                success: true,
                data: fiches,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
            
        } catch (error) {
            console.error('❌ Erreur récupération fiches médicales:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des fiches médicales',
                error: error.message
            });
        }
    }

    // Rechercher des fiches médicales
    static async search(req, res) {
        try {
            const { q, limit = 20 } = req.query;
            
            if (!q || q.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    message: 'Le terme de recherche doit contenir au moins 2 caractères'
                });
            }
            
            const fiches = await FicheMedicale.search(q.trim(), parseInt(limit));
            
            res.json({
                success: true,
                data: fiches,
                searchTerm: q,
                total: fiches.length
            });
            
        } catch (error) {
            console.error('❌ Erreur recherche fiches médicales:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la recherche',
                error: error.message
            });
        }
    }

    // Récupérer les statistiques des consultations
    static async getStatistiques(req, res) {
        try {
            const { medecin_id, date_debut, date_fin } = req.query;
            const filters = { medecin_id, date_debut, date_fin };
            
            const stats = await FicheMedicale.getStatistiques(filters);
            
            res.json({
                success: true,
                data: stats
            });
            
        } catch (error) {
            console.error('❌ Erreur statistiques fiches médicales:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des statistiques',
                error: error.message
            });
        }
    }

    // Créer une fiche médicale avec prescriptions
    static async createWithPrescriptions(req, res) {
        try {
            const { fiche_data, prescriptions = [] } = req.body;
            
            // Validation des données requises pour la fiche
            const requiredFields = ['patient_id', 'medecin_id', 'date_consultation', 'motif_consultation'];
            const missingFields = requiredFields.filter(field => !fiche_data[field]);
            
            if (missingFields.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Champs manquants pour la fiche: ${missingFields.join(', ')}`
                });
            }
            
            // Créer la fiche médicale
            const fiche = await FicheMedicale.create(fiche_data);
            
            // Créer les prescriptions si présentes
            let prescriptionsCreated = [];
            if (prescriptions.length > 0) {
                // Ajouter l'ID de la fiche à chaque prescription
                const prescriptionsWithFiche = prescriptions.map(p => ({
                    ...p,
                    fiche_medicale_id: fiche.id
                }));
                
                prescriptionsCreated = await Prescription.createMultiple(prescriptionsWithFiche);
            }
            
            res.status(201).json({
                success: true,
                message: 'Fiche médicale et prescriptions créées avec succès',
                data: {
                    fiche,
                    prescriptions: prescriptionsCreated
                }
            });
            
        } catch (error) {
            console.error('❌ Erreur création fiche avec prescriptions:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la création de la fiche avec prescriptions',
                error: error.message
            });
        }
    }

    // Finaliser une consultation
    static async finaliserConsultation(req, res) {
        try {
            const { id } = req.params;
            const { prescriptions = [], examens_complementaires = [] } = req.body;
            
            // Mettre à jour le statut de la fiche à "termine"
            const fiche = await FicheMedicale.update(id, { statut: 'termine' });
            
            // Créer les prescriptions si présentes
            let prescriptionsCreated = [];
            if (prescriptions.length > 0) {
                const prescriptionsWithFiche = prescriptions.map(p => ({
                    ...p,
                    fiche_medicale_id: id
                }));
                
                prescriptionsCreated = await Prescription.createMultiple(prescriptionsWithFiche);
            }
            
            res.json({
                success: true,
                message: 'Consultation finalisée avec succès',
                data: {
                    fiche,
                    prescriptions: prescriptionsCreated,
                    examens_complementaires
                }
            });
            
        } catch (error) {
            console.error('❌ Erreur finalisation consultation:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la finalisation de la consultation',
                error: error.message
            });
        }
    }

    // Récupérer le résumé médical d'un patient
    static async getResumeMedical(req, res) {
        try {
            const { patient_id } = req.params;
            
            // Récupérer les dernières fiches médicales
            const fiches = await FicheMedicale.findByPatientId(patient_id, 10, 0);
            
            // Récupérer les prescriptions actives
            const prescriptionsActives = await Prescription.getActivePrescriptions(patient_id);
            
            // Calculer quelques statistiques
            const stats = await FicheMedicale.getStatistiques({ patient_id });
            
            res.json({
                success: true,
                data: {
                    dernieres_consultations: fiches,
                    prescriptions_actives: prescriptionsActives,
                    statistiques: stats,
                    patient_id
                }
            });
            
        } catch (error) {
            console.error('❌ Erreur résumé médical:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération du résumé médical',
                error: error.message
            });
        }
    }
}

module.exports = FicheMedicaleController;
