const { body, param, query } = require('express-validator');

const createFicheMedicale = [
    body('patient_id').isInt({ gt: 0 }).withMessage('patient_id invalide'),
    body('medecin_id').isInt({ gt: 0 }).withMessage('medecin_id invalide'),
    body('date_consultation').isISO8601().withMessage('date_consultation invalide'),
    body('motif_consultation').notEmpty().withMessage('motif_consultation requis'),
    body('poids').optional().isFloat({ min: 0 }).withMessage('poids invalide'),
    body('taille').optional().isFloat({ min: 0 }).withMessage('taille invalide'),
    body('tension_systolique').optional().isInt({ min: 50, max: 300 }).withMessage('tension_systolique invalide'),
    body('tension_diastolique').optional().isInt({ min: 30, max: 200 }).withMessage('tension_diastolique invalide'),
    body('frequence_cardiaque').optional().isInt({ min: 30, max: 250 }).withMessage('frequence_cardiaque invalide'),
    body('temperature').optional().isFloat({ min: 30, max: 45 }).withMessage('temperature invalide'),
    body('symptomes').optional().custom((value) => {
        if (typeof value === 'string') {
            try { JSON.parse(value); return true; } catch { return false; }
        }
        return Array.isArray(value);
    }).withMessage('symptomes doit être un tableau ou JSON valide'),
    body('diagnostic_principal').optional().isLength({ max: 500 }).withMessage('diagnostic_principal trop long'),
    body('diagnostics_secondaires').optional().custom((value) => {
        if (typeof value === 'string') {
            try { JSON.parse(value); return true; } catch { return false; }
        }
        return Array.isArray(value);
    }).withMessage('diagnostics_secondaires doit être un tableau ou JSON valide'),
    body('suivi_necessaire').optional().isBoolean().withMessage('suivi_necessaire doit être un booléen'),
    body('date_prochain_rdv').optional().isISO8601().withMessage('date_prochain_rdv invalide')
];

const updateFicheMedicale = [
    param('id').isInt({ gt: 0 }).withMessage('id invalide'),
    body('poids').optional().isFloat({ min: 0 }).withMessage('poids invalide'),
    body('taille').optional().isFloat({ min: 0 }).withMessage('taille invalide'),
    body('tension_systolique').optional().isInt({ min: 50, max: 300 }).withMessage('tension_systolique invalide'),
    body('tension_diastolique').optional().isInt({ min: 30, max: 200 }).withMessage('tension_diastolique invalide'),
    body('frequence_cardiaque').optional().isInt({ min: 30, max: 250 }).withMessage('frequence_cardiaque invalide'),
    body('temperature').optional().isFloat({ min: 30, max: 45 }).withMessage('temperature invalide'),
    body('symptomes').optional().isArray().withMessage('symptomes doit être un tableau'),
    body('diagnostic_principal').optional().isLength({ max: 500 }).withMessage('diagnostic_principal trop long'),
    body('diagnostics_secondaires').optional().isArray().withMessage('diagnostics_secondaires doit être un tableau'),
    body('statut').optional().isIn(['en_cours', 'termine', 'annule']).withMessage('statut invalide'),
    body('suivi_necessaire').optional().isBoolean().withMessage('suivi_necessaire doit être un booléen'),
    body('date_prochain_rdv').optional().isISO8601().withMessage('date_prochain_rdv invalide')
];

const listFichesMedicales = [
    query('page').optional().isInt({ gt: 0 }).withMessage('page invalide'),
    query('limit').optional().isInt({ gt: 0, max: 100 }).withMessage('limit invalide'),
    query('date_debut').optional().isISO8601().withMessage('date_debut invalide'),
    query('date_fin').optional().isISO8601().withMessage('date_fin invalide'),
    query('statut').optional().isIn(['en_cours', 'termine', 'annule']).withMessage('statut invalide')
];

const createFicheMedicaleWithPrescriptions = [
    body('fiche_data').notEmpty().withMessage('fiche_data requis'),
    body('fiche_data.patient_id').isInt({ gt: 0 }).withMessage('patient_id invalide'),
    body('fiche_data.medecin_id').isInt({ gt: 0 }).withMessage('medecin_id invalide'),
    body('fiche_data.date_consultation').isISO8601().withMessage('date_consultation invalide'),
    body('fiche_data.motif_consultation').notEmpty().withMessage('motif_consultation requis'),
    body('prescriptions').optional().isArray().withMessage('prescriptions doit être un tableau'),
    body('prescriptions.*.medicament_id').optional().isInt({ gt: 0 }).withMessage('medicament_id invalide'),
    body('prescriptions.*.dosage_prescrit').optional().notEmpty().withMessage('dosage_prescrit requis'),
    body('prescriptions.*.frequence').optional().notEmpty().withMessage('frequence requise'),
    body('prescriptions.*.duree_traitement').optional().isInt({ gt: 0 }).withMessage('duree_traitement invalide'),
    body('prescriptions.*.quantite_totale').optional().isInt({ gt: 0 }).withMessage('quantite_totale invalide'),
    body('prescriptions.*.date_debut').optional().isISO8601().withMessage('date_debut invalide'),
    body('prescriptions.*.date_fin').optional().isISO8601().withMessage('date_fin invalide')
];

module.exports = {
    createFicheMedicale,
    updateFicheMedicale,
    listFichesMedicales,
    createFicheMedicaleWithPrescriptions
};
