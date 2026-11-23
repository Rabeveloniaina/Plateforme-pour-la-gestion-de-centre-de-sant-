const express = require('express');
const router = express.Router();
const MedicamentController = require('../controllers/medicamentController');
const { protect, authorize } = require('../middlewares/auth');
const { runValidations } = require('../middlewares/validate');
const { createMedicament, updateMedicament, listMedicaments } = require('../validators/medicamentValidators');

// Routes pour les médicaments
router.get('/', protect, authorize('admin', 'personnel', 'medecin'), MedicamentController.getAll);
router.get('/search', protect, authorize('admin', 'personnel', 'medecin'), MedicamentController.search);
router.get('/statistiques', protect, authorize('admin'), MedicamentController.getStatistiques);
router.get('/formes', protect, authorize('admin', 'personnel', 'medecin'), MedicamentController.getFormes);

// Routes par forme pharmaceutique
router.get('/forme/:forme', protect, authorize('admin', 'personnel', 'medecin'), MedicamentController.getByForme);

// Vérification des interactions
router.post('/interactions', protect, authorize('admin', 'personnel', 'medecin'), MedicamentController.checkInteractions);

// Import en masse (admin seulement)
router.post('/import', protect, authorize('admin'), MedicamentController.importBulk);

// CRUD médicaments
router.post('/', protect, authorize('admin'), runValidations(createMedicament), MedicamentController.create);
router.get('/:id', protect, authorize('admin', 'personnel', 'medecin'), MedicamentController.getById);
router.put('/:id', protect, authorize('admin'), runValidations(updateMedicament), MedicamentController.update);
router.delete('/:id', protect, authorize('admin'), MedicamentController.delete);

module.exports = router;
