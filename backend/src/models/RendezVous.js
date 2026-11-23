const { executeQuery, executeTransaction } = require('../config/database');

class RendezVous {
    // Créer un nouveau rendez-vous
    static async create(rdvData) {
        const {
            patient_id, medecin_id, centre_id, date_rdv, symptomes,
            orientation = 'generaliste', note_patient = '', duree_estimee = null,
            type_rdv = 'normal', priorite = 'normale', statut = 'attente',
            heure_arrivee = null
        } = rdvData;

        // Construire la requête dynamiquement selon les champs fournis
        const fields = ['patient_id', 'medecin_id', 'centre_id', 'date_rdv', 'symptomes', 'orientation', 'note_patient', 'duree_estimee'];
        const values = [patient_id, medecin_id, centre_id, date_rdv, JSON.stringify(symptomes), orientation, note_patient, duree_estimee];
        
        // Ajouter les champs optionnels s'ils sont fournis
        if (type_rdv !== undefined) {
            fields.push('type_rdv');
            values.push(type_rdv);
        }
        if (priorite !== undefined) {
            fields.push('priorite');
            values.push(priorite);
        }
        if (statut !== undefined) {
            fields.push('statut');
            values.push(statut);
        }
        if (heure_arrivee !== undefined && heure_arrivee !== null) {
            fields.push('heure_arrivee');
            values.push(heure_arrivee);
        }

        const query = `
            INSERT INTO rendez_vous (${fields.join(', ')})
            VALUES (${fields.map(() => '?').join(', ')})
        `;
        
        try {
            const result = await executeQuery(query, values);
            // Récupérer le rendez-vous créé avec son statut par défaut depuis la base
            const created = await this.findById(result.insertId);
            return created || { id: result.insertId, statut: statut || 'attente', ...rdvData };
        } catch (error) {
            throw new Error(`Erreur lors de la création du rendez-vous: ${error.message}`);
        }
    }

    // Récupérer un rendez-vous par ID
    static async findById(id) {
        const query = `
            SELECT rv.*, 
                   p.nom as patient_nom, p.prenom as patient_prenom, p.telephone as patient_telephone,
                   m.nom as medecin_nom, m.prenom as medecin_prenom, m.specialite,
                   cs.nom as centre_nom
            FROM rendez_vous rv
            LEFT JOIN patients p ON rv.patient_id = p.id_patient
            LEFT JOIN medecins m ON rv.medecin_id = m.id_medecin
            LEFT JOIN centres_sante cs ON rv.centre_id = cs.id_centre
            WHERE rv.id_rdv = ?
        `;
        
        try {
            const rdvs = await executeQuery(query, [id]);
            return rdvs[0] || null;
        } catch (error) {
            throw new Error(`Erreur lors de la récupération du rendez-vous: ${error.message}`);
        }
    }

