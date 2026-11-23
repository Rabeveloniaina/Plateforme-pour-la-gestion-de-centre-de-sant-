const RendezVous = require('../models/RendezVous');
const Patient = require('../models/Patient');
const { notifyRdv } = require('../services/notificationService');
const CentreSecurity = require('../middlewares/centreSecurity');
const { formatDateTimeForMySQL } = require('../utils/dateFormatter');
const DataIntegrityValidators = require('../validators/dataIntegrityValidators');

class RendezVousController {
    static async create(req, res) {
        try {
            const user = req.user;
            console.log('📅 POST /rendez-vous - Utilisateur:', user);
            console.log('📅 Données reçues:', req.body);
            
            const required = ['medecin_id', 'date_rdv'];
            const missing = required.filter(f => !req.body[f]);
            if (missing.length) return res.status(400).json({ success: false, message: `Champs manquants: ${missing.join(', ')}` });

            // Déterminer le patient_id et le centre_id
            let patientId = req.body.patient_id;
            let centreId = req.body.centre_id;
            
            // Si l'utilisateur est un patient, récupérer son patient_id depuis la table patients
            if (user.role === 'patient') {
                // Récupérer le patient_id depuis la table patients où user_id = user.id
                const { executeQuery } = require('../config/database');
                const patients = await executeQuery('SELECT id_patient FROM patients WHERE user_id = ? LIMIT 1', [user.id]);
                
                if (!patients || patients.length === 0) {
                    console.error(`❌ Patient non trouvé pour user_id=${user.id}`);
                    console.error(`❌ Vérification: user.role=${user.role}, user.id=${user.id}`);
                    
                    // Vérifier si l'utilisateur existe dans la table utilisateurs
                    const userCheck = await executeQuery('SELECT id_user, role FROM utilisateurs WHERE id_user = ? LIMIT 1', [user.id]);
                    if (!userCheck || userCheck.length === 0) {
                    return res.status(404).json({ 
                        success: false, 
                            message: 'Utilisateur non trouvé dans la base de données. Veuillez vous reconnecter.' 
                        });
                    }
                    
                    // Vérifier si un patient existe sans user_id (cas d'ancien système)
                    const patientWithoutUser = await executeQuery(
                        'SELECT id_patient, email FROM patients WHERE email = (SELECT email FROM utilisateurs WHERE id_user = ?) LIMIT 1', 
                        [user.id]
                    );
                    
                    if (patientWithoutUser && patientWithoutUser.length > 0) {
                        // Mettre à jour le patient avec le user_id
                        await executeQuery(
                            'UPDATE patients SET user_id = ? WHERE id_patient = ?',
                            [user.id, patientWithoutUser[0].id_patient]
                        );
                        console.log(`✅ Patient mis à jour avec user_id=${user.id}`);
                        patientId = patientWithoutUser[0].id_patient;
                    } else {
                        return res.status(404).json({ 
                            success: false, 
                            message: 'Profil patient non trouvé. Veuillez compléter votre profil patient avant de prendre un rendez-vous. Contactez l\'administrateur si le problème persiste.',
                            debug: {
                                user_id: user.id,
                                user_role: user.role,
                                suggestion: 'Le profil patient doit être créé et lié à votre compte utilisateur.'
                            }
                    });
                }
                } else {
                patientId = patients[0].id_patient; // Le patient réserve pour lui-même
                }
                
                centreId = req.body.centre_id; // Le patient peut choisir le centre
                
                if (!centreId) {
                    return res.status(400).json({ success: false, message: 'Centre ID requis' });
                }
            } else if (user.role !== 'ministere') {
                // Pour le personnel/admin, utiliser leur centre
                centreId = user.id_centre;
                if (!patientId) {
                    return res.status(400).json({ success: false, message: 'Patient ID requis' });
                }
            } else {
                // Pour le ministère, tout doit être fourni
                if (!centreId || !patientId) {
                    return res.status(400).json({ success: false, message: 'Centre ID et Patient ID requis pour le ministère' });
                }
            }

            // Combiner date_rdv et heure_rdv en un seul DATETIME
            let dateTimeRdv = req.body.date_rdv;
            if (req.body.heure_rdv) {
                // Format: "YYYY-MM-DD HH:MM:SS"
                const heure = req.body.heure_rdv.includes(':') ? req.body.heure_rdv : `${req.body.heure_rdv}:00`;
                dateTimeRdv = `${req.body.date_rdv} ${heure}`;
            } else {
                dateTimeRdv = `${req.body.date_rdv} 00:00:00`;
            }

            // Validation d'intégrité des données pour le rendez-vous
            const rdvValidationData = {
                date_rdv: dateTimeRdv,
                duree_estimee: req.body.duree_estimee || null,
                heure_arrivee: req.body.heure_arrivee || null
            };
            const rdvValidation = DataIntegrityValidators.validateRendezVous(rdvValidationData);
            if (!rdvValidation.valid) {
                return res.status(400).json({
                    success: false,
                    message: rdvValidation.errors.join(' '),
                    errors: rdvValidation.errors
                });
            }

            // Préparer les symptômes selon le schéma de la BDD
            // symptomes est un JSON avec: motif, symptomes (array ou string), intensite
            const symptomesArray = req.body.symptomes ? 
                (Array.isArray(req.body.symptomes) ? req.body.symptomes : req.body.symptomes.split(',').map(s => s.trim())) 
                : [];
            
            const symptomesData = {
                motif: req.body.motif || '',
                symptomes: symptomesArray,
                intensite: req.body.intensite || 'moderee'
            };

            // Orientation automatique basée sur les symptômes
            let orientation = req.body.orientation;
            let specialiteRecommandee = null;
            
            // Si orientation n'est pas fournie ou est 'auto', calculer automatiquement
            if (!orientation || orientation === 'auto') {
                const OrientationService = require('../services/orientationService');
                const orientationResult = await OrientationService.analyserOrientation(symptomesData);
                orientation = orientationResult.orientation;
                specialiteRecommandee = orientationResult.specialite || null;
                
                console.log('🔍 Orientation automatique:', orientationResult);
            }

            // Vérifier que le médecin existe et est actif dans le système
            const Medecin = require('../models/Medecin');
            const medecin = await Medecin.findById(req.body.medecin_id);
            
            if (!medecin) {
                return res.status(404).json({
                    success: false,
                    message: 'Médecin non trouvé'
                });
            }
            
            // Valider que le médecin est actif
            const medecinActifValidation = DataIntegrityValidators.validateMedecinActif(medecin.statut);
            if (!medecinActifValidation.valid) {
                return res.status(400).json({
                    success: false,
                    message: medecinActifValidation.message
                });
            }

            // Vérifier que le patient est actif (si on a le patient_id)
            if (patientId) {
                const Patient = require('../models/Patient');
                const patient = await Patient.findById(patientId);
                if (patient) {
                    const patientActifValidation = DataIntegrityValidators.validatePatientActif(patient.statut);
                    if (!patientActifValidation.valid) {
                        return res.status(400).json({
                            success: false,
                            message: patientActifValidation.message
                        });
                    }
                }
            }
            
            // Note: On ne vérifie PAS statut_operationnel (disponible/en_consultation/pause)
            // car il représente l'état ACTUEL du médecin, pas son état à l'heure du RDV.
            // Les vérifications pertinentes sont:
            // 1. Chevauchement avec RDV existants (ci-dessous)
            // 2. Horaires de travail (vérifiés côté frontend ou via API dédiée)
            
            // Vérifier qu'il n'y a pas de chevauchement avec un rendez-vous existant
            const { executeQuery } = require('../config/database');
            
            // Durée minimale de sécurité pour la vérification (15 minutes par défaut)
            // Cette durée sera utilisée pour bloquer les créneaux jusqu'à ce que le médecin confirme
            const dureeMinSecurite = 15; // minutes
            
            // Calculer les dates de début et fin du nouveau RDV
            const dateTimeRdvDebut = new Date(dateTimeRdv);
            const dateTimeRdvFin = new Date(dateTimeRdvDebut.getTime() + (dureeMinSecurite * 60 * 1000));
            
            // Format pour MySQL : 'YYYY-MM-DD HH:MM:SS' en HEURE LOCALE
            const dateTimeRdvDebutStr = formatDateTimeForMySQL(dateTimeRdvDebut);
            const dateTimeRdvFinStr = formatDateTimeForMySQL(dateTimeRdvFin);
            
            // Vérifier les chevauchements : deux rendez-vous se chevauchent si :
            // - Le début du nouveau RDV est avant la fin d'un RDV existant
            // - ET la fin du nouveau RDV est après le début d'un RDV existant
            // Pour les RDV non confirmés, utiliser une durée minimale de sécurité
            const existingRDV = await executeQuery(`
                SELECT 
                    id_rdv, 
                    date_rdv, 
                    COALESCE(duree_estimee, ?) as duree_estimee,
                    statut,
                    DATE_ADD(date_rdv, INTERVAL COALESCE(duree_estimee, ?) MINUTE) as date_fin
                FROM rendez_vous
                WHERE medecin_id = ?
                AND DATE(date_rdv) = DATE(?)
                AND statut NOT IN ('annule', 'termine')
                AND (
                    date_rdv < ? 
                    AND DATE_ADD(date_rdv, INTERVAL COALESCE(duree_estimee, ?) MINUTE) > ?
                )
                LIMIT 1
            `, [
                dureeMinSecurite,  // Durée par défaut pour COALESCE
                dureeMinSecurite,  // Durée par défaut pour COALESCE
                req.body.medecin_id,
                dateTimeRdv,
                dateTimeRdvFinStr,  // Fin du nouveau RDV
                dureeMinSecurite,  // Durée par défaut pour COALESCE
                dateTimeRdvDebutStr  // Début du nouveau RDV
            ]);
            
            if (existingRDV && existingRDV.length > 0) {
                const rdvExist = existingRDV[0];
                const heureExist = new Date(rdvExist.date_rdv).toLocaleTimeString('fr-FR', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    timeZone: 'UTC'
                });
                const heureFinExist = new Date(rdvExist.date_fin).toLocaleTimeString('fr-FR', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    timeZone: 'UTC'
                });
                const heureDemandee = dateTimeRdvDebut.toLocaleTimeString('fr-FR', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    timeZone: 'UTC'
                });
                
