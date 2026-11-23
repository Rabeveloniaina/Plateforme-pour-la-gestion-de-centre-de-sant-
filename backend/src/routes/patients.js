const express = require('express');
const router = express.Router();
const PatientController = require('../controllers/patientController');
const { protect, authorize } = require('../middlewares/auth');
const { runValidations } = require('../middlewares/validate');
const { createPatient, updatePatient, listPatients } = require('../validators/patientValidators');

// Routes pour les patients
router.get('/', protect, authorize('admin_centre', 'personnel', 'medecin', 'ministere'), runValidations(listPatients), PatientController.getAll);
router.get('/me', protect, authorize('patient'), PatientController.getMe); // Route pour patient connecté
router.post('/me', protect, authorize('patient'), PatientController.createMyProfile); // Créer le profil patient pour l'utilisateur connecté
router.put('/me', protect, authorize('patient'), runValidations(updatePatient), PatientController.updateMe); // Mettre à jour le profil du patient connecté
router.get('/search', protect, authorize('admin_centre', 'personnel', 'medecin', 'ministere'), PatientController.search);
router.get('/stats', protect, authorize('admin_centre', 'ministere'), PatientController.getStatsByCentre);
router.get('/centre/:centre_id', protect, authorize('admin_centre', 'personnel', 'medecin', 'ministere'), PatientController.getByCentre);
router.get('/:id/dossier', protect, authorize('admin_centre', 'personnel', 'medecin', 'ministere', 'patient'), PatientController.getDossier);
router.post('/', protect, authorize('admin_centre', 'personnel', 'ministere'), runValidations(createPatient), PatientController.create);
router.get('/:id', protect, authorize('admin_centre', 'personnel', 'medecin', 'ministere', 'patient'), PatientController.getById);
router.put('/:id', protect, authorize('admin_centre', 'personnel', 'ministere', 'patient'), runValidations(updatePatient), PatientController.update);
router.delete('/:id', protect, authorize('admin_centre', 'ministere'), PatientController.delete);

module.exports = router;
