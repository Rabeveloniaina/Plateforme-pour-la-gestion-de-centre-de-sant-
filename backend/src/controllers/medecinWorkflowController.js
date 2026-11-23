/**
 * Contrôleur pour les fonctionnalités de workflow du médecin
 * Centralise toutes les opérations quotidiennes du médecin
 */

const { asyncHandler, Errors } = require('../utils/asyncHandler');
const RendezVous = require('../models/RendezVous');
const FicheMedicale = require('../models/FicheMedicale');
const Patient = require('../models/Patient');
const Prescription = require('../models/Prescription');
const { formatDateForMySQL } = require('../utils/dateFormatter');
const OrientationService = require('../services/orientationService');

class MedecinWorkflowController {
    /**
     * 1. Consulter planning du jour
     * GET /api/medecin/workflow/planning-du-jour
     */
    static getPlanningDuJour = asyncHandler(async (req, res) => {
        const user = req.user;
        const { date } = req.query;
        const { executeQuery } = require('../config/database');
        
        console.log(`📅 GET /planning-du-jour - user_id: ${user.id}, date: ${date}`);
        
        // Récupérer l'id_medecin depuis user_id
        const medecinLink = await executeQuery(
            'SELECT id_medecin FROM medecins WHERE user_id = ?',
            [user.id]
        );
        
        if (medecinLink.length === 0) {
            console.error(`❌ Médecin non trouvé pour user_id: ${user.id}`);
            throw Errors.NOT_FOUND('Médecin');
        }
        
        const medecinId = medecinLink[0].id_medecin;
        const targetDate = date ? new Date(date) : new Date();
        const dateStr = formatDateForMySQL(targetDate);
        
        console.log(`📅 Récupération RDV pour médecin ${medecinId}, date: ${dateStr}`);
        
        // Récupérer les rendez-vous du jour
        // Note: date_rdv est un DATETIME, pas de colonne heure_rdv séparée
        // Certaines colonnes peuvent ne pas exister (heure_arrivee, heure_debut_consultation, etc.)
        let rdvs = [];
        try {
            // Essayer d'abord avec toutes les colonnes
            try {
                rdvs = await executeQuery(`
                    SELECT 
                        rv.id_rdv,
                        rv.date_rdv,
                        DATE_FORMAT(rv.date_rdv, '%Y-%m-%d') as date_rdv_date,
                        TIME_FORMAT(rv.date_rdv, '%H:%i') as heure_rdv,
                        rv.statut,
                        rv.symptomes,
                        rv.orientation,
                        rv.note_medecin,
                        rv.duree_estimee,
                        rv.duree_reelle,
                        rv.heure_arrivee,
                        rv.heure_debut_consultation,
                        rv.heure_fin_consultation,
                        rv.patient_id,
                        p.id_patient,
                        p.nom as patient_nom,
                        p.prenom as patient_prenom,
                        p.telephone as patient_telephone,
                        p.date_naissance,
                        p.sexe
                    FROM rendez_vous rv
                    INNER JOIN patients p ON rv.patient_id = p.id_patient
                    WHERE rv.medecin_id = ?
                    AND DATE(rv.date_rdv) = ?
                    AND rv.statut != 'annule'
                    ORDER BY rv.date_rdv ASC
                `, [medecinId, dateStr]);
            } catch (colError) {
                // Si erreur de colonne, essayer sans les colonnes optionnelles
                if (colError.message && colError.message.includes('Unknown column')) {
                    console.warn('⚠️ Certaines colonnes n\'existent pas, utilisation de la requête simplifiée');
                    rdvs = await executeQuery(`
                        SELECT 
                            rv.id_rdv,
                            rv.date_rdv,
                            DATE_FORMAT(rv.date_rdv, '%Y-%m-%d') as date_rdv_date,
                            TIME_FORMAT(rv.date_rdv, '%H:%i') as heure_rdv,
                            rv.statut,
                            rv.symptomes,
                            rv.orientation,
                            rv.note_medecin,
                            rv.duree_estimee,
                            rv.duree_reelle,
                            rv.patient_id,
                            p.id_patient,
                            p.nom as patient_nom,
                            p.prenom as patient_prenom,
                            p.telephone as patient_telephone,
                            p.date_naissance,
                            p.sexe
                        FROM rendez_vous rv
                        INNER JOIN patients p ON rv.patient_id = p.id_patient
                        WHERE rv.medecin_id = ?
                        AND DATE(rv.date_rdv) = ?
                        AND rv.statut != 'annule'
                        ORDER BY rv.date_rdv ASC
                    `, [medecinId, dateStr]);
                } else {
                    throw colError;
                }
            }
            console.log(`✅ ${rdvs.length} rendez-vous trouvés pour le ${dateStr}`);
        } catch (error) {
            console.error('❌ Erreur lors de la récupération des RDV:', error);
            throw error;
        }
        
        // Calculer les statistiques du jour
        const stats = {
            total: rdvs.length,
            en_attente: rdvs.filter(r => r.statut === 'attente').length,
            en_cours: rdvs.filter(r => r.statut === 'en_cours').length,
            termines: rdvs.filter(r => r.statut === 'termine').length,
            absents: rdvs.filter(r => r.statut === 'absent').length
        };
        
        // S'assurer que patient_id est bien présent dans chaque RDV
        const rdvsWithPatientId = rdvs.map(rdv => {
            const rdvData = {
                ...rdv,
                age: rdv.date_naissance ? 
                    Math.floor((new Date() - new Date(rdv.date_naissance)) / (365.25 * 24 * 60 * 60 * 1000)) : null
            };
            // S'assurer que patient_id est défini (utiliser id_patient si patient_id n'existe pas)
            // CRITIQUE: patient_id doit TOUJOURS être défini pour que le frontend puisse ouvrir le dossier
            if (!rdvData.patient_id) {
                rdvData.patient_id = rdvData.id_patient || null;
            }
            // Si patient_id est toujours null, il y a un problème de données
            if (!rdvData.patient_id) {
                console.error(`❌ ERREUR: RDV ${rdvData.id_rdv} n'a pas de patient_id!`, rdvData);
            }
            console.log(`📋 RDV ${rdvData.id_rdv}: patient_id=${rdvData.patient_id}, id_patient=${rdvData.id_patient}, keys:`, Object.keys(rdvData));
            return rdvData;
        });
        
        res.json({
            success: true,
            data: {
                date: dateStr,
                rendez_vous: rdvsWithPatientId,
                statistiques: stats
            }
        });
    });

