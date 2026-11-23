const { executeQuery, executeTransaction } = require('../config/database');

class Medecin {
    // Créer un nouveau médecin
    static async create(medecinData) {
        const {
            nom, prenom, sexe, date_naissance, specialite, experience = null,
            diplome = null, numero_licence, telephone, email, centre_id, user_id = null,
            statut = 'actif'
            // Note: date_embauche n'existe pas dans la table medecins, on l'ignore
        } = medecinData;

        console.log('📋 Création médecin avec données:', { nom, prenom, sexe, date_naissance, specialite, numero_licence, telephone, email, centre_id, user_id, statut });

        // Construire la requête dynamiquement selon les champs disponibles
        // Les champs requis dans la table medecins sont : nom, prenom, sexe, date_naissance, specialite, numero_licence, telephone, email, centre_id, statut
        const fields = ['nom', 'prenom', 'sexe', 'date_naissance', 'specialite', 'numero_licence', 'telephone', 'email', 'centre_id', 'statut'];
        const values = [nom, prenom, sexe, date_naissance, specialite, numero_licence, telephone, email, centre_id, statut];
        const placeholders = ['?', '?', '?', '?', '?', '?', '?', '?', '?', '?'];
        
        // Ajouter les champs optionnels s'ils sont présents
        if (experience !== null && experience !== undefined) {
            fields.push('experience');
            values.push(experience);
            placeholders.push('?');
        }
        if (diplome !== null && diplome !== undefined && diplome !== '') {
            fields.push('diplome');
            values.push(diplome);
            placeholders.push('?');
        }
        if (user_id !== null && user_id !== undefined) {
            fields.push('user_id');
            values.push(user_id);
            placeholders.push('?');
        }
        // date_embauche n'existe pas dans la table, on ne l'inclut pas

        const query = `
            INSERT INTO medecins (${fields.join(', ')})
            VALUES (${placeholders.join(', ')})
        `;
        
        console.log('📋 Requête SQL:', query);
        console.log('📋 Paramètres:', values);
        
        try {
            const result = await executeQuery(query, values);
            const insertedId = result.insertId;
            console.log('✅ Médecin inséré avec ID:', insertedId);
            return { id_medecin: insertedId, id: insertedId, ...medecinData };
        } catch (error) {
            console.error('❌ Erreur SQL lors de la création du médecin:', error);
            console.error('❌ Code erreur:', error.code);
            console.error('❌ Message erreur:', error.message);
            throw new Error(`Erreur lors de la création du médecin: ${error.message}`);
        }
    }

    // Récupérer un médecin par ID
    static async findById(id) {
        let query = `
            SELECT m.*, cs.nom as centre_nom, r.nom as region_nom, u.nom_utilisateur,
                   COALESCE(m.statut_operationnel, 'disponible') as statut_operationnel
        `;
        
        // Ajouter gestion_dynamique_statut si la colonne existe
        try {
            query = `
                SELECT m.*, cs.nom as centre_nom, r.nom as region_nom, u.nom_utilisateur,
                       COALESCE(m.statut_operationnel, 'disponible') as statut_operationnel,
                       COALESCE(m.gestion_dynamique_statut, TRUE) as gestion_dynamique_statut
            `;
        } catch (e) {
            // Colonne n'existe pas encore, continuer sans
        }
        
        query += `
            FROM medecins m
            LEFT JOIN centres_sante cs ON m.centre_id = cs.id_centre
            LEFT JOIN regions r ON cs.region_id = r.id_region
            LEFT JOIN utilisateurs u ON m.user_id = u.id_user
            WHERE m.id_medecin = ?
        `;
        
        try {
            const medecins = await executeQuery(query, [id]);
            return medecins[0] || null;
        } catch (error) {
            throw new Error(`Erreur lors de la récupération du médecin: ${error.message}`);
        }
    }
    
