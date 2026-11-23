/**
 * Routes pour la gestion des documents médicaux
 */

const express = require('express');
const router = express.Router();
const DocumentMedicalController = require('../controllers/documentMedicalController');
const { protect, authorize } = require('../middlewares/auth');

// Upload d'un document
router.post('/upload', 
    protect, 
    authorize('admin_centre', 'personnel', 'medecin', 'ministere'),
    DocumentMedicalController.uploadSingle
);

// Upload de plusieurs documents
router.post('/upload-multiple',
    protect,
    authorize('admin_centre', 'personnel', 'medecin', 'ministere'),
    DocumentMedicalController.uploadMultiple
);

// Liste des documents d'un patient
router.get('/patient/:patient_id',
    protect,
    authorize('admin_centre', 'personnel', 'medecin', 'ministere', 'patient'),
    DocumentMedicalController.getByPatient
);

// Liste des documents d'une fiche médicale
router.get('/fiche/:fiche_id',
    protect,
    authorize('admin_centre', 'personnel', 'medecin', 'ministere'),
    DocumentMedicalController.getByFiche
);

// Télécharger un document (avant /:id pour éviter conflit)
router.get('/:id/download',
    protect,
    authorize('admin_centre', 'personnel', 'medecin', 'ministere', 'patient'),
    DocumentMedicalController.download
);

// Voir un document (inline, avant /:id pour éviter conflit)
router.get('/:id/view',
    protect,
    authorize('admin_centre', 'personnel', 'medecin', 'ministere', 'patient'),
    DocumentMedicalController.view
);

// Obtenir un document par ID (dernier pour éviter conflit avec routes spécifiques)
router.get('/:id',
    protect,
    authorize('admin_centre', 'personnel', 'medecin', 'ministere', 'patient'),
    DocumentMedicalController.getById
);

// Supprimer un document
router.delete('/:id',
    protect,
    authorize('admin_centre', 'personnel', 'medecin', 'ministere'),
    DocumentMedicalController.delete
);

module.exports = router;

