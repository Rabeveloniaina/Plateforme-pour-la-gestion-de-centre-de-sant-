const { body, param, query } = require('express-validator');

const createRDV = [
	// patient_id est optionnel car il peut venir du JWT pour les patients
	body('patient_id').optional().isInt({ gt: 0 }).withMessage('patient_id invalide'),
	body('medecin_id').isInt({ gt: 0 }).withMessage('medecin_id invalide'),
	// centre_id est optionnel pour le personnel (vient du JWT)
	body('centre_id').optional().isInt({ gt: 0 }).withMessage('centre_id invalide'),
	// date_rdv peut être une date simple (YYYY-MM-DD) ou un datetime complet
	body('date_rdv').notEmpty().withMessage('date_rdv requis'),
	body('heure_rdv').optional(),
	body('motif').optional(),
	body('symptomes').optional(),
	body('notes').optional(),
	body('orientation').optional().isIn(['generaliste','specialiste','auto']).withMessage('orientation invalide'),
	body('duree_estimee').optional().isInt({ gt: 0 })
];

const updateRDV = [
	param('id').isInt({ gt: 0 }).withMessage('id invalide')
];

const listRDV = [
	query('page').optional().isInt({ gt: 0 }),
	query('limit').optional().isInt({ gt: 0 })
];

module.exports = { createRDV, updateRDV, listRDV };
