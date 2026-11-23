const express = require('express');
const router = express.Router();
const CentreController = require('../controllers/centreController');
const { protect, authorize } = require('../middlewares/auth');
const { runValidations } = require('../middlewares/validate');
const { createCentre, updateCentre, listCentres } = require('../validators/centreValidators');

router.get('/', protect, authorize('admin', 'admin_centre', 'personnel', 'ministere'), runValidations(listCentres), CentreController.getAll);
router.get('/:id', protect, authorize('admin', 'admin_centre', 'personnel', 'ministere'), CentreController.getById);
router.post('/', protect, authorize('admin', 'admin_centre', 'ministere'), runValidations(createCentre), CentreController.create);
router.put('/:id', protect, authorize('admin', 'admin_centre', 'ministere'), runValidations(updateCentre), CentreController.update);
router.delete('/:id', protect, authorize('admin', 'ministere'), CentreController.delete);

module.exports = router;
