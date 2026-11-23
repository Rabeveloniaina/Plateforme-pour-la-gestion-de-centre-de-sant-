const express = require('express');
const router = express.Router();
const PrescriptionController = require('../controllers/prescriptionController');
const { protect, authorize } = require('../middlewares/auth');
const { runValidations } = require('../middlewares/validate');
const { createPrescription, updatePrescription, listPrescriptions } = require('../validators/prescriptionValidators');

// Routes pour les prescriptions
router.get('/', protect, authorize('admin', 'personnel', 'medecin'), PrescriptionController.getAll);
router.get('/statistiques', protect, authorize('admin', 'medecin'), PrescriptionController.getStatistiques);

// Route pour le patient connecté (mes prescriptions)
router.get('/me', protect, authorize('patient'), PrescriptionController.getMyPrescriptions);

// Routes par patient
router.get('/patient/:patient_id', protect, authorize('admin', 'personnel', 'medecin'), runValidations(listPrescriptions), PrescriptionController.getByPatientId);
router.get('/patient/:patient_id/actives', protect, authorize('admin', 'personnel', 'medecin'), PrescriptionController.getActivePrescriptions);
router.get('/patient/:patient_id/interactions', protect, authorize('admin', 'personnel', 'medecin'), PrescriptionController.checkInteractionsForPatient);

// Routes par fiche médicale
router.get('/fiche/:fiche_medicale_id', protect, authorize('admin', 'personnel', 'medecin'), PrescriptionController.getByFicheMedicaleId);

// Génération d'ordonnance
router.get('/patient/:patient_id/fiche/:fiche_medicale_id/ordonnance', protect, authorize('admin', 'personnel', 'medecin'), PrescriptionController.genererOrdonnance);

// CRUD prescriptions
router.post('/', protect, authorize('admin', 'medecin'), runValidations(createPrescription), PrescriptionController.create);
router.post('/multiple', protect, authorize('admin', 'medecin'), PrescriptionController.createMultiple);
router.get('/:id', protect, authorize('admin', 'personnel', 'medecin'), PrescriptionController.getById);
router.put('/:id', protect, authorize('admin', 'medecin'), runValidations(updatePrescription), PrescriptionController.update);
router.delete('/:id', protect, authorize('admin', 'medecin'), PrescriptionController.delete);

// Actions sur les prescriptions
router.post('/:id/arreter', protect, authorize('admin', 'medecin'), PrescriptionController.arreter);
router.post('/:id/suspendre', protect, authorize('admin', 'medecin'), PrescriptionController.suspendre);
router.post('/:id/terminer', protect, authorize('admin', 'medecin'), PrescriptionController.terminer);
router.post('/:id/renouveler', protect, authorize('admin', 'medecin'), PrescriptionController.renouveler);

module.exports = router;
