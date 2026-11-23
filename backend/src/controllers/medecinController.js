const Medecin = require('../models/Medecin');
const DataIntegrityValidators = require('../validators/dataIntegrityValidators');
const Centre = require('../models/Centre');
const { executeQuery } = require('../config/database');

class MedecinController {
    static async create(req, res) {
        try {
            const user = req.user;
            const medecinData = req.body;
            
            // Sécurité : Assigner automatiquement le centre de l'utilisateur (sauf ministère)
            if (user.role !== 'ministere') {
                medecinData.centre_id = user.id_centre;
                console.log(`✅ Médecin auto-assigné au centre ${user.id_centre} de l'admin`);
            } else if (!medecinData.centre_id) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Centre ID requis pour le ministère' 
                });
            }
            
            // Validation des champs requis (prénom est optionnel pour les malgaches)
            const required = ['nom', 'sexe', 'date_naissance', 'specialite', 'numero_licence', 'telephone', 'email'];
            const missing = required.filter(f => !medecinData[f]);
            if (missing.length) return res.status(400).json({ 
                success: false, 
                message: `Champs manquants: ${missing.join(', ')}. Note: Le prénom est optionnel.` 
            });

            // Vérifier que le centre existe et est actif
            const centre = await Centre.findById(medecinData.centre_id);
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
                [medecinData.email]
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
                [medecinData.numero_licence]
            );
            if (existingMedecinByLicence.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'Ce numéro de licence est déjà utilisé'
                });
            }

            // Validation d'intégrité des données
            const integrityValidation = DataIntegrityValidators.validateMedecin(medecinData);
            if (!integrityValidation.valid) {
                return res.status(400).json({
                    success: false,
                    message: integrityValidation.errors.join(' '),
                    errors: integrityValidation.errors
                });
            }
            
            // Vérifier si user_id est fourni
            const User = require('../models/User');
            let user_id_was_provided = !!medecinData.user_id;
            let user_created_by_us = false;
            
            if (medecinData.user_id) {
                // Vérifier que l'utilisateur existe
                const user = await User.findById(medecinData.user_id);
                if (!user) {
                    return res.status(404).json({
                        success: false,
                        message: 'Utilisateur non trouvé'
                    });
                }
                // Vérifier que l'utilisateur a le rôle medecin
                if (user.role !== 'medecin') {
                    return res.status(400).json({
                        success: false,
                        message: 'L\'utilisateur doit avoir le rôle "medecin"'
                    });
                }
                // Vérifier que l'utilisateur n'a pas déjà un médecin associé
                const existingMedecinByUserId = await executeQuery(
                    'SELECT id_medecin FROM medecins WHERE user_id = ?',
                    [medecinData.user_id]
                );
                if (existingMedecinByUserId.length > 0) {
                    return res.status(409).json({
                        success: false,
                        message: 'Cet utilisateur a déjà un médecin associé'
                    });
                }
                // Synchroniser le centre_id
                if (user.id_centre !== medecinData.centre_id) {
                    // Mettre à jour le centre_id de l'utilisateur
                    await User.update(medecinData.user_id, { id_centre: medecinData.centre_id });
                    console.log(`✅ Centre_id synchronisé pour l'utilisateur ${medecinData.user_id}`);
                }
                // Synchroniser l'email
                if (user.email !== medecinData.email) {
                    // Vérifier que le nouvel email n'est pas utilisé par un autre utilisateur
                    if (await User.emailExists(medecinData.email, medecinData.user_id)) {
                        return res.status(409).json({
                            success: false,
                            message: 'Cet email est déjà utilisé par un autre utilisateur'
                        });
                    }
                    await User.update(medecinData.user_id, { email: medecinData.email });
                    console.log(`✅ Email synchronisé pour l'utilisateur ${medecinData.user_id}`);
                }
            } else {
                // Créer automatiquement un compte utilisateur si absent
                // Vérifier si l'email existe déjà dans utilisateurs
                if (await User.emailExists(medecinData.email)) {
                    return res.status(409).json({
                        success: false,
                        message: 'Cet email est déjà utilisé par un autre utilisateur'
                    });
                }
                
                // Utiliser l'email comme nom d'utilisateur pour permettre la connexion avec l'email
                // Vérifier l'unicité et générer une variante si nécessaire
                let nom_utilisateur = medecinData.email;
                let counter = 1;
                while (await User.usernameExists(nom_utilisateur)) {
                    // Si l'email existe déjà comme nom d'utilisateur, générer une variante
                    const emailParts = medecinData.email.split('@');
                    nom_utilisateur = `${emailParts[0]}${counter}@${emailParts[1]}`;
                    counter++;
                    // Sécurité : éviter une boucle infinie
                    if (counter > 1000) {
                        nom_utilisateur = `med${Date.now()}@${emailParts[1]}`;
                        break;
                    }
                }
                
                const email = medecinData.email;
                // Utiliser le numéro de licence comme mot de passe de base
                const mot_de_passe = medecinData.numero_licence || process.env.DEFAULT_USER_PASSWORD || 'admin123';
                const role = 'medecin';
                
                // Créer l'utilisateur avec User.create (qui ne gère pas les transactions)
                // On créera le médecin après, et si ça échoue, on supprimera l'utilisateur
                const createdUser = await User.create({ 
                    nom_utilisateur, 
                    email, 
                    mot_de_passe, 
                    role, 
                    id_centre: medecinData.centre_id, 
                    statut: 'actif' 
                });
                medecinData.user_id = createdUser.id_user;
                user_created_by_us = true;
                console.log(`✅ Compte utilisateur créé pour le médecin: ${nom_utilisateur} (ID: ${createdUser.id_user})`);
            }

            console.log('📤 Données médecin avant création:', medecinData);
            
            // S'assurer que prenom est une chaîne vide plutôt que null/undefined
            medecinData.prenom = medecinData.prenom || '';
            
            try {
                const medecin = await Medecin.create(medecinData);
                console.log('✅ Médecin créé avec succès:', medecin);
                
                res.status(201).json({ 
                    success: true, 
                    data: medecin,
                    message: 'Médecin créé avec succès'
                });
            } catch (medecinError) {
                // Si la création du médecin échoue et qu'on a créé un utilisateur, le supprimer réellement
                if (user_created_by_us && medecinData.user_id) {
                    console.error('❌ Erreur création médecin, suppression de l\'utilisateur créé:', medecinData.user_id);
                    try {
                        // Supprimer réellement l'utilisateur (pas soft delete) car il n'a pas encore de médecin associé
                        await executeQuery('DELETE FROM utilisateurs WHERE id_user = ?', [medecinData.user_id]);
                        console.log('✅ Utilisateur supprimé après échec de création du médecin');
                    } catch (deleteError) {
                        console.error('❌ Erreur lors de la suppression de l\'utilisateur:', deleteError);
                    }
                }
                throw medecinError;
            }
        } catch (e) {
            console.error('❌ Erreur création médecin:', e);
            console.error('❌ Stack:', e.stack);
            
            // Gérer les erreurs spécifiques
            if (e.message && e.message.includes('Duplicate entry')) {
                return res.status(409).json({ 
                    success: false, 
                    message: 'Un médecin avec ces informations existe déjà',
                    error: e.message 
                });
            }
            
            // Retourner le message d'erreur détaillé pour débogage
            const errorMessage = e.message || 'Erreur inconnue lors de la création du médecin';
            console.error('❌ Message d\'erreur complet:', errorMessage);
            
            res.status(500).json({ 
                success: false, 
                message: errorMessage,
                error: e.message,
                stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
            });
        }
    }

    static async getById(req, res) {
        try {
            const user = req.user;
            const item = await Medecin.findById(req.params.id);
            if (!item) return res.status(404).json({ success: false, message: 'Médecin non trouvé' });
            
            // Sécurité : admin_centre ne peut voir que les médecins de son centre
            if (user.role === 'admin_centre' && item.centre_id !== user.id_centre) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Vous ne pouvez accéder qu\'aux médecins de votre centre' 
                });
            }
            
            res.json({ success: true, data: item });
        } catch (e) {
            console.error('❌ Erreur récupération médecin:', e);
            res.status(500).json({ success: false, message: 'Erreur récupération médecin', error: e.message });
        }
    }

    static async getAll(req, res) {
        try {
            const user = req.user;
            const { page = 1, limit = 50, centre_id, specialite, statut, nom } = req.query;
            const offset = (page - 1) * limit;
            
            // Sécurité : personnel et admin_centre ne peuvent voir que les médecins de leur centre
            const filters = { specialite, statut, nom };
            if (user.role === 'admin_centre' || user.role === 'personnel') {
                filters.centre_id = user.id_centre;
            } else if (user.role === 'ministere') {
                filters.centre_id = centre_id; // Ministère peut voir tous les centres
            } else if (centre_id) {
                filters.centre_id = centre_id;
            }
            
            const items = await Medecin.findAll(parseInt(limit), offset, filters);
            const total = await Medecin.count(filters);
            res.json({ success: true, data: items, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } });
        } catch (e) {
            console.error('❌ Erreur récupération médecins:', e);
            res.status(500).json({ success: false, message: 'Erreur récupération médecins', error: e.message });
        }
    }

    static async update(req, res) {
        try {
            const medecinId = req.params.id;
            const updateData = req.body;
            const user = req.user;
            
            // Récupérer le médecin existant
            const exists = await Medecin.findById(medecinId);
            if (!exists) return res.status(404).json({ success: false, message: 'Médecin non trouvé' });
            
            // Sécurité : admin_centre ne peut modifier que les médecins de son centre
            if (user.role === 'admin_centre' && exists.centre_id !== user.id_centre) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Vous ne pouvez modifier que les médecins de votre centre' 
                });
            }
            
            // Si le centre est modifié et que l'utilisateur n'est pas ministère, forcer le centre de l'utilisateur
            if (user.role !== 'ministere') {
                updateData.centre_id = user.id_centre;
            }

            // Validation d'intégrité des données si date_naissance ou date_embauche sont modifiées
            if (updateData.date_naissance || updateData.date_embauche) {
                // Récupérer la date de naissance actuelle si elle n'est pas modifiée
                const dateNaissance = updateData.date_naissance || exists.date_naissance;
                const dateEmbauche = updateData.date_embauche || exists.date_embauche;
                
                const validationData = {
                    date_naissance: dateNaissance,
                    date_embauche: dateEmbauche
                };
                
                const integrityValidation = DataIntegrityValidators.validateMedecin(validationData);
                if (!integrityValidation.valid) {
                    return res.status(400).json({
                        success: false,
                        message: integrityValidation.errors.join(' '),
                        errors: integrityValidation.errors
                    });
                }
            }
            
            // Mettre à jour le compte utilisateur si le numéro de licence ou l'email change
            if (exists.user_id && (updateData.numero_licence || updateData.email)) {
                const User = require('../models/User');
                const userUpdateData = {};
                
                // Si le numéro de licence change, mettre à jour le mot de passe
                if (updateData.numero_licence && updateData.numero_licence !== exists.numero_licence) {
                    userUpdateData.mot_de_passe = updateData.numero_licence;
                    console.log(`🔑 Mise à jour du mot de passe avec le nouveau numéro de licence pour user_id ${exists.user_id}`);
                }
                
                // Si l'email change, mettre à jour l'email
                if (updateData.email && updateData.email !== exists.email) {
                    // Vérifier que le nouvel email n'est pas déjà utilisé
                    if (await User.emailExists(updateData.email, exists.user_id)) {
                        return res.status(409).json({
                            success: false,
                            message: 'Cet email est déjà utilisé par un autre utilisateur'
                        });
                    }
                    userUpdateData.email = updateData.email;
                }
                
                // Mettre à jour le compte utilisateur si nécessaire
                if (Object.keys(userUpdateData).length > 0) {
                    await User.update(exists.user_id, userUpdateData);
                    console.log(`✅ Compte utilisateur ${exists.user_id} mis à jour`);
                }
            }
            
            // Mettre à jour le médecin
            const item = await Medecin.update(medecinId, updateData);
            res.json({ success: true, data: item, message: 'Médecin mis à jour avec succès' });
        } catch (e) {
            console.error('❌ Erreur mise à jour médecin:', e);
            res.status(500).json({ success: false, message: 'Erreur mise à jour médecin', error: e.message });
        }
    }

    static async delete(req, res) {
        try {
            const medecinId = req.params.id;
            const user = req.user;
            
            // Récupérer le médecin existant
            const exists = await Medecin.findById(medecinId);
            if (!exists) return res.status(404).json({ success: false, message: 'Médecin non trouvé' });
            
            // Sécurité : admin_centre ne peut supprimer que les médecins de son centre
            if (user.role === 'admin_centre' && exists.centre_id !== user.id_centre) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Vous ne pouvez supprimer que les médecins de votre centre' 
                });
            }
            
            // Soft delete du médecin (statut = 'inactif')
            const result = await Medecin.delete(medecinId);
            
            // Désactiver aussi le compte utilisateur associé
            if (exists.user_id) {
                const User = require('../models/User');
                await User.update(exists.user_id, { statut: 'inactif' });
                console.log(`✅ Compte utilisateur ${exists.user_id} désactivé`);
            }
            
            res.json({ success: true, message: result.message });
        } catch (e) {
            console.error('❌ Erreur suppression médecin:', e);
            res.status(500).json({ success: false, message: 'Erreur suppression médecin', error: e.message });
        }
    }

    static async bySpecialite(req, res) {
        try {
            const data = await Medecin.findBySpecialite(req.params.specialite);
            res.json({ success: true, data });
        } catch (e) {
            res.status(500).json({ success: false, message: 'Erreur par spécialité', error: e.message });
        }
    }

    static async byCentre(req, res) {
        try {
            console.log(`👨‍⚕️ GET /medecins/centre/${req.params.centre_id} - Utilisateur:`, req.user);
            // Filtrer seulement les médecins disponibles pour la prise de rendez-vous
            const disponibleOnly = req.query.disponible === 'true';
            const dateRdv = req.query.date_rdv || null;
            const heureRdv = req.query.heure_rdv || null;
            
            const excludeRdvId = req.query.exclude_rdv_id ? parseInt(req.query.exclude_rdv_id) : null;
            
            console.log(`📅 Filtrage avec date_rdv=${dateRdv}, heure_rdv=${heureRdv}, disponibleOnly=${disponibleOnly}, excludeRdvId=${excludeRdvId}`);
            
            const data = await Medecin.findByCentre(req.params.centre_id, disponibleOnly, dateRdv, heureRdv, excludeRdvId);
            
            // Log détaillé des statuts
            console.log(`✅ ${data.length} médecins récupérés pour centre ${req.params.centre_id}${disponibleOnly ? ' (disponibles uniquement)' : ''}${dateRdv ? ` pour ${dateRdv} à ${heureRdv}` : ''}`);
            if (data.length > 0) {
                console.log('📋 Statuts des médecins retournés:');
                data.forEach(m => {
                    console.log(`  - Dr. ${m.prenom} ${m.nom}: statut_operationnel="${m.statut_operationnel || 'NULL'}", statut="${m.statut}"`);
                });
            }
            
            res.json({ success: true, data });
        } catch (e) {
            console.error('❌ Erreur médecins par centre:', e);
            res.status(500).json({ success: false, message: 'Erreur par centre', error: e.message });
        }
    }

    static async stats(req, res) {
        try {
            const data = await Medecin.getStatsBySpecialite();
            res.json({ success: true, data });
        } catch (e) {
            res.status(500).json({ success: false, message: 'Erreur stats', error: e.message });
        }
    }

    static async disponibilites(req, res) {
        try {
            const data = await Medecin.getDisponibilites(req.params.id);
            res.json({ success: true, data });
        } catch (e) {
            res.status(500).json({ success: false, message: 'Erreur disponibilités', error: e.message });
        }
    }

    static async updateDisponibilites(req, res) {
        try {
            const result = await Medecin.updateDisponibilites(req.params.id, req.body);
            res.json({ success: true, message: result.message });
        } catch (e) {
            res.status(500).json({ success: false, message: 'Erreur MAJ disponibilités', error: e.message });
        }
    }

    // Récupérer les horaires d'un médecin
    static async getHoraires(req, res) {
        try {
            const userId = req.params.id; // C'est l'id_user depuis le JWT
            
            // Récupérer d'abord l'id_medecin depuis user_id
            const { executeQuery } = require('../config/database');
            const medecinLink = await executeQuery(`
                SELECT id_medecin FROM medecins WHERE user_id = ?
            `, [userId]);
            
            if (medecinLink.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Médecin non trouvé pour cet utilisateur' 
                });
            }
            
            const medecinId = medecinLink[0].id_medecin;
            const horaires = await Medecin.getHoraires(medecinId);
            
            // Récupérer aussi l'état de la gestion dynamique
            const medecin = await Medecin.findById(medecinId);
            const gestionDynamique = medecin?.gestion_dynamique_statut !== false; // Par défaut true
            
            const response = { 
                success: true, 
                data: horaires
            };
            
            // Ajouter gestion_dynamique à la racine de la réponse
            if (gestionDynamique !== undefined) {
                response.gestion_dynamique = gestionDynamique;
            }
            
            res.json(response);
        } catch (e) {
            console.error('❌ Erreur récupération horaires:', e);
            res.status(500).json({ success: false, message: 'Erreur récupération horaires', error: e.message });
        }
    }

    // Mettre à jour les horaires d'un médecin
    static async updateHoraires(req, res) {
        try {
            const userId = req.params.id; // C'est l'id_user depuis le JWT
            const horaires = req.body;
            
            // Récupérer d'abord l'id_medecin depuis user_id
            const { executeQuery } = require('../config/database');
            const medecinLink = await executeQuery(`
                SELECT id_medecin FROM medecins WHERE user_id = ?
            `, [userId]);
            
            if (medecinLink.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Médecin non trouvé pour cet utilisateur' 
                });
            }
            
            const medecinId = medecinLink[0].id_medecin;
            
            // Vérifier que l'utilisateur peut modifier ses horaires
            const user = req.user;
            if (user.role !== 'medecin' && user.id !== userId) {
                if (user.role !== 'admin_centre' && user.role !== 'ministere') {
                    return res.status(403).json({
                        success: false,
                        message: 'Vous n\'avez pas la permission de modifier ces horaires'
                    });
                }
            }
            
            const result = await Medecin.updateHoraires(medecinId, horaires);
            
            // Mettre à jour immédiatement le statut si la gestion dynamique est activée
            const StatutDynamiqueService = require('../services/statutDynamiqueService');
            const updateResult = await StatutDynamiqueService.mettreAJourStatut(medecinId);
            if (updateResult) {
                console.log(`✅ Statut mis à jour après modification des horaires: ${updateResult.statut}`);
            }
            
            res.json({ 
                success: true, 
                message: result.message,
                statut_mis_a_jour: updateResult?.statut || null
            });
        } catch (e) {
            console.error('❌ Erreur mise à jour horaires:', e);
            res.status(500).json({ success: false, message: 'Erreur mise à jour horaires', error: e.message });
        }
    }

    // Activer/désactiver la gestion dynamique
    static async setGestionDynamique(req, res) {
        try {
            const userId = req.params.id; // C'est l'id_user depuis le JWT
            const { active } = req.body;
            
            // Récupérer d'abord l'id_medecin depuis user_id
            const { executeQuery } = require('../config/database');
            const medecinLink = await executeQuery(`
                SELECT id_medecin FROM medecins WHERE user_id = ?
            `, [userId]);
            
            if (medecinLink.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Médecin non trouvé pour cet utilisateur' 
                });
            }
            
            const medecinId = medecinLink[0].id_medecin;
            const result = await Medecin.setGestionDynamique(medecinId, active);
            
            res.json({ success: true, message: result.message });
        } catch (e) {
            console.error('❌ Erreur gestion dynamique:', e);
            res.status(500).json({ success: false, message: 'Erreur gestion dynamique', error: e.message });
        }
    }

    // Forcer la mise à jour du statut maintenant (pour tests)
    static async updateStatutNow(req, res) {
        try {
            const userId = req.params.id; // C'est l'id_user depuis le JWT
            
            // Récupérer d'abord l'id_medecin depuis user_id
            const { executeQuery } = require('../config/database');
            const medecinLink = await executeQuery(`
                SELECT id_medecin FROM medecins WHERE user_id = ?
            `, [userId]);
            
            if (medecinLink.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Médecin non trouvé pour cet utilisateur' 
                });
            }
            
            const medecinId = medecinLink[0].id_medecin;
            
            const StatutDynamiqueService = require('../services/statutDynamiqueService');
            const result = await StatutDynamiqueService.mettreAJourStatut(medecinId);
            
            if (result) {
                res.json({ 
                    success: true, 
                    message: 'Statut mis à jour avec succès',
                    data: result
                });
            } else {
                res.json({ 
                    success: true, 
                    message: 'Statut inchangé (déjà à jour)',
                    data: null
                });
            }
        } catch (e) {
            console.error('❌ Erreur mise à jour statut:', e);
            res.status(500).json({ success: false, message: 'Erreur mise à jour statut', error: e.message });
        }
    }

    // Mettre à jour le statut opérationnel d'un médecin
    static async updateStatutOperationnel(req, res) {
        try {
            const userId = req.params.id; // C'est l'id_user depuis le JWT
            const { statut_operationnel } = req.body;
            
            if (!statut_operationnel) {
                return res.status(400).json({
                    success: false,
                    message: 'Statut opérationnel requis'
                });
            }
            
            // Récupérer d'abord l'id_medecin depuis user_id
            const { executeQuery } = require('../config/database');
            const medecinLink = await executeQuery(`
                SELECT id_medecin FROM medecins WHERE user_id = ?
            `, [userId]);
            
            if (medecinLink.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Médecin non trouvé pour cet utilisateur' 
                });
            }
            
            const medecinId = medecinLink[0].id_medecin;
            
            // Vérifier que l'utilisateur peut modifier son propre statut
            const user = req.user;
            if (user.role !== 'medecin' && user.id !== userId) {
                // Seul un médecin peut modifier son propre statut, ou un admin peut modifier n'importe quel médecin
                if (user.role !== 'admin_centre' && user.role !== 'ministere') {
                    return res.status(403).json({
                        success: false,
                        message: 'Vous n\'avez pas la permission de modifier ce statut'
                    });
                }
            }
            
            const updatedMedecin = await Medecin.updateStatutOperationnel(medecinId, statut_operationnel);
            
            res.json({
                success: true,
                data: updatedMedecin,
                message: 'Statut opérationnel mis à jour avec succès'
            });
        } catch (e) {
            console.error('❌ Erreur mise à jour statut opérationnel:', e);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la mise à jour du statut opérationnel',
                error: e.message
            });
        }
    }
    
    // Récupérer le statut opérationnel d'un médecin
    static async getStatutOperationnel(req, res) {
        try {
            const userId = req.params.id; // C'est l'id_user depuis le JWT
            const statutInfo = await Medecin.getStatutOperationnelByUserId(userId);
            
            if (!statutInfo) {
                return res.status(404).json({
                    success: false,
                    message: 'Médecin non trouvé'
                });
            }
            
            res.json({
                success: true,
                data: statutInfo
            });
        } catch (e) {
            console.error('❌ Erreur récupération statut opérationnel:', e);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération du statut opérationnel',
                error: e.message
            });
        }
    }

    static async getStatistiques(req, res) {
        try {
            const { executeQuery } = require('../config/database');
            const userId = req.params.id; // C'est l'id_user depuis le JWT
            
            // Récupérer d'abord l'id_medecin depuis user_id
            const medecinLink = await executeQuery(`
                SELECT id_medecin FROM medecins WHERE user_id = ?
            `, [userId]);
            
            if (medecinLink.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Médecin non trouvé pour cet utilisateur' 
                });
            }
            
            const medecinId = medecinLink[0].id_medecin;
            
            // Récupérer les informations du médecin
            const medecin = await executeQuery(`
                SELECT m.nom, m.prenom, m.specialite, cs.nom as centre
                FROM medecins m
                JOIN centres_sante cs ON cs.id_centre = m.centre_id
                WHERE m.id_medecin = ?
            `, [medecinId]);
            
            if (medecin.length === 0) {
                return res.status(404).json({ success: false, message: 'Médecin non trouvé' });
            }

            // Statistiques du jour
            const patientsAujourdhui = await executeQuery(`
                SELECT COUNT(*) as total FROM rendez_vous 
                WHERE medecin_id = ? AND DATE(date_rdv) = CURDATE()
            `, [medecinId]);

            const consultationsTerminees = await executeQuery(`
                SELECT COUNT(*) as total FROM rendez_vous 
                WHERE medecin_id = ? AND statut = 'termine' AND DATE(date_rdv) = CURDATE()
            `, [medecinId]);

            const consultationsEnCours = await executeQuery(`
                SELECT COUNT(*) as total FROM rendez_vous 
                WHERE medecin_id = ? AND statut = 'en_cours' AND DATE(date_rdv) = CURDATE()
            `, [medecinId]);

            const rdvEnAttente = await executeQuery(`
                SELECT COUNT(*) as total FROM rendez_vous 
                WHERE medecin_id = ? AND statut = 'attente' AND DATE(date_rdv) = CURDATE()
            `, [medecinId]);

            // TODO: Ajouter les statistiques prescriptions et vaccinations quand les tables seront liées
            const prescriptionsAujourdhui = [{ total: 0 }];
            const vaccinationsAujourdhui = [{ total: 0 }];

            // Récupérer le statut opérationnel
            const statutOp = await Medecin.getStatutOperationnelByUserId(userId);
            
            const data = {
                medecin: {
                    ...medecin[0],
                    statut: statutOp?.statut_operationnel || 'disponible'
                },
                patientsAujourdhui: patientsAujourdhui[0].total,
                consultationsTerminees: consultationsTerminees[0].total,
                consultationsEnCours: consultationsEnCours[0].total,
                rdvEnAttente: rdvEnAttente[0].total,
                prescriptionsAujourdhui: prescriptionsAujourdhui[0].total,
                vaccinationsAujourdhui: vaccinationsAujourdhui[0].total
            };

            res.json({ success: true, data });
        } catch (e) {
            res.status(500).json({ success: false, message: 'Erreur statistiques médecin', error: e.message });
        }
    }

    // Obtenir la liste des spécialités disponibles
    static async getSpecialites(req, res) {
        try {
            const { executeQuery } = require('../config/database');
            
            const query = `
                SELECT DISTINCT specialite
                FROM medecins
                WHERE statut = 'actif'
                AND specialite IS NOT NULL
                AND specialite != ''
                ORDER BY specialite
            `;
            
            const result = await executeQuery(query, []);
            const specialites = result.map(row => row.specialite);
            
            res.json({
                success: true,
                data: specialites
            });
        } catch (error) {
            console.error('Erreur récupération spécialités:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des spécialités',
                error: error.message
            });
        }
    }

    // Obtenir les spécialistes par recherche (prénom, nom ou spécialité)
    static async getSpecialistes(req, res) {
        try {
            const { specialite, centre_id, search } = req.query;
            
            console.log('🔍 Recherche spécialistes:', { specialite, centre_id, search });
            
            const { executeQuery } = require('../config/database');
            
            let query = `
                SELECT 
                    m.id_medecin,
                    m.nom,
                    m.prenom,
                    m.specialite,
                    m.telephone,
                    m.email,
                    m.statut,
                    cs.nom as centre_nom,
                    cs.id_centre,
                    m.centre_id
                FROM medecins m
                LEFT JOIN centres_sante cs ON m.centre_id = cs.id_centre
                WHERE m.statut = 'actif'
            `;
            
            const params = [];
            
            // Filtrer par centre (obligatoire pour la rédirection)
            if (centre_id) {
                const centreIdNum = parseInt(centre_id);
                query += ` AND m.centre_id = ?`;
                params.push(centreIdNum);
                console.log('📍 Filtrage par centre_id:', centreIdNum, '(type:', typeof centreIdNum, ')');
            } else {
                console.log('⚠️ Aucun centre_id fourni - tous les médecins actifs seront retournés');
            }
            
            // Recherche par prénom, nom ou spécialité (insensible à la casse)
            if (search && search.trim()) {
                const searchTerm = `%${search.trim()}%`;
                // Utiliser LOWER() pour une recherche insensible à la casse
                // Rechercher dans prénom, nom, spécialité et nom complet (dans les deux sens)
                query += ` AND (
                    LOWER(TRIM(m.prenom)) LIKE LOWER(?) OR 
                    LOWER(TRIM(m.nom)) LIKE LOWER(?) OR 
                    LOWER(TRIM(m.specialite)) LIKE LOWER(?) OR
                    LOWER(CONCAT(TRIM(m.prenom), ' ', TRIM(m.nom))) LIKE LOWER(?) OR
                    LOWER(CONCAT(TRIM(m.nom), ' ', TRIM(m.prenom))) LIKE LOWER(?)
                )`;
                params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
                console.log('🔎 Recherche textuelle:', searchTerm);
            } else if (specialite && specialite.trim()) {
                // Recherche par spécialité si search n'est pas fourni
                query += ` AND LOWER(TRIM(m.specialite)) LIKE LOWER(?)`;
                params.push(`%${specialite.trim()}%`);
                console.log('🔎 Recherche par spécialité:', specialite);
            }
            
            query += ` ORDER BY m.nom, m.prenom LIMIT 30`;
            
            console.log('📝 Requête SQL:', query);
            console.log('📝 Paramètres:', params);
            
            const result = await executeQuery(query, params);
            
            console.log('✅ Résultats trouvés:', result.length);
            if (result.length > 0) {
                console.log('📋 Exemples de résultats:', result.slice(0, 3).map(m => `${m.prenom} ${m.nom} - ${m.specialite} (centre: ${m.centre_id || m.id_centre}, statut: ${m.statut})`));
            } else {
                // Si aucun résultat, vérifier s'il y a des médecins dans le centre sans la recherche
                if (centre_id && search) {
                    console.log(`\n🔍 DIAGNOSTIC - Aucun résultat pour "${search}" dans le centre ${centre_id}`);
                    
                    // 1. Vérifier tous les médecins dans le centre
                    const checkQuery = `
                        SELECT m.id_medecin, m.nom, m.prenom, m.specialite, m.centre_id, m.statut
                        FROM medecins m 
                        WHERE m.centre_id = ?
                        ORDER BY m.statut, m.nom
                        LIMIT 20
                    `;
                    const checkResult = await executeQuery(checkQuery, [parseInt(centre_id)]);
                    console.log(`📊 Total médecins dans le centre ${centre_id}: ${checkResult.length}`);
                    checkResult.forEach(m => {
                        const fullName = `${m.prenom} ${m.nom}`.trim();
                        console.log(`   - ID ${m.id_medecin}: ${fullName} | Statut: ${m.statut} | Spécialité: ${m.specialite}`);
                    });
                    
                    // 2. Vérifier les médecins actifs
                    const actifQuery = `
                        SELECT COUNT(*) as count 
                        FROM medecins m 
                        WHERE m.statut = 'actif' AND m.centre_id = ?
                    `;
                    const actifResult = await executeQuery(actifQuery, [parseInt(centre_id)]);
                    const actifCount = actifResult && actifResult[0] ? actifResult[0].count : 0;
                    console.log(`✅ Médecins actifs dans le centre: ${actifCount}`);
                    
                    // 3. Vérifier si le terme de recherche correspond à un médecin (SANS filtre de statut)
                    const searchTerm = `%${search.trim()}%`;
                    const searchCheckQuery = `
                        SELECT m.id_medecin, m.nom, m.prenom, m.specialite, m.centre_id, m.statut,
                               CONCAT(m.prenom, ' ', m.nom) as nom_complet
                        FROM medecins m 
                        WHERE m.centre_id = ?
                        AND (
                            LOWER(TRIM(m.prenom)) LIKE LOWER(?) OR 
                            LOWER(TRIM(m.nom)) LIKE LOWER(?) OR 
                            LOWER(TRIM(m.specialite)) LIKE LOWER(?) OR
                            LOWER(CONCAT(TRIM(m.prenom), ' ', TRIM(m.nom))) LIKE LOWER(?) OR
                            LOWER(CONCAT(TRIM(m.nom), ' ', TRIM(m.prenom))) LIKE LOWER(?)
                        )
                        LIMIT 10
                    `;
                    const searchCheckResult = await executeQuery(searchCheckQuery, [
                        parseInt(centre_id),
                        searchTerm, searchTerm, searchTerm, searchTerm, searchTerm
                    ]);
                    if (searchCheckResult.length > 0) {
                        console.log(`\n⚠️ MÉDECINS TROUVÉS MAIS FILTRÉS (recherche: "${search}"):`);
                        searchCheckResult.forEach(m => {
                            const isActif = m.statut === 'actif' ? '✅' : '❌';
                            console.log(`   ${isActif} ID ${m.id_medecin}: ${m.nom_complet} | Statut: ${m.statut} | Centre: ${m.centre_id}`);
                            console.log(`      Prénom: "${m.prenom}" | Nom: "${m.nom}" | Spécialité: "${m.specialite}"`);
                        });
                        
                        // Vérifier pourquoi ils ne sont pas retournés
                        const inactifs = searchCheckResult.filter(m => m.statut !== 'actif');
                        if (inactifs.length > 0) {
                            console.log(`\n💡 SOLUTION: ${inactifs.length} médecin(s) trouvé(s) mais avec statut "${inactifs[0].statut}" (non "actif")`);
                            console.log(`   → Ces médecins ne seront pas affichés car seuls les médecins "actifs" sont retournés`);
                        }
                    } else {
                        console.log(`\n❌ Aucun médecin trouvé avec le terme "${search}" dans le centre ${centre_id}`);
                        console.log(`   → Vérifiez l'orthographe du nom, prénom ou spécialité`);
                    }
                }
            }
            
            // Vérifier s'il y a des médecins correspondants mais avec un statut non-actif
            let diagnosticInfo = null;
            if (result.length === 0 && centre_id && search) {
                const diagnosticQuery = `
                    SELECT m.id_medecin, m.nom, m.prenom, m.statut, m.centre_id
                    FROM medecins m 
                    WHERE m.centre_id = ?
                    AND (
                        LOWER(TRIM(m.prenom)) LIKE LOWER(?) OR 
                        LOWER(TRIM(m.nom)) LIKE LOWER(?) OR 
                        LOWER(TRIM(m.specialite)) LIKE LOWER(?) OR
                        LOWER(CONCAT(TRIM(m.prenom), ' ', TRIM(m.nom))) LIKE LOWER(?) OR
                        LOWER(CONCAT(TRIM(m.nom), ' ', TRIM(m.prenom))) LIKE LOWER(?)
                    )
                    AND m.statut != 'actif'
                    LIMIT 5
                `;
                const searchTerm = `%${search.trim()}%`;
                const diagnosticResult = await executeQuery(diagnosticQuery, [
                    parseInt(centre_id),
                    searchTerm, searchTerm, searchTerm, searchTerm, searchTerm
                ]);
                if (diagnosticResult.length > 0) {
                    diagnosticInfo = {
                        found_inactive: true,
                        count: diagnosticResult.length,
                        statuts: [...new Set(diagnosticResult.map(m => m.statut))]
                    };
                }
            }
            
            res.json({
                success: true,
                data: result,
                search_term: search,
                centre_id: centre_id ? parseInt(centre_id) : null,
                count: result.length,
                diagnostic: diagnosticInfo
            });
        } catch (error) {
            console.error('❌ Erreur récupération spécialistes:', error);
            console.error('❌ Stack trace:', error.stack);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des spécialistes',
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }
}

module.exports = MedecinController;
