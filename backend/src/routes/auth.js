const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { protect, authorize } = require('../middlewares/auth');
const { runValidations } = require('../middlewares/validate');
const { register, login } = require('../validators/authValidators');

router.post('/register', runValidations(register), AuthController.register);
router.post('/login', runValidations(login), AuthController.login);
router.get('/me', protect, AuthController.me);
router.get('/users', protect, authorize('admin'), AuthController.listUsers);
router.put('/users/:id', protect, authorize('admin'), AuthController.updateUser);

module.exports = router;
