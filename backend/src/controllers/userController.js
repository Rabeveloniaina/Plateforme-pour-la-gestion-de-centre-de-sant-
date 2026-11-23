const User = require('../models/User');
const { asyncHandler, Errors } = require('../utils/asyncHandler');

class UserController {
    // Créer un nouvel utilisateur
    static create = asyncHandler(async (req, res) => {
            const userData = req.body;
            
            // Validation des données requises
            const requiredFields = ['nom_utilisateur', 'email', 'mot_de_passe'];
            const missingFields = requiredFields.filter(field => !userData[field]);
            
            if (missingFields.length > 0) {
            throw Errors.VALIDATION_ERROR(`Champs manquants: ${missingFields.join(', ')}`);
            }
            
            // Vérifier si le nom d'utilisateur existe déjà
            const usernameExists = await User.usernameExists(userData.nom_utilisateur);
            if (usernameExists) {
            throw Errors.ALREADY_EXISTS('Ce nom d\'utilisateur');
            }
            
            // Vérifier si l'email existe déjà
            const emailExists = await User.emailExists(userData.email);
            if (emailExists) {
            throw Errors.ALREADY_EXISTS('Cet email');
            }
            
            const user = await User.create(userData);
            
            // Ne pas retourner le mot de passe
            delete user.mot_de_passe;
            
            res.status(201).json({
                success: true,
                message: 'Utilisateur créé avec succès',
                data: user
            });
    });

    // Récupérer un utilisateur par ID
    static getById = asyncHandler(async (req, res) => {
            const { id } = req.params;
            const user = await User.findById(id);
            
            if (!user) {
            throw Errors.NOT_FOUND('Utilisateur');
            }
            
            // Ne pas retourner le mot de passe
            delete user.mot_de_passe;
            
            res.json({
                success: true,
                data: user
            });
    });

    // Récupérer tous les utilisateurs avec pagination
    static getAll = asyncHandler(async (req, res) => {
            const { 
                page = 1, 
                limit = 50, 
                role, 
                statut, 
                nom_utilisateur, 
                email 
            } = req.query;
            
            const offset = (page - 1) * limit;
            const filters = { role, statut, nom_utilisateur, email };
            
            const users = await User.findAll(parseInt(limit), offset, filters);
            const total = await User.count(filters);
            
            // Ne pas retourner les mots de passe
            const usersWithoutPasswords = users.map(user => {
                delete user.mot_de_passe;
                return user;
            });
            
            res.json({
                success: true,
                data: usersWithoutPasswords,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
    });

    // Mettre à jour un utilisateur
    static update = asyncHandler(async (req, res) => {
            const { id } = req.params;
            const updateData = req.body;
            
            // Vérifier que l'utilisateur existe
            const existingUser = await User.findById(id);
            if (!existingUser) {
            throw Errors.NOT_FOUND('Utilisateur');
            }
            
            // Vérifier si le nouveau nom d'utilisateur existe déjà (si modifié)
            if (updateData.nom_utilisateur && updateData.nom_utilisateur !== existingUser.nom_utilisateur) {
                const usernameExists = await User.usernameExists(updateData.nom_utilisateur, id);
                if (usernameExists) {
                throw Errors.ALREADY_EXISTS('Ce nom d\'utilisateur');
                }
            }
            
            // Vérifier si le nouvel email existe déjà (si modifié)
            if (updateData.email && updateData.email !== existingUser.email) {
                const emailExists = await User.emailExists(updateData.email, id);
                if (emailExists) {
                throw Errors.ALREADY_EXISTS('Cet email');
                }
            }
            
            const user = await User.update(id, updateData);
            
            // Ne pas retourner le mot de passe
            delete user.mot_de_passe;
            
            res.json({
                success: true,
                message: 'Utilisateur mis à jour avec succès',
                data: user
            });
    });

    // Supprimer un utilisateur (soft delete)
    static delete = asyncHandler(async (req, res) => {
            const { id } = req.params;
            
            // Vérifier que l'utilisateur existe
            const existingUser = await User.findById(id);
            if (!existingUser) {
            throw Errors.NOT_FOUND('Utilisateur');
            }
            
            const result = await User.delete(id);
            
            res.json({
                success: true,
                message: result.message
            });
    });

    // Rechercher des utilisateurs
    static search = asyncHandler(async (req, res) => {
            const { q, limit = 20 } = req.query;
            
            if (!q || q.trim().length < 2) {
            throw Errors.VALIDATION_ERROR('Le terme de recherche doit contenir au moins 2 caractères');
            }
            
            const users = await User.search(q.trim(), parseInt(limit));
            
            // Ne pas retourner les mots de passe
            const usersWithoutPasswords = users.map(user => {
                delete user.mot_de_passe;
                return user;
            });
            
            res.json({
                success: true,
                data: usersWithoutPasswords,
                searchTerm: q,
                total: usersWithoutPasswords.length
            });
    });

    // Récupérer les statistiques des utilisateurs
    static getStatistiques = asyncHandler(async (req, res) => {
            const stats = await User.getStatistiques();
            
            res.json({
                success: true,
                data: stats
            });
    });

    // Vérifier la disponibilité d'un nom d'utilisateur
    static checkUsername = asyncHandler(async (req, res) => {
            const { username } = req.params;
            const { exclude_id } = req.query;
            
            const exists = await User.usernameExists(username, exclude_id);
            
            res.json({
                success: true,
                data: {
                    username,
                    available: !exists
                }
            });
    });

    // Vérifier la disponibilité d'un email
    static checkEmail = asyncHandler(async (req, res) => {
            const { email } = req.params;
            const { exclude_id } = req.query;
            
            const exists = await User.emailExists(email, exclude_id);
            
            res.json({
                success: true,
                data: {
                    email,
                    available: !exists
                }
            });
    });

    // Changer le mot de passe
    static changePassword = asyncHandler(async (req, res) => {
            const { id } = req.params;
            const { current_password, new_password } = req.body;
            
            if (!current_password || !new_password) {
            throw Errors.VALIDATION_ERROR('Mot de passe actuel et nouveau mot de passe requis');
            }
            
            // Récupérer l'utilisateur avec le mot de passe
            const user = await User.findById(id);
            if (!user) {
            throw Errors.NOT_FOUND('Utilisateur');
            }
            
            // Vérifier le mot de passe actuel
            const isCurrentPasswordValid = await User.comparePassword(current_password, user.mot_de_passe);
            if (!isCurrentPasswordValid) {
            throw Errors.UNAUTHORIZED('Mot de passe actuel incorrect');
            }
            
            // Mettre à jour le mot de passe
        await User.update(id, { mot_de_passe: new_password });
            
            res.json({
                success: true,
                message: 'Mot de passe modifié avec succès'
            });
    });

    // Réinitialiser le mot de passe (pour les administrateurs)
    static resetPassword = asyncHandler(async (req, res) => {
            const { id } = req.params;
            const { new_password } = req.body;
            
            if (!new_password) {
            throw Errors.VALIDATION_ERROR('Nouveau mot de passe requis');
            }
            
            // Vérifier que l'utilisateur existe
            const existingUser = await User.findById(id);
            if (!existingUser) {
            throw Errors.NOT_FOUND('Utilisateur');
            }
            
            // Mettre à jour le mot de passe
            await User.update(id, { mot_de_passe: new_password });
            
            res.json({
                success: true,
                message: 'Mot de passe réinitialisé avec succès'
            });
    });
}

module.exports = UserController;
