const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/auth');

// Routes publiques (sans authentification)
router.post('/register', UserController.create);
router.get('/check-username/:username', UserController.checkUsername);
router.get('/check-email/:email', UserController.checkEmail);

// Routes protégées (nécessitent une authentification)
router.use(protect);

// CRUD complet des utilisateurs
router.get('/', UserController.getAll);
router.get('/search', UserController.search);
router.get('/stats', UserController.getStatistiques);
router.get('/:id', UserController.getById);
router.put('/:id', UserController.update);
router.delete('/:id', UserController.delete);

// Gestion des mots de passe
router.put('/:id/change-password', UserController.changePassword);
router.put('/:id/reset-password', authorize('admin'), UserController.resetPassword);

module.exports = router;
