const Medicament = require('../models/Medicament');
const { asyncHandler, Errors } = require('../utils/asyncHandler');

class MedicamentController {
    // Créer un nouveau médicament
    static create = asyncHandler(async (req, res) => {
        const medicamentData = req.body;
        
        // Validation des données requises
        const requiredFields = ['nom_commercial', 'forme_pharmaceutique', 'dosage'];
        const missingFields = requiredFields.filter(field => !medicamentData[field]);
        
        // Vérifier qu'au moins dci ou denomination_commune est fourni
        if (!medicamentData.dci && !medicamentData.denomination_commune) {
            missingFields.push('dci ou denomination_commune');
        }
        
        if (missingFields.length > 0) {
            throw Errors.VALIDATION_ERROR(`Champs manquants: ${missingFields.join(', ')}`);
        }
        
        const medicament = await Medicament.create(medicamentData);
        
        res.status(201).json({
            success: true,
            message: 'Médicament créé avec succès',
            data: medicament
        });
    });

    // Récupérer un médicament par ID
    static getById = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const medicament = await Medicament.findById(id);
        
        if (!medicament) {
            throw Errors.NOT_FOUND('Médicament');
        }
        
        res.json({
            success: true,
            data: medicament
        });
    });

    // Récupérer tous les médicaments avec pagination
    static getAll = asyncHandler(async (req, res) => {
        const { 
            page = 1, 
            limit = 50, 
            nom, 
            forme_pharmaceutique, 
            statut,
            fabricant
        } = req.query;
        
        const offset = (page - 1) * limit;
        const filters = { nom, forme_pharmaceutique, statut, fabricant };
        
        const medicaments = await Medicament.findAll(parseInt(limit), offset, filters);
        const total = await Medicament.count(filters);
        
        res.json({
            success: true,
            data: medicaments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    });

    // Mettre à jour un médicament
    static update = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const updateData = req.body;
        
        // Vérifier que le médicament existe
        const existingMedicament = await Medicament.findById(id);
        if (!existingMedicament) {
            throw Errors.NOT_FOUND('Médicament');
        }
        
        const medicament = await Medicament.update(id, updateData);
        
        res.json({
            success: true,
            message: 'Médicament mis à jour avec succès',
            data: medicament
        });
    });

    // Supprimer un médicament (soft delete)
    static delete = asyncHandler(async (req, res) => {
        const { id } = req.params;
        
        // Vérifier que le médicament existe
        const existingMedicament = await Medicament.findById(id);
        if (!existingMedicament) {
            throw Errors.NOT_FOUND('Médicament');
        }
        
        const result = await Medicament.delete(id);
        
        res.json({
            success: true,
            message: result.message
        });
    });

    // Rechercher des médicaments
    static search = asyncHandler(async (req, res) => {
        const { q, limit = 20 } = req.query;
        
        if (!q || q.trim().length < 2) {
            throw Errors.VALIDATION_ERROR('Le terme de recherche doit contenir au moins 2 caractères');
        }
        
        const medicaments = await Medicament.search(q.trim(), parseInt(limit));
        
        res.json({
            success: true,
            data: medicaments,
            searchTerm: q,
            total: medicaments.length
        });
    });

    // Récupérer les médicaments par forme pharmaceutique
    static getByForme = asyncHandler(async (req, res) => {
        const { forme } = req.params;
        const medicaments = await Medicament.findByForme(forme);
        
        res.json({
            success: true,
            data: medicaments,
            forme_pharmaceutique: forme
        });
    });

    // Récupérer les statistiques des médicaments
    static getStatistiques = asyncHandler(async (req, res) => {
        const stats = await Medicament.getStatistiques();
        
        res.json({
            success: true,
            data: stats
        });
    });

    // Vérifier les interactions médicamenteuses
    static checkInteractions = asyncHandler(async (req, res) => {
        const { medicament_ids } = req.body;
        
        if (!Array.isArray(medicament_ids) || medicament_ids.length === 0) {
            throw Errors.VALIDATION_ERROR('Liste des IDs de médicaments requise');
        }
        
        const interactions = await Medicament.checkInteractions(medicament_ids);
        
        // Analyser les interactions
        const interactionsAnalysees = [];
        for (let i = 0; i < interactions.length; i++) {
            for (let j = i + 1; j < interactions.length; j++) {
                const med1 = interactions[i];
                const med2 = interactions[j];
                
                // Recherche simple d'interactions croisées
                if (med1.interactions && med1.interactions.toLowerCase().includes(med2.nom_commercial.toLowerCase())) {
                    interactionsAnalysees.push({
                        medicament1: med1.nom_commercial,
                        medicament2: med2.nom_commercial,
                        description: med1.interactions,
                        niveau_risque: 'moderate' // À améliorer avec une vraie base de données d'interactions
                    });
                }
                
                if (med2.interactions && med2.interactions.toLowerCase().includes(med1.nom_commercial.toLowerCase())) {
                    interactionsAnalysees.push({
                        medicament1: med2.nom_commercial,
                        medicament2: med1.nom_commercial,
                        description: med2.interactions,
                        niveau_risque: 'moderate'
                    });
                }
            }
        }
        
        res.json({
            success: true,
            data: {
                medicaments_analyses: interactions,
                interactions_trouvees: interactionsAnalysees,
                nombre_interactions: interactionsAnalysees.length
            }
        });
    });

    // Import en masse de médicaments
    static importBulk = asyncHandler(async (req, res) => {
        const { medicaments } = req.body;
        
        if (!Array.isArray(medicaments) || medicaments.length === 0) {
            throw Errors.VALIDATION_ERROR('Liste de médicaments requise');
        }
        
        const results = {
            success: [],
            errors: [],
            total: medicaments.length
        };
        
        for (let i = 0; i < medicaments.length; i++) {
            try {
                const medicament = await Medicament.create(medicaments[i]);
                results.success.push({
                    index: i,
                    medicament: medicament
                });
            } catch (error) {
                results.errors.push({
                    index: i,
                    medicament: medicaments[i],
                    error: error.message
                });
            }
        }
        
        res.json({
            success: true,
            message: `Import terminé: ${results.success.length} succès, ${results.errors.length} erreurs`,
            data: results
        });
    });

    // Récupérer les formes pharmaceutiques disponibles
    static getFormes = asyncHandler(async (req, res) => {
        const formes = [
            'comprime', 'gelule', 'sirop', 'injection', 'pommade',
            'gouttes', 'spray', 'patch', 'suppositoire', 'autre'
        ];
        
        res.json({
            success: true,
            data: formes
        });
    });
}

module.exports = MedicamentController;