    // Récupérer tous les rendez-vous avec pagination
    static async findAll(limit = 50, offset = 0, filters = {}) {
        let query = `
            SELECT
                   rv.id_rdv as id,
                   rv.id_rdv,
                   rv.patient_id,
                   rv.medecin_id,
                   rv.centre_id,
                   rv.date_rdv,
                   DATE_FORMAT(rv.date_rdv, '%Y-%m-%d') as date,
                   TIME_FORMAT(rv.date_rdv, '%H:%i') as heure_rdv,
                   rv.statut,
                   rv.orientation,
                   rv.note_medecin,
                   rv.note_patient,
                   rv.duree_estimee,
                   rv.duree_reelle,
                   rv.heure_arrivee,
                   rv.heure_debut_consultation,
                   rv.heure_fin_consultation,
                   rv.created_at,
                   p.nom as patient_nom, 
                   p.prenom as patient_prenom,
                   CONCAT(m.prenom, ' ', m.nom) as medecin,
                   m.specialite,
                   cs.nom as centre_nom,
                   JSON_UNQUOTE(JSON_EXTRACT(rv.symptomes, '$.motif')) as motif,
                   JSON_EXTRACT(rv.symptomes, '$.symptomes') as symptomes_array,
                   JSON_UNQUOTE(JSON_EXTRACT(rv.symptomes, '$.intensite')) as intensite
            FROM rendez_vous rv
            LEFT JOIN patients p ON rv.patient_id = p.id_patient
            LEFT JOIN medecins m ON rv.medecin_id = m.id_medecin
            LEFT JOIN centres_sante cs ON rv.centre_id = cs.id_centre
            WHERE 1=1
        `;
        
        const params = [];
        
        // Filtres
        if (filters.centre_id) {
            query += ` AND rv.centre_id = ?`;
            params.push(filters.centre_id);
        }
        
        if (filters.medecin_id) {
            query += ` AND rv.medecin_id = ?`;
            params.push(filters.medecin_id);
        }
        
        if (filters.patient_id) {
            query += ` AND rv.patient_id = ?`;
            params.push(filters.patient_id);
        }
        
        if (filters.statut) {
            query += ` AND rv.statut = ?`;
            params.push(filters.statut);
        }
        
        if (filters.date_debut) {
            query += ` AND DATE(rv.date_rdv) >= ?`;
            params.push(filters.date_debut);
        }
        
        if (filters.date_fin) {
            query += ` AND DATE(rv.date_rdv) <= ?`;
            params.push(filters.date_fin);
        }

        if (filters.q) {
            query += ` AND (p.nom LIKE ? OR p.prenom LIKE ? OR m.nom LIKE ? OR m.prenom LIKE ?)`;
            params.push(`%${filters.q}%`, `%${filters.q}%`, `%${filters.q}%`, `%${filters.q}%`);
        }
        
        query += ` ORDER BY rv.date_rdv DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);
        
        try {
            const rdvs = await executeQuery(query, params);
            return rdvs;
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des rendez-vous: ${error.message}`);
        }
    }

    // Mettre à jour un rendez-vous
    static async update(id, updateData) {
        // Vérifier le statut actuel du RDV avant de permettre la modification
        const rdvActuel = await this.findById(id);
        if (!rdvActuel) {
            throw new Error('Rendez-vous non trouvé');
        }
        
        // Empêcher la modification d'un RDV confirmé, en cours ou terminé
        // Seuls les RDV en attente peuvent être modifiés par le patient
        if (rdvActuel.statut === 'confirme' || rdvActuel.statut === 'en_cours' || rdvActuel.statut === 'termine') {
            throw new Error('Vous ne pouvez pas modifier un rendez-vous déjà confirmé, en cours ou terminé. Veuillez contacter le centre de santé pour toute modification.');
        }
        
        // Si le statut n'est pas 'attente', empêcher la modification
        if (rdvActuel.statut !== 'attente') {
            throw new Error('Seuls les rendez-vous en attente peuvent être modifiés.');
        }
        
        const allowedFields = [
            'date_rdv', 'medecin_id', 'statut', 'symptomes', 'orientation', 'note_medecin',
            'note_patient', 'duree_estimee', 'duree_reelle', 'heure_arrivee',
            'heure_debut_consultation', 'heure_fin_consultation'
        ];
        
        const fieldsToUpdate = [];
        const params = [];
        
        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                if (field === 'symptomes') {
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
        
        const query = `UPDATE rendez_vous SET ${fieldsToUpdate.join(', ')} WHERE id_rdv = ?`;
        
        try {
            const result = await executeQuery(query, params);
            if (result.affectedRows === 0) {
                throw new Error('Rendez-vous non trouvé');
            }
            return await this.findById(id);
        } catch (error) {
            throw new Error(`Erreur lors de la mise à jour du rendez-vous: ${error.message}`);
        }
    }

    // Annuler un rendez-vous
    static async annuler(id, raison = '') {
        const query = `
            UPDATE rendez_vous 
            SET statut = 'annule', note_patient = CONCAT(IFNULL(note_patient, ''), ' - Annulé: ', ?)
            WHERE id_rdv = ?
        `;
        
        try {
            const result = await executeQuery(query, [raison, id]);
            if (result.affectedRows === 0) {
                throw new Error('Rendez-vous non trouvé');
            }
            return { message: 'Rendez-vous annulé avec succès' };
        } catch (error) {
            throw new Error(`Erreur lors de l'annulation: ${error.message}`);
        }
    }

    // Confirmer un rendez-vous
    static async confirmer(id, duree_estimee = null) {
        // Si une durée est fournie, l'utiliser, sinon utiliser une valeur par défaut de 15 minutes
        const duree = duree_estimee || 15;
        
        const query = `UPDATE rendez_vous SET statut = 'confirme', duree_estimee = ? WHERE id_rdv = ?`;
        
        try {
            const result = await executeQuery(query, [duree, id]);
            if (result.affectedRows === 0) {
                throw new Error('Rendez-vous non trouvé');
            }
            return { message: 'Rendez-vous confirmé avec succès', duree_estimee: duree };
        } catch (error) {
            throw new Error(`Erreur lors de la confirmation: ${error.message}`);
        }
    }

    // Marquer un rendez-vous comme terminé et réajuster les créneaux suivants
    static async terminer(id, duree_reelle, note_medecin = '') {
        try {
            // 1. Récupérer les infos du RDV avant mise à jour
            const rdvInfo = await this.findById(id);
            if (!rdvInfo) {
                throw new Error('Rendez-vous non trouvé');
            }

            // 2. Calculer l'heure réelle de fin
            const heureDebut = rdvInfo.heure_debut_consultation || rdvInfo.date_rdv;
            const dureeEstimee = rdvInfo.duree_estimee || 30;
            const dureeReelleMinutes = duree_reelle || dureeEstimee;
            
            // 3. Marquer comme terminé
            const updateQuery = `
                UPDATE rendez_vous 
                SET statut = 'termine', duree_reelle = ?, note_medecin = ?, heure_fin_consultation = NOW()
                WHERE id_rdv = ?
            `;
            const result = await executeQuery(updateQuery, [duree_reelle, note_medecin, id]);
            if (result.affectedRows === 0) {
                throw new Error('Rendez-vous non trouvé');
            }

            // 4. Réajuster les créneaux suivants si différence significative (> 10 min)
            const difference = dureeReelleMinutes - dureeEstimee;
            if (Math.abs(difference) > 10) {
                await this.reajusterCreneauxSuivants(id, rdvInfo.medecin_id, dureeReelleMinutes - dureeEstimee);
            }

            return { 
                message: 'Rendez-vous marqué comme terminé',
                reajustement: Math.abs(difference) > 10 ? 'Créneaux suivants réajustés' : null
            };
        } catch (error) {
            throw new Error(`Erreur lors de la finalisation: ${error.message}`);
        }
    }

    // Réajuster les créneaux suivants d'un médecin après un retard/avance
    static async reajusterCreneauxSuivants(rdvIdTermine, medecin_id, delaiMinutes) {
        try {
            // Récupérer l'heure de fin réelle du RDV terminé
            const rdvTermine = await this.findById(rdvIdTermine);
            if (!rdvTermine) return { ajustes: 0, message: 'RDV terminé non trouvé' };

            // Utiliser heure_fin_consultation si disponible, sinon calculer depuis date_rdv + duree
            let heureFinReelle;
            if (rdvTermine.heure_fin_consultation) {
                heureFinReelle = new Date(rdvTermine.heure_fin_consultation);
            } else {
                // Calculer depuis date_rdv + duree réelle (ou estimée)
                const dateRdv = new Date(rdvTermine.date_rdv);
                const dureeMinutes = rdvTermine.duree_reelle || rdvTermine.duree_estimee || 30;
                heureFinReelle = new Date(dateRdv.getTime() + dureeMinutes * 60 * 1000);
            }
            
            // Trouver tous les RDV suivants du même médecin pour aujourd'hui
            const query = `
                SELECT id_rdv, date_rdv, duree_estimee, patient_id
                FROM rendez_vous
                WHERE medecin_id = ?
                AND DATE(date_rdv) = DATE(?)
                AND id_rdv != ?
                AND statut IN ('attente', 'confirme')
                AND date_rdv >= ?
                ORDER BY date_rdv ASC
            `;
            
            const rdvSuivants = await executeQuery(query, [
                medecin_id,
                heureFinReelle,
                rdvIdTermine,
                heureFinReelle
            ]);

            if (rdvSuivants.length === 0) {
                return { ajustes: 0, message: 'Aucun RDV suivant à réajuster' };
            }

            let heureProchaine = new Date(heureFinReelle);
            let ajustes = 0;
            const rdvAjustes = [];

            // Réajuster chaque RDV suivant
            for (const rdv of rdvSuivants) {
                const dateOriginale = new Date(rdv.date_rdv);
                
                // Nouvelle heure = heure de fin précédente + 5 minutes de pause
                heureProchaine = new Date(heureProchaine.getTime() + (5 * 60 * 1000)); // 5 min pause
                
                // Si l'heure proposée est différente de l'originale de plus de 5 minutes
                const diffMinutes = (heureProchaine.getTime() - dateOriginale.getTime()) / (1000 * 60);
                
                if (Math.abs(diffMinutes) > 5) {
                    // Mettre à jour l'heure du RDV
                    const updateQuery = `
                        UPDATE rendez_vous
                        SET date_rdv = ?
                        WHERE id_rdv = ?
                    `;
                    await executeQuery(updateQuery, [heureProchaine, rdv.id_rdv]);
                    
                    rdvAjustes.push({
                        id: rdv.id_rdv,
                        heure_originale: dateOriginale,
                        nouvelle_heure: heureProchaine,
                        delai: diffMinutes > 0 ? `+${Math.round(diffMinutes)} min` : `${Math.round(diffMinutes)} min`
                    });
                    ajustes++;
                }
                
                // Pour le prochain RDV, utiliser la fin de celui-ci
                heureProchaine = new Date(heureProchaine.getTime() + ((rdv.duree_estimee || 30) * 60 * 1000));
            }

            return {
                ajustes,
                rdvAjustes,
                message: `${ajustes} RDV réajusté(s)`
            };
        } catch (error) {
            console.error('Erreur réajustement créneaux:', error);
            throw new Error(`Erreur lors du réajustement: ${error.message}`);
        }
    }

    // Marquer l'arrivée du patient et vérifier si réajustement nécessaire
    static async checkin(id) {
        try {
            // Récupérer les infos du RDV
            const rdvInfo = await this.findById(id);
            if (!rdvInfo) {
                throw new Error('Rendez-vous non trouvé');
            }

            // Si le statut est 'attente', le passer à 'confirme' lors du check-in
            // Sinon, garder le statut actuel (s'il est déjà confirmé)
            const nouveauStatut = rdvInfo.statut === 'attente' ? 'confirme' : rdvInfo.statut;

            // Marquer l'arrivée, mettre à jour le statut et définir priorité par défaut
            const query = `
                UPDATE rendez_vous
                SET heure_arrivee = NOW(), 
                    statut = ?,
                    priorite = COALESCE(priorite, 'normale')
                WHERE id_rdv = ?
            `;
            const result = await executeQuery(query, [nouveauStatut, id]);
            if (result.affectedRows === 0) throw new Error('Rendez-vous non trouvé');

            // Vérifier si le patient arrive en avance ou en retard significatif (> 15 min)
            const dateRdv = new Date(rdvInfo.date_rdv);
            const maintenant = new Date();
            const diffMinutes = (maintenant.getTime() - dateRdv.getTime()) / (1000 * 60);

            let reajustement = null;
            
            // Si retard significatif (> 15 min), réajuster les RDV suivants
            if (diffMinutes > 15) {
                // Retard : recalculer les RDV suivants du même médecin
                const ajustement = await this.reajusterCreneauxSuivants(
                    id, 
                    rdvInfo.medecin_id, 
                    diffMinutes
                );
                reajustement = {
                    type: 'retard',
                    minutes: Math.round(diffMinutes),
                    rdvAjustes: ajustement.ajustes || 0
                };
            } else if (diffMinutes < -30) {
                // Avance importante : log seulement (à implémenter selon les besoins)
                reajustement = {
                    type: 'avance',
                    minutes: Math.round(Math.abs(diffMinutes)),
                    message: 'Patient arrivé très en avance'
                };
            }

            return { 
                message: nouveauStatut === 'confirme' 
                    ? 'Patient enregistré et rendez-vous confirmé' 
                    : 'Patient enregistré en file d\'attente',
                statut: nouveauStatut,
                reajustement
            };
        } catch (error) {
            throw new Error(`Erreur lors du check-in: ${error.message}`);
        }
    }

    // Marquer un patient comme absent
    static async marquerAbsent(id, note = '') {
        try {
            const query = `
                UPDATE rendez_vous
                SET statut = 'absent', 
                    note_annulation = ?
                WHERE id_rdv = ?
            `;
            const noteComplete = note || 'Patient marqué absent - Non présentation au RDV';
            const result = await executeQuery(query, [noteComplete, id]);
            
            if (result.affectedRows === 0) {
                throw new Error('Rendez-vous non trouvé');
            }
            
            return { 
                message: 'Patient marqué comme absent',
                note: noteComplete
            };
        } catch (error) {
            throw new Error(`Erreur lors du marquage absent: ${error.message}`);
        }
    }

    // Démarrer la consultation
    static async demarrer(id) {
        const query = `
            UPDATE rendez_vous
            SET statut = 'en_cours', heure_debut_consultation = NOW()
            WHERE id_rdv = ?`;
        try {
            const result = await executeQuery(query, [id]);
            if (result.affectedRows === 0) throw new Error('Rendez-vous non trouvé');
            return { message: 'Consultation démarrée' };
        } catch (error) {
            throw new Error(`Erreur lors du démarrage: ${error.message}`);
        }
    }

    // Prochain en file d'attente pour un centre (ordre par heure d'arrivée puis date rdv)
    static async getNextInQueue(centre_id) {
        const query = `
            SELECT rv.*, p.nom as patient_nom, p.prenom as patient_prenom
            FROM rendez_vous rv
            LEFT JOIN patients p ON rv.patient_id = p.id_patient
            WHERE rv.centre_id = ? AND rv.statut = 'attente'
            ORDER BY COALESCE(rv.heure_arrivee, rv.date_rdv) ASC
            LIMIT 1`;
        try {
            const rows = await executeQuery(query, [centre_id]);
            return rows[0] || null;
        } catch (error) {
            throw new Error(`Erreur récupération prochain RDV: ${error.message}`);
        }
    }

    // Récupérer les rendez-vous du jour
    static async getRendezVousDuJour(centre_id = null) {
        let query = `
            SELECT rv.*, 
                   p.nom as patient_nom, p.prenom as patient_prenom,
                   m.nom as medecin_nom, m.prenom as medecin_prenom, m.specialite
            FROM rendez_vous rv
            LEFT JOIN patients p ON rv.patient_id = p.id_patient
            LEFT JOIN medecins m ON rv.medecin_id = m.id_medecin
            WHERE DATE(rv.date_rdv) = CURDATE()
        `;
        
        const params = [];
        
        if (centre_id) {
            query += ` AND rv.centre_id = ?`;
            params.push(centre_id);
        }
        
        query += ` ORDER BY rv.date_rdv ASC`;
        
        try {
            return await executeQuery(query, params);
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des RDV du jour: ${error.message}`);
        }
    }

    // Récupérer les rendez-vous d'un médecin pour une date
    static async getRendezVousMedecin(medecin_id, date) {
        const query = `
            SELECT rv.*, 
                   p.nom as patient_nom, p.prenom as patient_prenom,
                   p.telephone as patient_telephone
            FROM rendez_vous rv
            LEFT JOIN patients p ON rv.patient_id = p.id_patient
            WHERE rv.medecin_id = ? AND DATE(rv.date_rdv) = ?
            ORDER BY rv.date_rdv ASC
        `;
        
        try {
            return await executeQuery(query, [medecin_id, date]);
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des RDV du médecin: ${error.message}`);
        }
    }

    // Vérifier la disponibilité d'un créneau
    // Vérifie qu'il n'y a pas de chevauchement avec les RDV existants
    // Inclut tous les statuts actifs : attente, confirme, en_cours (pour éviter les chevauchements)
    static async verifierDisponibilite(medecin_id, date_rdv, duree_estimee) {
        // date_rdv est au format DATETIME (YYYY-MM-DD HH:MM:SS)
        const dureeMinutes = duree_estimee || 30;
        
        // Vérifier les chevauchements avec tous les RDV actifs
        // Deux RDV se chevauchent si : (nouveauDebut < existantFin) ET (nouveauFin > existantDebut)
        const query = `
            SELECT COUNT(*) as conflits
            FROM rendez_vous
            WHERE medecin_id = ? 
            AND DATE(date_rdv) = DATE(?)
            AND statut NOT IN ('annule', 'termine', 'absent')
            AND (
                -- Chevauchement détecté si :
                -- Le nouveau RDV commence avant la fin d'un RDV existant
                -- ET le nouveau RDV se termine après le début d'un RDV existant
                (? < DATE_ADD(date_rdv, INTERVAL COALESCE(duree_estimee, 30) MINUTE)
                 AND DATE_ADD(?, INTERVAL ? MINUTE) > date_rdv)
            )
        `;
        
        const params = [
            medecin_id, 
            date_rdv,      // Pour DATE() comparison
            date_rdv,      // Nouveau début (pour comparaison <)
            date_rdv,      // Nouveau début (pour DATE_ADD)
            dureeMinutes   // Durée du nouveau RDV
        ];
        
        try {
            const result = await executeQuery(query, params);
            const hasConflit = result[0].conflits > 0;
            
            if (hasConflit) {
                console.log(`⚠️ Conflit détecté pour médecin ${medecin_id} à ${date_rdv} (durée: ${dureeMinutes} min)`);
            }
            
            return !hasConflit;
        } catch (error) {
            throw new Error(`Erreur lors de la vérification de disponibilité: ${error.message}`);
        }
    }

    // Compter le nombre total de rendez-vous
    static async count(filters = {}) {
        let query = `SELECT COUNT(*) as total FROM rendez_vous WHERE 1=1`;
        const params = [];
        
        if (filters.centre_id) {
            query += ` AND centre_id = ?`;
            params.push(filters.centre_id);
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

    // Récupérer les statistiques des rendez-vous
    static async getStatistiques(centre_id = null, periode = 'jour') {
        let dateFilter = '';
        const params = [];
        
        switch (periode) {
            case 'jour':
                dateFilter = 'AND DATE(date_rdv) = CURDATE()';
                break;
            case 'semaine':
                dateFilter = 'AND YEARWEEK(date_rdv) = YEARWEEK(CURDATE())';
                break;
            case 'mois':
                dateFilter = 'AND MONTH(date_rdv) = MONTH(CURDATE()) AND YEAR(date_rdv) = YEAR(CURDATE())';
                break;
        }
        
        if (centre_id) {
            dateFilter += ' AND centre_id = ?';
            params.push(centre_id);
        }
        
        const query = `
            SELECT 
                statut,
                COUNT(*) as total,
                AVG(duree_reelle) as duree_moyenne
            FROM rendez_vous
            WHERE 1=1 ${dateFilter}
            GROUP BY statut
        `;
        
        try {
            return await executeQuery(query, params);
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`);
        }
    }
}

module.exports = RendezVous;