                return res.status(400).json({
                    success: false,
                    message: `Ce médecin a déjà un rendez-vous de ${heureExist} à ${heureFinExist}. Veuillez choisir un autre créneau.`,
                    conflict: {
                        existing_rdv_id: rdvExist.id_rdv,
                        existing_time: `${heureExist} - ${heureFinExist}`,
                        requested_time: heureDemandee,
                        duree_minimale_securite: dureeMinSecurite
                    }
                });
            }

            // Préparer les données pour le modèle
            // La durée ne sera pas définie à la création, elle sera définie par le médecin lors de la confirmation
            const rdvData = {
                patient_id: patientId,
                medecin_id: req.body.medecin_id,
                centre_id: centreId,
                date_rdv: dateTimeRdv,
                symptomes: symptomesData,
                orientation: orientation,
                note_patient: req.body.note_patient || '',
                duree_estimee: null  // NULL par défaut - sera défini par le médecin lors de la confirmation
            };

            console.log('✅ Données RDV préparées:', rdvData);
            if (specialiteRecommandee) {
                console.log('💡 Spécialité recommandée:', specialiteRecommandee);
            }

            // Créer le RDV
            const item = await RendezVous.create(rdvData);
            
            // Ajouter la spécialité recommandée dans la réponse si applicable
            if (specialiteRecommandee) {
                item.specialite_recommandee = specialiteRecommandee;
                item.orientation_auto = true;
            }
            console.log('✅ RDV créé avec ID:', item.id || item.id_rdv);
            
            res.status(201).json({ success: true, data: item, message: 'Rendez-vous créé avec succès' });
        } catch (e) {
            console.error('❌ Erreur création RDV:', e);
            res.status(500).json({ success: false, message: 'Erreur création RDV', error: e.message });
        }
    }

    static async getById(req, res) {
        try {
            const item = await RendezVous.findById(req.params.id);
            if (!item) return res.status(404).json({ success: false, message: 'RDV non trouvé' });
            res.json({ success: true, data: item });
        } catch (e) {
            res.status(500).json({ success: false, message: 'Erreur récupération RDV', error: e.message });
        }
    }

    static async getAll(req, res) {
        try {
            const { page = 1, limit = 50, centre_id, medecin_id, patient_id, statut, date_debut, date_fin, q } = req.query;
            const user = req.user;
            const offset = (page - 1) * limit;
            
            // Sécurité : Filtrer selon le rôle de l'utilisateur
            let filters = { medecin_id, patient_id, statut, date_debut, date_fin, q };

            if (user.role === 'patient') {
                // Un patient ne voit que ses propres rendez-vous
                // Récupérer le patient_id depuis la table patients où user_id = user.id
                const { executeQuery } = require('../config/database');
                const patients = await executeQuery('SELECT id_patient FROM patients WHERE user_id = ? LIMIT 1', [user.id]);
                
                if (patients && patients.length > 0) {
                    filters.patient_id = patients[0].id_patient;
                } else {
                    // Si pas de patient trouvé, retourner une liste vide
                    return res.json({ success: true, data: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } });
                }
            } else if (user.role === 'medecin') {
                // Si c'est un médecin, convertir son user_id en id_medecin
                const { executeQuery } = require('../config/database');
                const medecinLink = await executeQuery(`
                    SELECT id_medecin FROM medecins WHERE user_id = ?
                `, [user.id]);
                
                if (medecinLink.length > 0) {
                    // Utiliser l'id_medecin du médecin connecté
                    filters.medecin_id = medecinLink[0].id_medecin;
                    console.log(`✅ Médecin connecté: user_id=${user.id} → medecin_id=${filters.medecin_id}`);
                } else {
                    // Pas de médecin lié, retourner vide
                    console.log(`⚠️ Aucun médecin lié pour user_id=${user.id}`);
                    return res.json({ success: true, data: [], pagination: { page: parseInt(page), limit: parseInt(limit), total: 0, pages: 0 } });
                }
                // Les médecins voient seulement leur centre
                filters.centre_id = user.id_centre;
            } else if (user.role === 'ministere') {
                // Le ministère peut voir tous les centres
                filters.centre_id = centre_id;
            } else {
                // Les autres voient seulement leur centre
                filters.centre_id = user.id_centre;
            }
            
            const items = await RendezVous.findAll(parseInt(limit), offset, filters);
            const total = await RendezVous.count(filters);
            res.json({ success: true, data: items, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } });
        } catch (e) {
            res.status(500).json({ success: false, message: 'Erreur récupération RDV', error: e.message });
        }
    }

    static async update(req, res) {
        try {
            const item = await RendezVous.update(req.params.id, req.body);
            res.json({ success: true, data: item });
        } catch (e) {
            res.status(500).json({ success: false, message: 'Erreur mise à jour RDV', error: e.message });
        }
    }

    static async annuler(req, res) {
        try {
            const result = await RendezVous.annuler(req.params.id, req.body.raison || '');
            try {
                const rdv = await RendezVous.findById(req.params.id);
                if (rdv) {
                    const patient = await Patient.findById(rdv.patient_id);
                    if (patient) await notifyRdv(patient, rdv, 'annule');
                }
            } catch {}
            res.json({ success: true, message: result.message });
        } catch (e) {
            res.status(500).json({ success: false, message: 'Erreur annulation RDV', error: e.message });
        }
    }

    static async confirmer(req, res) {
        try {
            // Récupérer la durée depuis le body (optionnelle, défaut: 30 minutes)
            const duree_estimee = req.body.duree_estimee ? parseInt(req.body.duree_estimee) : null;
            
            // Validation d'intégrité de la durée estimée
            if (duree_estimee !== null) {
                const dureeValidation = DataIntegrityValidators.validateDureeConsultation(duree_estimee);
                if (!dureeValidation.valid) {
                    return res.status(400).json({ 
                        success: false, 
                        message: dureeValidation.message
                    });
                }
            }
            
            const result = await RendezVous.confirmer(req.params.id, duree_estimee);
            try {
                const rdv = await RendezVous.findById(req.params.id);
                if (rdv) {
                    const patient = await Patient.findById(rdv.patient_id);
                    if (patient) await notifyRdv(patient, rdv, 'confirme');
                }
            } catch {}
            res.json({ 
                success: true, 
                message: result.message,
                duree_estimee: result.duree_estimee
            });
        } catch (e) {
            res.status(500).json({ success: false, message: 'Erreur confirmation RDV', error: e.message });
        }
    }

    static async terminer(req, res) {
        try {
            const { duree_reelle, note_medecin } = req.body;
            
            // Validation d'intégrité de la durée réelle si fournie
            if (duree_reelle !== undefined && duree_reelle !== null) {
                const dureeValidation = DataIntegrityValidators.validateDureeConsultation(duree_reelle);
                if (!dureeValidation.valid) {
                    return res.status(400).json({ 
                        success: false, 
                        message: dureeValidation.message
                    });
                }
            }
            
            const result = await RendezVous.terminer(req.params.id, duree_reelle, note_medecin || '');
            
            // Si réajustement effectué, notifier les patients affectés (optionnel)
            if (result.reajustement) {
                console.log(`✅ Réajustement effectué: ${result.reajustement}`);
                // TODO: Envoyer notifications aux patients affectés si changement > 15 min
            }
            
            res.json({ 
                success: true, 
                message: result.message,
                reajustement: result.reajustement || null
            });
        } catch (e) {
            res.status(500).json({ success: false, message: 'Erreur finalisation RDV', error: e.message });
        }
    }

    // Check-in d'un patient (arrivé au centre)
    static async checkin(req, res) {
        try {
            const result = await RendezVous.checkin(req.params.id);
            
            // Si réajustement effectué, log et informer
            if (result.reajustement) {
                console.log(`✅ Réajustement check-in: ${JSON.stringify(result.reajustement)}`);
            }
            
            res.json({ 
                success: true, 
                message: result.message,
                reajustement: result.reajustement || null
            });
        } catch (e) {
            res.status(500).json({ success: false, message: 'Erreur check-in RDV', error: e.message });
        }
    }

    // Démarrer la consultation
    static async demarrer(req, res) {
        try {
            const result = await RendezVous.demarrer(req.params.id);
            res.json({ success: true, message: result.message });
        } catch (e) {
            res.status(500).json({ success: false, message: 'Erreur démarrage consultation', error: e.message });
        }
    }

    // Prochain RDV en file d'attente pour un centre
    static async prochainPourCentre(req, res) {
        try {
            const { centre_id } = req.query;
            if (!centre_id) return res.status(400).json({ success: false, message: 'centre_id requis' });
            const rdv = await RendezVous.getNextInQueue(centre_id);
            res.json({ success: true, data: rdv });
        } catch (e) {
            res.status(500).json({ success: false, message: 'Erreur récupération prochain RDV', error: e.message });
        }
    }

    static async duJour(req, res) {
        try {
            const user = req.user;
            // Les agents de centre / personnel voient uniquement les RDV de leur centre
            // Le ministère peut spécifier un centre ou voir tous les centres
            const centreId = user.role === 'ministere' 
                ? (req.query.centre_id || null) 
                : user.id_centre;
            
            const data = await RendezVous.getRendezVousDuJour(centreId);
            res.json({ success: true, data });
        } catch (e) {
            res.status(500).json({ success: false, message: 'Erreur RDV du jour', error: e.message });
        }
    }

    static async medecinJour(req, res) {
        try {
            const data = await RendezVous.getRendezVousMedecin(req.params.medecin_id, req.query.date);
            res.json({ success: true, data });
        } catch (e) {
            res.status(500).json({ success: false, message: 'Erreur RDV médecin', error: e.message });
        }
    }

    static async stats(req, res) {
        try {
            const data = await RendezVous.getStatistiques(req.query.centre_id || null, req.query.periode || 'jour');
            res.json({ success: true, data });
        } catch (e) {
            res.status(500).json({ success: false, message: 'Erreur stats RDV', error: e.message });
        }
    }

    static async medecinAujourdhui(req, res) {
        try {
            const { executeQuery } = require('../config/database');
            const userId = req.params.medecin_id; // C'est l'id_user depuis le JWT
            
            console.log(`🔍 GET /rendez-vous/medecin/${userId}/aujourdhui - Recherche RDV pour user_id=${userId}`);
            
            // Récupérer l'id_medecin depuis user_id
            const medecinLink = await executeQuery(`
                SELECT id_medecin FROM medecins WHERE user_id = ?
            `, [userId]);
            
            if (medecinLink.length === 0) {
                console.log(`⚠️ Aucun médecin trouvé pour user_id=${userId}`);
                return res.json({ success: true, data: [] }); // Pas de médecin lié = pas de RDV
            }
            
            const medecinId = medecinLink[0].id_medecin;
            console.log(`✅ Médecin trouvé: id_medecin=${medecinId} pour user_id=${userId}`);
            
            const rdv = await executeQuery(`
                SELECT 
                    rv.id_rdv as id,
                    rv.id_rdv,
                    rv.date_rdv,
                    rv.duree_estimee,
                    p.nom,
                    p.prenom,
                    TIMESTAMPDIFF(YEAR, p.date_naissance, CURDATE()) as age,
                    p.telephone,
                    JSON_UNQUOTE(JSON_EXTRACT(rv.symptomes, '$.motif')) as motif,
                    TIME_FORMAT(rv.date_rdv, '%H:%i') as heure,
                    rv.statut
                FROM rendez_vous rv
                JOIN patients p ON p.id_patient = rv.patient_id
                WHERE rv.medecin_id = ? 
                AND DATE(rv.date_rdv) = CURDATE()
                AND rv.statut NOT IN ('annule', 'absent', 'termine')
                ORDER BY rv.date_rdv ASC
            `, [medecinId]);
            
            console.log(`✅ ${rdv.length} rendez-vous trouvés pour medecin_id=${medecinId}`);
            
            res.json({ success: true, data: rdv });
        } catch (e) {
            res.status(500).json({ success: false, message: 'Erreur RDV médecin aujourd\'hui', error: e.message });
        }
    }

    static async patientRDV(req, res) {
        try {
            const { executeQuery } = require('../config/database');
            const patientId = req.params.patient_id;
            
            const rdv = await executeQuery(`
                SELECT 
                    rv.id_rdv as id,
                    DATE(rv.date_rdv) as date_rdv,
                    TIME(rv.date_rdv) as heure_rdv,
                    CONCAT(m.nom, ' ', m.prenom) as medecin,
                    m.specialite,
                    JSON_UNQUOTE(JSON_EXTRACT(rv.symptomes, '$.motif')) as motif,
                    rv.statut
                FROM rendez_vous rv
                JOIN medecins m ON m.id_medecin = rv.medecin_id
                WHERE rv.patient_id = ?
                ORDER BY rv.date_rdv DESC
            `, [patientId]);
            
            res.json({ success: true, data: rdv });
        } catch (e) {
            res.status(500).json({ success: false, message: 'Erreur RDV patient', error: e.message });
        }
    }

    // Créer un rendez-vous pour un patient qui arrive sans RDV (walk-in)
    static async walkIn(req, res) {
        try {
            const user = req.user;
            console.log('🚶 POST /rendez-vous/walk-in - Utilisateur:', user);
            console.log('🚶 Données reçues:', req.body);
            
            // Vérifier que l'utilisateur a les droits (admin, personnel, ou médecin)
            if (!['admin_centre', 'personnel', 'medecin', 'ministere'].includes(user.role)) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Vous n\'avez pas les droits pour créer un rendez-vous walk-in' 
                });
            }

            const required = ['patient_id', 'medecin_id'];
            const missing = required.filter(f => !req.body[f]);
            if (missing.length) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Champs manquants: ${missing.join(', ')}` 
                });
            }

            // Déterminer le centre_id
            let centreId = req.body.centre_id;
            if (!centreId) {
                if (user.role === 'ministere') {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'Centre ID requis pour le ministère' 
                    });
                }
                centreId = user.id_centre;
            }

            // Créer un RDV avec la date/heure actuelle (en HEURE LOCALE)
            const maintenant = new Date();
            const dateTimeRdv = formatDateTimeForMySQL(maintenant);

            // Préparer les symptômes
            const symptomesArray = req.body.symptomes ? 
                (Array.isArray(req.body.symptomes) ? req.body.symptomes : req.body.symptomes.split(',').map(s => s.trim())) 
                : [];
            
            const symptomesData = {
                motif: req.body.motif || 'Consultation sans rendez-vous',
                symptomes: symptomesArray,
                intensite: req.body.intensite || 'moderee'
            };

            // Préparer les données pour le modèle
            const rdvData = {
                patient_id: req.body.patient_id,
                medecin_id: req.body.medecin_id,
                centre_id: centreId,
                date_rdv: dateTimeRdv,
                symptomes: symptomesData,
                orientation: req.body.orientation || 'generaliste',
                note_patient: req.body.note_patient || '',
                duree_estimee: parseInt(req.body.duree_estimee) || 30,
                // Marquer l'arrivée immédiatement
                heure_arrivee: maintenant.toTimeString().slice(0, 8),
                statut: 'attente' // En attente dans la file
            };

            console.log('✅ Données RDV walk-in préparées:', rdvData);

            // Créer le RDV
            const item = await RendezVous.create(rdvData);
            console.log('✅ RDV walk-in créé avec ID:', item.id || item.id_rdv);
            
            // Mettre à jour l'heure d'arrivée (déjà dans rdvData mais on s'assure)
            if (item.id_rdv) {
                const { executeQuery } = require('../config/database');
                await executeQuery(
                    `UPDATE rendez_vous SET heure_arrivee = NOW() WHERE id_rdv = ?`,
                    [item.id_rdv || item.id]
                );
            }
            
            res.status(201).json({ 
                success: true, 
                data: item, 
                message: 'Patient enregistré et ajouté à la file d\'attente' 
            });
        } catch (e) {
            console.error('❌ Erreur création RDV walk-in:', e);
            res.status(500).json({ 
                success: false, 
                message: 'Erreur création rendez-vous walk-in', 
                error: e.message 
            });
        }
    }

    /**
     * Vérifier la disponibilité d'un créneau pour un médecin
     * GET /api/rendez-vous/check-availability
     */
    static async checkAvailability(req, res) {
        try {
            const { medecin_id, date_rdv, heure_rdv, duree = 30 } = req.query;
            
            if (!medecin_id || !date_rdv || !heure_rdv) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Paramètres manquants: medecin_id, date_rdv et heure_rdv sont requis' 
                });
            }
            
            // Combiner date et heure
            const heure = heure_rdv.includes(':') ? heure_rdv : `${heure_rdv}:00`;
            const dateTimeRdv = `${date_rdv} ${heure}`;
            const dateTimeRdvDebut = new Date(dateTimeRdv);
            const dateTimeRdvFin = new Date(dateTimeRdvDebut.getTime() + (parseInt(duree) * 60 * 1000));
            
            // Format pour MySQL en HEURE LOCALE
            const dateTimeRdvDebutStr = formatDateTimeForMySQL(dateTimeRdvDebut);
            const dateTimeRdvFinStr = formatDateTimeForMySQL(dateTimeRdvFin);
            
            const { executeQuery } = require('../config/database');
            
            // Vérifier les chevauchements
            const existingRDV = await executeQuery(`
                SELECT 
                    id_rdv,
                    date_rdv,
                    duree_estimee,
                    DATE_ADD(date_rdv, INTERVAL duree_estimee MINUTE) as date_fin
                FROM rendez_vous
                WHERE medecin_id = ?
                AND DATE(date_rdv) = DATE(?)
                AND statut NOT IN ('annule', 'termine')
                AND (
                    date_rdv < ? 
                    AND DATE_ADD(date_rdv, INTERVAL duree_estimee MINUTE) > ?
                )
                LIMIT 1
            `, [medecin_id, dateTimeRdv, dateTimeRdvFinStr, dateTimeRdvDebutStr]);
            
            const isAvailable = !existingRDV || existingRDV.length === 0;
            
            if (!isAvailable && existingRDV.length > 0) {
                const rdvExist = existingRDV[0];
                const heureExist = new Date(rdvExist.date_rdv).toLocaleTimeString('fr-FR', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    timeZone: 'UTC'
                });
                const heureFinExist = new Date(rdvExist.date_fin).toLocaleTimeString('fr-FR', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    timeZone: 'UTC'
                });
                
                return res.json({
                    success: true,
                    available: false,
                    conflict: {
                        existing_rdv_id: rdvExist.id_rdv,
                        existing_time: `${heureExist} - ${heureFinExist}`
                    },
                    message: `Créneau non disponible. Le médecin a déjà un rendez-vous de ${heureExist} à ${heureFinExist}.`
                });
            }
            
            res.json({
                success: true,
                available: true,
                message: 'Créneau disponible'
            });
        } catch (error) {
            console.error('❌ Erreur vérification disponibilité:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Erreur lors de la vérification de disponibilité', 
                error: error.message 
            });
        }
    }
}

module.exports = RendezVousController;
