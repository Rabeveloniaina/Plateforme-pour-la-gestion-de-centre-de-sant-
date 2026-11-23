const express = require('express');
const router = express.Router();
const MedecinController = require('../controllers/medecinController');
const { protect, authorize } = require('../middlewares/auth');
const { runValidations } = require('../middlewares/validate');
const { createMedecin, updateMedecin, listMedecins } = require('../validators/medecinValidators');

router.get('/', protect, authorize('admin_centre', 'personnel', 'medecin', 'ministere'), runValidations(listMedecins), MedecinController.getAll);
router.get('/stats', protect, authorize('admin_centre', 'ministere'), MedecinController.stats);
router.get('/specialites', protect, authorize('admin_centre', 'personnel', 'medecin', 'ministere', 'patient'), MedecinController.getSpecialites);
router.get('/specialistes', protect, authorize('admin_centre', 'personnel', 'medecin', 'ministere', 'patient'), MedecinController.getSpecialistes);
router.get('/specialite/:specialite', protect, authorize('admin_centre', 'personnel', 'medecin', 'ministere', 'patient'), MedecinController.bySpecialite);
router.get('/centre/:centre_id', protect, authorize('admin_centre', 'personnel', 'medecin', 'ministere', 'patient'), MedecinController.byCentre);
router.get('/:id/disponibilites', protect, authorize('admin_centre', 'personnel', 'medecin', 'ministere', 'patient'), MedecinController.disponibilites);
router.put('/:id/disponibilites', protect, authorize('admin_centre', 'medecin'), MedecinController.updateDisponibilites);
router.get('/:id/horaires', protect, authorize('admin_centre', 'personnel', 'medecin', 'ministere'), MedecinController.getHoraires);
router.put('/:id/horaires', protect, authorize('admin_centre', 'medecin', 'ministere'), MedecinController.updateHoraires);
router.put('/:id/gestion-dynamique', protect, authorize('admin_centre', 'medecin', 'ministere'), MedecinController.setGestionDynamique);
router.post('/:id/statut/update-now', protect, authorize('admin_centre', 'medecin', 'ministere'), MedecinController.updateStatutNow);
router.get('/:id/statut-operationnel', protect, authorize('admin_centre', 'personnel', 'medecin', 'ministere'), MedecinController.getStatutOperationnel);
router.put('/:id/statut-operationnel', protect, authorize('admin_centre', 'medecin', 'ministere'), MedecinController.updateStatutOperationnel);
router.get('/:id/statistiques', protect, authorize('admin_centre', 'personnel', 'medecin', 'ministere'), MedecinController.getStatistiques);
router.get('/:id', protect, authorize('admin_centre', 'personnel', 'medecin', 'ministere', 'patient'), MedecinController.getById);
router.post('/', protect, authorize('admin', 'admin_centre', 'ministere'), runValidations(createMedecin), MedecinController.create);
router.put('/:id', protect, authorize('admin', 'admin_centre', 'ministere'), runValidations(updateMedecin), MedecinController.update);
router.delete('/:id', protect, authorize('admin', 'ministere'), MedecinController.delete);

module.exports = router;
