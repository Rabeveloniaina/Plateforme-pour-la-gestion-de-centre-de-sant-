/**
 * EXEMPLE D'UTILISATION de asyncHandler
 * 
 * Ce fichier montre comment refactoriser les contrôleurs pour utiliser
 * asyncHandler et standardiser la gestion d'erreurs
 */

const { asyncHandler, Errors } = require('./asyncHandler');

// ============================================
// AVANT (gestion d'erreurs manuelle)
// ============================================

class MedicamentControllerOld {
    static async create(req, res) {
        try {
            const medicamentData = req.body;
            
            const requiredFields = ['nom_commercial', 'forme_pharmaceutique', 'dosage'];
            const missingFields = requiredFields.filter(field => !medicamentData[field]);
            
            if (missingFields.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Champs manquants: ${missingFields.join(', ')}`
                });
            }
            
            const medicament = await Medicament.create(medicamentData);
            
            res.status(201).json({
                success: true,
                message: 'Médicament créé avec succès',
                data: medicament
            });
            
        } catch (error) {
            console.error('❌ Erreur création médicament:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la création du médicament',
                error: error.message
            });
        }
    }
}

// ============================================
// APRÈS (avec asyncHandler)
// ============================================

const Medicament = require('../models/Medicament');

class MedicamentControllerNew {
    // Utilisation de asyncHandler - pas besoin de try/catch
    static create = asyncHandler(async (req, res) => {
        const medicamentData = req.body;
        
        // Validation
        const requiredFields = ['nom_commercial', 'forme_pharmaceutique', 'dosage'];
        const missingFields = requiredFields.filter(field => !medicamentData[field]);
        
        if (missingFields.length > 0) {
            throw Errors.VALIDATION_ERROR(`Champs manquants: ${missingFields.join(', ')}`);
        }
        
        // Vérifier si le médicament existe déjà
        if (!medicamentData.dci && !medicamentData.denomination_commune) {
            throw Errors.VALIDATION_ERROR('DCI ou dénomination commune requis');
        }
        
        const medicament = await Medicament.create(medicamentData);
        
        res.status(201).json({
            success: true,
            message: 'Médicament créé avec succès',
            data: medicament
        });
    });

    // Exemple avec getById
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

    // Exemple avec gestion d'erreur spécifique
    static update = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const updates = req.body;
        
        // Vérifier existence
        const existing = await Medicament.findById(id);
        if (!existing) {
            throw Errors.NOT_FOUND('Médicament');
        }
        
        // Vérifier doublon (si nom changé)
        if (updates.nom_commercial && updates.nom_commercial !== existing.nom_commercial) {
            const duplicate = await Medicament.findByName(updates.nom_commercial);
            if (duplicate) {
                throw Errors.ALREADY_EXISTS('Médicament avec ce nom');
            }
        }
        
        const updated = await Medicament.update(id, updates);
        
        res.json({
            success: true,
            message: 'Médicament modifié avec succès',
            data: updated
        });
    });
}

module.exports = MedicamentControllerNew;

/**
 * AVANTAGES :
 * 
 * 1. Code plus propre - pas de try/catch répétitifs
 * 2. Gestion d'erreurs cohérente via errorHandler middleware
 * 3. Messages d'erreur standardisés avec Errors.*
 * 4. Logs automatiques avec requestId
 * 5. Format de réponse uniforme
 * 6. Stack trace en développement uniquement
 */

