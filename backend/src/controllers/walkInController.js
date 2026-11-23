const Patient = require('../models/Patient');
const RendezVous = require('../models/RendezVous');
const { executeQuery } = require('../config/database');
const { asyncHandler, Errors } = require('../utils/asyncHandler');
const { formatDateTimeForMySQL } = require('../utils/dateFormatter');
const DataIntegrityValidators = require('../validators/dataIntegrityValidators');

class WalkInController {
    /**
     * Enregistrer un patient walk-in (sans RDV)
     * POST /api/personnel/walk-in
     */
    static enregistrerWalkIn = asyncHandler(async (req, res) => {
        const user = req.user;
        const { patient, medecin_id, motif, symptomes, priorite = 'normale' } = req.body;
        
        console.log('📝 Enregistrement walk-in:', { patient, medecin_id, motif });
        
        // Validation des données requises (prénom est optionnel pour les malgaches)
        if (!patient || !patient.nom || !patient.telephone) {
            throw Errors.VALIDATION_ERROR('Nom et téléphone du patient sont requis. Note: Le prénom est optionnel.');
        }
        
        if (!medecin_id) {
            throw Errors.VALIDATION_ERROR('Un médecin doit être sélectionné');
        }
        
        // Récupérer le centre de l'utilisateur
        const centreId = user.id_centre;
        if (!centreId) {
            throw Errors.VALIDATION_ERROR('Centre non trouvé pour cet utilisateur');
        }
        
        // Vérifier que le médecin appartient au centre de l'utilisateur
        const medecinCheck = await executeQuery(
            'SELECT id_medecin, centre_id, statut FROM medecins WHERE id_medecin = ?',
            [medecin_id]
        );
        
        if (medecinCheck.length === 0) {
            throw Errors.NOT_FOUND('Médecin');
        }

        // Vérifier que le médecin est actif
        if (medecinCheck[0].statut !== 'actif') {
            throw Errors.VALIDATION_ERROR('Ce médecin n\'est pas actif. Veuillez choisir un autre médecin.');
        }
        
        if (medecinCheck[0].centre_id !== centreId) {
            throw Errors.FORBIDDEN('Ce médecin n\'appartient pas à votre centre');
        }
        
        // Récupérer la région du centre
        const centres = await executeQuery('SELECT region_id FROM centres_sante WHERE id_centre = ?', [centreId]);
        if (centres.length === 0) {
            throw Errors.NOT_FOUND('Centre');
        }
        const regionId = centres[0].region_id;
        
        let patientId;
        
        // Vérifier si le patient existe déjà (par téléphone)
        const existingPatients = await executeQuery(
            'SELECT id_patient FROM patients WHERE telephone = ? LIMIT 1',
            [patient.telephone]
        );
        
        if (existingPatients.length > 0) {
            // Patient existant
            patientId = existingPatients[0].id_patient;
            console.log(`✅ Patient existant trouvé: ${patientId}`);
        } else {
            // Créer un nouveau patient
            // Si la date de naissance n'est pas fournie, on utilise une date par défaut mais on avertit
            // Dans un vrai système, on devrait demander la date de naissance
            let dateNaissance = patient.date_naissance;
            if (!dateNaissance) {
                // Utiliser une date par défaut raisonnable (il y a 30 ans)
                const dateParDefaut = new Date();
                dateParDefaut.setFullYear(dateParDefaut.getFullYear() - 30);
                dateNaissance = dateParDefaut.toISOString().split('T')[0];
                console.log(`⚠️ Date de naissance non fournie, utilisation de la date par défaut: ${dateNaissance}`);
            }

            const patientData = {
                nom: patient.nom,
                prenom: patient.prenom || '', // Prénom optionnel (peut être vide pour les malgaches)
                date_naissance: dateNaissance,
                sexe: patient.sexe || 'M',
                adresse: patient.adresse || 'Non renseignée',
                telephone: patient.telephone,
                email: patient.email || null,
                centre_id: centreId,
                region_id: regionId,
                groupe_sanguin: patient.groupe_sanguin || null,
                statut: 'actif'
            };

            // Validation d'intégrité des données
            const integrityValidation = DataIntegrityValidators.validatePatient(patientData);
            if (!integrityValidation.valid) {
                throw Errors.VALIDATION_ERROR(integrityValidation.errors.join(' '));
            }
            
            const newPatient = await Patient.create(patientData);
            patientId = newPatient.id;
            console.log(`✅ Nouveau patient créé: ${patientId}`);
        }
        
        // Trouver le prochain créneau libre le plus tôt possible pour ce médecin
        // On cherche jusqu'à 30 jours dans le futur pour trouver un créneau disponible
        const prochainCreneau = await trouverProchainCreneauLibre(medecin_id, centreId, priorite, 30);
        
        if (!prochainCreneau) {
            throw Errors.VALIDATION_ERROR('Aucun créneau disponible pour ce médecin dans les 30 prochains jours. Veuillez contacter le centre pour plus d\'informations.');
        }
        
        // Créer un RDV walk-in avec le prochain créneau libre
        const rdvData = {
            patient_id: patientId,
            medecin_id: medecin_id,
            centre_id: centreId,
            date_rdv: formatDateTimeForMySQL(prochainCreneau),
            type_rdv: 'walk_in',
            statut: 'attente',
            priorite: priorite, // normale, urgente
            symptomes: {
                motif: motif || 'Consultation sans RDV',
                symptomes: symptomes || [],
                type: 'walk-in',
                enregistre_par: user.nom_utilisateur || user.email
            },
            duree_estimee: 15, // Durée par défaut 15 min
            heure_arrivee: new Date().toTimeString().slice(0, 8) // Heure d'arrivée actuelle
        };
        
        const rdv = await RendezVous.create(rdvData);
        
        // Normaliser l'ID du RDV retourné
        const rdvId = rdv?.id ?? rdv?.id_rdv;
        if (!rdvId) {
            throw Errors.UNEXPECTED_ERROR('ID du rendez-vous non déterminé après création');
        }
        
        console.log(`✅ Walk-in enregistré: RDV ${rdvId} pour patient ${patientId}`);
        
        // Récupérer les infos complètes du RDV créé
        const rdvComplet = await executeQuery(`
            SELECT 
                rv.*,
                CONCAT(p.prenom, ' ', p.nom) as patient_nom,
                p.telephone,
                CONCAT(m.prenom, ' ', m.nom) as medecin_nom,
                m.specialite
            FROM rendez_vous rv
            LEFT JOIN patients p ON rv.patient_id = p.id_patient
            LEFT JOIN medecins m ON rv.medecin_id = m.id_medecin
            WHERE rv.id_rdv = ?
        `, [rdvId]);
        
        const positionFile = await getPositionDansFile(medecin_id, rdvId);
        const tempsAttente = await getTempsAttenteEstime(medecin_id);
        
        res.status(201).json({
            success: true,
            message: 'Patient walk-in enregistré avec succès',
            data: {
                patient_id: patientId,
                rdv_id: rdvId,
                rdv: rdvComplet[0],
                position_file: positionFile,
                temps_attente_estime: tempsAttente
            }
        });
    });
    
