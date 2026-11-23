const Notification = require('../models/Notification');

class NotificationController {
    // Créer une nouvelle notification
    static async create(req, res) {
        try {
            const { type, titre, message, patient_id, medecin_id, lu } = req.body;

            if (!type || !message) {
                return res.status(400).json({
                    success: false,
                    message: 'Type et message requis'
                });
            }

            const notification = await Notification.create({
                type,
                titre,
                message,
                patient_id: patient_id || null,
                medecin_id: medecin_id || null,
                lu: lu || false
            });

            res.status(201).json({
                success: true,
                message: 'Notification créée avec succès',
                data: notification
            });
        } catch (error) {
            console.error('❌ Erreur création notification:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la création de la notification',
                error: error.message
            });
        }
    }

    // Récupérer une notification par ID
    static async getById(req, res) {
        try {
            const { id } = req.params;
            const notification = await Notification.findById(id);

            if (!notification) {
                return res.status(404).json({
                    success: false,
                    message: 'Notification non trouvée'
                });
            }

            res.json({
                success: true,
                data: notification
            });

        } catch (error) {
            console.error('❌ Erreur récupération notification:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération de la notification',
                error: error.message
            });
        }
    }

    // Récupérer toutes les notifications avec pagination
    static async getAll(req, res) {
        try {
            const {
                page = 1,
                limit = 50,
                type,
                statut,
                patient_id,
                medecin_id
            } = req.query;

            const offset = (page - 1) * limit;
            const filters = { type, statut, patient_id, medecin_id };

            const notifications = await Notification.list({
                page: parseInt(page),
                limit: parseInt(limit),
                type,
                statut
            });
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
            console.error('❌ Erreur récupération notifications:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des notifications',
                error: error.message
            });
        }
    }

    // Mettre à jour une notification
    static async update(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            // Vérifier que la notification existe
            const existingNotification = await Notification.findById(id);
            if (!existingNotification) {
                return res.status(404).json({
                    success: false,
                    message: 'Notification non trouvée'
                });
            }

            const notification = await Notification.update(id, updateData);

            res.json({
                success: true,
                message: 'Notification mise à jour avec succès',
                data: notification
            });

        } catch (error) {
            console.error('❌ Erreur mise à jour notification:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la mise à jour de la notification',
                error: error.message
            });
        }
    }

    // Supprimer une notification
    static async delete(req, res) {
        try {
            const { id } = req.params;

            // Vérifier que la notification existe
            const existingNotification = await Notification.findById(id);
            if (!existingNotification) {
                return res.status(404).json({
                    success: false,
                    message: 'Notification non trouvée'
                });
            }

            const result = await Notification.delete(id);

            res.json({
                success: true,
                message: result.message
            });

        } catch (error) {
            console.error('❌ Erreur suppression notification:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la suppression de la notification',
                error: error.message
            });
        }
    }

    // Rechercher des notifications
    static async search(req, res) {
        try {
            const { q, limit = 20 } = req.query;

            if (!q || q.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    message: 'Le terme de recherche doit contenir au moins 2 caractères'
                });
            }

            const notifications = await Notification.search(q.trim(), parseInt(limit));

            res.json({
                success: true,
                data: notifications,
                searchTerm: q,
                total: notifications.length
            });

        } catch (error) {
            console.error('❌ Erreur recherche notifications:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la recherche',
                error: error.message
            });
        }
    }

    // Récupérer les notifications d'un patient
    static async getByPatientId(req, res) {
        try {
            const { patient_id } = req.params;
            const { page = 1, limit = 50 } = req.query;

            const offset = (page - 1) * limit;
            const notifications = await Notification.findByPatientId(patient_id, parseInt(limit), offset);
            const total = await Notification.count({ patient_id });

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
            console.error('❌ Erreur récupération notifications patient:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des notifications du patient',
                error: error.message
            });
        }
    }

    // Récupérer les notifications d'un médecin
    static async getByMedecinId(req, res) {
        try {
            const { medecin_id } = req.params;
            const { page = 1, limit = 50 } = req.query;

            const offset = (page - 1) * limit;
            const notifications = await Notification.findByMedecinId(medecin_id, parseInt(limit), offset);
            const total = await Notification.count({ medecin_id });

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
            console.error('❌ Erreur récupération notifications médecin:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des notifications du médecin',
                error: error.message
            });
        }
    }

    // Récupérer les notifications non lues
    static async getUnread(req, res) {
        try {
            const { patient_id, medecin_id, limit = 50 } = req.query;

            const notifications = await Notification.getUnread(patient_id, medecin_id, parseInt(limit));

            res.json({
                success: true,
                data: notifications,
                total: notifications.length
            });

        } catch (error) {
            console.error('❌ Erreur récupération notifications non lues:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des notifications non lues',
                error: error.message
            });
        }
    }

    // Marquer une notification comme lue
    static async markAsRead(req, res) {
        try {
            const { id } = req.params;

            const result = await Notification.markAsRead(id);

            res.json({
                success: true,
                message: result.message
            });

        } catch (error) {
            console.error('❌ Erreur marquage notification comme lue:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors du marquage de la notification',
                error: error.message
            });
        }
    }

    // Mettre à jour le statut d'une notification
    static async updateStatut(req, res) {
        try {
            const { id } = req.params;
            const { statut, date_envoi } = req.body;

            if (!statut) {
                return res.status(400).json({
                    success: false,
                    message: 'Statut requis'
                });
            }

            const result = await Notification.updateStatut(id, statut, date_envoi);

            res.json({
                success: true,
                message: result.message
            });

        } catch (error) {
            console.error('❌ Erreur mise à jour statut notification:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la mise à jour du statut',
                error: error.message
            });
        }
    }

    // Récupérer les statistiques des notifications
    static async getStatistiques(req, res) {
        try {
            const { date_debut, date_fin } = req.query;
            const filters = { date_debut, date_fin };

            const stats = await Notification.getStatistiques(filters);

            res.json({
                success: true,
                data: stats
            });

        } catch (error) {
            console.error('❌ Erreur statistiques notifications:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des statistiques',
                error: error.message
            });
        }
    }

    // Supprimer les notifications anciennes
    static async deleteOld(req, res) {
        try {
            const { days_old = 30 } = req.query;

            const result = await Notification.deleteOld(parseInt(days_old));

            res.json({
                success: true,
                message: result.message,
                data: {
                    deleted_count: result.deleted_count,
                    days_old: parseInt(days_old)
                }
            });

        } catch (error) {
            console.error('❌ Erreur suppression notifications anciennes:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la suppression des notifications anciennes',
                error: error.message
            });
        }
    }

    // Envoyer une notification de rappel de RDV
    static async sendRappelRdv(req, res) {
        try {
            const { patient_id, medecin_id, message, type = 'rappel_rdv' } = req.body;

            if (!patient_id || !message) {
                return res.status(400).json({
                    success: false,
                    message: 'Patient ID et message requis'
                });
            }

            const notification = await Notification.create({
                patient_id,
                medecin_id: medecin_id || null,
                type,
                message,
                statut: 'en_attente'
            });

            res.status(201).json({
                success: true,
                message: 'Notification de rappel créée avec succès',
                data: notification
            });

        } catch (error) {
            console.error('❌ Erreur envoi rappel RDV:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de l\'envoi du rappel',
                error: error.message
            });
        }
    }

    // Envoyer une notification de vaccination
    static async sendRappelVaccination(req, res) {
        try {
            const { patient_id, medecin_id, message, type = 'rappel_vaccination' } = req.body;

            if (!patient_id || !message) {
                return res.status(400).json({
                    success: false,
                    message: 'Patient ID et message requis'
                });
            }

            const notification = await Notification.create({
                patient_id,
                medecin_id: medecin_id || null,
                type,
                message,
                statut: 'en_attente'
            });

            res.status(201).json({
                success: true,
                message: 'Notification de rappel de vaccination créée avec succès',
                data: notification
            });

        } catch (error) {
            console.error('❌ Erreur envoi rappel vaccination:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de l\'envoi du rappel de vaccination',
                error: error.message
            });
        }
    }

    // Compter les notifications non lues
    static async getUnreadCount(req, res) {
        try {
            const { patient_id, medecin_id } = req.query;

            const count = await Notification.getUnreadCount(patient_id, medecin_id);

            res.json({
                success: true,
                data: { count }
            });

        } catch (error) {
            console.error('❌ Erreur comptage notifications non lues:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors du comptage des notifications non lues',
                error: error.message
            });
        }
    }

    // Marquer toutes les notifications comme lues
    static async markAllAsRead(req, res) {
        try {
            const { patient_id, medecin_id } = req.body;

            const result = await Notification.markAllAsRead(patient_id, medecin_id);

            res.json({
                success: true,
                message: result.message,
                data: { count: result.count }
            });

        } catch (error) {
            console.error('❌ Erreur marquage notifications comme lues:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors du marquage des notifications',
                error: error.message
            });
        }
    }
}

module.exports = NotificationController;
