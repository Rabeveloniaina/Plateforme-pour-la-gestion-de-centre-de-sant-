const Vaccination = require('../models/Vaccination');
const { asyncHandler, Errors } = require('../utils/asyncHandler');

class VaccinationController {
    // Créer une nouvelle vaccination
    static create = asyncHandler(async (req, res) => {
        const vaccinationData = req.body;
        
        // Validation des données requises
        const requiredFields = ['patient_id', 'medecin_id', 'nom_vaccin', 'type_vaccin', 'date_administration', 'site_injection', 'voie_administration'];
        const missingFields = requiredFields.filter(field => !vaccinationData[field]);
        
        if (missingFields.length > 0) {
            throw Errors.VALIDATION_ERROR(`Champs manquants: ${missingFields.join(', ')}`);
        }
        
        const vaccination = await Vaccination.create(vaccinationData);
        
        res.status(201).json({
            success: true,
            message: 'Vaccination créée avec succès',
            data: vaccination
        });
    });

    // Récupérer une vaccination par ID
    static getById = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const vaccination = await Vaccination.findById(id);
        
        if (!vaccination) {
            throw Errors.NOT_FOUND('Vaccination');
        }
        
        res.json({
            success: true,
            data: vaccination
        });
    });

    // Récupérer toutes les vaccinations d'un patient
    static getByPatientId = asyncHandler(async (req, res) => {
        const { patient_id } = req.params;
        const { page = 1, limit = 50 } = req.query;
        
        const offset = (page - 1) * limit;
        const vaccinations = await Vaccination.findByPatientId(patient_id, parseInt(limit), offset);
        const total = await Vaccination.count({ patient_id });
        
        res.json({
            success: true,
            data: vaccinations,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    });

    // Récupérer les vaccinations d'un médecin
    static getByMedecinId = asyncHandler(async (req, res) => {
        const { medecin_id } = req.params;
        const { 
            page = 1, 
            limit = 50, 
            date_debut, 
            date_fin, 
            type_vaccin,
            nom_vaccin
        } = req.query;
        
        const offset = (page - 1) * limit;
        const filters = { date_debut, date_fin, type_vaccin, nom_vaccin };
        
        const vaccinations = await Vaccination.findByMedecinId(medecin_id, parseInt(limit), offset, filters);
        const total = await Vaccination.count({ medecin_id, ...filters });
        
        res.json({
            success: true,
            data: vaccinations,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    });

    // Récupérer le carnet de vaccination d'un patient
    static getCarnetVaccination = asyncHandler(async (req, res) => {
        const { patient_id } = req.params;
        const carnet = await Vaccination.getCarnetVaccination(patient_id);
        
        res.json({
            success: true,
            data: {
                patient_id,
                vaccinations: carnet,
                nombre_vaccinations: carnet.length
            }
        });
    });

    // Vérifier le statut vaccinal d'un patient
    static checkStatutVaccinal = asyncHandler(async (req, res) => {
        const { patient_id } = req.params;
        const { vaccins_obligatoires } = req.body;
        
        const statut = await Vaccination.checkStatutVaccinal(patient_id, vaccins_obligatoires);
        
        res.json({
            success: true,
            data: statut
        });
    });

    // Récupérer les rappels de vaccination à venir
    static getRappelsAVenir = asyncHandler(async (req, res) => {
        const { centre_id, jours_avance = 30 } = req.query;
        
        const rappels = await Vaccination.getRappelsAVenir(centre_id, parseInt(jours_avance));
        
        res.json({
            success: true,
            data: rappels,
            total: rappels.length,
            jours_avance: parseInt(jours_avance)
        });
    });

    // Mettre à jour une vaccination
    static update = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const updateData = req.body;
        
        // Vérifier que la vaccination existe
        const existingVaccination = await Vaccination.findById(id);
        if (!existingVaccination) {
            throw Errors.NOT_FOUND('Vaccination');
        }
        
        const vaccination = await Vaccination.update(id, updateData);
        
        res.json({
            success: true,
            message: 'Vaccination mise à jour avec succès',
            data: vaccination
        });
    });

    // Supprimer une vaccination
    static delete = asyncHandler(async (req, res) => {
        const { id } = req.params;
        
        // Vérifier que la vaccination existe
        const existingVaccination = await Vaccination.findById(id);
        if (!existingVaccination) {
            throw Errors.NOT_FOUND('Vaccination');
        }
        
        const result = await Vaccination.delete(id);
        
        res.json({
            success: true,
            message: result.message
        });
    });

    // Récupérer toutes les vaccinations
    static getAll = asyncHandler(async (req, res) => {
        const { 
            page = 1, 
            limit = 50, 
            date_debut, 
            date_fin, 
            statut,
            type_vaccin,
            patient_id,
            medecin_id
        } = req.query;
        
        const offset = (page - 1) * limit;
        const filters = { date_debut, date_fin, statut, type_vaccin, patient_id, medecin_id };
        
        const vaccinations = await Vaccination.findAll(parseInt(limit), offset, filters);
        const total = await Vaccination.count(filters);
        
        res.json({
            success: true,
            data: vaccinations,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    });

    // Rechercher des vaccinations
    static search = asyncHandler(async (req, res) => {
        const { q, limit = 20 } = req.query;
        
        if (!q || q.trim().length < 2) {
            throw Errors.VALIDATION_ERROR('Le terme de recherche doit contenir au moins 2 caractères');
        }
        
        const vaccinations = await Vaccination.search(q.trim(), parseInt(limit));
        
        res.json({
            success: true,
            data: vaccinations,
            searchTerm: q,
            total: vaccinations.length
        });
    });

    // Récupérer les statistiques des vaccinations
    static getStatistiques = asyncHandler(async (req, res) => {
        const { date_debut, date_fin } = req.query;
        const filters = { date_debut, date_fin };
        
        const stats = await Vaccination.getStatistiques(filters);
        
        res.json({
            success: true,
            data: stats
        });
    });

    // Récupérer la couverture vaccinale
    static getCouvertureVaccinale = asyncHandler(async (req, res) => {
        const { centre_id, region_id } = req.query;
        
        const couverture = await Vaccination.getCouvertureVaccinale(centre_id, region_id);
        
        res.json({
            success: true,
            data: couverture,
            centre_id: centre_id || null,
            region_id: region_id || null
        });
    });

    // Planifier un rappel de vaccination
    static planifierRappel = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { date_rappel_prevu } = req.body;
        
        if (!date_rappel_prevu) {
            throw Errors.VALIDATION_ERROR('Date de rappel requise');
        }
        
        // Vérifier que la vaccination existe
        const existingVaccination = await Vaccination.findById(id);
        if (!existingVaccination) {
            throw Errors.NOT_FOUND('Vaccination');
        }
        
        const vaccination = await Vaccination.update(id, { date_rappel_prevu });
        
        res.json({
            success: true,
            message: 'Rappel planifié avec succès',
            data: vaccination
        });
    });

    // Enregistrer une réaction adverse
    static enregistrerReactionAdverse = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { reactions_adverses } = req.body;
        
        if (!reactions_adverses) {
            throw Errors.VALIDATION_ERROR('Description des réactions adverses requise');
        }
        
        // Vérifier que la vaccination existe
        const existingVaccination = await Vaccination.findById(id);
        if (!existingVaccination) {
            throw Errors.NOT_FOUND('Vaccination');
        }
        
        const vaccination = await Vaccination.update(id, { reactions_adverses });
        
        res.json({
            success: true,
            message: 'Réaction adverse enregistrée avec succès',
            data: vaccination
        });
    });

    // Récupérer les types de vaccins disponibles
    static getTypesVaccins = asyncHandler(async (req, res) => {
        const types = ['obligatoire', 'recommande', 'voyage', 'professionnel'];
        
        res.json({
            success: true,
            data: types
        });
    });

    // Récupérer les sites d'injection disponibles
    static getSitesInjection = asyncHandler(async (req, res) => {
        const sites = ['bras_gauche', 'bras_droit', 'cuisse_gauche', 'cuisse_droite', 'fessier', 'autre'];
        
        res.json({
            success: true,
            data: sites
        });
    });

    // Récupérer les voies d'administration disponibles
    static getVoiesAdministration = asyncHandler(async (req, res) => {
        const voies = ['intramusculaire', 'sous_cutanee', 'intradermique', 'orale', 'nasale'];
        
        res.json({
            success: true,
            data: voies
        });
    });
}

module.exports = VaccinationController;
