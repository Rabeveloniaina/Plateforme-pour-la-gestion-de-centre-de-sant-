const { body, param, query } = require('express-validator');

const createVaccination = [
    body('patient_id').isInt({ gt: 0 }).withMessage('patient_id invalide'),
    body('medecin_id').isInt({ gt: 0 }).withMessage('medecin_id invalide'),
    body('nom_vaccin').notEmpty().withMessage('nom_vaccin requis'),
    body('type_vaccin').isIn(['obligatoire', 'recommande', 'voyage', 'professionnel']).withMessage('type_vaccin invalide'),
    body('date_administration').isISO8601().withMessage('date_administration invalide'),
    body('site_injection').isIn([
        'bras_gauche', 'bras_droit', 'cuisse_gauche', 'cuisse_droite', 'fessier', 'autre'
    ]).withMessage('site_injection invalide'),
    body('voie_administration').isIn([
        'intramusculaire', 'sous_cutanee', 'intradermique', 'orale', 'nasale'
    ]).withMessage('voie_administration invalide'),
    body('fabricant').optional().isLength({ max: 200 }).withMessage('fabricant trop long'),
    body('numero_lot').optional().isLength({ max: 100 }).withMessage('numero_lot trop long'),
    body('date_expiration').optional().isISO8601().withMessage('date_expiration invalide'),
    body('reactions_adverses').optional().isLength({ max: 1000 }).withMessage('reactions_adverses trop long'),
    body('date_rappel_prevu').optional().isISO8601().withMessage('date_rappel_prevu invalide')
];

const updateVaccination = [
    param('id').isInt({ gt: 0 }).withMessage('id invalide'),
    body('nom_vaccin').optional().notEmpty().withMessage('nom_vaccin requis'),
    body('type_vaccin').optional().isIn(['obligatoire', 'recommande', 'voyage', 'professionnel']).withMessage('type_vaccin invalide'),
    body('date_administration').optional().isISO8601().withMessage('date_administration invalide'),
    body('site_injection').optional().isIn([
        'bras_gauche', 'bras_droit', 'cuisse_gauche', 'cuisse_droite', 'fessier', 'autre'
    ]).withMessage('site_injection invalide'),
    body('voie_administration').optional().isIn([
        'intramusculaire', 'sous_cutanee', 'intradermique', 'orale', 'nasale'
    ]).withMessage('voie_administration invalide'),
    body('fabricant').optional().isLength({ max: 200 }).withMessage('fabricant trop long'),
    body('numero_lot').optional().isLength({ max: 100 }).withMessage('numero_lot trop long'),
    body('date_expiration').optional().isISO8601().withMessage('date_expiration invalide'),
    body('reactions_adverses').optional().isLength({ max: 1000 }).withMessage('reactions_adverses trop long'),
    body('date_rappel_prevu').optional().isISO8601().withMessage('date_rappel_prevu invalide'),
    body('statut').optional().isIn(['administre', 'reporte', 'contre_indique']).withMessage('statut invalide')
];

const listVaccinations = [
    query('page').optional().isInt({ gt: 0 }).withMessage('page invalide'),
    query('limit').optional().isInt({ gt: 0, max: 100 }).withMessage('limit invalide'),
    query('date_debut').optional().isISO8601().withMessage('date_debut invalide'),
    query('date_fin').optional().isISO8601().withMessage('date_fin invalide'),
    query('type_vaccin').optional().isIn(['obligatoire', 'recommande', 'voyage', 'professionnel']).withMessage('type_vaccin invalide'),
    query('nom_vaccin').optional().isLength({ min: 1 }).withMessage('nom_vaccin trop court')
];

const checkStatutVaccinal = [
    param('patient_id').isInt({ gt: 0 }).withMessage('patient_id invalide'),
    body('vaccins_obligatoires').optional().isArray().withMessage('vaccins_obligatoires doit être un tableau'),
    body('vaccins_obligatoires.*').optional().isString().withMessage('nom de vaccin invalide')
];

const planifierRappel = [
    param('id').isInt({ gt: 0 }).withMessage('id invalide'),
    body('date_rappel_prevu').isISO8601().withMessage('date_rappel_prevu invalide')
];

const enregistrerReactionAdverse = [
    param('id').isInt({ gt: 0 }).withMessage('id invalide'),
    body('reactions_adverses').notEmpty().withMessage('reactions_adverses requises')
        .isLength({ max: 1000 }).withMessage('reactions_adverses trop long')
];

const getRappelsAVenir = [
    query('centre_id').optional().isInt({ gt: 0 }).withMessage('centre_id invalide'),
    query('jours_avance').optional().isInt({ min: 1, max: 365 }).withMessage('jours_avance invalide')
];

const getCouvertureVaccinale = [
    query('centre_id').optional().isInt({ gt: 0 }).withMessage('centre_id invalide'),
    query('region_id').optional().isInt({ gt: 0 }).withMessage('region_id invalide')
];

module.exports = {
    createVaccination,
    updateVaccination,
    listVaccinations,
    checkStatutVaccinal,
    planifierRappel,
    enregistrerReactionAdverse,
    getRappelsAVenir,
    getCouvertureVaccinale
};