    // Mettre à jour le statut opérationnel d'un médecin
    static async updateStatutOperationnel(id_medecin, statut_operationnel) {
        const validStatuses = ['disponible', 'en_consultation', 'pause', 'indisponible'];
        if (!validStatuses.includes(statut_operationnel)) {
            throw new Error(`Statut opérationnel invalide. Valeurs acceptées: ${validStatuses.join(', ')}`);
        }
        
        const query = `
            UPDATE medecins 
            SET statut_operationnel = ?, updated_at = NOW()
            WHERE id_medecin = ?
        `;
        
        try {
            const result = await executeQuery(query, [statut_operationnel, id_medecin]);
            if (result.affectedRows === 0) {
                throw new Error('Médecin non trouvé');
            }
            return await this.findById(id_medecin);
        } catch (error) {
            throw new Error(`Erreur lors de la mise à jour du statut opérationnel: ${error.message}`);
        }
    }
    
    // Récupérer le statut opérationnel d'un médecin par user_id
    static async getStatutOperationnelByUserId(user_id) {
        const query = `
            SELECT m.id_medecin, COALESCE(m.statut_operationnel, 'disponible') as statut_operationnel
            FROM medecins m
            WHERE m.user_id = ? AND m.statut = 'actif'
        `;
        
        try {
            const result = await executeQuery(query, [user_id]);
            return result[0] || null;
        } catch (error) {
            throw new Error(`Erreur lors de la récupération du statut opérationnel: ${error.message}`);
        }
    }