    /**
     * 2. Consulter dossier patient
     * GET /api/medecin/workflow/dossier-patient/:patient_id
     */
    static getDossierPatient = asyncHandler(async (req, res) => {
        const { patient_id } = req.params;
        const user = req.user;
        
        console.log(`📋 GET /dossier-patient/${patient_id} - user_id: ${user.id}`);
        
        // Récupérer l'ID du médecin d'abord
        const { executeQuery } = require('../config/database');
        const medecinLink = await executeQuery(
            'SELECT id_medecin FROM medecins WHERE user_id = ?',
            [user.id]
        );
        
        if (medecinLink.length === 0) {
            console.error(`❌ Médecin non trouvé pour user_id: ${user.id}`);
            throw Errors.NOT_FOUND('Médecin');
        }
        
        const medecinId = medecinLink[0].id_medecin;
        console.log(`✅ Médecin trouvé: id_medecin=${medecinId} pour user_id=${user.id}`);
        
        // Vérifier que le patient existe
        console.log(`🔍 Recherche patient avec id_patient=${patient_id}`);
        const patient = await Patient.findById(patient_id);
        if (!patient) {
            console.error(`❌ Patient ${patient_id} non trouvé dans la base de données`);
            // Afficher les patients disponibles pour débogage
            try {
                const allPatients = await executeQuery('SELECT id_patient, nom, prenom FROM patients ORDER BY id_patient DESC LIMIT 20', []);
                console.log(`📋 Patients disponibles (derniers 20):`, allPatients.map(p => ({ id_patient: p.id_patient, nom: p.nom, prenom: p.prenom })));
                
                // Vérifier aussi les rendez-vous pour voir quel patient_id est utilisé
                const rdvs = await executeQuery('SELECT DISTINCT patient_id FROM rendez_vous WHERE medecin_id = ? ORDER BY patient_id DESC LIMIT 10', [medecinId]);
                console.log(`📋 Patient IDs des RDV de ce médecin:`, rdvs.map(r => r.patient_id));
                
                // Vérifier si le patient_id existe dans les rendez-vous
                const rdvWithPatient = await executeQuery('SELECT patient_id, id_rdv, date_rdv FROM rendez_vous WHERE patient_id = ? AND medecin_id = ? LIMIT 1', [patient_id, medecinId]);
                if (rdvWithPatient.length > 0) {
                    console.log(`⚠️ Le patient_id ${patient_id} existe dans les rendez-vous mais pas dans la table patients!`);
                    console.log(`   RDV trouvé:`, rdvWithPatient[0]);
                }
            } catch (err) {
                console.error('Erreur lors de la récupération des patients:', err);
            }
            throw Errors.NOT_FOUND('Patient');
        }
        console.log(`✅ Patient trouvé: ${patient.nom} ${patient.prenom} (id_patient=${patient.id_patient})`);
        
        // Historique des rendez-vous
        // Note: date_rdv est un DATETIME, pas de colonne heure_rdv séparée
        let historiqueRDV = [];
        try {
            historiqueRDV = await executeQuery(`
                SELECT 
                    rv.id_rdv,
                    rv.date_rdv,
                    DATE_FORMAT(rv.date_rdv, '%Y-%m-%d') as date_rdv_date,
                    TIME_FORMAT(rv.date_rdv, '%H:%i') as heure_rdv,
                    rv.statut,
                    rv.symptomes,
                    rv.orientation,
                    rv.note_medecin,
                    rv.duree_reelle
                FROM rendez_vous rv
                WHERE rv.patient_id = ?
                AND rv.medecin_id = ?
                ORDER BY rv.date_rdv DESC
                LIMIT 20
            `, [patient_id, medecinId]);
        } catch (error) {
            console.error('❌ Erreur récupération historique RDV:', error);
            // Si erreur de colonne, essayer sans heure_rdv
            if (error.message && error.message.includes('Unknown column')) {
                historiqueRDV = await executeQuery(`
                    SELECT 
                        rv.id_rdv,
                        rv.date_rdv,
                        DATE_FORMAT(rv.date_rdv, '%Y-%m-%d') as date_rdv_date,
                        TIME_FORMAT(rv.date_rdv, '%H:%i') as heure_rdv,
                        rv.statut,
                        rv.symptomes,
                        rv.orientation,
                        rv.note_medecin,
                        rv.duree_reelle
                    FROM rendez_vous rv
                    WHERE rv.patient_id = ?
                    AND rv.medecin_id = ?
                    ORDER BY rv.date_rdv DESC
                    LIMIT 20
                `, [patient_id, medecinId]);
            } else {
                throw error;
            }
        }
        
        // Historique des fiches médicales
        // Note: La table fiches_medicales peut ne pas avoir de colonne statut
        let fichesMedicales = [];
        try {
            fichesMedicales = await executeQuery(`
                SELECT 
                    fm.id_fiche,
                    fm.date_consultation,
                    fm.motif_consultation,
                    fm.diagnostic_principal,
                    fm.poids,
                    fm.taille,
                    fm.tension_systolique,
                    fm.tension_diastolique,
                    fm.temperature,
                    fm.observations_medecin,
                    fm.recommandations
                FROM fiches_medicales fm
                WHERE fm.patient_id = ?
                AND fm.medecin_id = ?
                ORDER BY fm.date_consultation DESC
                LIMIT 10
            `, [patient_id, medecinId]);
        } catch (error) {
            console.error('❌ Erreur récupération fiches médicales:', error);
            // Si erreur de colonne, essayer sans les colonnes optionnelles
            if (error.message && error.message.includes('Unknown column')) {
                try {
                    fichesMedicales = await executeQuery(`
                        SELECT 
                            fm.id_fiche,
                            fm.date_consultation,
                            fm.motif_consultation,
                            fm.diagnostic_principal,
                            fm.poids,
                            fm.taille,
                            fm.tension_systolique,
                            fm.tension_diastolique,
                            fm.temperature
                        FROM fiches_medicales fm
                        WHERE fm.patient_id = ?
                        AND fm.medecin_id = ?
                        ORDER BY fm.date_consultation DESC
                        LIMIT 10
                    `, [patient_id, medecinId]);
                } catch (e2) {
                    console.error('❌ Erreur deuxième tentative fiches médicales:', e2);
                    fichesMedicales = [];
                }
            } else {
                // Pour d'autres erreurs, continuer avec un tableau vide
                fichesMedicales = [];
            }
        }
        
        // Prescriptions actives
        let prescriptionsActives = [];
        try {
            prescriptionsActives = await Prescription.getActivePrescriptions(patient_id);
        } catch (error) {
            console.error('❌ Erreur récupération prescriptions:', error);
            // Continuer sans prescriptions si erreur
            prescriptionsActives = [];
        }
        
        // Informations médicales de base du patient
        // Combiner les données de patients (groupe_sanguin) et patients_infos_medicales (détails)
        let infosMedicales = {
            groupe_sanguin: patient.groupe_sanguin || null
        };
        
        // Récupérer les infos supplémentaires depuis patients_infos_medicales si disponible
        try {
            const infosSupp = await executeQuery(`
                SELECT 
                    poids,
                    taille,
                    tension,
                    allergies,
                    antecedents,
                    maladies_chroniques,
                    medicaments_actuels,
                    contacts_urgence
                FROM patients_infos_medicales
                WHERE patient_id = ?
                LIMIT 1
            `, [patient_id]);
            
            if (infosSupp.length > 0) {
                infosMedicales = { ...infosMedicales, ...infosSupp[0] };
                console.log(`✅ Infos médicales supplémentaires trouvées pour patient ${patient_id}`);
            } else {
                console.log(`ℹ️ Pas d'infos médicales supplémentaires pour patient ${patient_id}`);
            }
        } catch (error) {
            console.warn('⚠️ Table patients_infos_medicales non disponible ou erreur:', error.message);
            // Table optionnelle, continuer avec juste le groupe sanguin
        }
        
        console.log(`✅ Dossier patient récupéré pour patient_id=${patient_id}, médecin_id=${medecinId}`);
        console.log(`   - RDV: ${historiqueRDV.length}, Fiches: ${fichesMedicales.length}, Prescriptions: ${prescriptionsActives.length}`);
        console.log(`   - Infos médicales:`, infosMedicales);
        
        res.json({
            success: true,
            data: {
                patient,
                infos_medicales: infosMedicales,
                historique_rdv: historiqueRDV || [],
                fiches_medicales: fichesMedicales || [],
                prescriptions_actives: prescriptionsActives || []
            }
        });
    });

