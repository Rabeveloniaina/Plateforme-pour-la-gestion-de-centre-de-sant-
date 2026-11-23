const express = require('express');
const router = express.Router();
const FicheMedicaleController = require('../controllers/ficheMedicaleController');
const { protect, authorize } = require('../middlewares/auth');
const { runValidations } = require('../middlewares/validate');
const { createFicheMedicale, updateFicheMedicale, listFichesMedicales } = require('../validators/ficheMedicaleValidators');

// Routes pour les fiches médicales
router.get('/', protect, authorize('admin_centre', 'personnel', 'medecin'), FicheMedicaleController.getAll);
router.get('/me', protect, authorize('patient'), FicheMedicaleController.getMyRecord); // Route pour patient connecté
router.get('/search', protect, authorize('admin_centre', 'personnel', 'medecin'), FicheMedicaleController.search);
router.get('/statistiques', protect, authorize('admin_centre', 'medecin'), FicheMedicaleController.getStatistiques);

// Routes par patient
router.get('/patient/:patient_id', protect, authorize('admin', 'personnel', 'medecin', 'patient'), FicheMedicaleController.getByPatientId);
router.get('/patient/:patient_id/resume', protect, authorize('admin', 'personnel', 'medecin', 'patient'), FicheMedicaleController.getResumeMedical);

// Routes par médecin
router.get('/medecin/:medecin_id', protect, authorize('admin', 'medecin'), FicheMedicaleController.getByMedecinId);

// CRUD fiches médicales
router.post('/', protect, authorize('admin_centre', 'medecin', 'patient'), FicheMedicaleController.create);
router.post('/with-prescriptions', protect, authorize('admin_centre', 'medecin'), FicheMedicaleController.createWithPrescriptions);
router.get('/:id', protect, authorize('admin_centre', 'personnel', 'medecin', 'patient'), FicheMedicaleController.getById);
router.put('/:id', protect, authorize('admin_centre', 'medecin', 'patient'), FicheMedicaleController.update);
router.delete('/:id', protect, authorize('admin_centre', 'patient'), FicheMedicaleController.delete);

// Actions spéciales
router.post('/:id/finaliser', protect, authorize('admin', 'medecin'), FicheMedicaleController.finaliserConsultation);

module.exports = router;
