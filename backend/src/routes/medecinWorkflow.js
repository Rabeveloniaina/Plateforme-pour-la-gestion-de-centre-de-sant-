/**
 * Routes pour le workflow du médecin
 * Centralise toutes les fonctionnalités quotidiennes du médecin
 */

const express = require('express');
const router = express.Router();
const MedecinWorkflowController = require('../controllers/medecinWorkflowController');
const { protect, authorize } = require('../middlewares/auth');

// Middleware de débogage pour tracer les requêtes
router.use((req, res, next) => {
    console.log(`🔍 [MedecinWorkflow] Route demandée: ${req.method} ${req.originalUrl || req.path}`);
    console.log(`   Path: ${req.path}, Base URL: ${req.baseUrl || 'N/A'}`);
    next();
});

// Route de test simple (sans authentification pour débogage)
router.get('/test', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Route medecinWorkflow fonctionne',
        path: req.path,
        originalUrl: req.originalUrl,
        baseUrl: req.baseUrl
    });
});

// Toutes les routes nécessitent une authentification et le rôle 'medecin'
// Appliquer les middlewares sur chaque route individuellement pour plus de clarté
// 1. Consulter planning du jour
router.get('/planning-du-jour', protect, authorize('medecin'), MedecinWorkflowController.getPlanningDuJour);

// 2. Consulter dossier patient
router.get('/dossier-patient/:patient_id', (req, res, next) => {
    console.log(`✅ [MedecinWorkflow] Route /dossier-patient/:patient_id atteinte`);
    console.log(`   patient_id: ${req.params.patient_id}`);
    console.log(`   user: ${req.user ? 'présent' : 'absent'}`);
    next();
}, protect, (req, res, next) => {
    console.log(`✅ [MedecinWorkflow] Après protect middleware`);
    next();
}, authorize('medecin'), (req, res, next) => {
    console.log(`✅ [MedecinWorkflow] Après authorize middleware`);
    next();
}, MedecinWorkflowController.getDossierPatient);

// 3. Mettre à jour fiche médicale
router.put('/fiche-medicale/:fiche_id', protect, authorize('medecin'), MedecinWorkflowController.updateFicheMedicale);

// 4. Enregistrer consultation
router.post('/enregistrer-consultation', protect, authorize('medecin'), MedecinWorkflowController.enregistrerConsultation);

// 5. Rediriger vers spécialiste
router.post('/rediriger-specialiste', protect, authorize('medecin'), MedecinWorkflowController.redirigerVersSpecialiste);

// 6. Suivre statistiques personnelles
router.get('/statistiques-personnelles', protect, authorize('medecin'), MedecinWorkflowController.getStatistiquesPersonnelles);

// 7. Terminer une consultation
router.post('/terminer-consultation/:rdv_id', protect, authorize('medecin'), async (req, res) => {
    try {
        const { rdv_id } = req.params;
        const { duree_reelle, note_medecin } = req.body;
        
        const RendezVous = require('../models/RendezVous');
        const result = await RendezVous.terminer(rdv_id, duree_reelle, note_medecin);
        
        res.json({
            success: true,
            message: 'Consultation terminée avec succès',
            data: result
        });
    } catch (error) {
        console.error('Erreur terminer consultation:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;

