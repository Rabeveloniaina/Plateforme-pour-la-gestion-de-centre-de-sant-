const { executeQuery } = require('../config/database');

class PatientInfosMedicales {
    // Créer ou mettre à jour les informations médicales de base d'un patient
    static async createOrUpdate(patientId, infos) {
        const {
            groupe_sanguin,
            poids,
            taille,
            tension,
            allergies,
            antecedents,
            maladies_chroniques,
            medicaments_actuels,
            contacts_urgence,
            infos_complementaires
        } = infos;

        // Vérifier si une fiche existe déjà
        const existingQuery = `SELECT id_info FROM patients_infos_medicales WHERE patient_id = ?`;
        const existing = await executeQuery(existingQuery, [patientId]);

        if (existing.length > 0) {
            // Mise à jour
            const updateQuery = `
                UPDATE patients_infos_medicales 
                SET groupe_sanguin = ?, poids = ?, taille = ?, tension = ?,
                    allergies = ?, antecedents = ?, maladies_chroniques = ?,
                    medicaments_actuels = ?, contacts_urgence = ?, 
                    infos_complementaires = ?, date_maj = NOW()
                WHERE patient_id = ?
            `;
            
            const params = [
                groupe_sanguin || null,
                poids || null,
                taille || null,
                tension || null,
                allergies || null,
                antecedents || null,
                maladies_chroniques || null,
                medicaments_actuels || null,
                contacts_urgence || null,
                infos_complementaires ? JSON.stringify(infos_complementaires) : null,
                patientId
            ];

            await executeQuery(updateQuery, params);
            return await this.findByPatientId(patientId);
        } else {
            // Création
            const insertQuery = `
                INSERT INTO patients_infos_medicales (
                    patient_id, groupe_sanguin, poids, taille, tension,
                    allergies, antecedents, maladies_chroniques,
                    medicaments_actuels, contacts_urgence, infos_complementaires
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const params = [
                patientId,
                groupe_sanguin || null,
                poids || null,
                taille || null,
                tension || null,
                allergies || null,
                antecedents || null,
                maladies_chroniques || null,
                medicaments_actuels || null,
                contacts_urgence || null,
                infos_complementaires ? JSON.stringify(infos_complementaires) : null
            ];

            const result = await executeQuery(insertQuery, params);
            return await this.findById(result.insertId);
        }
    }

    // Récupérer les informations médicales par ID
    static async findById(id) {
        const query = `
            SELECT * FROM patients_infos_medicales 
            WHERE id_info = ?
        `;
        
        const results = await executeQuery(query, [id]);
        if (results.length > 0 && results[0].infos_complementaires) {
            try {
                results[0].infos_complementaires = JSON.parse(results[0].infos_complementaires);
            } catch (e) {
                // Ignorer les erreurs de parsing
            }
        }
        return results[0] || null;
    }

    // Récupérer les informations médicales d'un patient
    static async findByPatientId(patientId) {
        const query = `
            SELECT * FROM patients_infos_medicales 
            WHERE patient_id = ?
        `;
        
        const results = await executeQuery(query, [patientId]);
        if (results.length > 0 && results[0].infos_complementaires) {
            try {
                results[0].infos_complementaires = JSON.parse(results[0].infos_complementaires);
            } catch (e) {
                // Ignorer les erreurs de parsing
            }
        }
        return results[0] || null;
    }

    // Supprimer les informations médicales d'un patient
    static async delete(id) {
        const query = `DELETE FROM patients_infos_medicales WHERE id_info = ?`;
        const result = await executeQuery(query, [id]);
        return result.affectedRows > 0;
    }

    // Mettre à jour un champ spécifique
    static async updateField(patientId, field, value) {
        const allowedFields = [
            'groupe_sanguin', 'poids', 'taille', 'tension', 'allergies',
            'antecedents', 'maladies_chroniques', 'medicaments_actuels',
            'contacts_urgence', 'infos_complementaires'
        ];

        if (!allowedFields.includes(field)) {
            throw new Error(`Champ non autorisé: ${field}`);
        }

        const query = `
            UPDATE patients_infos_medicales 
            SET ${field} = ?, date_maj = NOW()
            WHERE patient_id = ?
        `;

        const processedValue = field === 'infos_complementaires' && typeof value === 'object'
            ? JSON.stringify(value)
            : value;

        await executeQuery(query, [processedValue, patientId]);
        return await this.findByPatientId(patientId);
    }
}

module.exports = PatientInfosMedicales;

