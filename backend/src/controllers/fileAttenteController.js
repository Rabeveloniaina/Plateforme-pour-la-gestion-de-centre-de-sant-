const { executeQuery } = require('../config/database');
const { asyncHandler, Errors } = require('../utils/asyncHandler');

class FileAttenteController {
    /**
     * Obtenir la file d'attente du centre
     * GET /api/personnel/file-attente
     */
    static getFileAttente = asyncHandler(async (req, res) => {
        const user = req.user;
        console.log('📋 getFileAttente - User:', user);
        
        // Récupérer le centre_id depuis différentes sources
        let centreId = user.id_centre || user.centre_id;
        
        // Si l'utilisateur est un médecin, récupérer son centre depuis la table medecins
        if (!centreId && user.role === 'medecin' && user.id) {
            const medecin = await executeQuery(
                'SELECT centre_id FROM medecins WHERE id_user = ?',
                [user.id]
            );
            if (medecin && medecin.length > 0) {
                centreId = medecin[0].centre_id;
            }
        }
        
        // Si l'utilisateur est personnel, essayer de récupérer depuis user
        if (!centreId && (user.role === 'personnel' || user.role === 'agent_centre')) {
            const userData = await executeQuery(
                'SELECT centre_id FROM users WHERE id_user = ?',
                [user.id]
            );
            if (userData && userData.length > 0) {
                centreId = userData[0].centre_id;
            }
        }
        
        // Si toujours pas de centre_id, retourner une liste vide
        if (!centreId) {
            console.log('⚠️ Aucun centre_id trouvé pour l\'utilisateur');
            return res.json({
                success: true,
                data: [],
                count: 0,
                message: 'Aucun centre associé à cet utilisateur'
            });
        }
        
        console.log('✅ Centre ID trouvé:', centreId);
        
        const { medecin_id, statut } = req.query;
        
        let whereConditions = ['rv.centre_id = ?'];
        let params = [centreId];
        
        // Filtrer par médecin si spécifié
        if (medecin_id) {
            whereConditions.push('rv.medecin_id = ?');
            params.push(medecin_id);
        }
        
        // Filtrer par statut si spécifié, sinon attente/confirme/en_cours
        if (statut) {
            whereConditions.push('rv.statut = ?');
            params.push(statut);
        } else {
            // Inclure 'en_cours' pour que les patients appelés restent visibles
            whereConditions.push("rv.statut IN ('attente', 'confirme', 'en_cours')");
        }
        
        // Uniquement aujourd'hui
        whereConditions.push('DATE(rv.date_rdv) = CURDATE()');
        
        const query = `
            SELECT 
                rv.id_rdv,
                rv.date_rdv,
                rv.statut,
                rv.symptomes,
                rv.duree_estimee,
                rv.heure_arrivee,
                rv.patient_id,
                CONCAT(p.prenom, ' ', p.nom) as patient_nom,
                p.prenom as patient_prenom,
                p.nom as patient_nom_seul,
                p.id_patient,
                p.telephone,
                p.date_naissance,
                CONCAT(m.prenom, ' ', m.nom) as medecin_nom,
                m.id_medecin,
                m.specialite,
                m.statut_operationnel as medecin_statut,
                JSON_UNQUOTE(JSON_EXTRACT(rv.symptomes, '$.motif')) as motif,
                TIMESTAMPDIFF(MINUTE, rv.date_rdv, NOW()) as temps_attente_minutes,
                (
                    SELECT COUNT(*)
                    FROM rendez_vous rv2
                    WHERE rv2.medecin_id = rv.medecin_id
                    AND rv2.statut IN ('attente', 'confirme', 'en_cours')
                    AND rv2.date_rdv < rv.date_rdv
                    AND DATE(rv2.date_rdv) = CURDATE()
                ) as position_file
            FROM rendez_vous rv
            LEFT JOIN patients p ON rv.patient_id = p.id_patient
            LEFT JOIN medecins m ON rv.medecin_id = m.id_medecin
            WHERE ${whereConditions.join(' AND ')}
            ORDER BY rv.date_rdv ASC
        `;
        
        const fileAttente = await executeQuery(query, params);
        
        // Parser les symptômes JSON et extraire le motif
        const fileAttenteFormatted = fileAttente.map(rdv => {
            let symptomesParsed = null;
            let motif = rdv.motif || 'Consultation';
            
            if (rdv.symptomes) {
                try {
                    symptomesParsed = typeof rdv.symptomes === 'string' 
                        ? JSON.parse(rdv.symptomes) 
                        : rdv.symptomes;
                    
                    // Extraire le motif si pas déjà extrait
                    if (!motif && symptomesParsed.motif) {
                        motif = symptomesParsed.motif;
                    } else if (!motif && typeof symptomesParsed === 'string') {
                        motif = symptomesParsed;
                    }
                } catch (e) {
                    console.warn('Erreur parsing symptômes:', e);
                    if (!motif && typeof rdv.symptomes === 'string') {
                        motif = rdv.symptomes;
                    }
                }
            }
            
            return {
                ...rdv,
                symptomes: symptomesParsed,
                motif: motif,
                position_file: rdv.position_file + 1 // +1 car l'indexation commence à 0
            };
        });
        
        res.json({
            success: true,
            data: fileAttenteFormatted,
            count: fileAttenteFormatted.length
        });
    });
    