    /**
     * 3. Mettre à jour fiche médicale
     * PUT /api/medecin/workflow/fiche-medicale/:fiche_id
     */
    static updateFicheMedicale = asyncHandler(async (req, res) => {
        const { fiche_id } = req.params;
        const updateData = req.body;
        const user = req.user;
        
        // Vérifier que la fiche existe et appartient au médecin
        const existingFiche = await FicheMedicale.findById(fiche_id);
        if (!existingFiche) {
            throw Errors.NOT_FOUND('Fiche médicale');
        }
        
        const { executeQuery } = require('../config/database');
        const medecinLink = await executeQuery(
            'SELECT id_medecin FROM medecins WHERE user_id = ?',
            [user.id]
        );
        
        if (medecinLink.length === 0) {
            throw Errors.NOT_FOUND('Médecin');
        }
        
        const medecinId = medecinLink[0].id_medecin;
        
        // Vérifier que la fiche appartient au médecin
        if (existingFiche.medecin_id != medecinId) {
            throw Errors.FORBIDDEN('Vous ne pouvez modifier que vos propres fiches médicales');
        }
        
        // Mettre à jour la fiche
        const fiche = await FicheMedicale.update(fiche_id, updateData);
        
        res.json({
            success: true,
            message: 'Fiche médicale mise à jour avec succès',
            data: fiche
        });
    });