    /**
     * Obtenir la liste des patients walk-in en attente
     * GET /api/personnel/walk-in/en-attente
     */
    static getWalkInsEnAttente = asyncHandler(async (req, res) => {
        const user = req.user;
        const centreId = user.id_centre;
        
        const walkIns = await executeQuery(`
            SELECT 
                rv.id_rdv,
                rv.date_rdv,
                rv.priorite,
                rv.symptomes,
                rv.statut,
                CONCAT(p.prenom, ' ', p.nom) as patient_nom,
                p.telephone,
                CONCAT(m.prenom, ' ', m.nom) as medecin_nom,
                m.specialite,
                TIMESTAMPDIFF(MINUTE, rv.date_rdv, NOW()) as temps_attente
            FROM rendez_vous rv
            LEFT JOIN patients p ON rv.patient_id = p.id_patient
            LEFT JOIN medecins m ON rv.medecin_id = m.id_medecin
            WHERE rv.centre_id = ?
            AND rv.type_rdv = 'walk_in'
            AND rv.statut = 'attente'
            AND DATE(rv.date_rdv) = CURDATE()
            ORDER BY 
                CASE rv.priorite 
                    WHEN 'urgente' THEN 1
                    WHEN 'normale' THEN 2
                    ELSE 3
                END,
                rv.date_rdv ASC
        `, [centreId]);
        
        res.json({
            success: true,
            data: walkIns
        });
    });
}