    /**
     * Réorganiser la file d'attente (changer la priorité)
     * PUT /api/personnel/file-attente/:rdv_id/priorite
     */
    static changerPriorite = asyncHandler(async (req, res) => {
        const { rdv_id } = req.params;
        const { priorite } = req.body;
        
        if (!['urgente', 'normale'].includes(priorite)) {
            throw Errors.VALIDATION_ERROR('Priorité doit être "urgente" ou "normale"');
        }
        
        await executeQuery(
            'UPDATE rendez_vous SET priorite = ? WHERE id_rdv = ?',
            [priorite, rdv_id]
        );
        
        res.json({
            success: true,
            message: 'Priorité mise à jour avec succès'
        });
    });
    
    /**
     * Appeler le prochain patient (démarre la consultation)
     * POST /api/personnel/file-attente/:rdv_id/appeler
     * 
     * Cette méthode:
     * - Change le statut à 'en_cours'
     * - Enregistre automatiquement l'heure de début de consultation
     * - Ne modifie PAS heure_arrivee (déjà défini au check-in)
     */
    static appellerPatient = asyncHandler(async (req, res) => {
        const { rdv_id } = req.params;
        
        // Vérifier que le RDV existe et n'est pas déjà terminé
        const rdvCheck = await executeQuery(
            'SELECT statut, heure_debut_consultation FROM rendez_vous WHERE id_rdv = ?',
            [rdv_id]
        );
        
        if (rdvCheck.length === 0) {
            throw Errors.NOT_FOUND('Rendez-vous');
        }
        
        if (rdvCheck[0].statut === 'termine' || rdvCheck[0].statut === 'annule') {
            throw Errors.VALIDATION_ERROR('Ce rendez-vous est déjà terminé ou annulé');
        }
        
        // Mettre à jour le statut et enregistrer l'heure de début de consultation
        // Si heure_arrivee n'existe pas encore, on le définit aussi (cas où le check-in n'a pas été fait)
        await executeQuery(
            `UPDATE rendez_vous 
             SET statut = 'en_cours', 
                 heure_debut_consultation = NOW(),
                 heure_arrivee = COALESCE(heure_arrivee, NOW())
             WHERE id_rdv = ?`,
            [rdv_id]
        );
        
        // Récupérer les infos du RDV pour notifier (avec motif et symptômes)
        const rdv = await executeQuery(`
            SELECT 
                rv.*,
                CONCAT(p.prenom, ' ', p.nom) as patient_nom,
                p.telephone,
                p.id_patient,
                CONCAT(m.prenom, ' ', m.nom) as medecin_nom,
                m.id_medecin,
                JSON_UNQUOTE(JSON_EXTRACT(rv.symptomes, '$.motif')) as motif,
                JSON_EXTRACT(rv.symptomes, '$.symptomes') as symptomes_array
            FROM rendez_vous rv
            LEFT JOIN patients p ON rv.patient_id = p.id_patient
            LEFT JOIN medecins m ON rv.medecin_id = m.id_medecin
            WHERE rv.id_rdv = ?
        `, [rdv_id]);
        
        if (rdv.length === 0) {
            throw Errors.NOT_FOUND('Rendez-vous');
        }
        
        // Extraire les informations importantes pour la redirection
        const rdvData = rdv[0];
        
        // Parser les symptômes si c'est un JSON string
        let motif = rdvData.motif || 'Consultation';
        let symptomesArray = [];
        
        if (rdvData.symptomes) {
            try {
                let symptomesParsed = rdvData.symptomes;
                if (typeof rdvData.symptomes === 'string') {
                    symptomesParsed = JSON.parse(rdvData.symptomes);
                }
                
                // Extraire le motif
                if (symptomesParsed.motif) {
                    motif = symptomesParsed.motif;
                } else if (typeof symptomesParsed === 'string') {
                    motif = symptomesParsed;
                }
                
                // Extraire les symptômes
                if (symptomesParsed.symptomes && Array.isArray(symptomesParsed.symptomes)) {
                    symptomesArray = symptomesParsed.symptomes;
                } else if (Array.isArray(symptomesParsed)) {
                    symptomesArray = symptomesParsed;
                }
            } catch (e) {
                console.warn('⚠️ Erreur parsing symptômes:', e);
                // Si le parsing échoue, utiliser le motif extrait directement
                if (!motif && typeof rdvData.symptomes === 'string') {
                    motif = rdvData.symptomes;
                }
            }
        }
        
        console.log(`✅ Consultation démarrée pour RDV ${rdv_id} - Patient: ${rdvData.patient_nom}, Motif: ${motif}`);
        
        res.json({
            success: true,
            message: 'Patient appelé - Consultation démarrée',
            data: {
                ...rdvData,
                patient_id: rdvData.patient_id || rdvData.id_patient,
                id_rdv: rdvData.id_rdv || rdvData.id,
                heure_debut_consultation: rdvData.heure_debut_consultation,
                motif: motif,
                symptomes: symptomesArray
            }
        });
    });
    
