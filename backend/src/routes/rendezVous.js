const express = require('express');
const router = express.Router();
const RendezVousController = require('../controllers/rendezVousController');
const { protect, authorize } = require('../middlewares/auth');
const { runValidations } = require('../middlewares/validate');
const { createRDV, updateRDV, listRDV } = require('../validators/rdvValidators');

router.get('/', protect, authorize('admin_centre', 'personnel', 'medecin', 'ministere', 'patient'), runValidations(listRDV), RendezVousController.getAll);
router.get('/du-jour', protect, authorize('admin_centre', 'personnel', 'medecin', 'ministere'), RendezVousController.duJour);
router.get('/prochain', protect, authorize('admin_centre', 'personnel', 'ministere'), RendezVousController.prochainPourCentre);
router.get('/medecin/:medecin_id', protect, authorize('admin_centre', 'personnel', 'medecin', 'ministere'), RendezVousController.medecinJour);
router.get('/medecin/:medecin_id/aujourdhui', protect, authorize('admin_centre', 'personnel', 'medecin', 'ministere'), RendezVousController.medecinAujourdhui);
router.get('/patient/:patient_id', protect, authorize('admin_centre', 'personnel', 'medecin', 'ministere', 'patient'), RendezVousController.patientRDV);
router.get('/stats', protect, authorize('admin_centre', 'ministere'), RendezVousController.stats);
router.get('/check-availability', protect, authorize('admin_centre', 'personnel', 'ministere', 'patient'), RendezVousController.checkAvailability);
router.get('/:id', protect, authorize('admin_centre', 'personnel', 'medecin', 'ministere', 'patient'), RendezVousController.getById);
router.post('/', protect, authorize('admin_centre', 'personnel', 'ministere', 'patient'), runValidations(createRDV), RendezVousController.create);
router.put('/:id', protect, authorize('admin_centre', 'personnel', 'medecin', 'ministere', 'patient'), runValidations(updateRDV), RendezVousController.update);
router.post('/:id/annuler', protect, authorize('admin_centre', 'personnel', 'ministere', 'patient'), RendezVousController.annuler);
router.post('/:id/confirmer', protect, authorize('admin_centre', 'personnel', 'medecin', 'ministere'), RendezVousController.confirmer);
router.post('/:id/terminer', protect, authorize('admin_centre', 'personnel', 'medecin', 'ministere'), RendezVousController.terminer);
router.post('/:id/checkin', protect, authorize('admin_centre', 'personnel', 'medecin', 'ministere'), RendezVousController.checkin);
router.post('/:id/demarrer', protect, authorize('admin_centre', 'personnel', 'medecin', 'ministere'), RendezVousController.demarrer);
router.post('/walk-in', protect, authorize('admin_centre', 'personnel', 'medecin', 'ministere'), RendezVousController.walkIn);

// Routes pour reprogrammation
const ReprogrammationController = require('../controllers/reprogrammationController');

router.get('/reprogrammation/retards', protect, authorize('admin_centre', 'personnel', 'medecin'), ReprogrammationController.detecterRetards);
router.get('/reprogrammation/absences', protect, authorize('admin_centre', 'personnel', 'medecin'), ReprogrammationController.detecterAbsences);
router.post('/reprogrammation/:id/marquer-absent', protect, authorize('admin_centre', 'personnel', 'medecin'), ReprogrammationController.marquerAbsent);
router.post('/reprogrammation/:id/proposer', protect, authorize('admin_centre', 'personnel', 'medecin'), ReprogrammationController.proposerReprogrammation);
router.post('/reprogrammation/:id/reprogrammer', protect, authorize('admin_centre', 'personnel', 'medecin'), ReprogrammationController.reprogrammer);

module.exports = router;
