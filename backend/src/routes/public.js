const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');

// Récupérer toutes les régions (public)
router.get('/regions', async (req, res) => {
    try {
        const query = 'SELECT id_region, nom as nom_region FROM regions ORDER BY nom';
        const regions = await executeQuery(query);
        res.json({ success: true, data: regions });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la récupération des régions', 
            error: error.message 
        });
    }
});

// Récupérer tous les centres (public)
router.get('/centres', async (req, res) => {
    try {
        const query = `
            SELECT DISTINCT cs.nom, MIN(cs.id_centre) as id_centre, cs.adresse, cs.telephone, cs.email, 
                   cs.statut, cs.region_id, r.nom as nom_region
            FROM centres_sante cs 
            JOIN regions r ON cs.region_id = r.id_region 
            WHERE cs.statut = 'actif'
            GROUP BY cs.nom, cs.adresse, cs.telephone, cs.email, cs.statut, cs.region_id, r.nom
            ORDER BY cs.nom
        `;
        const centres = await executeQuery(query);
        res.json({ success: true, data: centres });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la récupération des centres', 
            error: error.message 
        });
    }
});

// Récupérer tous les médecins (public)
router.get('/medecins', async (req, res) => {
    try {
        const query = `
            SELECT m.id_medecin, m.nom, m.prenom, m.specialite, m.numero_licence,
                   m.telephone, m.email, m.centre_id, cs.nom as centre_nom
            FROM medecins m 
            JOIN centres_sante cs ON m.centre_id = cs.id_centre 
            WHERE m.statut = 'actif'
            ORDER BY m.nom, m.prenom
        `;
        const medecins = await executeQuery(query);
        res.json({ success: true, data: medecins });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la récupération des médecins', 
            error: error.message 
        });
    }
});

// Récupérer tous les patients (public)
router.get('/patients', async (req, res) => {
    try {
        const query = `
            SELECT p.id_patient, p.nom, p.prenom, p.date_naissance, p.sexe,
                   p.telephone, p.email, cs.nom as centre_nom
            FROM patients p 
            JOIN centres_sante cs ON p.centre_id = cs.id_centre 
            ORDER BY p.nom, p.prenom
        `;
        const patients = await executeQuery(query);
        res.json({ success: true, data: patients });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la récupération des patients', 
            error: error.message 
        });
    }
});

// Créer un médecin (public - pour les tests)
router.post('/medecins', async (req, res) => {
    try {
        const Medecin = require('../models/Medecin');
        const required = ['nom', 'prenom', 'sexe', 'date_naissance', 'specialite', 'numero_licence', 'telephone', 'email', 'centre_id'];
        const missing = required.filter(f => !req.body[f]);
        if (missing.length) return res.status(400).json({ success: false, message: `Champs manquants: ${missing.join(', ')}` });
        const medecin = await Medecin.create(req.body);
        res.status(201).json({ success: true, data: medecin });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Erreur création médecin', error: e.message });
    }
});

// Récupérer toutes les fiches médicales (public)
router.get('/fiches-medicales', async (req, res) => {
    try {
        const FicheMedicale = require('../models/FicheMedicale');
        const { page = 1, limit = 50, patient_id, medecin_id, date_debut, date_fin } = req.query;
        const offset = (page - 1) * limit;
        const filters = { patient_id, medecin_id, date_debut, date_fin };
        const fiches = await FicheMedicale.findAll(parseInt(limit), offset, filters);
        const total = await FicheMedicale.count(filters);
        res.json({ 
            success: true, 
            data: fiches, 
            pagination: { 
                page: parseInt(page), 
                limit: parseInt(limit), 
                total, 
                pages: Math.ceil(total / limit) 
            } 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la récupération des fiches médicales', 
            error: error.message 
        });
    }
});

// Récupérer une fiche médicale par ID (public)
router.get('/fiches-medicales/:id', async (req, res) => {
    try {
        const FicheMedicale = require('../models/FicheMedicale');
        const fiche = await FicheMedicale.findById(req.params.id);
        if (!fiche) return res.status(404).json({ success: false, message: 'Fiche médicale non trouvée' });
        res.json({ success: true, data: fiche });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la récupération de la fiche médicale', 
            error: error.message 
        });
    }
});