    /**
     * 4. Enregistrer consultation (complète avec fiche médicale)
     * POST /api/medecin/workflow/enregistrer-consultation
     */
    static enregistrerConsultation = asyncHandler(async (req, res) => {
        const user = req.user;
        const {
            rdv_id,
            patient_id,
            fiche_medicale,
            prescriptions = [],
            examens_complementaires = [],
            terminer_rdv = true
        } = req.body;
        
        const { executeQuery } = require('../config/database');
        
        // Récupérer l'id_medecin
        const medecinLink = await executeQuery(
            'SELECT id_medecin FROM medecins WHERE user_id = ?',
            [user.id]
        );
        
        if (medecinLink.length === 0) {
            throw Errors.NOT_FOUND('Médecin');
        }
        
        const medecinId = medecinLink[0].id_medecin;
        
        // Validation des données requises
        if (!fiche_medicale || !fiche_medicale.motif_consultation) {
            throw Errors.VALIDATION_ERROR('Le motif de consultation est requis');
        }
        
        // Vérifier que le patient existe
        const patient = await Patient.findById(patient_id);
        if (!patient) {
            throw Errors.NOT_FOUND('Patient');
        }

        // Vérifier que le médecin existe
        const medecin = await executeQuery(
            'SELECT id_medecin FROM medecins WHERE id_medecin = ?',
            [medecinId]
        );
        if (medecin.length === 0) {
            throw Errors.NOT_FOUND('Médecin');
        }
        
        // Créer la fiche médicale
        // Note: Un patient peut changer de centre et consulter un médecin d'un autre centre
        const dateConsultation = fiche_medicale.date_consultation || formatDateForMySQL(new Date());
        const ficheData = {
            ...fiche_medicale,
            patient_id,
            medecin_id: medecinId,
            date_consultation: dateConsultation
        };

        // Validation d'intégrité des données
        // Valider le motif de consultation
        if (ficheData.motif_consultation) {
            const motifValidation = DataIntegrityValidators.validateMotifConsultation(ficheData.motif_consultation);
            if (!motifValidation.valid) {
                throw Errors.VALIDATION_ERROR(motifValidation.message);
            }
        }

        // Valider la date de consultation (ne peut pas être dans le futur)
        const dateConsultValidation = DataIntegrityValidators.validateDateConsultationPasFutur(dateConsultation);
        if (!dateConsultValidation.valid) {
            throw Errors.VALIDATION_ERROR(dateConsultValidation.message);
        }

        // Valider les valeurs médicales
        const valeursMedicales = {
            poids: ficheData.poids,
            taille: ficheData.taille,
            tension_systolique: ficheData.tension_systolique,
            tension_diastolique: ficheData.tension_diastolique,
            frequence_cardiaque: ficheData.frequence_cardiaque,
            temperature: ficheData.temperature
        };
        const valeursValidation = DataIntegrityValidators.validateValeursMedicales(valeursMedicales);
        if (!valeursValidation.valid) {
            throw Errors.VALIDATION_ERROR(valeursValidation.errors.join(' '));
        }

        // Valider la date du prochain RDV si fournie
        if (ficheData.date_prochain_rdv) {
            const dateProchainRdv = new Date(ficheData.date_prochain_rdv);
            const maintenant = new Date();
            if (dateProchainRdv <= maintenant) {
                throw Errors.VALIDATION_ERROR('La date du prochain rendez-vous doit être dans le futur');
            }

            const dateFinValidation = DataIntegrityValidators.validateDateFinApresDebut(
                dateConsultation,
                ficheData.date_prochain_rdv,
                'consultation'
            );
            if (!dateFinValidation.valid) {
                throw Errors.VALIDATION_ERROR(dateFinValidation.message);
            }
        }
        
        const fiche = await FicheMedicale.create(ficheData);
        
        // Créer les prescriptions si présentes
        let prescriptionsCreated = [];
        if (prescriptions.length > 0) {
            const prescriptionsWithFiche = prescriptions.map(p => ({
                ...p,
                patient_id,
                medecin_id: medecinId,
                fiche_medicale_id: fiche.id_fiche
            }));
            
            prescriptionsCreated = await Prescription.createMultiple(prescriptionsWithFiche);
        }
        
        // Terminer le rendez-vous si demandé
        if (terminer_rdv && rdv_id) {
            const rdv = await RendezVous.findById(rdv_id);
            if (rdv && rdv.medecin_id == medecinId) {
                const dureeReelle = fiche_medicale.duree_consultation || 30;
                const noteMedecin = `Consultation enregistrée. Fiche #${fiche.id_fiche}`;
                await RendezVous.terminer(rdv_id, dureeReelle, noteMedecin);
            }
        }
        
        res.status(201).json({
            success: true,
            message: 'Consultation enregistrée avec succès',
            data: {
                fiche,
                prescriptions: prescriptionsCreated,
                examens_complementaires,
                rdv_termine: terminer_rdv && rdv_id
            }
        });
    });

