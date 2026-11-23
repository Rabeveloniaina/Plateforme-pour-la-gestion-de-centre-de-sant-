const Centre = require('../models/Centre');
const User = require('../models/User');

class CentreController {
    static async create(req, res) {
        try {
            const required = ['nom', 'adresse', 'region_id', 'telephone', 'email', 'mot_de_passe_admin'];
            const missing = required.filter(f => !req.body[f]);
            if (missing.length) return res.status(400).json({ success: false, message: `Champs manquants: ${missing.join(', ')}` });

            const { mot_de_passe_admin, email } = req.body;

            const emailExists = await User.emailExists(email);
            if (emailExists) {
                return res.status(409).json({ success: false, message: 'Un utilisateur avec cet email existe déjà' });
            }

            const { mot_de_passe_admin: _, ...centrePayload } = req.body;
            const centre = await Centre.create(centrePayload);

            const nomUtilisateur = email;
            const adminUser = await User.create({
                nom_utilisateur: nomUtilisateur,
                email,
                mot_de_passe: mot_de_passe_admin,
                role: 'admin_centre',
                statut: 'actif',
                id_centre: centre.id_centre
            });

            res.status(201).json({
                success: true,
                data: {
                    centre,
                    admin_user: {
                        id_user: adminUser.id_user,
                        nom_utilisateur: adminUser.nom_utilisateur
                    }
                }
            });
        } catch (e) {
            res.status(500).json({ success: false, message: 'Erreur création centre', error: e.message });
        }
    }

    static async getById(req, res) {
        try {
            const item = await Centre.findById(req.params.id);
            if (!item) return res.status(404).json({ success: false, message: 'Centre non trouvé' });
            res.json({ success: true, data: item });
        } catch (e) { res.status(500).json({ success: false, message: 'Erreur récupération centre', error: e.message }); }
    }

    static async getAll(req, res) {
        try {
            const { page = 1, limit = 50, region_id, regionId, statut, nom, q } = req.query;
            const offset = (page - 1) * limit;
            const filters = { 
                region_id: region_id || regionId || undefined,
                statut,
                nom: nom || q || undefined
            };
            const data = await Centre.findAll(parseInt(limit), offset, filters);
            const total = await Centre.count(filters);
            res.json({ success: true, data, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } });
        } catch (e) { res.status(500).json({ success: false, message: 'Erreur récupération centres', error: e.message }); }
    }

    static async update(req, res) {
        try {
            const item = await Centre.update(req.params.id, req.body);
            res.json({ success: true, data: item });
        } catch (e) { res.status(500).json({ success: false, message: 'Erreur mise à jour centre', error: e.message }); }
    }

    static async delete(req, res) {
        try {
            const result = await Centre.remove(req.params.id);
            res.json({ success: true, message: result.message });
        } catch (e) { res.status(500).json({ success: false, message: 'Erreur suppression centre', error: e.message }); }
    }
}

module.exports = CentreController;
