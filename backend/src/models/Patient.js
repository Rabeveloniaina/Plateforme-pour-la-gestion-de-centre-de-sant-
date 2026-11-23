const { executeQuery, executeTransaction } = require('../config/database');

class Patient {
    // Créer un nouveau patient
    static async create(patientData) {
        const {
            nom, prenom, date_naissance, sexe, adresse, telephone, email,
            centre_id, region_id, groupe_sanguin = null, allergies = null, antecedents = null, maladies_chroniques = null, user_id = null, statut = 'actif'
        } = patientData;

        // S'assurer que prenom est une chaîne vide plutôt que null/undefined (pour compatibilité avec NOT NULL)
        const prenomValue = prenom || '';

        const query = `
            INSERT INTO patients (nom, prenom, date_naissance, sexe, adresse, telephone, email, centre_id, region_id, groupe_sanguin, allergies, antecedents, maladies_chroniques, user_id, statut)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const params = [nom, prenomValue, date_naissance, sexe, adresse, telephone, email, centre_id, region_id, groupe_sanguin, JSON.stringify(allergies), JSON.stringify(antecedents), JSON.stringify(maladies_chroniques), user_id, statut];
        
        try {
            const result = await executeQuery(query, params);
            return { id: result.insertId, ...patientData };
        } catch (error) {
            throw new Error(`Erreur lors de la création du patient: ${error.message}`);
        }
    }

    // Récupérer un patient par ID
    static async findById(id) {
        const query = `
            SELECT p.*, c.nom as centre_nom, r.nom as region_nom, u.nom_utilisateur
            FROM patients p
            LEFT JOIN centres_sante c ON p.centre_id = c.id_centre
            LEFT JOIN regions r ON p.region_id = r.id_region
            LEFT JOIN utilisateurs u ON p.user_id = u.id_user
            WHERE p.id_patient = ?
        `;
        
        try {
            const patients = await executeQuery(query, [id]);
            if (patients[0]) {
                // Parser les champs JSON
                const patient = patients[0];
                patient.allergies = this.parseJsonField(patient.allergies);
                patient.antecedents = this.parseJsonField(patient.antecedents);
                patient.maladies_chroniques = this.parseJsonField(patient.maladies_chroniques);
                return patient;
            }
            return null;
        } catch (error) {
            throw new Error(`Erreur lors de la récupération du patient: ${error.message}`);
        }
    }
    
    // Helper pour parser les champs JSON
    static parseJsonField(field) {
        if (!field) return [];
        if (typeof field === 'string') {
            try {
                const parsed = JSON.parse(field);
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                return [];
            }
        }
        return Array.isArray(field) ? field : [];
    }

    // Récupérer tous les patients avec pagination
    static async findAll(limit = 50, offset = 0, filters = {}) {
        let query = `
            SELECT p.*, c.nom as centre_nom, r.nom as region_nom
            FROM patients p
            LEFT JOIN centres_sante c ON p.centre_id = c.id_centre
            LEFT JOIN regions r ON p.region_id = r.id_region
            WHERE 1=1
        `;
        
        const params = [];
        
        // Filtres
        if (filters.centre_id) {
            query += ` AND p.centre_id = ?`;
            params.push(filters.centre_id);
        }
        
        if (filters.nom) {
            query += ` AND (p.nom LIKE ? OR p.prenom LIKE ?)`;
            params.push(`%${filters.nom}%`, `%${filters.nom}%`);
        }
        
        if (filters.statut) {
            query += ` AND p.statut = ?`;
            params.push(filters.statut);
        }
        
        query += ` ORDER BY p.nom, p.prenom LIMIT ? OFFSET ?`;
        params.push(limit, offset);
        
        try {
            const patients = await executeQuery(query, params);
            // Parser les champs JSON pour chaque patient
            return patients.map(patient => ({
                ...patient,
                allergies: this.parseJsonField(patient.allergies),
                antecedents: this.parseJsonField(patient.antecedents),
                maladies_chroniques: this.parseJsonField(patient.maladies_chroniques)
            }));
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des patients: ${error.message}`);
        }
    }

    // Mettre à jour un patient
    static async update(id, updateData) {
        const allowedFields = [
            'nom', 'prenom', 'date_naissance', 'sexe', 'adresse', 'telephone',
            'email', 'centre_id', 'groupe_sanguin', 'statut', 'allergies', 'antecedents', 'maladies_chroniques'
        ];
        
        const fieldsToUpdate = [];
        const params = [];
        
        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                if (['allergies','antecedents','maladies_chroniques'].includes(field)) {
                    fieldsToUpdate.push(`${field} = ?`);
                    params.push(JSON.stringify(updateData[field]));
                } else {
                    fieldsToUpdate.push(`${field} = ?`);
                    params.push(updateData[field]);
                }
            }
        });
        
        if (fieldsToUpdate.length === 0) {
            throw new Error('Aucun champ valide à mettre à jour');
        }
        
        params.push(id);
        
        const query = `UPDATE patients SET ${fieldsToUpdate.join(', ')} WHERE id_patient = ?`;
        
        try {
            const result = await executeQuery(query, params);
            if (result.affectedRows === 0) {
                throw new Error('Patient non trouvé');
            }
            return await this.findById(id);
        } catch (error) {
            throw new Error(`Erreur lors de la mise à jour du patient: ${error.message}`);
        }
    }

    // Supprimer un patient (soft delete)
    static async delete(id) {
        const query = `UPDATE patients SET statut = 'inactif' WHERE id_patient = ?`;
        
        try {
            const result = await executeQuery(query, [id]);
            if (result.affectedRows === 0) {
                throw new Error('Patient non trouvé');
            }
            return { message: 'Patient supprimé avec succès' };
        } catch (error) {
            throw new Error(`Erreur lors de la suppression du patient: ${error.message}`);
        }
    }

    // Rechercher des patients
    static async search(searchTerm, limit = 20) {
        const query = `
            SELECT p.*, cs.nom as centre_nom
            FROM patients p
            LEFT JOIN centres_sante cs ON p.centre_id = cs.id_centre
            WHERE p.statut = 'actif' 
            AND (p.nom LIKE ? OR p.prenom LIKE ? OR p.telephone LIKE ? OR p.email LIKE ?)
            ORDER BY p.nom, p.prenom
            LIMIT ?
        `;
        
        const searchPattern = `%${searchTerm}%`;
        const params = [searchPattern, searchPattern, searchPattern, searchPattern, limit];
        
        try {
            return await executeQuery(query, params);
        } catch (error) {
            throw new Error(`Erreur lors de la recherche: ${error.message}`);
        }
    }

    // Compter le nombre total de patients
    static async count(filters = {}) {
        let query = `SELECT COUNT(*) as total FROM patients WHERE 1=1`;
        const params = [];
        
        if (filters.centre_id) {
            query += ` AND centre_id = ?`;
            params.push(filters.centre_id);
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

    // Récupérer les statistiques des patients par centre
    static async getStatsByCentre() {
        const query = `
            SELECT 
                cs.nom as centre_nom,
                COUNT(p.id_patient) as total_patients,
                COUNT(CASE WHEN p.statut = 'actif' THEN 1 END) as patients_actifs,
                COUNT(CASE WHEN p.statut = 'inactif' THEN 1 END) as patients_inactifs
            FROM centres_sante cs
            LEFT JOIN patients p ON cs.id_centre = p.centre_id
            GROUP BY cs.id_centre, cs.nom
            ORDER BY total_patients DESC
        `;
        
        try {
            return await executeQuery(query);
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`);
        }
    }
}

module.exports = Patient;
