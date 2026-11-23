const { executeQuery, executeTransaction } = require('../config/database');

class Prescription {
    // Créer une nouvelle prescription
    static async create(prescriptionData) {
        const {
            fiche_medicale_id, medicament_id, dosage_prescrit, frequence,
            duree_traitement, quantite_totale, instructions_specifiques = null,
            moment_prise = 'selon_besoin', date_debut, date_fin
        } = prescriptionData;

        const query = `
            INSERT INTO prescriptions (
                fiche_medicale_id, medicament_id, dosage_prescrit, frequence,
                duree_traitement, quantite_totale, instructions_specifiques,
                moment_prise, date_debut, date_fin
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const params = [
            fiche_medicale_id, medicament_id, dosage_prescrit, frequence,
            duree_traitement, quantite_totale, instructions_specifiques,
            moment_prise, date_debut, date_fin
        ];
        
        try {
            const result = await executeQuery(query, params);
            return { id: result.insertId, ...prescriptionData };
        } catch (error) {
            throw new Error(`Erreur lors de la création de la prescription: ${error.message}`);
        }
    }

    // Créer plusieurs prescriptions en une fois
    static async createMultiple(prescriptions) {
        // Nettoyer toutes les valeurs undefined et s'assurer que tous les champs nécessaires sont présents
        const cleanedPrescriptions = prescriptions.map(prescription => {
            // Créer un objet nettoyé avec toutes les valeurs nécessaires
            const cleaned = {
                fiche_medicale_id: prescription.fiche_medicale_id !== undefined ? prescription.fiche_medicale_id : null,
                medicament_id: prescription.medicament_id !== undefined ? prescription.medicament_id : null,
                dosage_prescrit: prescription.dosage_prescrit !== undefined ? prescription.dosage_prescrit : null,
                frequence: prescription.frequence !== undefined ? prescription.frequence : null,
                duree_traitement: prescription.duree_traitement !== undefined ? prescription.duree_traitement : null,
                quantite_totale: prescription.quantite_totale !== undefined ? prescription.quantite_totale : null,
                instructions_specifiques: prescription.instructions_specifiques !== undefined ? prescription.instructions_specifiques : null,
                moment_prise: prescription.moment_prise !== undefined ? prescription.moment_prise : null,
                date_debut: prescription.date_debut !== undefined ? prescription.date_debut : null,
                date_fin: prescription.date_fin !== undefined ? prescription.date_fin : null,
                statut: prescription.statut !== undefined ? prescription.statut : null
            };
            
            // Convertir explicitement undefined en null pour tous les champs
            Object.keys(cleaned).forEach(key => {
                if (cleaned[key] === undefined) {
                    cleaned[key] = null;
                }
            });
            
            return cleaned;
        });
        
        const queries = cleanedPrescriptions.map(prescription => {
            // Valider que les champs NOT NULL sont présents et non null/undefined
            if (prescription.fiche_medicale_id === null || prescription.fiche_medicale_id === undefined) {
                throw new Error('fiche_medicale_id est requis pour la prescription');
            }
            if (prescription.medicament_id === null || prescription.medicament_id === undefined) {
                throw new Error('medicament_id est requis pour la prescription');
            }
            if (prescription.date_debut === null || prescription.date_debut === undefined) {
                throw new Error('date_debut est requise pour la prescription');
            }
            
            // Préparer les paramètres avec des valeurs par défaut pour les champs NOT NULL
            const params = [
                prescription.fiche_medicale_id, // NOT NULL
                prescription.medicament_id, // NOT NULL
                (prescription.dosage_prescrit !== null && prescription.dosage_prescrit !== undefined) 
                    ? String(prescription.dosage_prescrit).trim() || 'N/A' 
                    : 'N/A', // NOT NULL - valeur par défaut
                (prescription.frequence !== null && prescription.frequence !== undefined) 
                    ? String(prescription.frequence).trim() || 'Selon prescription' 
                    : 'Selon prescription', // NOT NULL - valeur par défaut
                (prescription.duree_traitement !== null && prescription.duree_traitement !== undefined) 
                    ? parseInt(prescription.duree_traitement) || 7 
                    : 7, // NOT NULL - valeur par défaut
                (prescription.quantite_totale !== null && prescription.quantite_totale !== undefined) 
                    ? parseInt(prescription.quantite_totale) || 7 
                    : 7, // NOT NULL - valeur par défaut
                (prescription.instructions_specifiques !== null && prescription.instructions_specifiques !== undefined && String(prescription.instructions_specifiques).trim()) 
                    ? String(prescription.instructions_specifiques).trim() 
                    : null, // Peut être NULL
                (prescription.moment_prise !== null && prescription.moment_prise !== undefined) 
                    ? prescription.moment_prise 
                    : 'selon_besoin', // Valeur par défaut
                prescription.date_debut, // NOT NULL
                (prescription.date_fin !== null && prescription.date_fin !== undefined) 
                    ? prescription.date_fin 
                    : null, // Peut être NULL
                (prescription.statut !== null && prescription.statut !== undefined) 
                    ? prescription.statut 
                    : 'active' // Valeur par défaut
            ];
            
            // Vérifier qu'aucun paramètre n'est undefined
            params.forEach((param, index) => {
                if (param === undefined) {
                    const paramNames = [
                        'fiche_medicale_id', 'medicament_id', 'dosage_prescrit', 'frequence',
                        'duree_traitement', 'quantite_totale', 'instructions_specifiques',
                        'moment_prise', 'date_debut', 'date_fin', 'statut'
                    ];
                    throw new Error(`Paramètre ${paramNames[index]} est undefined`);
                }
            });
            
            return {
                query: `
                    INSERT INTO prescriptions (
                        fiche_medicale_id, medicament_id, dosage_prescrit, frequence,
                        duree_traitement, quantite_totale, instructions_specifiques,
                        moment_prise, date_debut, date_fin, statut
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
                params: params
            };
        });

        try {
            const results = await executeTransaction(queries);
            return results.map((result, index) => ({
                id: result.insertId,
                id_prescription: result.insertId,
                ...cleanedPrescriptions[index]
            }));
        } catch (error) {
            throw new Error(`Erreur lors de la création des prescriptions: ${error.message}`);
        }
    }

    // Récupérer une prescription par ID
    static async findById(id) {
        const query = `
            SELECT p.*, 
                   m.nom_commercial, m.denomination_commune, m.forme_pharmaceutique,
                   m.dosage as dosage_medicament, m.unite_dosage, m.contre_indications,
                   m.effets_secondaires, m.interactions,
                   fm.patient_id, fm.date_consultation,
                   pat.nom as patient_nom, pat.prenom as patient_prenom
            FROM prescriptions p
            LEFT JOIN medicaments m ON p.medicament_id = m.id_medicament
            LEFT JOIN fiches_medicales fm ON p.fiche_medicale_id = fm.id_fiche
            LEFT JOIN patients pat ON fm.patient_id = pat.id_patient
            WHERE p.id_prescription = ?
        `;
        
        try {
            const prescriptions = await executeQuery(query, [id]);
            return prescriptions[0] || null;
        } catch (error) {
            throw new Error(`Erreur lors de la récupération de la prescription: ${error.message}`);
        }
    }

    // Récupérer toutes les prescriptions d'une fiche médicale
    static async findByFicheMedicaleId(fiche_medicale_id) {
        const query = `
            SELECT p.*, 
                   m.nom_commercial, m.denomination_commune, m.forme_pharmaceutique,
                   m.dosage as dosage_medicament, m.unite_dosage, m.contre_indications,
                   m.effets_secondaires, m.interactions
            FROM prescriptions p
            LEFT JOIN medicaments m ON p.medicament_id = m.id_medicament
            WHERE p.fiche_medicale_id = ?
            ORDER BY p.created_at DESC
        `;
        
        try {
            return await executeQuery(query, [fiche_medicale_id]);
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des prescriptions: ${error.message}`);
        }
    }

    // Récupérer toutes les prescriptions d'un patient
    static async findByPatientId(patient_id, limit = 50, offset = 0, filters = {}) {
        let query = `
            SELECT p.*, 
                   m.nom_commercial, m.denomination_commune, m.forme_pharmaceutique,
                   m.dosage as dosage_medicament, m.unite_dosage,
                   fm.date_consultation, fm.diagnostic_principal,
                   med.nom as medecin_nom, med.prenom as medecin_prenom
            FROM prescriptions p
            LEFT JOIN medicaments m ON p.medicament_id = m.id_medicament
            LEFT JOIN fiches_medicales fm ON p.fiche_medicale_id = fm.id_fiche
            LEFT JOIN medecins med ON fm.medecin_id = med.id_medecin
            WHERE fm.patient_id = ?
        `;
        
        const params = [patient_id];
        
        if (filters.statut) {
            query += ` AND p.statut = ?`;
            params.push(filters.statut);
        }
        
        if (filters.date_debut) {
            query += ` AND p.date_debut >= ?`;
            params.push(filters.date_debut);
        }
        
        if (filters.date_fin) {
            query += ` AND p.date_fin <= ?`;
            params.push(filters.date_fin);
        }
        
        if (filters.medicament) {
            query += ` AND (m.nom_commercial LIKE ? OR m.denomination_commune LIKE ?)`;
            params.push(`%${filters.medicament}%`, `%${filters.medicament}%`);
        }
        
        query += ` ORDER BY p.date_debut DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);
        
        try {
            return await executeQuery(query, params);
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des prescriptions du patient: ${error.message}`);
        }
    }

    // Récupérer les prescriptions actives d'un patient
    static async getActivePrescriptions(patient_id) {
        const query = `
            SELECT p.*, 
                   m.nom_commercial, m.denomination_commune, m.forme_pharmaceutique,
                   m.dosage as dosage_medicament, m.unite_dosage, m.interactions,
                   fm.date_consultation,
                   med.nom as medecin_nom, med.prenom as medecin_prenom
            FROM prescriptions p
            LEFT JOIN medicaments m ON p.medicament_id = m.id_medicament
            LEFT JOIN fiches_medicales fm ON p.fiche_medicale_id = fm.id_fiche
            LEFT JOIN medecins med ON fm.medecin_id = med.id_medecin
            WHERE fm.patient_id = ? 
            AND p.statut = 'active'
            AND p.date_fin >= CURDATE()
            ORDER BY p.date_debut DESC
        `;
        
        try {
            return await executeQuery(query, [patient_id]);
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des prescriptions actives: ${error.message}`);
        }
    }

    // Mettre à jour une prescription
    static async update(id, updateData) {
        const allowedFields = [
            'dosage_prescrit', 'frequence', 'duree_traitement', 'quantite_totale',
            'instructions_specifiques', 'moment_prise', 'date_debut', 'date_fin',
            'statut', 'raison_arret'
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
        
        const query = `UPDATE prescriptions SET ${fieldsToUpdate.join(', ')} WHERE id_prescription = ?`;
        
        try {
            const result = await executeQuery(query, params);
            if (result.affectedRows === 0) {
                throw new Error('Prescription non trouvée');
            }
            return await this.findById(id);
        } catch (error) {
            throw new Error(`Erreur lors de la mise à jour de la prescription: ${error.message}`);
        }
    }

    // Arrêter une prescription
    static async arreter(id, raison = '') {
        const query = `
            UPDATE prescriptions 
            SET statut = 'arretee', raison_arret = ?
            WHERE id_prescription = ?
        `;
        
        try {
            const result = await executeQuery(query, [raison, id]);
            if (result.affectedRows === 0) {
                throw new Error('Prescription non trouvée');
            }
            return { message: 'Prescription arrêtée avec succès' };
        } catch (error) {
            throw new Error(`Erreur lors de l'arrêt de la prescription: ${error.message}`);
        }
    }

    // Suspendre une prescription
    static async suspendre(id, raison = '') {
        const query = `
            UPDATE prescriptions 
            SET statut = 'suspendue', raison_arret = ?
            WHERE id_prescription = ?
        `;
        
        try {
            const result = await executeQuery(query, [raison, id]);
            if (result.affectedRows === 0) {
                throw new Error('Prescription non trouvée');
            }
            return { message: 'Prescription suspendue avec succès' };
        } catch (error) {
            throw new Error(`Erreur lors de la suspension de la prescription: ${error.message}`);
        }
    }

    // Terminer une prescription
    static async terminer(id) {
        const query = `
            UPDATE prescriptions 
            SET statut = 'terminee'
            WHERE id_prescription = ?
        `;
        
        try {
            const result = await executeQuery(query, [id]);
            if (result.affectedRows === 0) {
                throw new Error('Prescription non trouvée');
            }
            return { message: 'Prescription terminée avec succès' };
        } catch (error) {
            throw new Error(`Erreur lors de la finalisation de la prescription: ${error.message}`);
        }
    }

    // Supprimer une prescription
    static async delete(id) {
        const query = `DELETE FROM prescriptions WHERE id_prescription = ?`;
        
        try {
            const result = await executeQuery(query, [id]);
            if (result.affectedRows === 0) {
                throw new Error('Prescription non trouvée');
            }
            return { message: 'Prescription supprimée avec succès' };
        } catch (error) {
            throw new Error(`Erreur lors de la suppression de la prescription: ${error.message}`);
        }
    }

    // Vérifier les interactions médicamenteuses pour un patient
    static async checkInteractionsForPatient(patient_id) {
        const query = `
            SELECT p.id_prescription, p.medicament_id,
                   m.nom_commercial, m.denomination_commune, m.interactions
            FROM prescriptions p
            LEFT JOIN medicaments m ON p.medicament_id = m.id_medicament
            LEFT JOIN fiches_medicales fm ON p.fiche_medicale_id = fm.id_fiche
            WHERE fm.patient_id = ? 
            AND p.statut = 'active'
            AND p.date_fin >= CURDATE()
            AND m.interactions IS NOT NULL
            AND m.interactions != ''
        `;
        
        try {
            return await executeQuery(query, [patient_id]);
        } catch (error) {
            throw new Error(`Erreur lors de la vérification des interactions: ${error.message}`);
        }
    }

    // Récupérer toutes les prescriptions avec pagination
    static async getAll(whereClause = '', params = [], limit = 10, offset = 0) {
        const query = `
            SELECT 
                p.*,
                m.nom_commercial, m.denomination_commune,
                fm.patient_id, fm.date_consultation
            FROM prescriptions p
            LEFT JOIN medicaments m ON p.medicament_id = m.id_medicament
            LEFT JOIN fiches_medicales fm ON p.fiche_medicale_id = fm.id_fiche
            ${whereClause}
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?
        `;
        
        try {
            return await executeQuery(query, [...params, parseInt(limit), parseInt(offset)]);
        } catch (error) {
            console.error('Erreur lors de la récupération des prescriptions:', error);
            throw new Error('Erreur lors de la récupération des prescriptions: ' + error.message);
        }
    }

    // Compter les prescriptions
    static async count(whereClause = '', params = []) {
        const query = `
            SELECT COUNT(*) as total 
            FROM prescriptions p
            LEFT JOIN medicaments m ON p.medicament_id = m.id_medicament
            LEFT JOIN fiches_medicales fm ON p.fiche_medicale_id = fm.id_fiche
            ${whereClause || 'WHERE 1=1'}
        `;
        
        try {
            const result = await executeQuery(query, params);
            return result[0].total;
        } catch (error) {
            throw new Error(`Erreur lors du comptage: ${error.message}`);
        }
    }

    // Récupérer toutes les prescriptions avec pagination
    static async findAll(limit = 50, offset = 0, filters = {}) {
        let query = `
            SELECT p.*, 
                   fm.date_consultation, fm.diagnostic_principal,
                   pt.nom as patient_nom, pt.prenom as patient_prenom,
                   m.nom as medecin_nom, m.prenom as medecin_prenom,
                   med.nom as medicament_nom, med.categorie as medicament_categorie
            FROM prescriptions p
            LEFT JOIN fiches_medicales fm ON p.fiche_medicale_id = fm.id_fiche
            LEFT JOIN patients pt ON fm.patient_id = pt.id_patient
            LEFT JOIN medecins m ON fm.medecin_id = m.id_medecin
            LEFT JOIN medicaments med ON p.medicament_id = med.id_medicament
            WHERE 1=1
        `;
        
        const params = [];
        
        if (filters.patient_id) {
            query += ` AND pt.id_patient = ?`;
            params.push(filters.patient_id);
        }
        
        if (filters.medecin_id) {
            query += ` AND m.id_medecin = ?`;
            params.push(filters.medecin_id);
        }
        
        if (filters.date_debut) {
            query += ` AND p.date_debut >= ?`;
            params.push(filters.date_debut);
        }
        
        if (filters.date_fin) {
            query += ` AND p.date_debut <= ?`;
            params.push(filters.date_fin);
        }
        
        if (filters.statut) {
            query += ` AND p.statut = ?`;
            params.push(filters.statut);
        }
        
        query += ` ORDER BY p.date_debut DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);
        
        try {
            const prescriptions = await executeQuery(query, params);
            return prescriptions;
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des prescriptions: ${error.message}`);
        }
    }

    // Compter le nombre total de prescriptions
    static async count(filters = {}) {
        let query = `
            SELECT COUNT(*) as total 
            FROM prescriptions p
            LEFT JOIN fiches_medicales fm ON p.fiche_medicale_id = fm.id_fiche
            LEFT JOIN patients pt ON fm.patient_id = pt.id_patient
            LEFT JOIN medecins m ON fm.medecin_id = m.id_medecin
            WHERE 1=1
        `;
        const params = [];
        
        if (filters.patient_id) {
            query += ` AND pt.id_patient = ?`;
            params.push(filters.patient_id);
        }
        
        if (filters.medecin_id) {
            query += ` AND m.id_medecin = ?`;
            params.push(filters.medecin_id);
        }
        
        if (filters.date_debut) {
            query += ` AND p.date_debut >= ?`;
            params.push(filters.date_debut);
        }
        
        if (filters.date_fin) {
            query += ` AND p.date_debut <= ?`;
            params.push(filters.date_fin);
        }
        
        if (filters.statut) {
            query += ` AND p.statut = ?`;
            params.push(filters.statut);
        }
        
        try {
            const result = await executeQuery(query, params);
            return result[0].total;
        } catch (error) {
            throw new Error(`Erreur lors du comptage des prescriptions: ${error.message}`);
        }
    }

    // Statistiques des prescriptions
    static async getStatistiques(filters = {}) {
        let query = `
            SELECT 
                COUNT(*) as total_prescriptions,
                COUNT(CASE WHEN p.statut = 'active' THEN 1 END) as prescriptions_actives,
                COUNT(CASE WHEN p.statut = 'terminee' THEN 1 END) as prescriptions_terminees,
                COUNT(CASE WHEN p.statut = 'arretee' THEN 1 END) as prescriptions_arretees,
                AVG(p.duree_traitement) as duree_moyenne_traitement
            FROM prescriptions p
            LEFT JOIN fiches_medicales fm ON p.fiche_medicale_id = fm.id_fiche
            WHERE 1=1
        `;
        
        const params = [];
        
        if (filters.date_debut) {
            query += ` AND p.date_debut >= ?`;
            params.push(filters.date_debut);
        }
        
        if (filters.date_fin) {
            query += ` AND p.date_debut <= ?`;
            params.push(filters.date_fin);
        }
        
        try {
            const result = await executeQuery(query, params);
            return result[0];
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`);
        }
    }
}

module.exports = Prescription;
