const { executeQuery } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    static async findById(id) {
        const rows = await executeQuery('SELECT * FROM utilisateurs WHERE id_user = ?', [id]);
        return rows[0] || null;
    }

    static async findByUsername(username) {
        const rows = await executeQuery('SELECT * FROM utilisateurs WHERE nom_utilisateur = ?', [username]);
        return rows[0] || null;
    }

    static async findByUsernameWithCentre(username) {
        const rows = await executeQuery(`
            SELECT u.*, c.nom as centre_name 
            FROM utilisateurs u 
            LEFT JOIN centres_sante c ON u.id_centre = c.id_centre 
            WHERE u.nom_utilisateur = ? OR u.email = ?
        `, [username, username]);
        return rows[0] || null;
    }

    static async findByEmail(email) {
        const rows = await executeQuery('SELECT * FROM utilisateurs WHERE email = ?', [email]);
        return rows[0] || null;
    }

    static async create({ nom_utilisateur, email, mot_de_passe, role = 'patient', statut = 'actif', id_centre = null }) {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(mot_de_passe, salt);
        const result = await executeQuery(
            'INSERT INTO utilisateurs (nom_utilisateur, mot_de_passe, email, role, statut, id_centre) VALUES (?, ?, ?, ?, ?, ?)',
            [nom_utilisateur, hash, email, role, statut, id_centre]
        );
        return { id_user: result.insertId, nom_utilisateur, email, role, statut, id_centre };
    }

    static async comparePassword(plain, hashed) {
        return bcrypt.compare(plain, hashed);
    }

    // Récupérer tous les utilisateurs avec pagination
    static async findAll(limit = 50, offset = 0, filters = {}) {
        let query = `SELECT * FROM utilisateurs WHERE 1=1`;
        const params = [];
        
        if (filters.role) {
            query += ` AND role = ?`;
            params.push(filters.role);
        }
        
        if (filters.statut) {
            query += ` AND statut = ?`;
            params.push(filters.statut);
        }
        
        if (filters.nom_utilisateur) {
            query += ` AND nom_utilisateur LIKE ?`;
            params.push(`%${filters.nom_utilisateur}%`);
        }
        
        if (filters.email) {
            query += ` AND email LIKE ?`;
            params.push(`%${filters.email}%`);
        }
        
        query += ` ORDER BY nom_utilisateur ASC LIMIT ? OFFSET ?`;
        params.push(limit, offset);
        
        try {
            return await executeQuery(query, params);
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des utilisateurs: ${error.message}`);
        }
    }

    // Mettre à jour un utilisateur
    static async update(id, updateData) {
        const allowedFields = ['nom_utilisateur', 'email', 'role', 'statut'];
        const fieldsToUpdate = [];
        const params = [];
        
        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                fieldsToUpdate.push(`${field} = ?`);
                params.push(updateData[field]);
            }
        });
        
        if (updateData.mot_de_passe) {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(updateData.mot_de_passe, salt);
            fieldsToUpdate.push('mot_de_passe = ?');
            params.push(hash);
        }
        
        if (fieldsToUpdate.length === 0) {
            throw new Error('Aucun champ valide à mettre à jour');
        }
        
        params.push(id);
        
        const query = `UPDATE utilisateurs SET ${fieldsToUpdate.join(', ')} WHERE id_user = ?`;
        
        try {
            const result = await executeQuery(query, params);
            if (result.affectedRows === 0) {
                throw new Error('Utilisateur non trouvé');
            }
            return await this.findById(id);
        } catch (error) {
            throw new Error(`Erreur lors de la mise à jour de l'utilisateur: ${error.message}`);
        }
    }

    // Supprimer un utilisateur (soft delete)
    static async delete(id) {
        const query = `UPDATE utilisateurs SET statut = 'inactif' WHERE id_user = ?`;
        
        try {
            const result = await executeQuery(query, [id]);
            if (result.affectedRows === 0) {
                throw new Error('Utilisateur non trouvé');
            }
            return { message: 'Utilisateur supprimé avec succès' };
        } catch (error) {
            throw new Error(`Erreur lors de la suppression de l'utilisateur: ${error.message}`);
        }
    }

    // Rechercher des utilisateurs
    static async search(searchTerm, limit = 20) {
        const query = `
            SELECT * FROM utilisateurs
            WHERE statut = 'actif' 
            AND (nom_utilisateur LIKE ? OR email LIKE ?)
            ORDER BY nom_utilisateur ASC
            LIMIT ?
        `;
        
        const searchPattern = `%${searchTerm}%`;
        const params = [searchPattern, searchPattern, limit];
        
        try {
            return await executeQuery(query, params);
        } catch (error) {
            throw new Error(`Erreur lors de la recherche: ${error.message}`);
        }
    }

    // Compter le nombre total d'utilisateurs
    static async count(filters = {}) {
        let query = `SELECT COUNT(*) as total FROM utilisateurs WHERE 1=1`;
        const params = [];
        
        if (filters.role) {
            query += ` AND role = ?`;
            params.push(filters.role);
        }
        
        if (filters.statut) {
            query += ` AND statut = ?`;
            params.push(filters.statut);
        }
        
        try {
            const result = await executeQuery(query, params);
            return result[0].total;
        } catch (error) {
            throw new Error(`Erreur lors du comptage: ${error.message}`);
        }
    }

    // Récupérer les statistiques des utilisateurs
    static async getStatistiques() {
        const query = `
            SELECT 
                role,
                COUNT(*) as total_utilisateurs,
                COUNT(CASE WHEN statut = 'actif' THEN 1 END) as utilisateurs_actifs,
                COUNT(CASE WHEN statut = 'inactif' THEN 1 END) as utilisateurs_inactifs
            FROM utilisateurs
            GROUP BY role
            ORDER BY total_utilisateurs DESC
        `;
        
        try {
            return await executeQuery(query);
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`);
        }
    }

    // Vérifier si un nom d'utilisateur existe
    static async usernameExists(username, excludeId = null) {
        let query = `SELECT COUNT(*) as count FROM utilisateurs WHERE nom_utilisateur = ?`;
        const params = [username];
        
        if (excludeId) {
            query += ` AND id_user != ?`;
            params.push(excludeId);
        }
        
        try {
            const result = await executeQuery(query, params);
            return result[0].count > 0;
        } catch (error) {
            throw new Error(`Erreur lors de la vérification du nom d'utilisateur: ${error.message}`);
        }
    }

    // Vérifier si un email existe
    static async emailExists(email, excludeId = null) {
        let query = `SELECT COUNT(*) as count FROM utilisateurs WHERE email = ?`;
        const params = [email];
        
        if (excludeId) {
            query += ` AND id_user != ?`;
            params.push(excludeId);
        }
        
        try {
            const result = await executeQuery(query, params);
            return result[0].count > 0;
        } catch (error) {
            throw new Error(`Erreur lors de la vérification de l'email: ${error.message}`);
        }
    }
}

module.exports = User;
