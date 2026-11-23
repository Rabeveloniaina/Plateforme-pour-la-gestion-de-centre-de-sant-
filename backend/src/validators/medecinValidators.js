const { body, param, query } = require('express-validator');

const createMedecin = [
	body('nom').notEmpty().withMessage('nom requis'),
	body('prenom').notEmpty().withMessage('prenom requis'),
	body('sexe').isIn(['M','F']).withMessage('sexe invalide'),
	body('date_naissance').isISO8601().withMessage('date_naissance invalide'),
	body('specialite').notEmpty().withMessage('specialite requise'),
	body('numero_licence').notEmpty().withMessage('numero_licence requis'),
	body('telephone').notEmpty().withMessage('telephone requis'),
	body('email').isEmail().withMessage('email invalide'),
	body('centre_id').isInt({ gt: 0 }).withMessage('centre_id invalide')
];

const updateMedecin = [
	param('id').isInt({ gt: 0 }).withMessage('id invalide')
];

const listMedecins = [
	query('page').optional().isInt({ gt: 0 }),
	query('limit').optional().isInt({ gt: 0 })
];

module.exports = { createMedecin, updateMedecin, listMedecins };
