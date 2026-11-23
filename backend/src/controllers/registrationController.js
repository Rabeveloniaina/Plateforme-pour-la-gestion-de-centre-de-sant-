const Patient = require('../models/Patient');
const User = require('../models/User');
const Centre = require('../models/Centre');
const { executeQuery } = require('../config/database');
const DataIntegrityValidators = require('../validators/dataIntegrityValidators');

class RegistrationController {
    // Inscription d'un patient (auto-inscription)
    static async registerPatient(req, res) {
        try {
            const patientData = req.body;
            
            // Validation des données requises (prénom est optionnel pour les malgaches)
            const requiredFields = ['nom', 'date_naissance', 'sexe', 'adresse', 'telephone', 'email', 'mot_de_passe', 'region_id', 'centre_id'];
            const missingFields = requiredFields.filter(field => !patientData[field]);
            
            if (missingFields.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Champs manquants: ${missingFields.join(', ')}. La région et le centre de santé sont obligatoires. Note: Le prénom est optionnel.`
                });
            }

            // Validation d'intégrité des données
            const integrityValidation = DataIntegrityValidators.validatePatient(patientData);
            if (!integrityValidation.valid) {
                return res.status(400).json({
                    success: false,
                    message: integrityValidation.errors.join(' '),
                    errors: integrityValidation.errors
                });
            }

            // Vérifier si l'email existe déjà
            const existingUser = await User.findByEmail(patientData.email);
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'Un compte avec cet email existe déjà'
                });
            }

            // Utiliser la région et le centre fournis par le patient
            const centreId = patientData.centre_id;
            const regionId = patientData.region_id;

            // Validation de la cohérence centre/région
            const centreRegionValidation = await DataIntegrityValidators.validateCentreRegion(
                centreId,
                regionId,
                executeQuery
            );
            if (!centreRegionValidation.valid) {
                return res.status(400).json({
                    success: false,
                    message: centreRegionValidation.message
                });
            }

            // Créer l'utilisateur patient
            const user = await User.create({
                nom_utilisateur: patientData.email, // Utiliser l'email comme nom d'utilisateur
                email: patientData.email,
                mot_de_passe: patientData.mot_de_passe,
                role: 'patient',
                id_centre: centreId
            });

            // Créer le patient
            // S'assurer que prenom est une chaîne vide plutôt que null/undefined
            const patient = await Patient.create({
                ...patientData,
                prenom: patientData.prenom || '', // Prénom optionnel, utiliser chaîne vide si non fourni
                user_id: user.id_user,
                centre_id: centreId,
                region_id: regionId
            });

            res.status(201).json({
                success: true,
                message: 'Compte patient créé avec succès',
                data: {
                    patient_id: patient.id_patient,
                    user_id: user.id_user,
                    centre_id: centreId,
                    region_id: regionId
                }
            });

        } catch (error) {
            console.error('❌ Erreur inscription patient:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de l\'inscription',
                error: error.message
            });
        }
    }

    // Demander la création d'un centre (ministère uniquement)
    static async requestCentreCreation(req, res) {
        try {
            const centreData = req.body;
            const user = req.user;

            // Vérifier que c'est le ministère
            if (user.role !== 'ministere') {
                return res.status(403).json({
                    success: false,
                    message: 'Seul le ministère peut créer des centres'
                });
            }

            // Validation des données requises
            const requiredFields = ['nom_centre', 'adresse', 'region_id', 'telephone', 'email'];
            const missingFields = requiredFields.filter(field => !centreData[field]);
            
            if (missingFields.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Champs manquants: ${missingFields.join(', ')}`
                });
            }

            // Créer directement le centre (ministère a approbation automatique)
            const centre = await Centre.create(centreData);

