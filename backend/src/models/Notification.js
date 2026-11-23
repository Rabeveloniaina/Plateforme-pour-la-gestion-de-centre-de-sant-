const { executeQuery } = require('../config/database');

class Notification {
    static async create({ patient_id = null, medecin_id = null, type, titre = null, message, statut = 'en_attente', lu = false }) {
        const res = await executeQuery(
            `INSERT INTO notifications (patient_id, medecin_id, type, titre, message, statut, lu, created_at) VALUES (?,?,?,?,?,?,?, NOW())`,
            [patient_id, medecin_id, type, titre, message, statut, lu]
        );
        return { id: res.insertId, patient_id, medecin_id, type, titre, message, statut, lu };
    }

    static async list({ page = 1, limit = 50, type, statut }) {
        const offset = (page - 1) * limit;
        let q = `SELECT * FROM notifications WHERE 1=1`;
        const p = [];
        if (type) { q += ' AND type = ?'; p.push(type); }
        if (statut) { q += ' AND statut = ?'; p.push(statut); }
        q += ' ORDER BY id_notification DESC LIMIT ? OFFSET ?';
        p.push(parseInt(limit), offset);
        return executeQuery(q, p);
    }

    static async updateStatut(id, statut, date_envoi = null) {
        const res = await executeQuery(
            `UPDATE notifications SET statut = ?, date_envoi = COALESCE(?, date_envoi) WHERE id_notification = ?`,
            [statut, date_envoi, id]
        );
        if (res.affectedRows === 0) throw new Error('Notification non trouvée');
        return { message: 'Statut mis à jour' };
    }

    // Récupérer une notification par ID
    static async findById(id) {
        const query = `
            SELECT n.*, 
                   p.nom as patient_nom, p.prenom as patient_prenom,
                   m.nom as medecin_nom, m.prenom as medecin_prenom
            FROM notifications n
            LEFT JOIN patients p ON n.patient_id = p.id_patient
            LEFT JOIN medecins m ON n.medecin_id = m.id_medecin
            WHERE n.id_notification = ?
        `;

        try {
            const notifications = await executeQuery(query, [id]);
            return notifications[0] || null;
        } catch (error) {
            throw new Error(`Erreur lors de la récupération de la notification: ${error.message}`);
        }
    }

