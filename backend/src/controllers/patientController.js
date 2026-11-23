const Patient = require('../models/Patient');
const RendezVous = require('../models/RendezVous');
const CentreSecurity = require('../middlewares/centreSecurity');
const { asyncHandler, Errors } = require('../utils/asyncHandler');
const DataIntegrityValidators = require('../validators/dataIntegrityValidators');

class PatientController {
    // Récupérer les informations du patient connecté
    static getMe = asyncHandler(async (req, res) => {
        const user = req.user;
        const { executeQuery } = require('../config/database');
        
        // Récupérer le patient_id depuis la table patients où user_id = user.id
        const patients = await executeQuery('SELECT id_patient FROM patients WHERE user_id = ? LIMIT 1', [user.id]);
        
        if (!patients || patients.length === 0) {
            // Retourner un 404 avec needsProfile pour permettre au frontend de rediriger
            return res.status(404).json({
                success: false,
                message: 'Profil patient non trouvé',
                needsProfile: true
            });
        }
        
        const patient = await Patient.findById(patients[0].id_patient);
        
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient non trouvé',
                needsProfile: true
            });
        }
        
        res.json({
            success: true,
            data: patient
        });
    });

    // Créer le profil patient pour l'utilisateur connecté
    static createMyProfile = asyncHandler(async (req, res) => {
        const user = req.user;
        const patientData = req.body;
        const { executeQuery } = require('../config/database');
        const Centre = require('../models/Centre');
        
        // Vérifier si le patient existe déjà
        const existing = await executeQuery('SELECT id_patient FROM patients WHERE user_id = ? LIMIT 1', [user.id]);
        if (existing && existing.length > 0) {
            throw Errors.ALREADY_EXISTS('Profil patient');
        }
        
        // Validation des données requises (prénom est optionnel pour les malgaches)
        const requiredFields = ['nom', 'date_naissance', 'sexe', 'adresse', 'telephone'];
        const missingFields = requiredFields.filter(field => !patientData[field]);
        
        if (missingFields.length > 0) {
            throw Errors.VALIDATION_ERROR(`Champs manquants: ${missingFields.join(', ')}. Note: Le prénom est optionnel.`);
        }

        // Validation d'intégrité des données
        const integrityValidation = DataIntegrityValidators.validatePatient(patientData);
        if (!integrityValidation.valid) {
            throw Errors.VALIDATION_ERROR(integrityValidation.errors.join(' '));
        }
        
        // Récupérer les informations de l'utilisateur pour compléter le profil
        const userInfo = await executeQuery('SELECT email, id_centre FROM utilisateurs WHERE id_user = ? LIMIT 1', [user.id]);
        if (!userInfo || userInfo.length === 0) {
            throw Errors.NOT_FOUND('Utilisateur');
        }
        
        const userEmail = userInfo[0].email;
        let centreId = patientData.centre_id || userInfo[0].id_centre;
        let regionId = patientData.region_id;
        
        // Si pas de centre_id, utiliser celui de l'utilisateur
        if (!centreId) {
            throw Errors.VALIDATION_ERROR('Centre ID requis. Veuillez sélectionner un centre de santé.');
        }
        
        // Récupérer la région depuis le centre si pas fournie
        if (!regionId) {
            const centre = await Centre.findById(centreId);
            if (!centre) {
                throw Errors.NOT_FOUND('Centre');
            }
            regionId = centre.region_id;
        }
        
        // Créer le patient avec le user_id
        const patient = await Patient.create({
            ...patientData,
            email: patientData.email || userEmail,
            user_id: user.id,
            centre_id: centreId,
            region_id: regionId
        });
        
        res.status(201).json({
            success: true,
            message: 'Profil patient créé avec succès',
            data: patient
        });
    });

    // Mettre à jour le profil du patient connecté
    static updateMe = asyncHandler(async (req, res) => {
        const user = req.user;
        const updateData = req.body;
        const { executeQuery } = require('../config/database');
        
        // Récupérer le patient_id depuis la table patients où user_id = user.id
        const patients = await executeQuery('SELECT id_patient FROM patients WHERE user_id = ? LIMIT 1', [user.id]);
        
        if (!patients || patients.length === 0) {
            throw Errors.NOT_FOUND('Profil patient');
        }
        
        const patientId = patients[0].id_patient;
        
        // Vérifier que le patient existe
        const existingPatient = await Patient.findById(patientId);
        if (!existingPatient) {
            throw Errors.NOT_FOUND('Patient');
        }
        
        // Empêcher la modification de certains champs critiques
        const restrictedFields = ['user_id', 'centre_id', 'region_id'];
        restrictedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                delete updateData[field];
            }
        });
        
        // Validation d'intégrité des données si date_naissance est modifiée
        if (updateData.date_naissance) {
            const integrityValidation = DataIntegrityValidators.validatePatient(updateData);
            if (!integrityValidation.valid) {
                throw Errors.VALIDATION_ERROR(integrityValidation.errors.join(' '));
            }
        }

        // Mettre à jour le patient
        const patient = await Patient.update(patientId, updateData);
        
        res.json({
            success: true,
            message: 'Profil mis à jour avec succès',
            data: patient
        });
    });

    // Créer un nouveau patient
    static create = asyncHandler(async (req, res) => {
        const patientData = req.body;
        const user = req.user;
        const Centre = require('../models/Centre');
        
        // Validation des données requises (prénom est optionnel pour les malgaches)
        const requiredFields = ['nom', 'date_naissance', 'sexe', 'adresse', 'telephone'];
        const missingFields = requiredFields.filter(field => !patientData[field]);
        
        if (missingFields.length > 0) {
            throw Errors.VALIDATION_ERROR(`Champs manquants: ${missingFields.join(', ')}. Note: Le prénom est optionnel.`);
        }

        // Validation d'intégrité des données
        const integrityValidation = DataIntegrityValidators.validatePatient(patientData);
        if (!integrityValidation.valid) {
            throw Errors.VALIDATION_ERROR(integrityValidation.errors.join(' '));
        }

        // Sécurité : Assigner automatiquement le centre ET la région de l'utilisateur
        if (user.role !== 'ministere') {
            // Pour admin_centre, medecin, personnel : utiliser leur centre
            
            // Vérifier que l'utilisateur a un centre assigné
            if (!user.id_centre) {
                throw Errors.VALIDATION_ERROR('Utilisateur non assigné à un centre. Veuillez contacter l\'administrateur.');
            }
            
            patientData.centre_id = user.id_centre;
            
            // Récupérer la région depuis le centre
            const centre = await Centre.findById(user.id_centre);
            if (!centre) {
                throw Errors.NOT_FOUND('Centre de l\'utilisateur');
            }
            patientData.region_id = centre.region_id;
            
            console.log(`✅ Patient auto-assigné au centre ${centre.nom} (région ${centre.nom_region})`);
        } else {
            // Pour ministère : centre_id et region_id doivent être fournis
            if (!patientData.centre_id) {
                throw Errors.VALIDATION_ERROR('Centre ID requis pour le ministère');
            }
            
            // Récupérer la région depuis le centre choisi
            const centre = await Centre.findById(patientData.centre_id);
            if (!centre) {
                throw Errors.NOT_FOUND('Centre');
            }
            patientData.region_id = centre.region_id;
        }
        
        const patient = await Patient.create(patientData);
        
        res.status(201).json({
            success: true,
            message: 'Patient créé avec succès',
            data: patient
        });
    });

    // Récupérer un patient par ID
    static getById = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const user = req.user;
        const { executeQuery } = require('../config/database');
        
        // Si c'est un patient, vérifier qu'il accède à son propre profil
        if (user.role === 'patient') {
            const patients = await executeQuery('SELECT id_patient FROM patients WHERE user_id = ? LIMIT 1', [user.id]);
            if (!patients || patients.length === 0 || patients[0].id_patient != id) {
                throw Errors.FORBIDDEN('Vous ne pouvez accéder qu\'à votre propre profil');
            }
        }
        
        const patient = await Patient.findById(id);
        
        if (!patient) {
            throw Errors.NOT_FOUND('Patient');
        }
        
        res.json({
            success: true,
            data: patient
        });
    });

    // Récupérer tous les patients avec pagination
    static getAll = asyncHandler(async (req, res) => {
        const { 
            page = 1, 
            limit = 50, 
            centre_id, 
            nom, 
            statut 
        } = req.query;
        
        const user = req.user;
        const offset = (page - 1) * limit;
        
        // Sécurité : Filtrer par centre de l'utilisateur
        let filters = { nom, statut };

        // Le ministère peut voir tous les centres, les autres seulement leur centre
        if (user.role === 'ministere') {
            filters.centre_id = centre_id; // Utilise le centre_id de la requête si fourni
        } else {
            filters.centre_id = user.id_centre; // Force le centre de l'utilisateur
        }
        
        const patients = await Patient.findAll(parseInt(limit), offset, filters);
        const total = await Patient.count(filters);
        
        res.json({
            success: true,
            data: patients,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    });

    // Mettre à jour un patient
    static update = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const updateData = req.body;
        const user = req.user;
        const { executeQuery } = require('../config/database');
        
        // Vérifier que le patient existe
        const existingPatient = await Patient.findById(id);
        if (!existingPatient) {
            throw Errors.NOT_FOUND('Patient');
        }
        
        // Si c'est un patient qui essaie de modifier, vérifier qu'il modifie son propre profil
        if (user.role === 'patient') {
            const patients = await executeQuery('SELECT id_patient FROM patients WHERE user_id = ? LIMIT 1', [user.id]);
            if (!patients || patients.length === 0 || patients[0].id_patient != id) {
                throw Errors.FORBIDDEN('Vous ne pouvez modifier que votre propre profil');
            }
            
            // Empêcher la modification de certains champs critiques pour les patients
            const restrictedFields = ['user_id', 'centre_id', 'region_id', 'statut'];
            restrictedFields.forEach(field => {
                if (updateData[field] !== undefined) {
                    delete updateData[field];
                }
            });
        }
        
        // Validation d'intégrité des données si date_naissance est modifiée
        if (updateData.date_naissance) {
            const integrityValidation = DataIntegrityValidators.validatePatient(updateData);
            if (!integrityValidation.valid) {
                throw Errors.VALIDATION_ERROR(integrityValidation.errors.join(' '));
            }
        }

        const patient = await Patient.update(id, updateData);
        
        res.json({
            success: true,
            message: 'Patient mis à jour avec succès',
            data: patient
        });
    });

    // Supprimer un patient (soft delete)
    static delete = asyncHandler(async (req, res) => {
        const { id } = req.params;
        
        // Vérifier que le patient existe
        const existingPatient = await Patient.findById(id);
        if (!existingPatient) {
            throw Errors.NOT_FOUND('Patient');
        }
        
        const result = await Patient.delete(id);
        
        res.json({
            success: true,
            message: result.message
        });
    });

    // Rechercher des patients
    static search = asyncHandler(async (req, res) => {
        const { q, limit = 20 } = req.query;
        
        if (!q || q.trim().length < 2) {
            throw Errors.VALIDATION_ERROR('Le terme de recherche doit contenir au moins 2 caractères');
        }
        
        const patients = await Patient.search(q.trim(), parseInt(limit));
        
        res.json({
            success: true,
            data: patients,
            searchTerm: q,
            total: patients.length
        });
    });

    // Récupérer les statistiques des patients par centre
    static getStatsByCentre = asyncHandler(async (req, res) => {
        const stats = await Patient.getStatsByCentre();
        
        res.json({
            success: true,
            data: stats
        });
    });

    // Récupérer les patients d'un centre spécifique
    static getByCentre = asyncHandler(async (req, res) => {
        const { centre_id } = req.params;
        const { page = 1, limit = 50 } = req.query;
        
        const offset = (page - 1) * limit;
        const filters = { centre_id };
        
        const patients = await Patient.findAll(parseInt(limit), offset, filters);
        const total = await Patient.count(filters);
        
        res.json({
            success: true,
            data: patients,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    });

    // Dossier patient: informations + historique de consultations
    static getDossier = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const user = req.user;
        const { executeQuery } = require('../config/database');
        
        // Si c'est un patient, vérifier qu'il accède à son propre dossier
        if (user.role === 'patient') {
            const patients = await executeQuery('SELECT id_patient FROM patients WHERE user_id = ? LIMIT 1', [user.id]);
            if (!patients || patients.length === 0 || patients[0].id_patient != id) {
                throw Errors.FORBIDDEN('Vous ne pouvez accéder qu\'à votre propre dossier');
            }
        }
        
        const patient = await Patient.findById(id);
        if (!patient) {
            throw Errors.NOT_FOUND('Patient');
        }

        const history = await RendezVous.findAll(50, 0, { patient_id: id });
        res.json({
            success: true,
            data: {
                patient,
                historique: history.map(h => ({
                    id_rdv: h.id_rdv,
                    date_rdv: h.date_rdv,
                    statut: h.statut,
                    medecin: { nom: h.medecin_nom, prenom: h.medecin_prenom, specialite: h.specialite },
                    centre_nom: h.centre_nom,
                    duree_reelle: h.duree_reelle,
                    note_medecin: h.note_medecin || null
                }))
            }
        });
    });
}

module.exports = PatientController;
