const express = require('express');
const router = express.Router();
const StatistiqueController = require('../controllers/statistiqueController');
const { protect, authorize } = require('../middlewares/auth');

router.get('/centre', protect, authorize('admin_centre', 'personnel', 'medecin', 'ministere'), StatistiqueController.byCentre);
router.get('/centre/:centre_id', protect, authorize('admin_centre', 'personnel', 'medecin', 'ministere'), StatistiqueController.byCentre);
router.get('/region', protect, authorize('ministere'), StatistiqueController.byRegion);
router.get('/ministere', protect, authorize('ministere'), StatistiqueController.ministere);
router.get('/personnel', protect, authorize('personnel', 'admin_centre'), StatistiqueController.personnel);
router.get('/export', protect, authorize('admin_centre', 'ministere'), StatistiqueController.exportCSV);
router.get('/export-pdf', protect, authorize('admin_centre', 'ministere'), StatistiqueController.exportPDF);

module.exports = router;