    // Mettre à jour une notification
    static async update(id, updateData) {
        const allowedFields = ['type', 'message', 'statut', 'patient_id', 'medecin_id'];
        const fieldsToUpdate = [];
        const params = [];

        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                fieldsToUpdate.push(`${field} = ?`);
                params.push(updateData[field]);
            }
        });

        if (fieldsToUpdate.length === 0) {
            throw new Error('Aucun champ valide à mettre à jour');
        }

        params.push(id);

        const query = `UPDATE notifications SET ${fieldsToUpdate.join(', ')} WHERE id_notification = ?`;

        try {
            const result = await executeQuery(query, params);
            if (result.affectedRows === 0) {
                throw new Error('Notification non trouvée');
            }
            return await this.findById(id);
        } catch (error) {
            throw new Error(`Erreur lors de la mise à jour de la notification: ${error.message}`);
        }
    }

    // Supprimer une notification
    static async delete(id) {
        const query = `DELETE FROM notifications WHERE id_notification = ?`;

        try {
            const result = await executeQuery(query, [id]);
            if (result.affectedRows === 0) {
                throw new Error('Notification non trouvée');
            }
            return { message: 'Notification supprimée avec succès' };
        } catch (error) {
            throw new Error(`Erreur lors de la suppression de la notification: ${error.message}`);
        }
    }

    // Rechercher des notifications
    static async search(searchTerm, limit = 20) {
        const query = `
            SELECT n.*, 
                   p.nom as patient_nom, p.prenom as patient_prenom,
                   m.nom as medecin_nom, m.prenom as medecin_prenom
            FROM notifications n
            LEFT JOIN patients p ON n.patient_id = p.id_patient
            LEFT JOIN medecins m ON n.medecin_id = m.id_medecin
            WHERE n.message LIKE ? 
               OR p.nom LIKE ?
               OR p.prenom LIKE ?
               OR m.nom LIKE ?
               OR m.prenom LIKE ?
            ORDER BY n.created_at DESC
            LIMIT ?
        `;

        const searchPattern = `%${searchTerm}%`;
        const params = [searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, limit];

        try {
            return await executeQuery(query, params);
        } catch (error) {
            throw new Error(`Erreur lors de la recherche: ${error.message}`);
        }
    }

    // Compter le nombre total de notifications
    static async count(filters = {}) {
        let query = `SELECT COUNT(*) as total FROM notifications WHERE 1=1`;
        const params = [];

        if (filters.type) {
            query += ` AND type = ?`;
            params.push(filters.type);
        }

        if (filters.statut) {
            query += ` AND statut = ?`;
            params.push(filters.statut);
        }

        if (filters.patient_id) {
            query += ` AND patient_id = ?`;
            params.push(filters.patient_id);
        }

        if (filters.medecin_id) {
            query += ` AND medecin_id = ?`;
            params.push(filters.medecin_id);
        }

        try {
            const result = await executeQuery(query, params);
            return result[0].total;
        } catch (error) {
            throw new Error(`Erreur lors du comptage: ${error.message}`);
        }
    }

    // Récupérer toutes les notifications avec pagination
    static async findAll(limit = 50, offset = 0, filters = {}) {
        let query = `
            SELECT n.*, 
                   p.nom as patient_nom, p.prenom as patient_prenom,
                   m.nom as medecin_nom, m.prenom as medecin_prenom
            FROM notifications n
            LEFT JOIN patients p ON n.patient_id = p.id_patient
            LEFT JOIN medecins m ON n.medecin_id = m.id_medecin
            WHERE 1=1
        `;

        const params = [];

        if (filters.user_id) {
            query += ` AND n.user_id = ?`;
            params.push(filters.user_id);
        }

        if (filters.type) {
            query += ` AND n.type = ?`;
            params.push(filters.type);
        }

        if (filters.statut) {
            query += ` AND n.statut = ?`;
            params.push(filters.statut);
        }

        if (filters.patient_id) {
            query += ` AND n.patient_id = ?`;
            params.push(filters.patient_id);
        }

        if (filters.medecin_id) {
            query += ` AND n.medecin_id = ?`;
            params.push(filters.medecin_id);
        }

        if (filters.date_debut) {
            query += ` AND DATE(n.created_at) >= ?`;
            params.push(filters.date_debut);
        }

        if (filters.date_fin) {
            query += ` AND DATE(n.created_at) <= ?`;
            params.push(filters.date_fin);
        }

        query += ` ORDER BY n.created_at DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        try {
            return await executeQuery(query, params);
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des notifications: ${error.message}`);
        }
    }

    // Récupérer les notifications d'un patient
    static async findByPatientId(patient_id, limit = 50, offset = 0) {
        const query = `
            SELECT n.*, 
                   m.nom as medecin_nom, m.prenom as medecin_prenom
            FROM notifications n
            LEFT JOIN medecins m ON n.medecin_id = m.id_medecin
            WHERE n.patient_id = ?
            ORDER BY n.created_at DESC
            LIMIT ? OFFSET ?
        `;

        try {
            return await executeQuery(query, [patient_id, limit, offset]);
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des notifications du patient: ${error.message}`);
        }
    }

    // Récupérer les notifications d'un médecin
    static async findByMedecinId(medecin_id, limit = 50, offset = 0) {
        const query = `
            SELECT n.*, 
                   p.nom as patient_nom, p.prenom as patient_prenom
            FROM notifications n
            LEFT JOIN patients p ON n.patient_id = p.id_patient
            WHERE n.medecin_id = ?
            ORDER BY n.created_at DESC
            LIMIT ? OFFSET ?
        `;

        try {
            return await executeQuery(query, [medecin_id, limit, offset]);
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des notifications du médecin: ${error.message}`);
        }
    }

    // Récupérer les notifications non lues
    static async getUnread(patient_id = null, medecin_id = null, limit = 50) {
        let query = `
            SELECT n.*, 
                   p.nom as patient_nom, p.prenom as patient_prenom,
                   m.nom as medecin_nom, m.prenom as medecin_prenom
            FROM notifications n
            LEFT JOIN patients p ON n.patient_id = p.id_patient
            LEFT JOIN medecins m ON n.medecin_id = m.id_medecin
            WHERE n.lu = FALSE
        `;

        const params = [];

        if (patient_id) {
            query += ` AND n.patient_id = ?`;
            params.push(patient_id);
        }

        if (medecin_id) {
            query += ` AND n.medecin_id = ?`;
            params.push(medecin_id);
        }

        query += ` ORDER BY n.created_at DESC LIMIT ?`;
        params.push(limit);

        try {
            return await executeQuery(query, params);
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des notifications non lues: ${error.message}`);
        }
    }

    // Marquer comme lue
    static async markAsRead(id) {
        const query = `UPDATE notifications SET lu = TRUE WHERE id = ?`;

        try {
            const result = await executeQuery(query, [id]);
            if (result.affectedRows === 0) {
                throw new Error('Notification non trouvée');
            }
            return { message: 'Notification marquée comme lue' };
        } catch (error) {
            throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
        }
    }

    // Marquer toutes les notifications comme lues pour un utilisateur
    static async markAllAsRead(patient_id = null, medecin_id = null) {
        let query = `UPDATE notifications SET lu = TRUE WHERE lu = FALSE`;
        const params = [];

        if (patient_id) {
            query += ` AND patient_id = ?`;
            params.push(patient_id);
        }

        if (medecin_id) {
            query += ` AND medecin_id = ?`;
            params.push(medecin_id);
        }

        try {
            const result = await executeQuery(query, params);
            return {
                message: 'Notifications marquées comme lues',
                count: result.affectedRows
            };
        } catch (error) {
            throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
        }
    }

    // Compter les notifications non lues
    static async getUnreadCount(patient_id = null, medecin_id = null) {
        let query = `SELECT COUNT(*) as count FROM notifications WHERE lu = FALSE`;
        const params = [];

        if (patient_id) {
            query += ` AND patient_id = ?`;
            params.push(patient_id);
        }

        if (medecin_id) {
            query += ` AND medecin_id = ?`;
            params.push(medecin_id);
        }

        try {
            const result = await executeQuery(query, params);
            return result[0].count;
        } catch (error) {
            throw new Error(`Erreur lors du comptage: ${error.message}`);
        }
    }

    // Récupérer les statistiques des notifications
    static async getStatistiques(filters = {}) {
        let query = `
            SELECT 
                COUNT(*) as total_notifications,
                COUNT(CASE WHEN statut = 'en_attente' THEN 1 END) as notifications_en_attente,
                COUNT(CASE WHEN statut = 'envoyee' THEN 1 END) as notifications_envoyees,
                COUNT(CASE WHEN statut = 'echec' THEN 1 END) as notifications_echec,
                type,
                COUNT(*) as count_by_type
            FROM notifications
            WHERE 1=1
        `;

        const params = [];

        if (filters.date_debut) {
            query += ` AND DATE(created_at) >= ?`;
            params.push(filters.date_debut);
        }

        if (filters.date_fin) {
            query += ` AND DATE(created_at) <= ?`;
            params.push(filters.date_fin);
        }

        query += ` GROUP BY type ORDER BY count_by_type DESC`;

        try {
            return await executeQuery(query, params);
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`);
        }
    }

    // Supprimer les notifications anciennes
    static async deleteOld(daysOld = 30) {
        const query = `DELETE FROM notifications WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`;

        try {
            const result = await executeQuery(query, [daysOld]);
            return {
                message: `${result.affectedRows} notifications anciennes supprimées`,
                deleted_count: result.affectedRows
            };
        } catch (error) {
            throw new Error(`Erreur lors de la suppression des notifications anciennes: ${error.message}`);
        }
    }
}

module.exports = Notification;
