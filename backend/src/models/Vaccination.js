const { executeQuery } = require('../config/database');

class Vaccination {
    // Créer une nouvelle vaccination
    static async create(vaccinationData) {
        const {
            patient_id, medecin_id, nom_vaccin, type_vaccin, fabricant = null,
            numero_lot = null, date_expiration = null, date_administration,
            site_injection, voie_administration, reactions_adverses = null,
            date_rappel_prevu = null
        } = vaccinationData;

        const query = `
            INSERT INTO vaccinations (
                patient_id, medecin_id, nom_vaccin, type_vaccin, fabricant,
                numero_lot, date_expiration, date_administration, site_injection,
                voie_administration, reactions_adverses, date_rappel_prevu
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const params = [
            patient_id, medecin_id, nom_vaccin, type_vaccin, fabricant,
            numero_lot, date_expiration, date_administration, site_injection,
            voie_administration, reactions_adverses, date_rappel_prevu
        ];
        
        try {
            const result = await executeQuery(query, params);
            return { 
                id_vaccination: result.insertId,
                id: result.insertId, // Pour compatibilité
                ...vaccinationData 
            };
        } catch (error) {
            throw new Error(`Erreur lors de la création de la vaccination: ${error.message}`);
        }
    }

    // Récupérer une vaccination par ID
    static async findById(id) {
        const query = `
            SELECT v.*, 
                   p.nom as patient_nom, p.prenom as patient_prenom, p.date_naissance,
                   m.nom as medecin_nom, m.prenom as medecin_prenom,
                   cs.nom as centre_nom
            FROM vaccinations v
            LEFT JOIN patients p ON v.patient_id = p.id_patient
            LEFT JOIN medecins m ON v.medecin_id = m.id_medecin
            LEFT JOIN centres_sante cs ON m.centre_id = cs.id_centre
            WHERE v.id_vaccination = ?
        `;
        
        try {
            const vaccinations = await executeQuery(query, [id]);
            return vaccinations[0] || null;
        } catch (error) {
            throw new Error(`Erreur lors de la récupération de la vaccination: ${error.message}`);
        }
    }

    // Récupérer toutes les vaccinations d'un patient
    static async findByPatientId(patient_id, limit = 50, offset = 0) {
        const query = `
            SELECT v.*, 
                   m.nom as medecin_nom, m.prenom as medecin_prenom,
                   cs.nom as centre_nom
            FROM vaccinations v
            LEFT JOIN medecins m ON v.medecin_id = m.id_medecin
            LEFT JOIN centres_sante cs ON m.centre_id = cs.id_centre
            WHERE v.patient_id = ?
            ORDER BY v.date_administration DESC
            LIMIT ? OFFSET ?
        `;
        
        try {
            return await executeQuery(query, [patient_id, limit, offset]);
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des vaccinations du patient: ${error.message}`);
        }
    }

    // Récupérer les vaccinations par médecin
    static async findByMedecinId(medecin_id, limit = 50, offset = 0, filters = {}) {
        let query = `
            SELECT v.*, 
                   p.nom as patient_nom, p.prenom as patient_prenom, p.telephone,
                   cs.nom as centre_nom
            FROM vaccinations v
            LEFT JOIN patients p ON v.patient_id = p.id_patient
            LEFT JOIN medecins m ON v.medecin_id = m.id_medecin
            LEFT JOIN centres_sante cs ON m.centre_id = cs.id_centre
            WHERE v.medecin_id = ?
        `;
        
        const params = [medecin_id];
        
        if (filters.date_debut) {
            query += ` AND v.date_administration >= ?`;
            params.push(filters.date_debut);
        }
        
        if (filters.date_fin) {
            query += ` AND v.date_administration <= ?`;
            params.push(filters.date_fin);
        }
        
        if (filters.type_vaccin) {
            query += ` AND v.type_vaccin = ?`;
            params.push(filters.type_vaccin);
        }
        
        if (filters.nom_vaccin) {
            query += ` AND v.nom_vaccin LIKE ?`;
            params.push(`%${filters.nom_vaccin}%`);
        }
        
        query += ` ORDER BY v.date_administration DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);
        
        try {
            return await executeQuery(query, params);
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des vaccinations du médecin: ${error.message}`);
        }
    }

    // Récupérer les rappels de vaccination à venir
    static async getRappelsAVenir(centre_id = null, jours_avance = 30) {
        let query = `
            SELECT v.*, 
                   p.nom as patient_nom, p.prenom as patient_prenom, 
                   p.telephone, p.email,
                   m.nom as medecin_nom, m.prenom as medecin_prenom,
                   cs.nom as centre_nom
            FROM vaccinations v
            LEFT JOIN patients p ON v.patient_id = p.id_patient
            LEFT JOIN medecins m ON v.medecin_id = m.id_medecin
            LEFT JOIN centres_sante cs ON m.centre_id = cs.id_centre
            WHERE v.date_rappel_prevu IS NOT NULL
            AND v.date_rappel_prevu BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
            AND v.statut = 'administre'
        `;
        
        const params = [jours_avance];
        
        if (centre_id) {
            query += ` AND cs.id_centre = ?`;
            params.push(centre_id);
        }
        
        query += ` ORDER BY v.date_rappel_prevu ASC`;
        
        try {
            return await executeQuery(query, params);
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des rappels: ${error.message}`);
        }
    }

    // Récupérer le carnet de vaccination d'un patient
    static async getCarnetVaccination(patient_id) {
        const query = `
            SELECT v.*, 
                   m.nom as medecin_nom, m.prenom as medecin_prenom,
                   cs.nom as centre_nom
            FROM vaccinations v
            LEFT JOIN medecins m ON v.medecin_id = m.id_medecin
            LEFT JOIN centres_sante cs ON m.centre_id = cs.id_centre
            WHERE v.patient_id = ? AND v.statut = 'administre'
            ORDER BY v.date_administration ASC
        `;
        
        try {
            return await executeQuery(query, [patient_id]);
        } catch (error) {
            throw new Error(`Erreur lors de la récupération du carnet de vaccination: ${error.message}`);
        }
    }

    // Vérifier le statut vaccinal d'un patient
    static async checkStatutVaccinal(patient_id, vaccins_obligatoires = []) {
        if (vaccins_obligatoires.length === 0) {
            // Vaccins obligatoires par défaut (Sénégal)
            vaccins_obligatoires = [
                'BCG', 'DTC', 'Polio', 'Hépatite B', 'Haemophilus', 'Pneumocoque',
                'Rotavirus', 'Rougeole', 'Rubéole', 'Oreillons', 'Méningocoque'
            ];
        }
        
        const placeholders = vaccins_obligatoires.map(() => '?').join(',');
        const query = `
            SELECT nom_vaccin, COUNT(*) as doses_recues, MAX(date_administration) as derniere_dose
            FROM vaccinations
            WHERE patient_id = ? 
            AND statut = 'administre'
            AND nom_vaccin IN (${placeholders})
            GROUP BY nom_vaccin
        `;
        
        try {
            const vaccinsRecus = await executeQuery(query, [patient_id, ...vaccins_obligatoires]);
            
            // Créer un rapport de statut
            const statut = {
                patient_id,
                vaccins_a_jour: [],
                vaccins_manquants: [],
                vaccins_en_retard: []
            };
            
            vaccins_obligatoires.forEach(vaccin => {
                const vaccinRecu = vaccinsRecus.find(v => v.nom_vaccin === vaccin);
                if (vaccinRecu) {
                    statut.vaccins_a_jour.push({
                        nom_vaccin: vaccin,
                        doses_recues: vaccinRecu.doses_recues,
                        derniere_dose: vaccinRecu.derniere_dose
                    });
                } else {
                    statut.vaccins_manquants.push(vaccin);
                }
            });
            
            return statut;
        } catch (error) {
            throw new Error(`Erreur lors de la vérification du statut vaccinal: ${error.message}`);
        }
    }

    // Mettre à jour une vaccination
    static async update(id, updateData) {
        const allowedFields = [
            'nom_vaccin', 'type_vaccin', 'fabricant', 'numero_lot', 'date_expiration',
            'date_administration', 'site_injection', 'voie_administration',
            'reactions_adverses', 'date_rappel_prevu', 'statut'
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
        
        const query = `UPDATE vaccinations SET ${fieldsToUpdate.join(', ')} WHERE id_vaccination = ?`;
        
        try {
            const result = await executeQuery(query, params);
            if (result.affectedRows === 0) {
                throw new Error('Vaccination non trouvée');
            }
            return await this.findById(id);
        } catch (error) {
            throw new Error(`Erreur lors de la mise à jour de la vaccination: ${error.message}`);
        }
    }

    // Supprimer une vaccination
    static async delete(id) {
        const query = `DELETE FROM vaccinations WHERE id_vaccination = ?`;
        
        try {
            const result = await executeQuery(query, [id]);
            if (result.affectedRows === 0) {
                throw new Error('Vaccination non trouvée');
            }
            return { message: 'Vaccination supprimée avec succès' };
        } catch (error) {
            throw new Error(`Erreur lors de la suppression de la vaccination: ${error.message}`);
        }
    }

    // Rechercher des vaccinations
    static async search(searchTerm, limit = 20) {
        const query = `
            SELECT v.*, 
                   p.nom as patient_nom, p.prenom as patient_prenom,
                   m.nom as medecin_nom, m.prenom as medecin_prenom
            FROM vaccinations v
            LEFT JOIN patients p ON v.patient_id = p.id_patient
            LEFT JOIN medecins m ON v.medecin_id = m.id_medecin
            WHERE v.nom_vaccin LIKE ? 
               OR p.nom LIKE ?
               OR p.prenom LIKE ?
               OR v.fabricant LIKE ?
            ORDER BY v.date_administration DESC
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

    // Compter les vaccinations
    static async count(filters = {}) {
        let query = `SELECT COUNT(*) as total FROM vaccinations v WHERE 1=1`;
        const params = [];
        
        if (filters.patient_id) {
            query += ` AND v.patient_id = ?`;
            params.push(filters.patient_id);
        }
        
        if (filters.medecin_id) {
            query += ` AND v.medecin_id = ?`;
            params.push(filters.medecin_id);
        }
        
        if (filters.type_vaccin) {
            query += ` AND v.type_vaccin = ?`;
            params.push(filters.type_vaccin);
        }
        
        try {
            const result = await executeQuery(query, params);
            return result[0].total;
        } catch (error) {
            throw new Error(`Erreur lors du comptage: ${error.message}`);
        }
    }

    // Statistiques des vaccinations
    static async getStatistiques(filters = {}) {
        let query = `
            SELECT 
                COUNT(*) as total_vaccinations,
                COUNT(CASE WHEN statut = 'administre' THEN 1 END) as vaccinations_administrees,
                COUNT(CASE WHEN statut = 'reporte' THEN 1 END) as vaccinations_reportees,
                COUNT(CASE WHEN statut = 'contre_indique' THEN 1 END) as vaccinations_contre_indiquees,
                type_vaccin,
                COUNT(*) as count_by_type
            FROM vaccinations v
            WHERE 1=1
        `;
        
        const params = [];
        
        if (filters.date_debut) {
            query += ` AND v.date_administration >= ?`;
            params.push(filters.date_debut);
        }
        
        if (filters.date_fin) {
            query += ` AND v.date_administration <= ?`;
            params.push(filters.date_fin);
        }
        
        query += ` GROUP BY type_vaccin ORDER BY count_by_type DESC`;
        
        try {
            return await executeQuery(query, params);
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`);
        }
    }

    // Couverture vaccinale par région/centre
    // Récupérer toutes les vaccinations avec pagination
    static async findAll(limit = 50, offset = 0, filters = {}) {
        let query = `
            SELECT v.*, 
                   p.nom as patient_nom, p.prenom as patient_prenom, p.date_naissance,
                   cs.nom as centre_nom, r.nom as region_nom
            FROM vaccinations v
            LEFT JOIN patients p ON v.patient_id = p.id_patient
            LEFT JOIN centres_sante cs ON v.centre_id = cs.id_centre
            LEFT JOIN regions r ON cs.region_id = r.id_region
            WHERE 1=1
        `;
        
        const params = [];
        
        if (filters.patient_id) {
            query += ` AND v.patient_id = ?`;
            params.push(filters.patient_id);
        }
        
        if (filters.centre_id) {
            query += ` AND v.centre_id = ?`;
            params.push(filters.centre_id);
        }
        
        if (filters.date_debut) {
            query += ` AND DATE(v.date_administration) >= ?`;
            params.push(filters.date_debut);
        }
        
        if (filters.date_fin) {
            query += ` AND DATE(v.date_administration) <= ?`;
            params.push(filters.date_fin);
        }
        
        if (filters.statut) {
            query += ` AND v.statut = ?`;
            params.push(filters.statut);
        }
        
        if (filters.nom_vaccin) {
            query += ` AND v.nom_vaccin LIKE ?`;
            params.push(`%${filters.nom_vaccin}%`);
        }
        
        query += ` ORDER BY v.date_administration DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);
        
        try {
            const vaccinations = await executeQuery(query, params);
            return vaccinations;
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des vaccinations: ${error.message}`);
        }
    }

    // Compter le nombre total de vaccinations
    static async count(filters = {}) {
        let query = `SELECT COUNT(*) as total FROM vaccinations v WHERE 1=1`;
        const params = [];
        
        if (filters.patient_id) {
            query += ` AND v.patient_id = ?`;
            params.push(filters.patient_id);
        }
        
        if (filters.centre_id) {
            query += ` AND v.centre_id = ?`;
            params.push(filters.centre_id);
        }
        
        if (filters.date_debut) {
            query += ` AND DATE(v.date_administration) >= ?`;
            params.push(filters.date_debut);
        }
        
        if (filters.date_fin) {
            query += ` AND DATE(v.date_administration) <= ?`;
            params.push(filters.date_fin);
        }
        
        if (filters.statut) {
            query += ` AND v.statut = ?`;
            params.push(filters.statut);
        }
        
        if (filters.nom_vaccin) {
            query += ` AND v.nom_vaccin LIKE ?`;
            params.push(`%${filters.nom_vaccin}%`);
        }
        
        try {
            const result = await executeQuery(query, params);
            return result[0].total;
        } catch (error) {
            throw new Error(`Erreur lors du comptage des vaccinations: ${error.message}`);
        }
    }

    static async getCouvertureVaccinale(centre_id = null, region_id = null) {
        let query = `
            SELECT 
                v.nom_vaccin,
                COUNT(DISTINCT v.patient_id) as patients_vaccines,
                COUNT(DISTINCT p.id_patient) as total_patients,
                ROUND((COUNT(DISTINCT v.patient_id) / COUNT(DISTINCT p.id_patient)) * 100, 2) as taux_couverture
            FROM patients p
            LEFT JOIN vaccinations v ON p.id_patient = v.patient_id AND v.statut = 'administre'
            LEFT JOIN centres_sante cs ON p.centre_id = cs.id_centre
            WHERE 1=1
        `;
        
        const params = [];
        
        if (centre_id) {
            query += ` AND cs.id_centre = ?`;
            params.push(centre_id);
        }
        
        if (region_id) {
            query += ` AND cs.region_id = ?`;
            params.push(region_id);
        }
        
        query += ` GROUP BY v.nom_vaccin ORDER BY taux_couverture DESC`;
        
        try {
            return await executeQuery(query, params);
        } catch (error) {
            throw new Error(`Erreur lors du calcul de la couverture vaccinale: ${error.message}`);
        }
    }
}

module.exports = Vaccination;
