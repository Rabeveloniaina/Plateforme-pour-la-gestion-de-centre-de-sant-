const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const patientInfosMedicalesController = require('../controllers/patientInfosMedicalesController');

// Routes pour les informations médicales de base du patient
router.get('/me', protect, authorize('patient'), patientInfosMedicalesController.getMyInfos);
router.post('/', protect, authorize('patient'), patientInfosMedicalesController.createOrUpdate);
router.put('/field', protect, authorize('patient'), patientInfosMedicalesController.updateField);
router.delete('/:id', protect, authorize('patient', 'medecin', 'admin'), patientInfosMedicalesController.delete);

// Route pour médecin/admin pour consulter les infos d'un patient
router.get('/patient/:patient_id', protect, authorize('medecin', 'admin', 'agent_centre'), patientInfosMedicalesController.getByPatientId);

module.exports = router;