    /**
     * 5. Rediriger vers spécialiste
     * POST /api/medecin/workflow/rediriger-specialiste
     */
    static redirigerVersSpecialiste = asyncHandler(async (req, res) => {
        const user = req.user;
        const {
            patient_id,
            rdv_id,
            symptomes,
            specialite,
            motif_orientation,
            centre_id = null
        } = req.body;
        
        const { executeQuery } = require('../config/database');
        
        // Validation
        if (!patient_id || !specialite) {
            throw Errors.VALIDATION_ERROR('Patient ID et spécialité requis');
        }
        
        // Vérifier que le patient existe
        const patient = await Patient.findById(patient_id);
        if (!patient) {
            throw Errors.NOT_FOUND('Patient');
        }
        
        // Analyser l'orientation si symptômes fournis
        let specialiteRecommandee = specialite;
        let raisonOrientation = motif_orientation || 'Orientation médicale nécessaire';
        
        if (symptomes) {
            const orientationResult = await OrientationService.analyserOrientation({
                symptomes: Array.isArray(symptomes) ? symptomes : [symptomes],
                motif: motif_orientation || ''
            });
            
            if (orientationResult.orientation === 'specialiste' && orientationResult.specialite) {
                specialiteRecommandee = orientationResult.specialite;
                raisonOrientation = orientationResult.raison;
            }
        }
        
        // Trouver les spécialistes disponibles
        const specialistes = await OrientationService.trouverSpecialistes(
            specialiteRecommandee,
            centre_id || patient.centre_id
        );
        
        // Mettre à jour le rendez-vous si rdv_id fourni
        if (rdv_id) {
            const rdv = await RendezVous.findById(rdv_id);
            if (rdv) {
                await RendezVous.update(rdv_id, {
                    orientation: 'specialiste',
                    note_medecin: `Orientation vers ${specialiteRecommandee}. ${raisonOrientation}`
                });
            }
        }
        
        res.json({
            success: true,
            message: 'Orientation vers spécialiste effectuée',
            data: {
                patient_id,
                specialite: specialiteRecommandee,
                raison: raisonOrientation,
                specialistes_disponibles: specialistes,
                suggestion: specialistes.length > 0 
                    ? `Créer un nouveau rendez-vous avec l'un des spécialistes disponibles`
                    : `Aucun spécialiste disponible dans ce centre. Consultez d'autres centres.`
            }
        });
    });

