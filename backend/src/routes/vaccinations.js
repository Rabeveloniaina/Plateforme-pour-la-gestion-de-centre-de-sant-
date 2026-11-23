const express = require('express');
const router = express.Router();
const VaccinationController = require('../controllers/vaccinationController');
const { protect, authorize } = require('../middlewares/auth');
const { runValidations } = require('../middlewares/validate');
const { createVaccination, updateVaccination, listVaccinations } = require('../validators/vaccinationValidators');

// Routes pour les vaccinations
router.get('/', protect, authorize('admin', 'personnel', 'medecin'), VaccinationController.getAll);
router.get('/search', protect, authorize('admin', 'personnel', 'medecin'), VaccinationController.search);
router.get('/statistiques', protect, authorize('admin', 'medecin'), VaccinationController.getStatistiques);
router.get('/couverture', protect, authorize('admin'), VaccinationController.getCouvertureVaccinale);
router.get('/rappels', protect, authorize('admin', 'personnel', 'medecin'), VaccinationController.getRappelsAVenir);

// Données de référence
router.get('/types', protect, authorize('admin', 'personnel', 'medecin'), VaccinationController.getTypesVaccins);
router.get('/sites-injection', protect, authorize('admin', 'personnel', 'medecin'), VaccinationController.getSitesInjection);
router.get('/voies-administration', protect, authorize('admin', 'personnel', 'medecin'), VaccinationController.getVoiesAdministration);

// Routes par patient
router.get('/patient/:patient_id', protect, authorize('admin', 'personnel', 'medecin'), VaccinationController.getByPatientId);
router.get('/patient/:patient_id/carnet', protect, authorize('admin', 'personnel', 'medecin'), VaccinationController.getCarnetVaccination);
router.post('/patient/:patient_id/statut-vaccinal', protect, authorize('admin', 'personnel', 'medecin'), VaccinationController.checkStatutVaccinal);

// Routes par médecin
router.get('/medecin/:medecin_id', protect, authorize('admin', 'medecin'), VaccinationController.getByMedecinId);

// CRUD vaccinations
router.post('/', protect, authorize('admin', 'personnel', 'medecin'), runValidations(createVaccination), VaccinationController.create);
router.get('/:id', protect, authorize('admin', 'personnel', 'medecin'), VaccinationController.getById);
router.put('/:id', protect, authorize('admin', 'personnel', 'medecin'), runValidations(updateVaccination), VaccinationController.update);
router.delete('/:id', protect, authorize('admin'), VaccinationController.delete);

// Actions spéciales
router.post('/:id/planifier-rappel', protect, authorize('admin', 'personnel', 'medecin'), VaccinationController.planifierRappel);
router.post('/:id/reaction-adverse', protect, authorize('admin', 'personnel', 'medecin'), VaccinationController.enregistrerReactionAdverse);

module.exports = router;
