/**
 * Contrôleur pour la gestion du profil médecin
 * Permet à un médecin de consulter et mettre à jour ses propres informations
 */

class MedecinProfileController {
    /**
     * Récupérer le profil complet du médecin connecté
     */
    static async getMyProfile(req, res) {
        try {
            const { executeQuery } = require('../config/database');
            const userId = req.user.id; // Depuis le JWT
            
            console.log(`🔍 Récupération profil médecin pour user_id=${userId}`);
            
            // Récupérer les infos utilisateur + médecin
            const query = `
                SELECT 
                    u.id_user,
                    u.nom_utilisateur,
                    u.email as user_email,
                    u.role,
                    m.id_medecin,
                    m.nom,
                    m.prenom,
                    m.sexe,
                    m.date_naissance,
                    m.specialite,
                    m.numero_licence,
                    m.telephone,
                    m.email as medecin_email,
                    m.centre_id,
                    m.statut,
                    cs.nom as centre_nom
                FROM utilisateurs u
                LEFT JOIN medecins m ON m.user_id = u.id_user
                LEFT JOIN centres_sante cs ON cs.id_centre = m.centre_id
                WHERE u.id_user = ?
            `;
            
            const [profile] = await executeQuery(query, [userId]);
            
            if (!profile) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Profil non trouvé' 
                });
            }
            
            // Si pas d'enregistrement médecin, le signaler
            if (!profile.id_medecin) {
                return res.status(404).json({
                    success: false,
                    message: 'Enregistrement médecin non trouvé. Contactez l\'administrateur.',
                    user: {
                        id_user: profile.id_user,
                        nom_utilisateur: profile.nom_utilisateur,
                        email: profile.user_email,
                        role: profile.role
                    }
                });
            }
            
            res.json({ success: true, data: profile });
        } catch (e) {
            console.error('❌ Erreur récupération profil médecin:', e);
            res.status(500).json({ 
                success: false, 
                message: 'Erreur récupération profil', 
                error: e.message 
            });
        }
    }
    
    /**
     * Mettre à jour le profil du médecin connecté
     */
    static async updateMyProfile(req, res) {
        try {
            const { executeQuery } = require('../config/database');
            const userId = req.user.id;
            const {
                nom,
                prenom,
                sexe,
                date_naissance,
                specialite,
                numero_licence,
                telephone,
                email
            } = req.body;
            
            console.log(`📝 Mise à jour profil médecin pour user_id=${userId}`);
            
            // Vérifier que le médecin existe
            const [medecin] = await executeQuery(
                'SELECT id_medecin FROM medecins WHERE user_id = ?',
                [userId]
            );
            
            if (!medecin) {
                return res.status(404).json({
                    success: false,
                    message: 'Enregistrement médecin non trouvé'
                });
            }
            
            // Construire la requête de mise à jour
            const updates = [];
            const values = [];
            
            if (nom) { updates.push('nom = ?'); values.push(nom); }
            if (prenom) { updates.push('prenom = ?'); values.push(prenom); }
            if (sexe) { updates.push('sexe = ?'); values.push(sexe); }
            if (date_naissance) { updates.push('date_naissance = ?'); values.push(date_naissance); }
            if (specialite) { updates.push('specialite = ?'); values.push(specialite); }
            if (numero_licence) { updates.push('numero_licence = ?'); values.push(numero_licence); }
            if (telephone) { updates.push('telephone = ?'); values.push(telephone); }
            if (email) { updates.push('email = ?'); values.push(email); }
            
            if (updates.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Aucun champ à mettre à jour'
                });
            }
            
            values.push(medecin.id_medecin);
            
            const query = `
                UPDATE medecins 
                SET ${updates.join(', ')} 
                WHERE id_medecin = ?
            `;
            
            await executeQuery(query, values);
            
            console.log(`✅ Profil médecin mis à jour pour user_id=${userId}`);
            
            // Retourner le profil mis à jour
            const [updated] = await executeQuery(
                'SELECT * FROM medecins WHERE id_medecin = ?',
                [medecin.id_medecin]
            );
            
            res.json({ 
                success: true, 
                message: 'Profil mis à jour avec succès',
                data: updated 
            });
        } catch (e) {
            console.error('❌ Erreur mise à jour profil médecin:', e);
            res.status(500).json({ 
                success: false, 
                message: 'Erreur mise à jour profil', 
                error: e.message 
            });
        }
    }
}

module.exports = MedecinProfileController;

