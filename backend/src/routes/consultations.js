const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const ConsultationController = require('../controllers/consultationController');

// Routes pour les fiches de consultation (créées par les médecins)

/**
 * @route   POST /api/consultations
 * @desc    Créer une nouvelle fiche de consultation
 * @access  Médecin uniquement
 */
router.post('/', 
    protect, 
    authorize('medecin'), 
    ConsultationController.create
);

/**
 * @route   GET /api/consultations
 * @desc    Récupérer toutes les fiches de consultation (filtrées par médecin si médecin connecté)
 * @access  Médecin, Admin, Agent
 */
router.get('/', 
    protect, 
    authorize('medecin', 'admin', 'agent_centre', 'ministere'), 
    ConsultationController.getAll
);

/**
 * @route   GET /api/consultations/:id
 * @desc    Récupérer une fiche de consultation par ID
 * @access  Médecin, Admin, Agent
 */
router.get('/:id', 
    protect, 
    authorize('medecin', 'admin', 'agent_centre'), 
    ConsultationController.getById
);

/**
 * @route   PUT /api/consultations/:id
 * @desc    Mettre à jour une fiche de consultation
 * @access  Médecin (propriétaire) ou Admin
 */
router.put('/:id', 
    protect, 
    authorize('medecin', 'admin'), 
    ConsultationController.update
);

/**
 * @route   DELETE /api/consultations/:id
 * @desc    Supprimer une fiche de consultation
 * @access  Médecin (propriétaire) ou Admin
 */
router.delete('/:id', 
    protect, 
    authorize('medecin', 'admin'), 
    ConsultationController.delete
);

/**
 * @route   GET /api/consultations/patient/:patient_id
 * @desc    Récupérer toutes les consultations d'un patient
 * @access  Médecin, Admin, Agent
 */
router.get('/patient/:patient_id', 
    protect, 
    authorize('medecin', 'admin', 'agent_centre'), 
    ConsultationController.getByPatientId
);

/**
 * @route   POST /api/consultations/rediriger
 * @desc    Rediriger un patient vers un spécialiste dans le même centre
 * @access  Médecin uniquement
 */
router.post('/rediriger', 
    protect, 
    authorize('medecin'), 
    ConsultationController.rediriger
);

module.exports = router;

