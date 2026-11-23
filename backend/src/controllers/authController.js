const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET || 'secret_jwt_plateforme_sante_2024_dev', {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });
};

class AuthController {
    static async register(req, res) {
        try {
            const { 
                nom_utilisateur, 
                email, 
                mot_de_passe, 
                role = 'patient',
                // Champs optionnels pour médecin
                nom,
                prenom,
                sexe,
                date_naissance,
                specialite,
                numero_licence,
                telephone,
                centre_id
            } = req.body;
            
            if (!nom_utilisateur || !mot_de_passe) {
                return res.status(400).json({ success: false, message: 'nom_utilisateur et mot_de_passe sont requis' });
            }
            
            const existing = await User.findByUsername(nom_utilisateur);
            if (existing) return res.status(409).json({ success: false, message: 'Nom d\'utilisateur déjà utilisé' });
            
            if (email) {
                const existingEmail = await User.findByEmail(email);
                if (existingEmail) return res.status(409).json({ success: false, message: 'Email déjà utilisé' });
            }
            
            // 🔗 Si c'est un médecin, valider les données avant de créer l'utilisateur
            if (role === 'medecin') {
                const { executeQuery } = require('../config/database');
                const Centre = require('../models/Centre');
                const DataIntegrityValidators = require('../validators/dataIntegrityValidators');
                
                // Vérifier que les champs obligatoires sont fournis
                if (!nom || !sexe || !date_naissance || !specialite || !numero_licence || !telephone || !centre_id) {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'Pour un médecin, les champs suivants sont requis: nom, sexe, date_naissance, specialite, numero_licence, telephone, centre_id. Note: Le prénom est optionnel.' 
                    });
                }
                
                // Vérifier que le centre existe et est actif
                const centre = await Centre.findById(centre_id);
                if (!centre) {
                    return res.status(404).json({
                        success: false,
                        message: 'Centre de santé non trouvé'
                    });
                }
                if (centre.statut !== 'actif') {
                    return res.status(400).json({
                        success: false,
                        message: 'Le centre de santé n\'est pas actif'
                    });
                }
                
                // Vérifier que l'email n'existe pas déjà dans medecins
                const existingMedecinByEmail = await executeQuery(
                    'SELECT id_medecin FROM medecins WHERE email = ?',
                    [email]
                );
                if (existingMedecinByEmail.length > 0) {
                    return res.status(409).json({
                        success: false,
                        message: 'Cet email est déjà utilisé par un autre médecin'
                    });
                }
                
                // Vérifier que le numéro de licence n'existe pas déjà
                const existingMedecinByLicence = await executeQuery(
                    'SELECT id_medecin FROM medecins WHERE numero_licence = ?',
                    [numero_licence]
                );
                if (existingMedecinByLicence.length > 0) {
                    return res.status(409).json({
                        success: false,
                        message: 'Ce numéro de licence est déjà utilisé'
                    });
                }
                
                // Validation d'intégrité des données
                const medecinData = {
                    nom,
                    prenom: prenom || '', // Prénom optionnel
                    sexe,
                    date_naissance,
                    specialite,
                    numero_licence,
                    telephone,
                    email,
                    centre_id
                };
                
                const integrityValidation = DataIntegrityValidators.validateMedecin(medecinData);
                if (!integrityValidation.valid) {
                    return res.status(400).json({
                        success: false,
                        message: integrityValidation.errors.join(' '),
                        errors: integrityValidation.errors
                    });
                }
            }
            
            // Créer l'utilisateur avec le centre_id si c'est un médecin
            const user = await User.create({ 
                nom_utilisateur, 
                email: email || null, 
                mot_de_passe, 
                role,
                id_centre: role === 'medecin' ? centre_id : null
            });
            
