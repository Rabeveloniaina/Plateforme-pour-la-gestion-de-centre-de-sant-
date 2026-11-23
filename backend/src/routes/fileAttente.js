const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const FileAttenteController = require('../controllers/fileAttenteController');

/**
 * @route   GET /api/personnel/file-attente
 * @desc    Obtenir la file d'attente du centre
 * @access  Personnel, Admin, Médecin
 */
router.get('/', 
    protect, 
    authorize('personnel', 'agent_centre', 'admin', 'medecin'), 
    FileAttenteController.getFileAttente
);

/**
 * @route   GET /api/personnel/file-attente/stats
 * @desc    Obtenir les statistiques de la file d'attente
 * @access  Personnel, Admin
 */
router.get('/stats', 
    protect, 
    authorize('personnel', 'agent_centre', 'admin'), 
    FileAttenteController.getStatsFileAttente
);

/**
 * @route   PUT /api/personnel/file-attente/:rdv_id/priorite
 * @desc    Changer la priorité d'un patient dans la file
 * @access  Personnel, Admin, Médecin
 */
router.put('/:rdv_id/priorite', 
    protect, 
    authorize('personnel', 'agent_centre', 'admin', 'medecin'), 
    FileAttenteController.changerPriorite
);

/**
 * @route   POST /api/personnel/file-attente/:rdv_id/appeler
 * @desc    Appeler le prochain patient (MEDECIN UNIQUEMENT)
 * @access  Médecin
 */
router.post('/:rdv_id/appeler', 
    protect, 
    authorize('medecin'), 
    FileAttenteController.appellerPatient
);

/**
 * @route   POST /api/personnel/file-attente/:rdv_id/marquer-absent
 * @desc    Marquer un patient comme absent
 * @access  Médecin, Personnel, Admin
 */
router.post('/:rdv_id/marquer-absent', 
    protect, 
    authorize('medecin', 'personnel', 'agent_centre', 'admin'), 
    FileAttenteController.marquerAbsent
);

module.exports = router;

