const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const WalkInController = require('../controllers/walkInController');

/**
 * @route   POST /api/personnel/walk-in
 * @desc    Enregistrer un patient walk-in (sans RDV)
 * @access  Personnel, Admin
 */
router.post('/', 
    protect, 
    authorize('personnel', 'agent_centre', 'admin'), 
    WalkInController.enregistrerWalkIn
);

/**
 * @route   GET /api/personnel/walk-in/en-attente
 * @desc    Liste des walk-ins en attente
 * @access  Personnel, Admin, Médecin
 */
router.get('/en-attente', 
    protect, 
    authorize('personnel', 'agent_centre', 'admin', 'medecin'), 
    WalkInController.getWalkInsEnAttente
);

module.exports = router;

