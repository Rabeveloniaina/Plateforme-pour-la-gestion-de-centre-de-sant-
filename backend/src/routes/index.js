const express = require('express');
const router = express.Router();

// Import des routes
const patientsRoutes = require('./patients');
const medecinsRoutes = require('./medecins');
const medecinProfileRoutes = require('./medecinProfile');
const medecinWorkflowRoutes = require('./medecinWorkflow');
const rendezVousRoutes = require('./rendezVous');
const authRoutes = require('./auth');
const centresRoutes = require('./centres');
const statistiquesRoutes = require('./statistiques');
const notificationsRoutes = require('./notifications');
const fichesMedicalesRoutes = require('./fichesMedicales'); // Fiches médicales complètes (consultations)
const patientInfosMedicalesRoutes = require('./fiches-medicales'); // Infos médicales de base du patient
const consultationsRoutes = require('./consultations');
const medicamentsRoutes = require('./medicaments');
const prescriptionsRoutes = require('./prescriptions');
const vaccinationsRoutes = require('./vaccinations');
const regionsRoutes = require('./regions');
const publicRoutes = require('./public');
const usersRoutes = require('./users');
const registrationRoutes = require('./registration');
const documentsRoutes = require('./documents');
const walkInRoutes = require('./walkIn');
const fileAttenteRoutes = require('./fileAttente');

// Routes de base
router.get('/', (req, res) => {
    res.json({
        message: '🏥 API de la Plateforme de Gestion des Centres de Santé',
        version: '1.0.0',
        endpoints: {
            auth: '/auth',
            users: '/users',
            patients: '/patients',
            medecins: '/medecins',
            medecin_workflow: '/medecin/workflow',
            rendez_vous: '/rendez-vous',
            centres: '/centres',
            statistiques: '/statistiques',
            notifications: '/notifications',
            fiches_medicales: '/fiches-medicales',
            consultations: '/consultations',
            patient_infos_medicales: '/patient/infos-medicales',
            medicaments: '/medicaments',
            prescriptions: '/prescriptions',
            vaccinations: '/vaccinations',
            regions: '/regions',
            registration: '/registration',
            documents: '/documents',
            walk_in: '/personnel/walk-in',
            file_attente: '/personnel/file-attente',
            public: '/public'
        },
        documentation: 'Consultez le README.md pour plus d\'informations'
    });
});

// Routes de santé
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'API opérationnelle',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Montage des routes
// IMPORTANT: Les routes plus spécifiques doivent être montées AVANT les routes génériques
// pour éviter les conflits de routage (ex: /medecin/workflow avant /medecins)

// Middleware de débogage pour tracer le routage
router.use((req, res, next) => {
    console.log(`🔀 [Router] Traitement de: ${req.method} ${req.path}`);
    next();
});

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/patients', patientsRoutes);
router.use('/medecin-profile', medecinProfileRoutes);

// Route spécifique AVANT les routes génériques
// IMPORTANT: Cette route DOIT être montée AVANT /medecins pour éviter les conflits
console.log('✅ Montage route /medecin/workflow');
router.use('/medecin/workflow', medecinWorkflowRoutes);

router.use('/medecins', medecinsRoutes);
router.use('/rendez-vous', rendezVousRoutes);
router.use('/centres', centresRoutes);
router.use('/statistiques', statistiquesRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/fiches-medicales', fichesMedicalesRoutes); // Fiches médicales complètes (consultations avec médecin)
router.use('/patient/infos-medicales', patientInfosMedicalesRoutes); // Infos médicales de BASE du patient (groupe sanguin, allergies, etc.)
router.use('/consultations', consultationsRoutes); // Fiches de CONSULTATION (médecin) - alias
router.use('/medicaments', medicamentsRoutes);
router.use('/prescriptions', prescriptionsRoutes);
router.use('/vaccinations', vaccinationsRoutes);
router.use('/regions', regionsRoutes);
router.use('/public', publicRoutes);
router.use('/registration', registrationRoutes);
router.use('/documents', documentsRoutes);
router.use('/personnel/walk-in', walkInRoutes);
router.use('/personnel/file-attente', fileAttenteRoutes);

// Route 404 pour les endpoints non trouvés
router.use('*', (req, res) => {
    console.log(`❌ 404 - Route non trouvée: ${req.method} ${req.originalUrl}`);
    console.log(`   Path: ${req.path}, Base URL: ${req.baseUrl}`);
    res.status(404).json({
        success: false,
        message: 'Endpoint non trouvé',
        requestedUrl: req.originalUrl,
        availableEndpoints: [
            'GET /',
            'GET /health',
            'POST /auth/login',
            'POST /auth/register',
            'GET /auth/me',
            'GET /users',
            'GET /patients',
            'GET /medecins',
            'GET /rendez-vous',
            'GET /centres',
            'GET /statistiques/centre',
            'GET /statistiques/region',
            'GET /notifications',
            'GET /fiches-medicales',
            'GET /consultations',
            'GET /patient/infos-medicales',
            'GET /medicaments',
            'GET /prescriptions',
            'GET /vaccinations',
            'GET /regions',
            'GET /public/centres',
            'POST /documents/upload',
            'GET /documents',
            'GET /documents/patient/:patient_id',
            'GET /documents/fiche/:fiche_id',
            'GET /medecin/workflow/planning-du-jour',
            'GET /personnel/walk-in',
            'GET /personnel/file-attente'
        ]
    });
});

module.exports = router;