// Créer une fiche médicale (public - pour les tests)
router.post('/fiches-medicales', async (req, res) => {
    try {
        const FicheMedicale = require('../models/FicheMedicale');
        const required = ['patient_id', 'medecin_id', 'date_consultation', 'motif_consultation'];
        const missing = required.filter(f => !req.body[f]);
        if (missing.length) return res.status(400).json({ success: false, message: `Champs manquants: ${missing.join(', ')}` });
        const fiche = await FicheMedicale.create(req.body);
        res.status(201).json({ success: true, data: fiche });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Erreur création fiche médicale', error: e.message });
    }
});

// Récupérer tous les rendez-vous (public)
router.get('/rendez-vous', async (req, res) => {
    try {
        const RendezVous = require('../models/RendezVous');
        const { page = 1, limit = 50, patient_id, medecin_id, centre_id, date_debut, date_fin } = req.query;
        const offset = (page - 1) * limit;
        const filters = { patient_id, medecin_id, centre_id, date_debut, date_fin };
        const rdvs = await RendezVous.findAll(parseInt(limit), offset, filters);
        const total = await RendezVous.count(filters);
        res.json({ 
            success: true, 
            data: rdvs, 
            pagination: { 
                page: parseInt(page), 
                limit: parseInt(limit), 
                total, 
                pages: Math.ceil(total / limit) 
            } 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la récupération des rendez-vous', 
            error: error.message 
        });
    }
});

// Récupérer tous les médicaments (public)
router.get('/medicaments', async (req, res) => {
    try {
        const Medicament = require('../models/Medicament');
        const { page = 1, limit = 50, nom, categorie, statut } = req.query;
        const offset = (page - 1) * limit;
        const filters = { nom, categorie, statut };
        const medicaments = await Medicament.findAll(parseInt(limit), offset, filters);
        const total = await Medicament.count(filters);
        res.json({ 
            success: true, 
            data: medicaments, 
            pagination: { 
                page: parseInt(page), 
                limit: parseInt(limit), 
                total, 
                pages: Math.ceil(total / limit) 
            } 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la récupération des médicaments', 
            error: error.message 
        });
    }
});

// Récupérer toutes les prescriptions (public)
router.get('/prescriptions', async (req, res) => {
    try {
        const Prescription = require('../models/Prescription');
        const { page = 1, limit = 50, patient_id, medecin_id, date_debut, date_fin } = req.query;
        const offset = (page - 1) * limit;
        const filters = { patient_id, medecin_id, date_debut, date_fin };
        const prescriptions = await Prescription.findAll(parseInt(limit), offset, filters);
        const total = await Prescription.count(filters);
        res.json({ 
            success: true, 
            data: prescriptions, 
            pagination: { 
                page: parseInt(page), 
                limit: parseInt(limit), 
                total, 
                pages: Math.ceil(total / limit) 
            } 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la récupération des prescriptions', 
            error: error.message 
        });
    }
});

// Récupérer toutes les vaccinations (public)
router.get('/vaccinations', async (req, res) => {
    try {
        const Vaccination = require('../models/Vaccination');
        const { page = 1, limit = 50, patient_id, centre_id, date_debut, date_fin } = req.query;
        const offset = (page - 1) * limit;
        const filters = { patient_id, centre_id, date_debut, date_fin };
        const vaccinations = await Vaccination.findAll(parseInt(limit), offset, filters);
        const total = await Vaccination.count(filters);
        res.json({ 
            success: true, 
            data: vaccinations, 
            pagination: { 
                page: parseInt(page), 
                limit: parseInt(limit), 
                total, 
                pages: Math.ceil(total / limit) 
            } 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la récupération des vaccinations', 
            error: error.message 
        });
    }
});

// Récupérer toutes les notifications (public)
router.get('/notifications', async (req, res) => {
    try {
        const Notification = require('../models/Notification');
        const { page = 1, limit = 50, user_id, type, statut } = req.query;
        const offset = (page - 1) * limit;
        const filters = { user_id, type, statut };
        const notifications = await Notification.findAll(parseInt(limit), offset, filters);
        const total = await Notification.count(filters);
        res.json({ 
            success: true, 
            data: notifications, 
            pagination: { 
                page: parseInt(page), 
                limit: parseInt(limit), 
                total, 
                pages: Math.ceil(total / limit) 
            } 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la récupération des notifications', 
            error: error.message 
        });
    }
});

module.exports = router;