    // Récupérer tous les médecins avec pagination
    static async findAll(limit = 50, offset = 0, filters = {}) {
        let query = `
            SELECT m.*, cs.nom as centre_nom, r.nom as region_nom
            FROM medecins m
            LEFT JOIN centres_sante cs ON m.centre_id = cs.id_centre
            LEFT JOIN regions r ON cs.region_id = r.id_region
            WHERE 1=1
        `;
        
        const params = [];
        
        // Filtres
        if (filters.centre_id) {
            query += ` AND m.centre_id = ?`;
            params.push(filters.centre_id);
        }
        
        if (filters.specialite) {
            query += ` AND m.specialite = ?`;
            params.push(filters.specialite);
        }
        
        if (filters.statut) {
            query += ` AND m.statut = ?`;
            params.push(filters.statut);
        }
        
        if (filters.nom) {
            query += ` AND (m.nom LIKE ? OR m.prenom LIKE ?)`;
            params.push(`%${filters.nom}%`, `%${filters.nom}%`);
        }
        
        query += ` ORDER BY m.nom, m.prenom LIMIT ? OFFSET ?`;
        params.push(limit, offset);
        
        try {
            const medecins = await executeQuery(query, params);
            return medecins;
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des médecins: ${error.message}`);
        }
    }

    // Mettre à jour un médecin
    static async update(id, updateData) {
        const allowedFields = [
            'nom', 'prenom', 'sexe', 'date_naissance', 'specialite', 'experience',
            'diplome', 'numero_licence', 'telephone', 'email', 'centre_id', 'statut',
            'statut_operationnel'
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
        
        const query = `UPDATE medecins SET ${fieldsToUpdate.join(', ')} WHERE id_medecin = ?`;
        
        try {
            const result = await executeQuery(query, params);
            if (result.affectedRows === 0) {
                throw new Error('Médecin non trouvé');
            }
            return await this.findById(id);
        } catch (error) {
            throw new Error(`Erreur lors de la mise à jour du médecin: ${error.message}`);
        }
    }

    // Supprimer un médecin (soft delete)
    static async delete(id) {
        const query = `UPDATE medecins SET statut = 'inactif' WHERE id_medecin = ?`;
        
        try {
            const result = await executeQuery(query, [id]);
            if (result.affectedRows === 0) {
                throw new Error('Médecin non trouvé');
            }
            return { message: 'Médecin supprimé avec succès' };
        } catch (error) {
            throw new Error(`Erreur lors de la suppression du médecin: ${error.message}`);
        }
    }

    // Rechercher des médecins
    static async search(searchTerm, limit = 20) {
        const query = `
            SELECT m.*, cs.nom as centre_nom
            FROM medecins m
            LEFT JOIN centres_sante cs ON m.centre_id = cs.id_centre
            WHERE m.statut = 'actif' 
            AND (m.nom LIKE ? OR m.prenom LIKE ? OR m.specialite LIKE ? OR m.numero_licence LIKE ?)
            ORDER BY m.nom, m.prenom
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

    // Récupérer les médecins par spécialité
    static async findBySpecialite(specialite) {
        const query = `
            SELECT m.*, cs.nom as centre_nom
            FROM medecins m
            LEFT JOIN centres_sante cs ON m.centre_id = cs.id_centre
            WHERE m.specialite = ? AND m.statut = 'actif'
            ORDER BY m.nom, m.prenom
        `;
        
        try {
            return await executeQuery(query, [specialite]);
        } catch (error) {
            throw new Error(`Erreur lors de la récupération par spécialité: ${error.message}`);
        }
    }

    // Récupérer les médecins par centre
    static async findByCentre(centreId, disponibleOnly = false, dateRdv = null, heureRdv = null, excludeRdvId = null) {
        let query = `
            SELECT m.*, cs.nom as centre_nom,
                   COALESCE(m.statut_operationnel, 'disponible') as statut_operationnel,
                   m.horaires_medecin, m.disponibilite
            FROM medecins m
            LEFT JOIN centres_sante cs ON m.centre_id = cs.id_centre
            WHERE m.centre_id = ? AND m.statut = 'actif'
        `;
        
        const params = [centreId];
        
        // Si date et heure sont fournies, filtrer selon les disponibilités
        if (dateRdv && heureRdv) {
            // Combiner date et heure en DATETIME (format MySQL: YYYY-MM-DD HH:MM:SS)
            let heure = heureRdv.includes(':') ? heureRdv : `${heureRdv}:00`;
            // S'assurer que l'heure a le format HH:MM:SS
            if (heure.split(':').length === 2) {
                heure = `${heure}:00`;
            }
            const dateTimeRdv = `${dateRdv} ${heure}`;
            
            // Durée minimale de sécurité pour bloquer les créneaux (15 minutes par défaut)
            // Cette durée est utilisée pour bloquer les créneaux jusqu'à ce que le médecin confirme le RDV
            const dureeMinSecurite = 15;
            
            console.log(`🔍 Vérification disponibilité médecin - dateTimeRdv: ${dateTimeRdv}, durée min sécurité: ${dureeMinSecurite} min`);
            
            // Vérifier qu'il n'y a pas de chevauchement avec un rendez-vous existant
            // Deux rendez-vous se chevauchent si :
            // - Le nouveau RDV commence avant la fin d'un RDV existant
            // - ET le nouveau RDV se termine après le début d'un RDV existant
            // Pour les RDV non confirmés (duree_estimee = NULL), utiliser 15 minutes par défaut
            // Exclure le RDV en cours de modification (excludeRdvId) du calcul de disponibilité
            query += `
                -- Vérifier qu'il n'y a pas de chevauchement avec un rendez-vous existant
                AND NOT EXISTS (
                    SELECT 1 FROM rendez_vous rv
                    WHERE rv.medecin_id = m.id_medecin
                    AND DATE(rv.date_rdv) = DATE(?)
                    AND rv.statut NOT IN ('annule', 'termine')
                    ${excludeRdvId ? 'AND rv.id_rdv != ?' : ''}
                    AND (
                        -- Condition de chevauchement : 
                        -- Le nouveau RDV commence avant la fin du RDV existant
                        -- ET le nouveau RDV se termine après le début du RDV existant
                        (? < DATE_ADD(rv.date_rdv, INTERVAL COALESCE(rv.duree_estimee, ?) MINUTE)
                         AND DATE_ADD(?, INTERVAL ? MINUTE) > rv.date_rdv)
                    )
                )
                -- Note: On ne filtre PAS sur statut_operationnel ici car il représente
                -- la disponibilité ACTUELLE du médecin, pas sa disponibilité future.
                -- Le filtrage se fait uniquement sur les horaires de travail et les RDV existants.
            `;
            params.push(
                dateTimeRdv          // Pour DATE() comparison
            );
            if (excludeRdvId) {
                params.push(excludeRdvId); // Exclure le RDV en cours de modification
            }
            params.push(
                dateTimeRdv,          // Début du nouveau RDV (pour vérifier < fin RDV existant)
                dureeMinSecurite,     // Durée par défaut pour COALESCE (si duree_estimee est NULL)
                dateTimeRdv,          // Début du nouveau RDV (pour DATE_ADD)
                dureeMinSecurite      // Durée minimale de sécurité pour le nouveau RDV (15 min)
            );
        } else if (disponibleOnly) {
            // Note: On ne filtre PAS sur statut_operationnel (disponible actuellement)
            // car pour la prise de RDV, ce qui compte c'est la disponibilité FUTURE.
            // Les filtres pertinents sont:
            // 1. Statut système (actif/inactif) - déjà appliqué dans WHERE
            // 2. Horaires de travail - vérifiés côté client ou avec date/heure
            // 3. RDV existants - vérifiés avec date/heure spécifiques
        }
        
        query += ` ORDER BY m.nom, m.prenom`;
        
        try {
            let results = await executeQuery(query, params);
            
            // Log pour déboguer les chevauchements
            if (dateRdv && heureRdv) {
                console.log(`📊 Médecins disponibles après vérification chevauchement pour ${dateRdv} ${heureRdv}: ${results.length}`);
            }
            
            // Si date et heure sont fournies, filtrer aussi selon les horaires de travail
            if (dateRdv && heureRdv) {
                const dateObj = new Date(dateRdv + 'T00:00:00');
                const jourSemaine = dateObj.getDay(); // 0 = Dimanche, 1 = Lundi, etc.
                const joursMap = {
                    0: 'dimanche',
                    1: 'lundi',
                    2: 'mardi',
                    3: 'mercredi',
                    4: 'jeudi',
                    5: 'vendredi',
                    6: 'samedi'
                };
                const jourNom = joursMap[jourSemaine];
                
                // Parser l'heure (format HH:MM ou HH:MM:SS)
                const heureParts = heureRdv.split(':');
                const heureRdvStr = `${heureParts[0]}:${heureParts[1]}`;
                
                // Fonction pour comparer les heures
                const compareHeures = (h1, h2) => {
                    const [h1h, h1m] = h1.split(':').map(Number);
                    const [h2h, h2m] = h2.split(':').map(Number);
                    const t1 = h1h * 60 + h1m;
                    const t2 = h2h * 60 + h2m;
                    return t1 - t2;
                };
                
                // Filtrer les médecins qui travaillent à cette heure
                results = results.filter(medecin => {
                    // Récupérer les horaires
                    let horaires = null;
                    try {
                        if (medecin.horaires_medecin) {
                            horaires = typeof medecin.horaires_medecin === 'string' 
                                ? JSON.parse(medecin.horaires_medecin) 
                                : medecin.horaires_medecin;
                        } else if (medecin.disponibilite) {
                            horaires = typeof medecin.disponibilite === 'string' 
                                ? JSON.parse(medecin.disponibilite) 
                                : medecin.disponibilite;
                        }
                    } catch (e) {
                        console.warn(`⚠️ Erreur parsing horaires pour médecin ${medecin.id_medecin}:`, e.message);
                    }
                    
                    // Si pas d'horaires configurés, accepter le médecin (compatibilité)
                    if (!horaires || typeof horaires !== 'object') {
                        console.log(`⚠️ Pas d'horaires pour Dr. ${medecin.prenom} ${medecin.nom}, accepté par défaut`);
                        return true;
                    }
                    
                    // Vérifier le jour
                    const horaireJour = horaires[jourNom];
                    if (!horaireJour || !horaireJour.actif) {
                        console.log(`❌ Dr. ${medecin.prenom} ${medecin.nom} ne travaille pas le ${jourNom}`);
                        return false;
                    }
                    
                    // Vérifier que l'heure est dans les horaires de travail
                    const heureDebut = horaireJour.debut || '08:00';
                    const heureFin = horaireJour.fin || '17:00';
                    
                    if (compareHeures(heureRdvStr, heureDebut) < 0) {
                        console.log(`❌ Dr. ${medecin.prenom} ${medecin.nom}: ${heureRdvStr} < ${heureDebut} (début)`);
                        return false;
                    }
                    
                    if (compareHeures(heureRdvStr, heureFin) > 0) {
                        console.log(`❌ Dr. ${medecin.prenom} ${medecin.nom}: ${heureRdvStr} > ${heureFin} (fin)`);
                        return false;
                    }
                    
                    // Vérifier si on est dans une période de pause
                    if (horaireJour.pause_debut && horaireJour.pause_fin) {
                        const pauseDebut = horaireJour.pause_debut;
                        const pauseFin = horaireJour.pause_fin;
                        if (compareHeures(heureRdvStr, pauseDebut) >= 0 && compareHeures(heureRdvStr, pauseFin) <= 0) {
                            console.log(`❌ Dr. ${medecin.prenom} ${medecin.nom}: ${heureRdvStr} est en pause (${pauseDebut}-${pauseFin})`);
                            return false;
                        }
                    }
                    
                    console.log(`✅ Dr. ${medecin.prenom} ${medecin.nom} travaille le ${jourNom} de ${heureDebut} à ${heureFin}, disponible à ${heureRdvStr}`);
                    return true;
                });
            }
            
            // Log pour déboguer
            if (dateRdv && heureRdv) {
                console.log(`📊 Médecins trouvés pour ${dateRdv} ${heureRdv}:`, results.length);
                results.forEach(m => {
                    console.log(`  - Dr. ${m.prenom} ${m.nom}: statut=${m.statut_operationnel || 'NULL'}, actif=${m.statut}`);
                });
            }
            
            // Retirer les colonnes horaires du résultat final (pour ne pas les exposer)
            results = results.map(m => {
                const { horaires_medecin, disponibilite, ...rest } = m;
                return rest;
            });
            
            return results;
        } catch (error) {
            throw new Error(`Erreur lors de la récupération par centre: ${error.message}`);
        }
    }

    // Compter le nombre total de médecins
    static async count(filters = {}) {
        let query = `SELECT COUNT(*) as total FROM medecins WHERE 1=1`;
        const params = [];
        
        if (filters.centre_id) {
            query += ` AND centre_id = ?`;
            params.push(filters.centre_id);
        }
        
        if (filters.specialite) {
            query += ` AND specialite = ?`;
            params.push(filters.specialite);
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

    // Récupérer les statistiques des médecins par spécialité
    static async getStatsBySpecialite() {
        const query = `
            SELECT 
                specialite,
                COUNT(*) as total_medecins,
                COUNT(CASE WHEN statut = 'actif' THEN 1 END) as medecins_actifs,
                COUNT(CASE WHEN statut = 'conges' THEN 1 END) as medecins_conges,
                AVG(experience) as experience_moyenne
            FROM medecins
            GROUP BY specialite
            ORDER BY total_medecins DESC
        `;
        
        try {
            return await executeQuery(query);
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`);
        }
    }

    // Récupérer les disponibilités d'un médecin
    static async getDisponibilites(id) {
        const query = `
            SELECT disponibilite
            FROM medecins
            WHERE id_medecin = ?
        `;
        
        try {
            const result = await executeQuery(query, [id]);
            if (result[0] && result[0].disponibilite) {
                return JSON.parse(result[0].disponibilite);
            }
            return null;
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des disponibilités: ${error.message}`);
        }
    }

    // Mettre à jour les disponibilités d'un médecin
    static async updateDisponibilites(id, disponibilites) {
        const query = `UPDATE medecins SET disponibilite = ? WHERE id_medecin = ?`;
        
        try {
            const result = await executeQuery(query, [JSON.stringify(disponibilites), id]);
            if (result.affectedRows === 0) {
                throw new Error('Médecin non trouvé');
            }
            return { message: 'Disponibilités mises à jour avec succès' };
        } catch (error) {
            throw new Error(`Erreur lors de la mise à jour des disponibilités: ${error.message}`);
        }
    }

    // Mettre à jour les horaires d'un médecin
    static async updateHoraires(id, horaires) {
        try {
            // Vérifier si la colonne horaires_medecin existe
            let query;
            try {
                query = `UPDATE medecins SET horaires_medecin = ? WHERE id_medecin = ?`;
                const result = await executeQuery(query, [JSON.stringify(horaires), id]);
                if (result.affectedRows === 0) {
                    throw new Error('Médecin non trouvé');
                }
            } catch (error) {
                // Si la colonne n'existe pas, utiliser disponibilite
                if (error.message.includes('Unknown column')) {
                    query = `UPDATE medecins SET disponibilite = ? WHERE id_medecin = ?`;
                    const result = await executeQuery(query, [JSON.stringify(horaires), id]);
                    if (result.affectedRows === 0) {
                        throw new Error('Médecin non trouvé');
                    }
                } else {
                    throw error;
                }
            }
            return { message: 'Horaires mis à jour avec succès' };
        } catch (error) {
            throw new Error(`Erreur lors de la mise à jour des horaires: ${error.message}`);
        }
    }

    // Récupérer les horaires d'un médecin
    static async getHoraires(id) {
        try {
            // Essayer d'abord avec horaires_medecin, puis disponibilite comme fallback
            let query = `SELECT horaires_medecin, disponibilite FROM medecins WHERE id_medecin = ?`;
            
            try {
                const result = await executeQuery(query, [id]);
                if (result.length === 0) {
                    return null;
                }

                // Prioriser horaires_medecin, sinon utiliser disponibilite
                if (result[0].horaires_medecin) {
                    return typeof result[0].horaires_medecin === 'string' 
                        ? JSON.parse(result[0].horaires_medecin) 
                        : result[0].horaires_medecin;
                }
                
                if (result[0].disponibilite) {
                    return typeof result[0].disponibilite === 'string' 
                        ? JSON.parse(result[0].disponibilite) 
                        : result[0].disponibilite;
                }
                
                return null;
            } catch (error) {
                // Si la colonne horaires_medecin n'existe pas, essayer avec disponibilite seulement
                if (error.message.includes('Unknown column') && error.message.includes('horaires_medecin')) {
                    query = `SELECT disponibilite FROM medecins WHERE id_medecin = ?`;
                    const result = await executeQuery(query, [id]);
                    if (result.length === 0) {
                        return null;
                    }
                    if (result[0].disponibilite) {
                        return typeof result[0].disponibilite === 'string' 
                            ? JSON.parse(result[0].disponibilite) 
                            : result[0].disponibilite;
                    }
                    return null;
                }
                throw error;
            }
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des horaires: ${error.message}`);
        }
    }

    // Activer/désactiver la gestion dynamique du statut
    static async setGestionDynamique(id, active) {
        try {
            let query;
            try {
                query = `UPDATE medecins SET gestion_dynamique_statut = ? WHERE id_medecin = ?`;
                const result = await executeQuery(query, [active, id]);
                if (result.affectedRows === 0) {
                    throw new Error('Médecin non trouvé');
                }
            } catch (error) {
                // Si la colonne n'existe pas, ignorer (fonctionnalité non disponible)
                if (error.message.includes('Unknown column')) {
                    return { message: 'Gestion dynamique non configurée dans la base de données' };
                }
                throw error;
            }
            return { message: `Gestion dynamique ${active ? 'activée' : 'désactivée'} avec succès` };
        } catch (error) {
            throw new Error(`Erreur lors de la mise à jour de la gestion dynamique: ${error.message}`);
        }
    }
}

module.exports = Medecin;
