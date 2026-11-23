const express = require('express');
const router = express.Router();
const MedecinProfileController = require('../controllers/medecinProfileController');
const { protect, authorize } = require('../middlewares/auth');

// Routes pour le profil du médecin connecté
router.get('/me', protect, authorize('medecin'), MedecinProfileController.getMyProfile);
router.put('/me', protect, authorize('medecin'), MedecinProfileController.updateMyProfile);

module.exports = router;