    /**
     * Marquer un patient comme absent
     * POST /api/personnel/file-attente/:rdv_id/marquer-absent
     */
    static marquerAbsent = asyncHandler(async (req, res) => {
        const { rdv_id } = req.params;
        const { note } = req.body || {};
        
        const result = await RendezVous.marquerAbsent(rdv_id, note);
        
        res.json({
            success: true,
            message: result.message,
            data: {
                rdv_id,
                statut: 'absent',
                note: result.note
            }
        });
    });

    /**
     * Obtenir les statistiques de la file d'attente
     * GET /api/personnel/file-attente/stats
     */
    static getStatsFileAttente = asyncHandler(async (req, res) => {
        const user = req.user;
        console.log('📊 getStatsFileAttente - User:', user);
        
        // Récupérer le centre_id depuis différentes sources
        let centreId = user.id_centre || user.centre_id;
        
        // Si l'utilisateur est un médecin, récupérer son centre depuis la table medecins
        if (!centreId && user.role === 'medecin' && user.id) {
            const medecin = await executeQuery(
                'SELECT centre_id FROM medecins WHERE id_user = ?',
                [user.id]
            );
            if (medecin && medecin.length > 0) {
                centreId = medecin[0].centre_id;
            }
        }
        
        // Si l'utilisateur est personnel, essayer de récupérer depuis user
        if (!centreId && (user.role === 'personnel' || user.role === 'agent_centre')) {
            const userData = await executeQuery(
                'SELECT centre_id FROM users WHERE id_user = ?',
                [user.id]
            );
            if (userData && userData.length > 0) {
                centreId = userData[0].centre_id;
            }
        }
        
        // Si toujours pas de centre_id, retourner des stats vides
        if (!centreId) {
            console.log('⚠️ Aucun centre_id trouvé pour l\'utilisateur');
            return res.json({
                success: true,
                data: {
                    total_en_attente: 0,
                    temps_attente_moyen: 0,
                    repartition_type: [],
                    repartition_priorite: []
                },
                message: 'Aucun centre associé à cet utilisateur'
            });
        }
        
        console.log('✅ Centre ID trouvé:', centreId);
        
        // Nombre total en attente (inclut en_cours)
        const totalEnAttente = await executeQuery(`
            SELECT COUNT(*) as count
            FROM rendez_vous
            WHERE centre_id = ?
            AND statut IN ('attente', 'confirme', 'en_cours')
            AND DATE(date_rdv) = CURDATE()
        `, [centreId]);
        
        // Temps d'attente moyen
        const tempsAttenteMoyen = await executeQuery(`
            SELECT AVG(TIMESTAMPDIFF(MINUTE, date_rdv, NOW())) as temps_moyen
            FROM rendez_vous
            WHERE centre_id = ?
            AND statut IN ('attente', 'confirme', 'en_cours')
            AND DATE(date_rdv) = CURDATE()
        `, [centreId]);
        
        // Nombre par statut
        const repartitionStatut = await executeQuery(`
            SELECT 
                statut,
                COUNT(*) as count
            FROM rendez_vous
            WHERE centre_id = ?
            AND DATE(date_rdv) = CURDATE()
            GROUP BY statut
        `, [centreId]);
        
        // Nombre de patients arrivés (avec heure_arrivee)
        const patientsArrives = await executeQuery(`
            SELECT COUNT(*) as count
            FROM rendez_vous
            WHERE centre_id = ?
            AND heure_arrivee IS NOT NULL
            AND DATE(date_rdv) = CURDATE()
        `, [centreId]);
        
        res.json({
            success: true,
            data: {
                total_en_attente: totalEnAttente[0].count,
                temps_attente_moyen: Math.round(tempsAttenteMoyen[0].temps_moyen || 0),
                repartition_statut: repartitionStatut,
                patients_arrives: patientsArrives[0].count
            }
        });
    });
}

module.exports = FileAttenteController;

