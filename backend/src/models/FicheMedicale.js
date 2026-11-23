const { executeQuery, executeTransaction } = require('../config/database');

class FicheMedicale {
    // Créer une nouvelle fiche médicale
    static async create(ficheData) {
        const {
            patient_id, medecin_id, date_consultation, poids, taille,
            tension_systolique, tension_diastolique, frequence_cardiaque, temperature,
            motif_consultation, symptomes, examen_physique, diagnostic_principal,
            diagnostics_secondaires, observations_medecin, recommandations,
            suivi_necessaire = false, date_prochain_rdv = null
        } = ficheData;
        

        const query = `
            INSERT INTO fiches_medicales (
                patient_id, medecin_id, date_consultation, poids, taille,
                tension_systolique, tension_diastolique, frequence_cardiaque, temperature,
                motif_consultation, symptomes, examen_physique, diagnostic_principal,
                diagnostics_secondaires, observations_medecin, recommandations,
                suivi_necessaire, date_prochain_rdv
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        // Traiter les symptômes pour le format JSON MySQL
        let symptomesJson = null;
        if (symptomes) {
            if (typeof symptomes === 'string') {
                // Si c'est une chaîne vide, mettre null
                if (symptomes.trim() === '') {
                    symptomesJson = null;
                } else {
                    // Vérifier si c'est déjà du JSON valide
                    try {
                        JSON.parse(symptomes);
                        // Si c'est déjà du JSON valide, l'utiliser tel quel
                        symptomesJson = symptomes;
                    } catch (e) {
                        // Si ce n'est pas du JSON, créer un objet JSON valide
                        symptomesJson = JSON.stringify({ description: symptomes });
                    }
                }
            } else if (Array.isArray(symptomes)) {
                // Si c'est un tableau, le convertir en JSON
                symptomesJson = JSON.stringify(symptomes);
            } else if (typeof symptomes === 'object') {
                // Si c'est un objet, le convertir en JSON
                symptomesJson = JSON.stringify(symptomes);
            }
        }
        
        // Traiter les diagnostics secondaires pour le format JSON MySQL
        let diagnosticsSecondairesJson = null;
        if (diagnostics_secondaires) {
            if (typeof diagnostics_secondaires === 'string') {
                if (diagnostics_secondaires.trim() === '') {
                    diagnosticsSecondairesJson = null;
                } else {
                    try {
                        JSON.parse(diagnostics_secondaires);
                        diagnosticsSecondairesJson = diagnostics_secondaires;
                    } catch (e) {
                        // Si ce n'est pas du JSON, créer un tableau JSON
                        diagnosticsSecondairesJson = JSON.stringify([diagnostics_secondaires]);
                    }
                }
            } else if (Array.isArray(diagnostics_secondaires)) {
                diagnosticsSecondairesJson = JSON.stringify(diagnostics_secondaires);
            } else if (typeof diagnostics_secondaires === 'object') {
                diagnosticsSecondairesJson = JSON.stringify(diagnostics_secondaires);
            }
        }
        
        const params = [
            patient_id, medecin_id, date_consultation, poids || null, taille || null,
            tension_systolique || null, tension_diastolique || null, frequence_cardiaque || null, temperature || null,
            motif_consultation, 
            symptomesJson,
            examen_physique || null, diagnostic_principal || null,
            diagnosticsSecondairesJson, 
            observations_medecin || null, recommandations || null,
            suivi_necessaire || false, date_prochain_rdv || null
        ];
        
        try {
            const result = await executeQuery(query, params);
            return { 
                id_fiche: result.insertId,
                id: result.insertId, // Pour compatibilité
                ...ficheData 
            };
        } catch (error) {
            throw new Error(`Erreur lors de la création de la fiche médicale: ${error.message}`);
        }
    }

    // Récupérer une fiche médicale par ID
    static async findById(id) {
        const query = `
            SELECT fm.*, 
                   p.nom as patient_nom, p.prenom as patient_prenom, p.date_naissance,
                   m.nom as medecin_nom, m.prenom as medecin_prenom, m.specialite,
                   cs.nom as centre_nom
            FROM fiches_medicales fm
            LEFT JOIN patients p ON fm.patient_id = p.id_patient
            LEFT JOIN medecins m ON fm.medecin_id = m.id_medecin
            LEFT JOIN centres_sante cs ON m.centre_id = cs.id_centre
            WHERE fm.id_fiche = ?
        `;
        
        try {
            const fiches = await executeQuery(query, [id]);
            const fiche = fiches[0];
            if (fiche) {
                // Parser les champs JSON
                if (fiche.symptomes) fiche.symptomes = JSON.parse(fiche.symptomes);
                if (fiche.diagnostics_secondaires) fiche.diagnostics_secondaires = JSON.parse(fiche.diagnostics_secondaires);
            }
            return fiche || null;
        } catch (error) {
            throw new Error(`Erreur lors de la récupération de la fiche médicale: ${error.message}`);
        }
    }

    // Récupérer toutes les fiches médicales d'un patient
    static async findByPatientId(patient_id, limit = 50, offset = 0) {
        const query = `
            SELECT fm.*, 
                   m.nom as medecin_nom, m.prenom as medecin_prenom, m.specialite,
                   cs.nom as centre_nom
            FROM fiches_medicales fm
            LEFT JOIN medecins m ON fm.medecin_id = m.id_medecin
            LEFT JOIN centres_sante cs ON m.centre_id = cs.id_centre
            WHERE fm.patient_id = ?
            ORDER BY fm.date_consultation DESC
            LIMIT ? OFFSET ?
        `;
        
        try {
            const fiches = await executeQuery(query, [patient_id, limit, offset]);
            // Parser les champs JSON
            return fiches.map(fiche => {
                if (fiche.symptomes) fiche.symptomes = JSON.parse(fiche.symptomes);
                if (fiche.diagnostics_secondaires) fiche.diagnostics_secondaires = JSON.parse(fiche.diagnostics_secondaires);
                return fiche;
            });
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des fiches du patient: ${error.message}`);
        }
    }

    // Récupérer toutes les fiches médicales avec pagination
    static async findAll(limit = 50, offset = 0, filters = {}) {
        let query = `
            SELECT fm.*, 
                   p.nom as patient_nom, p.prenom as patient_prenom, p.telephone,
                   m.nom as medecin_nom, m.prenom as medecin_prenom, m.specialite,
                   cs.nom as centre_nom
            FROM fiches_medicales fm
            LEFT JOIN patients p ON fm.patient_id = p.id_patient
            LEFT JOIN medecins m ON fm.medecin_id = m.id_medecin
            LEFT JOIN centres_sante cs ON m.centre_id = cs.id_centre
            WHERE 1=1
        `;
        
        const params = [];
        
        if (filters.patient_id) {
            query += ` AND fm.patient_id = ?`;
            params.push(filters.patient_id);
        }
        
        if (filters.medecin_id) {
            query += ` AND fm.medecin_id = ?`;
            params.push(filters.medecin_id);
        }
        
        if (filters.date_debut) {
            query += ` AND DATE(fm.date_consultation) >= ?`;
            params.push(filters.date_debut);
        }
        
        if (filters.date_fin) {
            query += ` AND DATE(fm.date_consultation) <= ?`;
            params.push(filters.date_fin);
        }
        
        if (filters.statut) {
            query += ` AND fm.statut = ?`;
            params.push(filters.statut);
        }
        
        query += ` ORDER BY fm.date_consultation DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);
        
        try {
            const fiches = await executeQuery(query, params);
            return fiches.map(fiche => {
                if (fiche.symptomes) fiche.symptomes = JSON.parse(fiche.symptomes);
                if (fiche.diagnostics_secondaires) fiche.diagnostics_secondaires = JSON.parse(fiche.diagnostics_secondaires);
                return fiche;
            });
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des fiches médicales: ${error.message}`);
        }
    }

    // Compter le nombre total de fiches médicales
    static async count(filters = {}) {
        let query = `SELECT COUNT(*) as total FROM fiches_medicales fm WHERE 1=1`;
        const params = [];
        
        if (filters.patient_id) {
            query += ` AND fm.patient_id = ?`;
            params.push(filters.patient_id);
        }
        
        if (filters.medecin_id) {
            query += ` AND fm.medecin_id = ?`;
            params.push(filters.medecin_id);
        }
        
        if (filters.date_debut) {
            query += ` AND DATE(fm.date_consultation) >= ?`;
            params.push(filters.date_debut);
        }
        
        if (filters.date_fin) {
            query += ` AND DATE(fm.date_consultation) <= ?`;
            params.push(filters.date_fin);
        }
        
        if (filters.statut) {
            query += ` AND fm.statut = ?`;
            params.push(filters.statut);
        }
        
        try {
            const result = await executeQuery(query, params);
            return result[0].total;
        } catch (error) {
            throw new Error(`Erreur lors du comptage des fiches médicales: ${error.message}`);
        }
    }

    // Récupérer toutes les fiches d'un médecin
    static async findByMedecinId(medecin_id, limit = 50, offset = 0, filters = {}) {
        let query = `
            SELECT fm.*, 
                   p.nom as patient_nom, p.prenom as patient_prenom, p.telephone,
                   cs.nom as centre_nom
            FROM fiches_medicales fm
            LEFT JOIN patients p ON fm.patient_id = p.id_patient
            LEFT JOIN medecins m ON fm.medecin_id = m.id_medecin
            LEFT JOIN centres_sante cs ON m.centre_id = cs.id_centre
            WHERE fm.medecin_id = ?
        `;
        
        const params = [medecin_id];
        
        if (filters.date_debut) {
            query += ` AND DATE(fm.date_consultation) >= ?`;
            params.push(filters.date_debut);
        }
        
        if (filters.date_fin) {
            query += ` AND DATE(fm.date_consultation) <= ?`;
            params.push(filters.date_fin);
        }
        
        if (filters.statut) {
            query += ` AND fm.statut = ?`;
            params.push(filters.statut);
        }
        
        query += ` ORDER BY fm.date_consultation DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);
        
        try {
            const fiches = await executeQuery(query, params);
            return fiches.map(fiche => {
                if (fiche.symptomes) fiche.symptomes = JSON.parse(fiche.symptomes);
                if (fiche.diagnostics_secondaires) fiche.diagnostics_secondaires = JSON.parse(fiche.diagnostics_secondaires);
                return fiche;
            });
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des fiches du médecin: ${error.message}`);
        }
    }

    // Mettre à jour une fiche médicale
    static async update(id, updateData) {
        const allowedFields = [
            'poids', 'taille', 'tension_systolique', 'tension_diastolique',
            'frequence_cardiaque', 'temperature', 'motif_consultation', 'symptomes',
            'examen_physique', 'diagnostic_principal', 'diagnostics_secondaires',
            'observations_medecin', 'recommandations', 'suivi_necessaire',
            'date_prochain_rdv', 'statut'
        ];
        
        const fieldsToUpdate = [];
        const params = [];
        
        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                if (['symptomes', 'diagnostics_secondaires'].includes(field)) {
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
        
        const query = `UPDATE fiches_medicales SET ${fieldsToUpdate.join(', ')} WHERE id_fiche = ?`;
        
        try {
            const result = await executeQuery(query, params);
            if (result.affectedRows === 0) {
                throw new Error('Fiche médicale non trouvée');
            }
            return await this.findById(id);
        } catch (error) {
            throw new Error(`Erreur lors de la mise à jour de la fiche médicale: ${error.message}`);
        }
    }

    // Supprimer une fiche médicale
    static async delete(id) {
        const query = `DELETE FROM fiches_medicales WHERE id_fiche = ?`;
        
        try {
            const result = await executeQuery(query, [id]);
            if (result.affectedRows === 0) {
                throw new Error('Fiche médicale non trouvée');
            }
            return { message: 'Fiche médicale supprimée avec succès' };
        } catch (error) {
            throw new Error(`Erreur lors de la suppression de la fiche médicale: ${error.message}`);
        }
    }

    // Rechercher dans les fiches médicales
    static async search(searchTerm, limit = 20) {
        const query = `
            SELECT fm.*, 
                   p.nom as patient_nom, p.prenom as patient_prenom,
                   m.nom as medecin_nom, m.prenom as medecin_prenom
            FROM fiches_medicales fm
            LEFT JOIN patients p ON fm.patient_id = p.id_patient
            LEFT JOIN medecins m ON fm.medecin_id = m.id_medecin
            WHERE fm.diagnostic_principal LIKE ? 
               OR fm.motif_consultation LIKE ?
               OR p.nom LIKE ?
               OR p.prenom LIKE ?
            ORDER BY fm.date_consultation DESC
            LIMIT ?
        `;
        
        const searchPattern = `%${searchTerm}%`;
        const params = [searchPattern, searchPattern, searchPattern, searchPattern, limit];
        
        try {
            const fiches = await executeQuery(query, params);
            return fiches.map(fiche => {
                if (fiche.symptomes) fiche.symptomes = JSON.parse(fiche.symptomes);
                if (fiche.diagnostics_secondaires) fiche.diagnostics_secondaires = JSON.parse(fiche.diagnostics_secondaires);
                return fiche;
            });
        } catch (error) {
            throw new Error(`Erreur lors de la recherche: ${error.message}`);
        }
    }

    // Statistiques des consultations
    static async getStatistiques(filters = {}) {
        let query = `
            SELECT 
                COUNT(*) as total_consultations,
                COUNT(CASE WHEN statut = 'termine' THEN 1 END) as consultations_terminees,
                AVG(CASE WHEN poids > 0 THEN poids END) as poids_moyen,
                AVG(CASE WHEN tension_systolique > 0 THEN tension_systolique END) as tension_systolique_moy,
                COUNT(CASE WHEN suivi_necessaire = 1 THEN 1 END) as patients_suivi_necessaire
            FROM fiches_medicales fm
            WHERE 1=1
        `;
        
        const params = [];
        
        if (filters.medecin_id) {
            query += ` AND fm.medecin_id = ?`;
            params.push(filters.medecin_id);
        }
        
        if (filters.date_debut) {
            query += ` AND DATE(fm.date_consultation) >= ?`;
            params.push(filters.date_debut);
        }
        
        if (filters.date_fin) {
            query += ` AND DATE(fm.date_consultation) <= ?`;
            params.push(filters.date_fin);
        }
        
        try {
            const result = await executeQuery(query, params);
            return result[0];
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`);
        }
    }

    // Compter les fiches
    static async count(filters = {}) {
        let query = `SELECT COUNT(*) as total FROM fiches_medicales WHERE 1=1`;
        const params = [];
        
        if (filters.patient_id) {
            query += ` AND patient_id = ?`;
            params.push(filters.patient_id);
        }
        
        if (filters.medecin_id) {
            query += ` AND medecin_id = ?`;
            params.push(filters.medecin_id);
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
}

module.exports = FicheMedicale;