            // 🔗 Si c'est un médecin, créer automatiquement l'enregistrement dans la table medecins
            if (role === 'medecin') {
                const { executeQuery } = require('../config/database');
                
                try {
                    // Créer un enregistrement complet
                    await executeQuery(`
                        INSERT INTO medecins (
                            nom, prenom, sexe, date_naissance, specialite, 
                            numero_licence, telephone, email, centre_id, user_id, statut
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        nom,
                        prenom || '', // Prénom optionnel
                        sexe,
                        date_naissance,
                        specialite,
                        numero_licence,
                        telephone,
                        email,
                        centre_id,
                        user.id_user,
                        'actif'
                    ]);
                    
                    console.log(`✅ Enregistrement médecin créé automatiquement pour user_id=${user.id_user}`);
                } catch (medecinError) {
                    // Si la création du médecin échoue, supprimer réellement l'utilisateur créé (pas soft delete)
                    console.error('❌ Erreur création médecin, suppression de l\'utilisateur créé:', user.id_user);
                    try {
                        const { executeQuery } = require('../config/database');
                        await executeQuery('DELETE FROM utilisateurs WHERE id_user = ?', [user.id_user]);
                        console.log('✅ Utilisateur supprimé après échec de création du médecin');
                    } catch (deleteError) {
                        console.error('❌ Erreur lors de la suppression de l\'utilisateur:', deleteError);
                    }
                    throw medecinError;
                }
            }
            
            const token = signToken({ id: user.id_user, role: user.role, username: nom_utilisateur });
            res.status(201).json({ success: true, token, user });
        } catch (e) {
            console.error('❌ Erreur inscription:', e);
            res.status(500).json({ success: false, message: 'Erreur inscription', error: e.message });
        }
    }

    static async login(req, res) {
        try {
            const { nom_utilisateur, mot_de_passe } = req.body;
            if (!nom_utilisateur || !mot_de_passe) return res.status(400).json({ success: false, message: 'Identifiants requis' });
            
            // Récupérer l'utilisateur avec les informations du centre
            const user = await User.findByUsernameWithCentre(nom_utilisateur);
            if (!user) return res.status(401).json({ success: false, message: 'Identifiants invalides' });
            
            const ok = await User.comparePassword(mot_de_passe, user.mot_de_passe);
            if (!ok) return res.status(401).json({ success: false, message: 'Identifiants invalides' });
            
            const token = signToken({ 
                id: user.id_user, 
                role: user.role, 
                username: user.nom_utilisateur,
                id_centre: user.id_centre 
            });
            
            res.json({ 
                success: true, 
                token, 
                user: { 
                    id: user.id_user,  // ✅ Ajout de 'id' pour compatibilité frontend
                    id_user: user.id_user, 
                    nom_utilisateur: user.nom_utilisateur, 
                    role: user.role, 
                    email: user.email,
                    id_centre: user.id_centre,
                    centre_name: user.centre_name
                } 
            });
        } catch (e) {
            res.status(500).json({ success: false, message: 'Erreur connexion', error: e.message });
        }
    }

    static async me(req, res) {
        try {
            const user = await User.findById(req.user.id);
            if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
            res.json({ success: true, user: { id_user: user.id_user, nom_utilisateur: user.nom_utilisateur, role: user.role, email: user.email } });
        } catch (e) {
            res.status(500).json({ success: false, message: 'Erreur profil', error: e.message });
        }
    }

    static async listUsers(req, res) {
        try {
            const rows = await require('../config/database').executeQuery('SELECT id_user, nom_utilisateur, email, role, statut FROM utilisateurs ORDER BY id_user DESC');
            res.json({ success: true, data: rows });
        } catch (e) {
            res.status(500).json({ success: false, message: 'Erreur liste utilisateurs', error: e.message });
        }
    }

    static async updateUser(req, res) {
        try {
            const { id } = req.params;
            const { role, statut } = req.body;
            const allowed = [];
            const values = [];
            if (role) { allowed.push('role = ?'); values.push(role); }
            if (statut) { allowed.push('statut = ?'); values.push(statut); }
            if (allowed.length === 0) return res.status(400).json({ success: false, message: 'Aucun champ à mettre à jour' });
            values.push(id);
            const sql = `UPDATE utilisateurs SET ${allowed.join(', ')} WHERE id_user = ?`;
            const result = await require('../config/database').executeQuery(sql, values);
            if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
            const user = await User.findById(id);
            res.json({ success: true, data: { id_user: user.id_user, nom_utilisateur: user.nom_utilisateur, email: user.email, role: user.role, statut: user.statut } });
        } catch (e) {
            res.status(500).json({ success: false, message: 'Erreur mise à jour utilisateur', error: e.message });
        }
    }
}

module.exports = AuthController;