// Fonction helper pour trouver le prochain créneau libre le plus tôt possible
async function trouverProchainCreneauLibre(medecinId, centreId, priorite = 'normale', joursMax = 30) {
    try {
        const maintenant = new Date();
        const aujourdhui = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate());
        
        // Récupérer les horaires et le statut du médecin
        const medecinInfo = await executeQuery(
            'SELECT horaires_medecin, statut, statut_operationnel FROM medecins WHERE id_medecin = ?',
            [medecinId]
        );
        
        if (medecinInfo.length === 0) {
            console.log('⚠️ Médecin non trouvé');
            return null;
        }

        // Vérifier que le médecin est actif (mais il peut être indisponible temporairement)
        if (medecinInfo[0].statut !== 'actif') {
            console.log('⚠️ Médecin non actif');
            return null;
        }
        
        let horaires = {};
        try {
            horaires = typeof medecinInfo[0].horaires_medecin === 'string' 
                ? JSON.parse(medecinInfo[0].horaires_medecin) 
                : medecinInfo[0].horaires_medecin || {};
        } catch (e) {
            console.warn('⚠️ Erreur parsing horaires:', e);
            horaires = {};
        }
        
        // Déterminer le jour actuel
        const joursMap = {
            0: 'dimanche', 1: 'lundi', 2: 'mardi', 3: 'mercredi',
            4: 'jeudi', 5: 'vendredi', 6: 'samedi'
        };
        
        const dureeRDV = 15; // 15 minutes pour un walk-in
        
        // Chercher un créneau dans les joursMax prochains jours
        for (let jourOffset = 0; jourOffset <= joursMax; jourOffset++) {
            const dateTest = new Date(aujourdhui);
            dateTest.setDate(dateTest.getDate() + jourOffset);
            const jourTest = joursMap[dateTest.getDay()];
            const horaireTest = horaires[jourTest] || {};
            
            // Si ce jour n'est pas actif dans les horaires, passer au suivant
            if (!horaireTest.actif) {
                continue;
            }
            
            // Déterminer les heures de travail pour ce jour
            const heureDebut = horaireTest.debut ? horaireTest.debut.split(':') : [9, 0];
            const heureFin = horaireTest.fin ? horaireTest.fin.split(':') : [17, 0];
            
            // Récupérer tous les RDV du médecin pour ce jour
            const rdvs = await executeQuery(`
                SELECT date_rdv, duree_estimee, priorite
                FROM rendez_vous
                WHERE medecin_id = ?
                AND centre_id = ?
                AND DATE(date_rdv) = DATE(?)
                AND statut NOT IN ('annule', 'termine', 'absent')
                ORDER BY date_rdv ASC
            `, [medecinId, centreId, dateTest]);
            
            // Déterminer l'heure de début de recherche
            let heureDebutTest;
            if (jourOffset === 0) {
                // Aujourd'hui : commencer à partir de maintenant + 15 min minimum
                heureDebutTest = new Date(Math.max(
                    maintenant.getTime() + 15 * 60 * 1000, // Maintenant + 15 min
                    aujourdhui.getTime() + parseInt(heureDebut[0]) * 60 * 60 * 1000 + parseInt(heureDebut[1]) * 60 * 1000 // Ou heure de début
                ));
            } else {
                // Jour futur : commencer à l'heure de début
                heureDebutTest = new Date(dateTest);
                heureDebutTest.setHours(parseInt(heureDebut[0]), parseInt(heureDebut[1]), 0, 0);
            }
            
            const heureFinJour = new Date(dateTest);
            heureFinJour.setHours(parseInt(heureFin[0]), parseInt(heureFin[1]), 0, 0);
            
            // Si priorité urgente et c'est aujourd'hui et médecin disponible maintenant, essayer maintenant
            if (priorite === 'urgente' && jourOffset === 0 && 
                medecinInfo[0].statut_operationnel === 'disponible') {
                const maintenantPlus15 = new Date(maintenant.getTime() + 15 * 60 * 1000);
                if (maintenantPlus15 >= heureDebutTest && maintenantPlus15 < heureFinJour) {
                    // Vérifier si le créneau est libre
                    const conflit = rdvs.find(rdv => {
                        const rdvDebut = new Date(rdv.date_rdv);
                        const rdvFin = new Date(rdvDebut.getTime() + (rdv.duree_estimee || 15) * 60 * 1000);
                        return (maintenantPlus15 < rdvFin && new Date(maintenantPlus15.getTime() + dureeRDV * 60 * 1000) > rdvDebut);
                    });
                    
                    if (!conflit) {
                        console.log(`✅ Créneau urgent trouvé: ${maintenantPlus15.toISOString()}`);
                        return maintenantPlus15;
                    }
                }
            }
            
            // Chercher un créneau libre dans ce jour
            let creneauActuel = new Date(heureDebutTest);
            
            // S'assurer qu'on ne dépasse pas la fin de la journée
            while (creneauActuel < heureFinJour) {
                // Vérifier si ce créneau est libre
                const conflit = rdvs.find(rdv => {
                    const rdvDebut = new Date(rdv.date_rdv);
                    const rdvFin = new Date(rdvDebut.getTime() + (rdv.duree_estimee || 15) * 60 * 1000);
                    const creneauFin = new Date(creneauActuel.getTime() + dureeRDV * 60 * 1000);
                    // Il y a conflit si les créneaux se chevauchent
                    return (creneauActuel < rdvFin && creneauFin > rdvDebut);
                });
                
                if (!conflit) {
                    console.log(`✅ Créneau libre trouvé: ${creneauActuel.toISOString()} (jour +${jourOffset})`);
                    return creneauActuel;
                }
                
                // Passer au créneau suivant (toutes les 15 minutes)
                creneauActuel = new Date(creneauActuel.getTime() + 15 * 60 * 1000);
            }
        }
        
        // Aucun créneau trouvé dans les joursMax jours
        console.log(`⚠️ Aucun créneau libre trouvé dans les ${joursMax} prochains jours`);
        return null;
    } catch (error) {
        console.error('❌ Erreur recherche créneau libre:', error);
        return null;
    }
}