    /**
     * 6. Suivre statistiques personnelles
     * GET /api/medecin/workflow/statistiques-personnelles
     */
    static getStatistiquesPersonnelles = asyncHandler(async (req, res) => {
        const user = req.user;
        const { periode = 'mois', date_debut, date_fin } = req.query;
        const { executeQuery } = require('../config/database');
        
        console.log(`📊 GET /statistiques-personnelles - user_id: ${user.id}, periode: ${periode}`);
        
        // Récupérer l'id_medecin
        const medecinLink = await executeQuery(
            'SELECT id_medecin FROM medecins WHERE user_id = ?',
            [user.id]
        );
        
        if (medecinLink.length === 0) {
            console.error(`❌ Médecin non trouvé pour user_id: ${user.id}`);
            throw Errors.NOT_FOUND('Médecin');
        }
        
        const medecinId = medecinLink[0].id_medecin;
        console.log(`📊 Calcul statistiques pour médecin ${medecinId}, période: ${periode}`);
        
        // Calculer les dates selon la période
        let dateDebut, dateFin;
        const now = new Date();
        
        if (periode === 'jour') {
            dateDebut = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            dateFin = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        } else if (periode === 'semaine') {
            const jour = now.getDay();
            const diff = now.getDate() - jour;
            dateDebut = new Date(now.setDate(diff));
            dateFin = new Date(now.setDate(diff + 7));
        } else if (periode === 'mois') {
            dateDebut = new Date(now.getFullYear(), now.getMonth(), 1);
            dateFin = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        } else if (date_debut && date_fin) {
            dateDebut = new Date(date_debut);
            dateFin = new Date(date_fin);
        } else {
            // Par défaut : mois en cours
            dateDebut = new Date(now.getFullYear(), now.getMonth(), 1);
            dateFin = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        }
        
        const dateDebutStr = formatDateForMySQL(dateDebut);
        const dateFinStr = formatDateForMySQL(dateFin);
        
        console.log(`📅 Période: ${dateDebutStr} à ${dateFinStr}`);
        
        // Statistiques des rendez-vous
        let statsRDV = [{ total: 0, termines: 0, en_cours: 0, en_attente: 0, annules: 0, duree_moyenne: 0 }];
        try {
            statsRDV = await executeQuery(`
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN statut = 'termine' THEN 1 END) as termines,
                    COUNT(CASE WHEN statut = 'en_cours' THEN 1 END) as en_cours,
                    COUNT(CASE WHEN statut = 'attente' THEN 1 END) as en_attente,
                    COUNT(CASE WHEN statut = 'annule' THEN 1 END) as annules,
                    AVG(duree_reelle) as duree_moyenne
                FROM rendez_vous
                WHERE medecin_id = ?
                AND DATE(date_rdv) >= ?
                AND DATE(date_rdv) < ?
            `, [medecinId, dateDebutStr, dateFinStr]);
        } catch (error) {
            console.error('❌ Erreur stats RDV:', error.message);
        }
        
        // Statistiques des consultations (fiches médicales)
        // Note: La table fiches_medicales n'a peut-être pas de colonne statut
        // On compte toutes les fiches comme terminées si elles existent
        let statsConsultations = [{ total: 0 }];
        try {
            statsConsultations = await executeQuery(`
                SELECT 
                    COUNT(*) as total
                FROM fiches_medicales
                WHERE medecin_id = ?
                AND DATE(date_consultation) >= ?
                AND DATE(date_consultation) < ?
            `, [medecinId, dateDebutStr, dateFinStr]);
        } catch (error) {
            console.error('❌ Erreur stats consultations:', error.message);
        }
        
        // Statistiques des prescriptions
        // Note: Les prescriptions sont liées aux médecins via fiches_medicales
        // On utilise date_debut au lieu de date_prescription
        let statsPrescriptions = [{ total: 0, actives: 0 }];
        try {
            statsPrescriptions = await executeQuery(`
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN p.statut = 'active' OR p.statut IS NULL THEN 1 END) as actives
                FROM prescriptions p
                INNER JOIN fiches_medicales fm ON p.fiche_medicale_id = fm.id_fiche
                WHERE fm.medecin_id = ?
                AND DATE(p.date_debut) >= ?
                AND DATE(p.date_debut) < ?
            `, [medecinId, dateDebutStr, dateFinStr]);
        } catch (error) {
            console.error('❌ Erreur stats prescriptions:', error.message);
        }
        
        // Évolution par jour (derniers 7 jours)
        let evolution = [];
        try {
            evolution = await executeQuery(`
                SELECT 
                    DATE(date_rdv) as date,
                    COUNT(*) as total_rdv,
                    COUNT(CASE WHEN statut = 'termine' THEN 1 END) as rdv_termines
                FROM rendez_vous
                WHERE medecin_id = ?
                AND DATE(date_rdv) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                GROUP BY DATE(date_rdv)
                ORDER BY date ASC
            `, [medecinId]);
        } catch (error) {
            console.error('❌ Erreur évolution:', error.message);
        }
        
        // Top diagnostics
        let topDiagnostics = [];
        try {
            topDiagnostics = await executeQuery(`
                SELECT 
                    diagnostic_principal,
                    COUNT(*) as nombre
                FROM fiches_medicales
                WHERE medecin_id = ?
                AND DATE(date_consultation) >= ?
                AND DATE(date_consultation) < ?
                AND diagnostic_principal IS NOT NULL
                GROUP BY diagnostic_principal
                ORDER BY nombre DESC
                LIMIT 5
            `, [medecinId, dateDebutStr, dateFinStr]);
        } catch (error) {
            console.error('❌ Erreur top diagnostics:', error.message);
        }
        
        res.json({
            success: true,
            data: {
                periode: {
                    type: periode,
                    date_debut: dateDebutStr,
                    date_fin: dateFinStr
                },
                rendez_vous: {
                    total: statsRDV[0].total || 0,
                    termines: statsRDV[0].termines || 0,
                    en_cours: statsRDV[0].en_cours || 0,
                    en_attente: statsRDV[0].en_attente || 0,
                    annules: statsRDV[0].annules || 0,
                    duree_moyenne: Math.round(statsRDV[0].duree_moyenne || 0)
                },
                consultations: {
                    total: statsConsultations[0].total || 0,
                    terminees: statsConsultations[0].total || 0 // Toutes les fiches sont considérées terminées
                },
                prescriptions: {
                    total: statsPrescriptions[0].total || 0,
                    actives: statsPrescriptions[0].actives || statsPrescriptions[0].total || 0
                },
                evolution: evolution,
                top_diagnostics: topDiagnostics
            }
        });
    });
}

module.exports = MedecinWorkflowController;

