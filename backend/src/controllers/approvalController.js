const ApprovalRequest = require('../models/ApprovalRequest');
const Centre = require('../models/Centre');
const Medecin = require('../models/Medecin');
const User = require('../models/User');
const { notifyApproval } = require('../services/notificationService');

class ApprovalController {
    // Créer une demande d'approbation
    static async createRequest(req, res) {
        try {
            const { type, target_id, data } = req.body;
            const requester_id = req.user.id;

            // Validation des types autorisés
            const allowedTypes = ['centre', 'medecin', 'personnel'];
            if (!allowedTypes.includes(type)) {
                return res.status(400).json({
                    success: false,
                    message: 'Type de demande non autorisé'
                });
            }

            // Vérifier les permissions selon le type
            if (type === 'centre' && req.user.role !== 'ministere') {
                return res.status(403).json({
                    success: false,
                    message: 'Seul le ministère peut créer des centres'
                });
            }

            if (type === 'medecin' && req.user.role !== 'admin_centre') {
                return res.status(403).json({
                    success: false,
                    message: 'Seul un admin centre peut créer des médecins'
                });
            }

            if (type === 'personnel' && req.user.role !== 'admin_centre') {
                return res.status(403).json({
                    success: false,
                    message: 'Seul un admin centre peut créer du personnel'
                });
            }

            // Créer la demande d'approbation
            const approvalRequest = await ApprovalRequest.create({
                type,
                requester_id,
                target_id,
                data
            });

            // Notifier les approbateurs appropriés
            await notifyApproval(approvalRequest);

            res.status(201).json({
                success: true,
                message: 'Demande d\'approbation créée avec succès',
                data: approvalRequest
            });

        } catch (error) {
            console.error('❌ Erreur création demande:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la création de la demande',
                error: error.message
            });
        }
    }

    // Lister les demandes d'approbation
    static async getRequests(req, res) {
        try {
            const { type, status } = req.query;
            const user = req.user;

            let requests = [];

            if (user.role === 'ministere') {
                // Le ministère peut voir toutes les demandes
                requests = await ApprovalRequest.findByType(type, status);
            } else if (user.role === 'admin_centre') {
                // L'admin centre peut voir les demandes de son centre
                requests = await ApprovalRequest.findByApprover(user.id);
            } else {
                // Les autres peuvent voir leurs propres demandes
                requests = await ApprovalRequest.findByRequester(user.id);
            }

            res.json({
                success: true,
                data: requests
            });

        } catch (error) {
            console.error('❌ Erreur récupération demandes:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des demandes',
                error: error.message
            });
        }
    }

    // Approuver une demande
    static async approveRequest(req, res) {
        try {
            const { id } = req.params;
            const { comments } = req.body;
            const approver_id = req.user.id;

            const request = await ApprovalRequest.findById(id);
            if (!request) {
                return res.status(404).json({
                    success: false,
                    message: 'Demande non trouvée'
                });
            }

            // Vérifier les permissions d'approbation
            if (request.type === 'centre' && req.user.role !== 'ministere') {
                return res.status(403).json({
                    success: false,
                    message: 'Seul le ministère peut approuver les centres'
                });
            }

            if ((request.type === 'medecin' || request.type === 'personnel') && req.user.role !== 'admin_centre') {
                return res.status(403).json({
                    success: false,
                    message: 'Seul un admin centre peut approuver les médecins et personnel'
                });
            }

            // Approuver la demande
            const approved = await ApprovalRequest.approve(id, approver_id, comments);
            if (!approved) {
                return res.status(400).json({
                    success: false,
                    message: 'Erreur lors de l\'approbation'
                });
            }

            // Traiter l'approbation selon le type
            await processApproval(request);

            res.json({
                success: true,
                message: 'Demande approuvée avec succès'
            });

        } catch (error) {
            console.error('❌ Erreur approbation:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de l\'approbation',
                error: error.message
            });
        }
    }

    // Rejeter une demande
    static async rejectRequest(req, res) {
        try {
            const { id } = req.params;
            const { comments } = req.body;
            const approver_id = req.user.id;

            const request = await ApprovalRequest.findById(id);
            if (!request) {
                return res.status(404).json({
                    success: false,
                    message: 'Demande non trouvée'
                });
            }

            // Vérifier les permissions de rejet
            if (request.type === 'centre' && req.user.role !== 'ministere') {
                return res.status(403).json({
                    success: false,
                    message: 'Seul le ministère peut rejeter les centres'
                });
            }

            if ((request.type === 'medecin' || request.type === 'personnel') && req.user.role !== 'admin_centre') {
                return res.status(403).json({
                    success: false,
                    message: 'Seul un admin centre peut rejeter les médecins et personnel'
                });
            }

            // Rejeter la demande
            const rejected = await ApprovalRequest.reject(id, approver_id, comments);
            if (!rejected) {
                return res.status(400).json({
                    success: false,
                    message: 'Erreur lors du rejet'
                });
            }

            res.json({
                success: true,
                message: 'Demande rejetée avec succès'
            });

        } catch (error) {
            console.error('❌ Erreur rejet:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors du rejet',
                error: error.message
            });
        }
    }

    // Statistiques des demandes
    static async getStats(req, res) {
        try {
            const pending = await ApprovalRequest.countByStatus('pending');
            const approved = await ApprovalRequest.countByStatus('approved');
            const rejected = await ApprovalRequest.countByStatus('rejected');

            res.json({
                success: true,
                data: {
                    pending,
                    approved,
                    rejected,
                    total: pending + approved + rejected
                }
            });

        } catch (error) {
            console.error('❌ Erreur statistiques:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des statistiques',
                error: error.message
            });
        }
    }
}

// Traiter l'approbation selon le type
async function processApproval(request) {
    const data = JSON.parse(request.data);

    switch (request.type) {
        case 'centre':
            // Créer le centre
            await Centre.create(data);
            break;
        case 'medecin':
            // Créer le médecin
            await Medecin.create(data);
            break;
        case 'personnel':
            // Créer l'utilisateur personnel
            await User.create({
                ...data,
                role: 'personnel'
            });
            break;
    }
}

module.exports = ApprovalController;