// Fonction helper pour calculer la position dans la file
async function getPositionDansFile(medecinId, rdvId = null) {
    if (!rdvId) {
        // Si pas de rdvId, compter tous les RDV en attente
        const result = await executeQuery(`
            SELECT COUNT(*) as position
            FROM rendez_vous
            WHERE medecin_id = ?
            AND statut IN ('attente', 'confirme')
            AND DATE(date_rdv) = CURDATE()
        `, [medecinId]);
        return (result[0]?.position || 0) + 1;
    }
    
    // Récupérer la date_rdv du RDV en question
    const rdvInfo = await executeQuery(
        'SELECT date_rdv FROM rendez_vous WHERE id_rdv = ?',
        [rdvId]
    );
    
    if (rdvInfo.length === 0) {
        return 1;
    }
    
    const rdvDate = rdvInfo[0].date_rdv;
    
    // Compter les RDV qui sont avant dans la file (même médecin, même jour, en attente/confirmé)
    // Ordre : par date_rdv ASC, puis par id_rdv ASC
    const result = await executeQuery(`
        SELECT COUNT(*) as position
        FROM rendez_vous
        WHERE medecin_id = ?
        AND statut IN ('attente', 'confirme')
        AND DATE(date_rdv) = CURDATE()
        AND (
            date_rdv < ?
            OR (date_rdv = ? AND id_rdv < ?)
        )
    `, [medecinId, rdvDate, rdvDate, rdvId]);
    
    // La position est le nombre de personnes avant + 1
    return (result[0]?.position || 0) + 1;
}

// Fonction helper pour estimer le temps d'attente
async function getTempsAttenteEstime(medecinId) {
    const result = await executeQuery(`
        SELECT 
            COUNT(*) * 20 as temps_estime_minutes
        FROM rendez_vous
        WHERE medecin_id = ?
        AND statut IN ('attente', 'confirme')
        AND DATE(date_rdv) = CURDATE()
    `, [medecinId]);
    
    return result[0].temps_estime_minutes || 20;
}

module.exports = WalkInController;
