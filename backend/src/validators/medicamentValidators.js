const { body, param, query } = require('express-validator');

const createMedicament = [
    body('nom_commercial').notEmpty().withMessage('nom_commercial requis'),
    body().custom((value, { req }) => {
        if (!req.body.dci && !req.body.denomination_commune) {
            throw new Error('dci ou denomination_commune requis');
        }
        return true;
    }),
    body('forme_pharmaceutique').isIn([
        'comprime', 'gelule', 'sirop', 'injection', 'pommade', 
        'gouttes', 'spray', 'patch', 'suppositoire', 'autre'
    ]).withMessage('forme_pharmaceutique invalide'),
    body('dosage').notEmpty().withMessage('dosage requis'),
    body('unite_dosage').notEmpty().withMessage('unite_dosage requise'),
    body('fabricant').optional().isLength({ max: 200 }).withMessage('fabricant trop long'),
    body('code_atc').optional().isLength({ max: 20 }).withMessage('code_atc trop long'),
    body('contre_indications').optional().isLength({ max: 2000 }).withMessage('contre_indications trop long'),
    body('effets_secondaires').optional().isLength({ max: 2000 }).withMessage('effets_secondaires trop long'),
    body('interactions').optional().isLength({ max: 2000 }).withMessage('interactions trop long')
];

const updateMedicament = [
    param('id').isInt({ gt: 0 }).withMessage('id invalide'),
    body('nom_commercial').optional().notEmpty().withMessage('nom_commercial requis'),
    body('denomination_commune').optional().notEmpty().withMessage('denomination_commune requise'),
    body('forme_pharmaceutique').optional().isIn([
        'comprime', 'gelule', 'sirop', 'injection', 'pommade', 
        'gouttes', 'spray', 'patch', 'suppositoire', 'autre'
    ]).withMessage('forme_pharmaceutique invalide'),
    body('dosage').optional().notEmpty().withMessage('dosage requis'),
    body('unite_dosage').optional().notEmpty().withMessage('unite_dosage requise'),
    body('fabricant').optional().isLength({ max: 200 }).withMessage('fabricant trop long'),
    body('code_atc').optional().isLength({ max: 20 }).withMessage('code_atc trop long'),
    body('contre_indications').optional().isLength({ max: 2000 }).withMessage('contre_indications trop long'),
    body('effets_secondaires').optional().isLength({ max: 2000 }).withMessage('effets_secondaires trop long'),
    body('interactions').optional().isLength({ max: 2000 }).withMessage('interactions trop long'),
    body('statut').optional().isIn(['actif', 'inactif', 'retire']).withMessage('statut invalide')
];

const listMedicaments = [
    query('page').optional().isInt({ gt: 0 }).withMessage('page invalide'),
    query('limit').optional().isInt({ gt: 0, max: 100 }).withMessage('limit invalide'),
    query('nom').optional().isLength({ min: 1 }).withMessage('nom trop court'),
    query('forme_pharmaceutique').optional().isIn([
        'comprime', 'gelule', 'sirop', 'injection', 'pommade', 
        'gouttes', 'spray', 'patch', 'suppositoire', 'autre'
    ]).withMessage('forme_pharmaceutique invalide'),
    query('statut').optional().isIn(['actif', 'inactif', 'retire']).withMessage('statut invalide'),
    query('fabricant').optional().isLength({ min: 1 }).withMessage('fabricant trop court')
];

const checkInteractions = [
    body('medicament_ids').isArray({ min: 1 }).withMessage('medicament_ids requis et doit être un tableau'),
    body('medicament_ids.*').isInt({ gt: 0 }).withMessage('medicament_id invalide')
];

const importBulkMedicaments = [
    body('medicaments').isArray({ min: 1 }).withMessage('medicaments requis et doit être un tableau'),
    body('medicaments.*.nom_commercial').notEmpty().withMessage('nom_commercial requis'),
    body('medicaments.*.denomination_commune').notEmpty().withMessage('denomination_commune requise'),
    body('medicaments.*.forme_pharmaceutique').isIn([
        'comprime', 'gelule', 'sirop', 'injection', 'pommade', 
        'gouttes', 'spray', 'patch', 'suppositoire', 'autre'
    ]).withMessage('forme_pharmaceutique invalide'),
    body('medicaments.*.dosage').notEmpty().withMessage('dosage requis'),
    body('medicaments.*.unite_dosage').notEmpty().withMessage('unite_dosage requise')
];

module.exports = {
    createMedicament,
    updateMedicament,
    listMedicaments,
    checkInteractions,
    importBulkMedicaments
};
