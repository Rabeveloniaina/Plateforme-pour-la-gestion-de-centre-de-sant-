const { body } = require('express-validator');

const register = [
	body('nom_utilisateur').notEmpty().withMessage('nom_utilisateur requis'),
	body('mot_de_passe').isLength({ min: 6 }).withMessage('mot_de_passe min 6 caractères'),
	body('role').optional().isIn(['patient','medecin','admin','personnel']).withMessage('role invalide')
];

const login = [
	body('nom_utilisateur').notEmpty().withMessage('nom_utilisateur requis'),
	body('mot_de_passe').notEmpty().withMessage('mot_de_passe requis')
];

module.exports = { register, login };
