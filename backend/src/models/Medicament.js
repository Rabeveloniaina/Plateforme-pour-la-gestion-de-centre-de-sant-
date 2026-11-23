const { executeQuery } = require('../config/database');

class Medicament {
    // Créer un nouveau médicament
    static async create(medicamentData) {
        const {
            nom_commercial, dci, denomination_commune, forme_pharmaceutique, dosage,
            unite_dosage, fabricant = null, code_atc = null, contre_indications = null,
            effets_secondaires = null, interactions = null, statut = 'actif'
        } = medicamentData;

        // Utiliser dci comme denomination_commune si pas fournie
        const finalDenomination = denomination_commune || dci;

        const query = `
            INSERT INTO medicaments (
                nom_commercial, denomination_commune, forme_pharmaceutique, dosage,
                unite_dosage, fabricant, code_atc, contre_indications,
                effets_secondaires, interactions, statut
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const params = [
            nom_commercial, finalDenomination, forme_pharmaceutique, dosage,
            unite_dosage || 'mg', fabricant, code_atc, contre_indications,
            effets_secondaires, interactions, statut
        ];
        
        try {
            const result = await executeQuery(query, params);
            return { 
                id_medicament: result.insertId,
                id: result.insertId, // Pour compatibilité
                ...medicamentData 
            };
        } catch (error) {
            throw new Error(`Erreur lors de la création du médicament: ${error.message}`);
        }
    }

    // Récupérer un médicament par ID
    static async findById(id) {
        const query = `SELECT * FROM medicaments WHERE id_medicament = ?`;
        
        try {
            const medicaments = await executeQuery(query, [id]);
            return medicaments[0] || null;
        } catch (error) {
            throw new Error(`Erreur lors de la récupération du médicament: ${error.message}`);
        }
    }

    // Récupérer tous les médicaments avec pagination et filtres
    static async findAll(limit = 50, offset = 0, filters = {}) {
        let query = `SELECT * FROM medicaments WHERE 1=1`;
        const params = [];
        
        if (filters.nom) {
            query += ` AND (nom_commercial LIKE ? OR denomination_commune LIKE ?)`;
            params.push(`%${filters.nom}%`, `%${filters.nom}%`);
        }
        
        if (filters.forme_pharmaceutique) {
            query += ` AND forme_pharmaceutique = ?`;
            params.push(filters.forme_pharmaceutique);
        }
        
        if (filters.statut) {
            query += ` AND statut = ?`;
            params.push(filters.statut);
        }
        
        if (filters.fabricant) {
            query += ` AND fabricant LIKE ?`;
            params.push(`%${filters.fabricant}%`);
        }
        
        query += ` ORDER BY nom_commercial ASC LIMIT ? OFFSET ?`;
        params.push(limit, offset);
        
        try {
            return await executeQuery(query, params);
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des médicaments: ${error.message}`);
        }
    }

    // Rechercher des médicaments
    static async search(searchTerm, limit = 20) {
        const query = `
            SELECT * FROM medicaments
            WHERE statut = 'actif' 
            AND (nom_commercial LIKE ? OR denomination_commune LIKE ? OR fabricant LIKE ?)
            ORDER BY nom_commercial ASC
            LIMIT ?
        `;
        
        const searchPattern = `%${searchTerm}%`;
        const params = [searchPattern, searchPattern, searchPattern, limit];
        
        try {
            return await executeQuery(query, params);
        } catch (error) {
            throw new Error(`Erreur lors de la recherche: ${error.message}`);
        }
    }

    // Mettre à jour un médicament
    static async update(id, updateData) {
        const allowedFields = [
            'nom_commercial', 'denomination_commune', 'forme_pharmaceutique', 'dosage',
            'unite_dosage', 'fabricant', 'code_atc', 'contre_indications',
            'effets_secondaires', 'interactions', 'statut'
        ];
        
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
        
        const query = `UPDATE medicaments SET ${fieldsToUpdate.join(', ')} WHERE id_medicament = ?`;
        
        try {
            const result = await executeQuery(query, params);
            if (result.affectedRows === 0) {
                throw new Error('Médicament non trouvé');
            }
            return await this.findById(id);
        } catch (error) {
            throw new Error(`Erreur lors de la mise à jour du médicament: ${error.message}`);
        }
    }

    // Supprimer un médicament (soft delete)
    static async delete(id) {
        const query = `UPDATE medicaments SET statut = 'inactif' WHERE id_medicament = ?`;
        
        try {
            const result = await executeQuery(query, [id]);
            if (result.affectedRows === 0) {
                throw new Error('Médicament non trouvé');
            }
            return { message: 'Médicament désactivé avec succès' };
        } catch (error) {
            throw new Error(`Erreur lors de la suppression du médicament: ${error.message}`);
        }
    }

    // Compter les médicaments
    static async count(filters = {}) {
        let query = `SELECT COUNT(*) as total FROM medicaments WHERE 1=1`;
        const params = [];
        
        if (filters.statut) {
            query += ` AND statut = ?`;
            params.push(filters.statut);
        }
        
        if (filters.forme_pharmaceutique) {
            query += ` AND forme_pharmaceutique = ?`;
            params.push(filters.forme_pharmaceutique);
        }
        
        try {
            const result = await executeQuery(query, params);
            return result[0].total;
        } catch (error) {
            throw new Error(`Erreur lors du comptage: ${error.message}`);
        }
    }

    // Statistiques des médicaments
    static async getStatistiques() {
        const query = `
            SELECT 
                COUNT(*) as total_medicaments,
                COUNT(CASE WHEN statut = 'actif' THEN 1 END) as medicaments_actifs,
                COUNT(CASE WHEN statut = 'inactif' THEN 1 END) as medicaments_inactifs,
                forme_pharmaceutique,
                COUNT(*) as count_by_forme
            FROM medicaments
            GROUP BY forme_pharmaceutique
            ORDER BY count_by_forme DESC
        `;
        
        try {
            return await executeQuery(query);
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`);
        }
    }

    // Récupérer les médicaments par forme pharmaceutique
    static async findByForme(forme) {
        const query = `
            SELECT * FROM medicaments
            WHERE forme_pharmaceutique = ? AND statut = 'actif'
            ORDER BY nom_commercial ASC
        `;
        
        try {
            return await executeQuery(query, [forme]);
        } catch (error) {
            throw new Error(`Erreur lors de la récupération par forme: ${error.message}`);
        }
    }

    // Vérifier les interactions médicamenteuses
    static async checkInteractions(medicamentIds) {
        if (!Array.isArray(medicamentIds) || medicamentIds.length === 0) {
            return [];
        }
        
        const placeholders = medicamentIds.map(() => '?').join(',');
        const query = `
            SELECT id_medicament, nom_commercial, interactions
            FROM medicaments
            WHERE id_medicament IN (${placeholders})
            AND interactions IS NOT NULL
            AND interactions != ''
        `;
        
        try {
            return await executeQuery(query, medicamentIds);
        } catch (error) {
            throw new Error(`Erreur lors de la vérification des interactions: ${error.message}`);
        }
    }
}

module.exports = Medicament;
