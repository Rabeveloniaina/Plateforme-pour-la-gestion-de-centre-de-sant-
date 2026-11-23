const { body, param, query } = require('express-validator');

const createPrescription = [
    body('fiche_medicale_id').isInt({ gt: 0 }).withMessage('fiche_medicale_id invalide'),
    body('medicament_id').isInt({ gt: 0 }).withMessage('medicament_id invalide'),
    body('dosage_prescrit').notEmpty().withMessage('dosage_prescrit requis'),
    body('frequence').notEmpty().withMessage('frequence requise'),
    body('duree_traitement').isInt({ gt: 0 }).withMessage('duree_traitement invalide'),
    body('quantite_totale').isInt({ gt: 0 }).withMessage('quantite_totale invalide'),
    body('date_debut').isISO8601().withMessage('date_debut invalide'),
    body('date_fin').isISO8601().withMessage('date_fin invalide'),
    body('instructions_specifiques').optional().isLength({ max: 1000 }).withMessage('instructions_specifiques trop long'),
    body('moment_prise').optional().isIn([
        'avant_repas', 'pendant_repas', 'apres_repas', 'a_jeun', 'au_coucher', 'selon_besoin'
    ]).withMessage('moment_prise invalide')
];

const updatePrescription = [
    param('id').isInt({ gt: 0 }).withMessage('id invalide'),
    body('dosage_prescrit').optional().notEmpty().withMessage('dosage_prescrit requis'),
    body('frequence').optional().notEmpty().withMessage('frequence requise'),
    body('duree_traitement').optional().isInt({ gt: 0 }).withMessage('duree_traitement invalide'),
    body('quantite_totale').optional().isInt({ gt: 0 }).withMessage('quantite_totale invalide'),
    body('date_debut').optional().isISO8601().withMessage('date_debut invalide'),
    body('date_fin').optional().isISO8601().withMessage('date_fin invalide'),
    body('instructions_specifiques').optional().isLength({ max: 1000 }).withMessage('instructions_specifiques trop long'),
    body('moment_prise').optional().isIn([
        'avant_repas', 'pendant_repas', 'apres_repas', 'a_jeun', 'au_coucher', 'selon_besoin'
    ]).withMessage('moment_prise invalide'),
    body('statut').optional().isIn(['active', 'terminee', 'arretee', 'suspendue']).withMessage('statut invalide'),
    body('raison_arret').optional().isLength({ max: 500 }).withMessage('raison_arret trop long')
];

const listPrescriptions = [
    query('page').optional().isInt({ gt: 0 }).withMessage('page invalide'),
    query('limit').optional().isInt({ gt: 0, max: 100 }).withMessage('limit invalide'),
    query('statut').optional().isIn(['active', 'terminee', 'arretee', 'suspendue']).withMessage('statut invalide'),
    query('date_debut').optional().isISO8601().withMessage('date_debut invalide'),
    query('date_fin').optional().isISO8601().withMessage('date_fin invalide'),
    query('medicament').optional().isLength({ min: 1 }).withMessage('medicament trop court')
];

const createMultiplePrescriptions = [
    body('prescriptions').isArray({ min: 1 }).withMessage('prescriptions requis et doit être un tableau'),
    body('prescriptions.*.fiche_medicale_id').isInt({ gt: 0 }).withMessage('fiche_medicale_id invalide'),
    body('prescriptions.*.medicament_id').isInt({ gt: 0 }).withMessage('medicament_id invalide'),
    body('prescriptions.*.dosage_prescrit').notEmpty().withMessage('dosage_prescrit requis'),
    body('prescriptions.*.frequence').notEmpty().withMessage('frequence requise'),
    body('prescriptions.*.duree_traitement').isInt({ gt: 0 }).withMessage('duree_traitement invalide'),
    body('prescriptions.*.quantite_totale').isInt({ gt: 0 }).withMessage('quantite_totale invalide'),
    body('prescriptions.*.date_debut').isISO8601().withMessage('date_debut invalide'),
    body('prescriptions.*.date_fin').isISO8601().withMessage('date_fin invalide'),
    body('prescriptions.*.moment_prise').optional().isIn([
        'avant_repas', 'pendant_repas', 'apres_repas', 'a_jeun', 'au_coucher', 'selon_besoin'
    ]).withMessage('moment_prise invalide')
];

const arreterPrescription = [
    param('id').isInt({ gt: 0 }).withMessage('id invalide'),
    body('raison').optional().isLength({ max: 500 }).withMessage('raison trop longue')
];

const suspendrePrescription = [
    param('id').isInt({ gt: 0 }).withMessage('id invalide'),
    body('raison').optional().isLength({ max: 500 }).withMessage('raison trop longue')
];

const renouvelerPrescription = [
    param('id').isInt({ gt: 0 }).withMessage('id invalide'),
    body('nouvelle_duree').optional().isInt({ gt: 0 }).withMessage('nouvelle_duree invalide'),
    body('nouvelle_quantite').optional().isInt({ gt: 0 }).withMessage('nouvelle_quantite invalide'),
    body('date_debut').optional().isISO8601().withMessage('date_debut invalide')
];

module.exports = {
    createPrescription,
    updatePrescription,
    listPrescriptions,
    createMultiplePrescriptions,
    arreterPrescription,
    suspendrePrescription,
    renouvelerPrescription
};
