const express = require('express');
const router = express.Router();
const RegistrationController = require('../controllers/registrationController');
const ApprovalController = require('../controllers/approvalController');
const { protect, authorize } = require('../middlewares/auth');
const { runValidations } = require('../middlewares/validate');

// Routes publiques (sans authentification)
router.get('/centres', RegistrationController.getAvailableCentres);
router.get('/regions', RegistrationController.getAvailableRegions);
router.post('/patient', RegistrationController.registerPatient);

// Routes protégées pour les demandes d'approbation
router.post('/centre', protect, authorize('ministere'), RegistrationController.requestCentreCreation);
router.post('/medecin', protect, authorize('admin_centre'), RegistrationController.requestMedecinCreation);
router.post('/personnel', protect, authorize('admin_centre'), RegistrationController.requestPersonnelCreation);

// Routes pour la gestion des approbations
router.get('/approvals', protect, authorize('admin_centre', 'ministere'), ApprovalController.getRequests);
router.post('/approvals/:id/approve', protect, authorize('admin_centre', 'ministere'), ApprovalController.approveRequest);
router.post('/approvals/:id/reject', protect, authorize('admin_centre', 'ministere'), ApprovalController.rejectRequest);
router.get('/approvals/stats', protect, authorize('admin_centre', 'ministere'), ApprovalController.getStats);

module.exports = router;
