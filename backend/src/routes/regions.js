const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const { executeQuery } = require('../config/database');

// Récupérer toutes les régions (PUBLIC - accessible sans authentification)
// Nécessaire pour permettre aux patients de voir les régions avant de se connecter
router.get('/', async (req, res) => {
    try {
        console.log('🌍 GET /regions - Utilisateur:', req.user);
        const query = 'SELECT id_region, nom, code_region FROM regions ORDER BY nom';
        const regions = await executeQuery(query);
        console.log(`✅ ${regions.length} régions récupérées`);
        res.json({ success: true, data: regions });
    } catch (error) {
        console.error('❌ Erreur régions:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la récupération des régions', 
            error: error.message 
        });
    }
});

// Récupérer les centres d'une région spécifique (PUBLIC - accessible sans authentification)
// Nécessaire pour permettre aux patients de voir les centres avant de se connecter
router.get('/:region_id/centres', async (req, res) => {
    try {
        console.log(`🏥 GET /regions/${req.params.region_id}/centres - Utilisateur:`, req.user);
        const { region_id } = req.params;
        const query = `
            SELECT 
                id_centre, 
                nom, 
                adresse, 
                telephone, 
                email, 
                statut,
                region_id
            FROM centres_sante 
            WHERE region_id = ? AND statut = 'actif'
            ORDER BY nom
        `;
        const centres = await executeQuery(query, [region_id]);
        console.log(`✅ ${centres.length} centres récupérés pour région ${region_id}`);
        res.json({ success: true, data: centres });
    } catch (error) {
        console.error('❌ Erreur centres par région:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la récupération des centres', 
            error: error.message 
        });
    }
});

module.exports = router;
