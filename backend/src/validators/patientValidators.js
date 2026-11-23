const { body, param, query } = require('express-validator');

const createPatient = [
	body('nom').notEmpty().withMessage('nom requis'),
	body('prenom').notEmpty().withMessage('prenom requis'),
	body('date_naissance').isISO8601().withMessage('date_naissance invalide'),
	body('sexe').isIn(['M','F']).withMessage('sexe invalide'),
	body('adresse').notEmpty().withMessage('adresse requise'),
	body('telephone').notEmpty().withMessage('telephone requis'),
	body('centre_id').isInt({ gt: 0 }).withMessage('centre_id invalide'),
	body('allergies').optional(),
	body('antecedents').optional(),
	body('maladies_chroniques').optional()
];

const updatePatient = [
	param('id').isInt({ gt: 0 }).withMessage('id invalide'),
	body('allergies').optional(),
	body('antecedents').optional(),
	body('maladies_chroniques').optional()
];

const listPatients = [
	query('page').optional().isInt({ gt: 0 }),
	query('limit').optional().isInt({ gt: 0 })
];

module.exports = { createPatient, updatePatient, listPatients };