            res.status(201).json({
                success: true,
                message: 'Centre créé avec succès',
                data: centre
            });

        } catch (error) {
            console.error('❌ Erreur création centre:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la création du centre',
                error: error.message
            });
        }
    }

    // Demander la création d'un médecin (admin centre)
    static async requestMedecinCreation(req, res) {
        try {
            const medecinData = req.body;
            const user = req.user;

            // Vérifier que c'est un admin centre
            if (user.role !== 'admin_centre') {
                return res.status(403).json({
                    success: false,
                    message: 'Seul un admin centre peut créer des médecins'
                });
            }

            // Validation des données requises
            const requiredFields = ['nom', 'prenom', 'specialite', 'email', 'telephone', 'mot_de_passe'];
            const missingFields = requiredFields.filter(field => !medecinData[field]);
            
            if (missingFields.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Champs manquants: ${missingFields.join(', ')}`
                });
            }

            // Vérifier si l'email existe déjà
            const existingUser = await User.findByEmail(medecinData.email);
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'Un compte avec cet email existe déjà'
                });
            }

            // Assigner le centre de l'admin
            medecinData.centre_id = user.id_centre;
            medecinData.region_id = user.region_id;

            // Créer la demande d'approbation
            const ApprovalRequest = require('../models/ApprovalRequest');
            const approvalRequest = await ApprovalRequest.create({
                type: 'medecin',
                requester_id: user.id,
                data: medecinData
            });

            res.status(201).json({
                success: true,
                message: 'Demande de création de médecin soumise avec succès',
                data: {
                    request_id: approvalRequest.id,
                    status: 'pending'
                }
            });

        } catch (error) {
            console.error('❌ Erreur demande médecin:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la demande de création',
                error: error.message
            });
        }
    }

    // Demander la création de personnel (admin centre)
    static async requestPersonnelCreation(req, res) {
        try {
            const personnelData = req.body;
            const user = req.user;

            // Vérifier que c'est un admin centre
            if (user.role !== 'admin_centre') {
                return res.status(403).json({
                    success: false,
                    message: 'Seul un admin centre peut créer du personnel'
                });
            }

            // Validation des données requises
            const requiredFields = ['nom_utilisateur', 'email', 'mot_de_passe', 'fonction'];
            const missingFields = requiredFields.filter(field => !personnelData[field]);
            
            if (missingFields.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Champs manquants: ${missingFields.join(', ')}`
                });
            }

            // Vérifier si l'email existe déjà
            const existingUser = await User.findByEmail(personnelData.email);
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'Un compte avec cet email existe déjà'
                });
            }

            // Assigner le centre de l'admin
            personnelData.centre_id = user.id_centre;
            personnelData.region_id = user.region_id;

            // Créer la demande d'approbation
            const ApprovalRequest = require('../models/ApprovalRequest');
            const approvalRequest = await ApprovalRequest.create({
                type: 'personnel',
                requester_id: user.id,
                data: personnelData
            });

            res.status(201).json({
                success: true,
                message: 'Demande de création de personnel soumise avec succès',
                data: {
                    request_id: approvalRequest.id,
                    status: 'pending'
                }
            });

        } catch (error) {
            console.error('❌ Erreur demande personnel:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la demande de création',
                error: error.message
            });
        }
    }

    // Lister les centres disponibles pour l'inscription
    static async getAvailableCentres(req, res) {
        try {
            const centres = await executeQuery(`
                SELECT DISTINCT c.id_centre, c.nom as nom_centre, c.adresse, c.telephone, c.email, 
                       c.region_id, r.nom as nom_region, r.code_region
                FROM centres_sante c
                LEFT JOIN regions r ON c.region_id = r.id_region
                WHERE c.statut = 'actif'
                ORDER BY c.nom
            `);

            // Log pour debug
            console.log('🔍 Centres récupérés:', centres.length, 'centres');
            console.log('🔍 Premiers centres:', centres.slice(0, 3));

            res.json({
                success: true,
                data: centres
            });

        } catch (error) {
            console.error('❌ Erreur récupération centres:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des centres',
                error: error.message
            });
        }
    }

    // Lister les régions disponibles
    static async getAvailableRegions(req, res) {
        try {
            const regions = await executeQuery(`
                SELECT id_region, nom as nom_region, code_region
                FROM regions
                ORDER BY nom
            `);

            res.json({
                success: true,
                data: regions
            });

        } catch (error) {
            console.error('❌ Erreur récupération régions:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des régions',
                error: error.message
            });
        }
    }
}

module.exports = RegistrationController;
