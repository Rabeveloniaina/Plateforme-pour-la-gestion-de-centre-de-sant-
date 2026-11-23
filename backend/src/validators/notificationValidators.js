const { body, query, param } = require('express-validator');

const createNotification = [
	body('type').isIn(['SMS','email','push']).withMessage('type invalide'),
	body('message').notEmpty().withMessage('message requis'),
	body('patient_id').optional().isInt({ gt: 0 }),
	body('medecin_id').optional().isInt({ gt: 0 })
];

const listNotifications = [
	query('page').optional().isInt({ gt: 0 }),
	query('limit').optional().isInt({ gt: 0 }),
	query('type').optional().isIn(['SMS','email','push']),
	query('statut').optional().isIn(['en_attente','envoye','echoue'])
];

const updateNotificationStatut = [
	param('id').isInt({ gt: 0 }).withMessage('id invalide'),
	body('statut').isIn(['en_attente','envoye','echoue']).withMessage('statut invalide')
];

module.exports = { createNotification, listNotifications, updateNotificationStatut };
