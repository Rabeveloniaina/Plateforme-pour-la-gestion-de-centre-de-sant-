const { body, param, query } = require('express-validator');

const createCentre = [
	body('nom').notEmpty().withMessage('nom requis'),
	body('adresse').notEmpty().withMessage('adresse requise'),
	body('region_id').isInt({ gt: 0 }).withMessage('region_id invalide'),
	body('capacite_max').optional().isInt({ gt: 0 }),
	body('telephone').notEmpty().withMessage('telephone requis'),
	body('email').isEmail().withMessage('email invalide'),
	body('mot_de_passe_admin')
		.isLength({ min: 6 })
		.withMessage('mot_de_passe_admin doit contenir au moins 6 caractères')
];

const updateCentre = [
	param('id').isInt({ gt: 0 }).withMessage('id invalide')
];

const listCentres = [
	query('page').optional().isInt({ gt: 0 }),
	query('limit').optional().isInt({ gt: 0 })
];

module.exports = { createCentre, updateCentre, listCentres };
