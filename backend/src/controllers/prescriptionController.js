const Prescription = require('../models/Prescription');
const Medicament = require('../models/Medicament');
const { formatDateForMySQL } = require('../utils/dateFormatter');
const DataIntegrityValidators = require('../validators/dataIntegrityValidators');

class PrescriptionController {
    // Récupérer toutes les prescriptions avec pagination
    static async getAll(req, res) {
        try {
            const { page = 1, limit = 10, statut, search } = req.query;
            const offset = (page - 1) * limit;
            
            let conditions = [];
            let params = [];
            
            if (statut) {
                conditions.push('p.statut = ?');
                params.push(statut);
            }
            
            if (search) {
                conditions.push('(m.nom_commercial LIKE ? OR m.denomination_commune LIKE ?)');
                params.push(`%${search}%`, `%${search}%`);
            }
            
            const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
            
            const prescriptions = await Prescription.getAll(whereClause, params, limit, offset);
            const total = await Prescription.count(whereClause, params);
            
            res.json({
                success: true,
                data: {
                    prescriptions,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        pages: Math.ceil(total / limit)
                    }
                }
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des prescriptions:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des prescriptions',
                error: error.message
            });
        }
    }

    // Créer une nouvelle prescription
    static async create(req, res) {
        try {
            const prescriptionData = req.body;
            
            // Validation des données requises
            const requiredFields = ['fiche_medicale_id', 'medicament_id', 'dosage_prescrit', 'frequence', 'duree_traitement', 'quantite_totale', 'date_debut', 'date_fin'];
            const missingFields = requiredFields.filter(field => !prescriptionData[field]);
            
            if (missingFields.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Champs manquants: ${missingFields.join(', ')}`
                });
            }

            // Validation d'intégrité des données
            // Valider que la date de début est aujourd'hui ou dans le futur
            const dateDebutValidation = DataIntegrityValidators.validateDateDebutPrescription(prescriptionData.date_debut);
            if (!dateDebutValidation.valid) {
                return res.status(400).json({
                    success: false,
                    message: dateDebutValidation.message
                });
            }

            // Valider que la date de fin est après la date de début
            const dateFinValidation = DataIntegrityValidators.validateDateFinApresDebut(
                prescriptionData.date_debut,
                prescriptionData.date_fin,
                'prescription'
            );
            if (!dateFinValidation.valid) {
                return res.status(400).json({
                    success: false,
                    message: dateFinValidation.message
                });
            }

            // Valider que la durée de traitement est positive
            const dureeTraitement = parseInt(prescriptionData.duree_traitement);
            if (isNaN(dureeTraitement) || dureeTraitement <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'La durée de traitement doit être un nombre positif (en jours)'
                });
            }

            // Valider que la quantité totale est positive
            const quantiteTotale = parseInt(prescriptionData.quantite_totale);
            if (isNaN(quantiteTotale) || quantiteTotale <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'La quantité totale doit être un nombre positif'
                });
            }
            
            const prescription = await Prescription.create(prescriptionData);
            
            res.status(201).json({
                success: true,
                message: 'Prescription créée avec succès',
                data: prescription
            });
            
        } catch (error) {
            console.error('❌ Erreur création prescription:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la création de la prescription',
                error: error.message
            });
        }
    }

    // Créer plusieurs prescriptions en une fois
    static async createMultiple(req, res) {
        try {
            const { prescriptions } = req.body;
            
            if (!Array.isArray(prescriptions) || prescriptions.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Liste de prescriptions requise'
                });
            }
            
            const prescriptionsCreated = await Prescription.createMultiple(prescriptions);
            
            res.status(201).json({
                success: true,
                message: 'Prescriptions créées avec succès',
                data: prescriptionsCreated
            });
            
        } catch (error) {
            console.error('❌ Erreur création prescriptions multiples:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la création des prescriptions',
                error: error.message
            });
        }
    }

    // Récupérer une prescription par ID
    static async getById(req, res) {
        try {
            const { id } = req.params;
            const prescription = await Prescription.findById(id);
            
            if (!prescription) {
                return res.status(404).json({
                    success: false,
                    message: 'Prescription non trouvée'
                });
            }
            
            res.json({
                success: true,
                data: prescription
            });
            
        } catch (error) {
            console.error('❌ Erreur récupération prescription:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération de la prescription',
                error: error.message
            });
        }
    }

    // Récupérer toutes les prescriptions d'un patient
    static async getByPatientId(req, res) {
        try {
            const { patient_id } = req.params;
            const { 
                page = 1, 
                limit = 50, 
                statut, 
                date_debut, 
                date_fin,
                medicament
            } = req.query;
            
            const offset = (page - 1) * limit;
            const filters = { statut, date_debut, date_fin, medicament };
            
            const prescriptions = await Prescription.findByPatientId(patient_id, parseInt(limit), offset, filters);
            const total = await Prescription.count({ patient_id, ...filters });
            
            res.json({
                success: true,
                data: prescriptions,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
            
        } catch (error) {
            console.error('❌ Erreur récupération prescriptions patient:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des prescriptions du patient',
                error: error.message
            });
        }
    }

    // Récupérer les prescriptions actives d'un patient
    static async getActivePrescriptions(req, res) {
        try {
            const { patient_id } = req.params;
            const prescriptions = await Prescription.getActivePrescriptions(patient_id);
            
            res.json({
                success: true,
                data: prescriptions,
                total: prescriptions.length
            });
            
        } catch (error) {
            console.error('❌ Erreur récupération prescriptions actives:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des prescriptions actives',
                error: error.message
            });
        }
    }

    // Récupérer les prescriptions du patient connecté (pour les patients)
    static async getMyPrescriptions(req, res) {
        try {
            const user = req.user;
            
            // Vérifier que l'utilisateur est un patient
            if (user.role !== 'patient') {
                return res.status(403).json({
                    success: false,
                    message: 'Cette route est réservée aux patients'
                });
            }

            // Récupérer le patient_id depuis la table patients où user_id = user.id
            const { executeQuery } = require('../config/database');
            const patients = await executeQuery(
                'SELECT id_patient FROM patients WHERE user_id = ? LIMIT 1', 
                [user.id]
            );
            
            if (!patients || patients.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Patient non trouvé pour cet utilisateur'
                });
            }

            const patient_id = patients[0].id_patient;
            
            const { 
                page = 1, 
                limit = 50, 
                statut, 
                date_debut, 
                date_fin,
                medicament
            } = req.query;
            
            const offset = (page - 1) * limit;
            const filters = { statut, date_debut, date_fin, medicament };
            
            const prescriptions = await Prescription.findByPatientId(patient_id, parseInt(limit), offset, filters);
            const total = await Prescription.count({ patient_id, ...filters });
            
            res.json({
                success: true,
                data: prescriptions,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
            
        } catch (error) {
            console.error('❌ Erreur récupération prescriptions patient connecté:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération de vos prescriptions',
                error: error.message
            });
        }
    }

    // Récupérer les prescriptions d'une fiche médicale
    static async getByFicheMedicaleId(req, res) {
        try {
            const { fiche_medicale_id } = req.params;
            const prescriptions = await Prescription.findByFicheMedicaleId(fiche_medicale_id);
            
            res.json({
                success: true,
                data: prescriptions,
                total: prescriptions.length
            });
            
        } catch (error) {
            console.error('❌ Erreur récupération prescriptions fiche:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des prescriptions de la fiche',
                error: error.message
            });
        }
    }

    // Mettre à jour une prescription
    static async update(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            
            // Vérifier que la prescription existe
            const existingPrescription = await Prescription.findById(id);
            if (!existingPrescription) {
                return res.status(404).json({
                    success: false,
                    message: 'Prescription non trouvée'
                });
            }
            
            const prescription = await Prescription.update(id, updateData);
            
            res.json({
                success: true,
                message: 'Prescription mise à jour avec succès',
                data: prescription
            });
            
        } catch (error) {
            console.error('❌ Erreur mise à jour prescription:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la mise à jour de la prescription',
                error: error.message
            });
        }
    }

    // Arrêter une prescription
    static async arreter(req, res) {
        try {
            const { id } = req.params;
            const { raison = '' } = req.body;
            
            // Vérifier que la prescription existe
            const existingPrescription = await Prescription.findById(id);
            if (!existingPrescription) {
                return res.status(404).json({
                    success: false,
                    message: 'Prescription non trouvée'
                });
            }
            
            const result = await Prescription.arreter(id, raison);
            
            res.json({
                success: true,
                message: result.message
            });
            
        } catch (error) {
            console.error('❌ Erreur arrêt prescription:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de l\'arrêt de la prescription',
                error: error.message
            });
        }
    }

    // Suspendre une prescription
    static async suspendre(req, res) {
        try {
            const { id } = req.params;
            const { raison = '' } = req.body;
            
            // Vérifier que la prescription existe
            const existingPrescription = await Prescription.findById(id);
            if (!existingPrescription) {
                return res.status(404).json({
                    success: false,
                    message: 'Prescription non trouvée'
                });
            }
            
            const result = await Prescription.suspendre(id, raison);
            
            res.json({
                success: true,
                message: result.message
            });
            
        } catch (error) {
            console.error('❌ Erreur suspension prescription:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la suspension de la prescription',
                error: error.message
            });
        }
    }

    // Terminer une prescription
    static async terminer(req, res) {
        try {
            const { id } = req.params;
            
            // Vérifier que la prescription existe
            const existingPrescription = await Prescription.findById(id);
            if (!existingPrescription) {
                return res.status(404).json({
                    success: false,
                    message: 'Prescription non trouvée'
                });
            }
            
            const result = await Prescription.terminer(id);
            
            res.json({
                success: true,
                message: result.message
            });
            
        } catch (error) {
            console.error('❌ Erreur finalisation prescription:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la finalisation de la prescription',
                error: error.message
            });
        }
    }

    // Supprimer une prescription
    static async delete(req, res) {
        try {
            const { id } = req.params;
            
            // Vérifier que la prescription existe
            const existingPrescription = await Prescription.findById(id);
            if (!existingPrescription) {
                return res.status(404).json({
                    success: false,
                    message: 'Prescription non trouvée'
                });
            }
            
            const result = await Prescription.delete(id);
            
            res.json({
                success: true,
                message: result.message
            });
            
        } catch (error) {
            console.error('❌ Erreur suppression prescription:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la suppression de la prescription',
                error: error.message
            });
        }
    }

    // Vérifier les interactions médicamenteuses pour un patient
    static async checkInteractionsForPatient(req, res) {
        try {
            const { patient_id } = req.params;
            const interactions = await Prescription.checkInteractionsForPatient(patient_id);
            
            // Analyser les interactions
            const interactionsAnalysees = [];
            const medicamentsActifs = [];
            
            for (const prescription of interactions) {
                medicamentsActifs.push({
                    id: prescription.medicament_id,
                    nom: prescription.nom_commercial,
                    interactions: prescription.interactions
                });
            }
            
            // Vérifier les interactions croisées
            for (let i = 0; i < medicamentsActifs.length; i++) {
                for (let j = i + 1; j < medicamentsActifs.length; j++) {
                    const med1 = medicamentsActifs[i];
                    const med2 = medicamentsActifs[j];
                    
                    if (med1.interactions && med1.interactions.toLowerCase().includes(med2.nom.toLowerCase())) {
                        interactionsAnalysees.push({
                            medicament1: med1.nom,
                            medicament2: med2.nom,
                            description: med1.interactions,
                            niveau_risque: 'moderate'
                        });
                    }
                    
                    if (med2.interactions && med2.interactions.toLowerCase().includes(med1.nom.toLowerCase())) {
                        interactionsAnalysees.push({
                            medicament1: med2.nom,
                            medicament2: med1.nom,
                            description: med2.interactions,
                            niveau_risque: 'moderate'
                        });
                    }
                }
            }
            
            res.json({
                success: true,
                data: {
                    patient_id,
                    medicaments_actifs: medicamentsActifs,
                    interactions_trouvees: interactionsAnalysees,
                    nombre_interactions: interactionsAnalysees.length,
                    alerte: interactionsAnalysees.length > 0
                }
            });
            
        } catch (error) {
            console.error('❌ Erreur vérification interactions patient:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la vérification des interactions',
                error: error.message
            });
        }
    }

    // Récupérer les statistiques des prescriptions
    static async getStatistiques(req, res) {
        try {
            const { date_debut, date_fin } = req.query;
            const filters = { date_debut, date_fin };
            
            const stats = await Prescription.getStatistiques(filters);
            
            res.json({
                success: true,
                data: stats
            });
            
        } catch (error) {
            console.error('❌ Erreur statistiques prescriptions:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des statistiques',
                error: error.message
            });
        }
    }

    // Générer une ordonnance (format simple)
    static async genererOrdonnance(req, res) {
        try {
            const { patient_id, fiche_medicale_id } = req.params;
            
            // Récupérer les prescriptions de la fiche
            const prescriptions = await Prescription.findByFicheMedicaleId(fiche_medicale_id);
            
            if (prescriptions.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Aucune prescription trouvée pour cette consultation'
                });
            }
            
            // Récupérer les informations de la première prescription pour avoir les données patient/médecin
            const premierePrescription = await Prescription.findById(prescriptions[0].id_prescription);
            
            const ordonnance = {
                patient: {
                    nom: premierePrescription.patient_nom,
                    prenom: premierePrescription.patient_prenom
                },
                date_consultation: premierePrescription.date_consultation,
                prescriptions: prescriptions.map(p => ({
                    medicament: p.nom_commercial,
                    denomination: p.denomination_commune,
                    forme: p.forme_pharmaceutique,
                    dosage_prescrit: p.dosage_prescrit,
                    frequence: p.frequence,
                    duree_traitement: p.duree_traitement,
                    quantite_totale: p.quantite_totale,
                    instructions: p.instructions_specifiques,
                    moment_prise: p.moment_prise
                })),
                nombre_medicaments: prescriptions.length
            };
            
            res.json({
                success: true,
                data: ordonnance
            });
            
        } catch (error) {
            console.error('❌ Erreur génération ordonnance:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la génération de l\'ordonnance',
                error: error.message
            });
        }
    }

    // Renouveler une prescription
    static async renouveler(req, res) {
        try {
            const { id } = req.params;
            const { nouvelle_duree, nouvelle_quantite, date_debut } = req.body;
            
            // Récupérer la prescription originale
            const prescriptionOriginale = await Prescription.findById(id);
            if (!prescriptionOriginale) {
                return res.status(404).json({
                    success: false,
                    message: 'Prescription originale non trouvée'
                });
            }
            
            // Calculer la nouvelle date de fin
            const dateDebut = new Date(date_debut || Date.now());
            const dateFin = new Date(dateDebut);
            dateFin.setDate(dateFin.getDate() + (nouvelle_duree || prescriptionOriginale.duree_traitement));
            
            // Créer une nouvelle prescription basée sur l'originale
            const nouvellePrescription = {
                fiche_medicale_id: prescriptionOriginale.fiche_medicale_id,
                medicament_id: prescriptionOriginale.medicament_id,
                dosage_prescrit: prescriptionOriginale.dosage_prescrit,
                frequence: prescriptionOriginale.frequence,
                duree_traitement: nouvelle_duree || prescriptionOriginale.duree_traitement,
                quantite_totale: nouvelle_quantite || prescriptionOriginale.quantite_totale,
                instructions_specifiques: prescriptionOriginale.instructions_specifiques,
                moment_prise: prescriptionOriginale.moment_prise,
                date_debut: formatDateForMySQL(dateDebut),
                date_fin: formatDateForMySQL(dateFin)
            };
            
            const prescriptionRenouvelee = await Prescription.create(nouvellePrescription);
            
            res.status(201).json({
                success: true,
                message: 'Prescription renouvelée avec succès',
                data: {
                    prescription_originale: prescriptionOriginale,
                    prescription_renouvelee: prescriptionRenouvelee
                }
            });
            
        } catch (error) {
            console.error('❌ Erreur renouvellement prescription:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors du renouvellement de la prescription',
                error: error.message
            });
        }
    }
}

module.exports = PrescriptionController;
