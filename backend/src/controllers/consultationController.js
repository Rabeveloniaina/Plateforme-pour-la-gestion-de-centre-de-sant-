const FicheMedicale = require('../models/FicheMedicale');
const Patient = require('../models/Patient');
const { executeQuery } = require('../config/database');
const { asyncHandler, Errors } = require('../utils/asyncHandler');
const { formatDateForMySQL } = require('../utils/dateFormatter');
const DataIntegrityValidators = require('../validators/dataIntegrityValidators');

class ConsultationController {
    /**
     * Créer une nouvelle fiche de consultation (par un médecin)
     * POST /api/consultations
     */
    static create = asyncHandler(async (req, res) => {
        const user = req.user;
        const ficheData = req.body;
        
        console.log('📝 Création fiche consultation:', { user: user.id, data: ficheData });
        
        // Récupérer l'id_medecin du médecin connecté
        const medecinLink = await executeQuery(
            'SELECT id_medecin FROM medecins WHERE user_id = ?',
            [user.id]
        );
        
        if (medecinLink.length === 0) {
            throw Errors.NOT_FOUND('Médecin');
        }
        
        const medecinId = medecinLink[0].id_medecin;
        console.log(`✅ Médecin trouvé: id_medecin=${medecinId}`);
        
        // Validation des données requises
        if (!ficheData.id_patient && !ficheData.patient_id) {
            throw Errors.VALIDATION_ERROR('patient_id est requis');
        }
        
        const patientId = ficheData.id_patient || ficheData.patient_id;
        
        // Vérifier que le patient existe
        const patient = await Patient.findById(patientId);
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
        
        // Préparer les données de la fiche avec medecin_id automatique
        // Note: Un patient peut changer de centre et consulter un médecin d'un autre centre
        const dateConsultation = ficheData.date_consultation || formatDateForMySQL(new Date());
        const ficheComplete = {
            patient_id: patientId,
            medecin_id: medecinId,
            date_consultation: dateConsultation,
            motif_consultation: ficheData.motif_consultation,
            symptomes: ficheData.symptomes || null,
            poids: ficheData.poids || null,
            taille: ficheData.taille || null,
            temperature: ficheData.temperature || null,
            tension_systolique: ficheData.tension_systolique || null,
            tension_diastolique: ficheData.tension_diastolique || null,
            frequence_cardiaque: ficheData.frequence_cardiaque || null,
            frequence_respiratoire: ficheData.frequence_respiratoire || null,
            examen_physique: ficheData.examen_physique || null,
            diagnostic_principal: ficheData.diagnostic || ficheData.diagnostic_principal || null,
            diagnostics_secondaires: ficheData.diagnostics_secondaires || null,
            observations_medecin: ficheData.observations_medecin || ficheData.notes || null,
            recommandations: ficheData.recommandations || ficheData.traitement_prescrit || null,
            suivi_necessaire: ficheData.suivi_necessaire || false,
            date_prochain_rdv: ficheData.date_prochain_rdv || null
        };

        // Validation d'intégrité des données
        // Valider le motif de consultation
        if (ficheComplete.motif_consultation) {
            const motifValidation = DataIntegrityValidators.validateMotifConsultation(ficheComplete.motif_consultation);
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
            poids: ficheComplete.poids,
            taille: ficheComplete.taille,
            tension_systolique: ficheComplete.tension_systolique,
            tension_diastolique: ficheComplete.tension_diastolique,
            frequence_cardiaque: ficheComplete.frequence_cardiaque,
            temperature: ficheComplete.temperature
        };
        const valeursValidation = DataIntegrityValidators.validateValeursMedicales(valeursMedicales);
        if (!valeursValidation.valid) {
            throw Errors.VALIDATION_ERROR(valeursValidation.errors.join(' '));
        }

        // Valider la date du prochain RDV si fournie (doit être dans le futur)
        if (ficheComplete.date_prochain_rdv) {
            const dateProchainRdv = new Date(ficheComplete.date_prochain_rdv);
            const maintenant = new Date();
            if (dateProchainRdv <= maintenant) {
                throw Errors.VALIDATION_ERROR('La date du prochain rendez-vous doit être dans le futur');
            }

            // Valider que la date de fin (prochain RDV) est après la date de début (consultation)
            const dateFinValidation = DataIntegrityValidators.validateDateFinApresDebut(
                dateConsultation,
                ficheComplete.date_prochain_rdv,
                'consultation'
            );
            if (!dateFinValidation.valid) {
                throw Errors.VALIDATION_ERROR(dateFinValidation.message);
            }
        }
        
        console.log('📊 Données fiche complète:', ficheComplete);
        
        // Créer la fiche médicale
        const fiche = await FicheMedicale.create(ficheComplete);
        
        console.log(`✅ Fiche de consultation créée: id_fiche=${fiche.id_fiche}`);
        
        // Fonction helper pour rechercher ou créer un médicament
        const findOrCreateMedicament = async (medicamentNom, dosage = null) => {
            const Medicament = require('../models/Medicament');
            const { executeQuery } = require('../config/database');
            
            try {
                // Chercher d'abord le médicament par nom
                const existing = await Medicament.search(medicamentNom, 1);
                if (existing && existing.length > 0) {
                    return existing[0].id_medicament;
                }
                
                // Si non trouvé, créer un médicament générique
                // Extraire le dosage du nom si présent
                let dosageValue = dosage || 'N/A';
                let formePharmaceutique = 'comprime'; // Par défaut
                
                // Détecter la forme pharmaceutique dans le nom
                const nomLower = medicamentNom.toLowerCase();
                if (nomLower.includes('sirop')) formePharmaceutique = 'sirop';
                else if (nomLower.includes('gelule') || nomLower.includes('gélule')) formePharmaceutique = 'gelule';
                else if (nomLower.includes('pommade')) formePharmaceutique = 'pommade';
                else if (nomLower.includes('injection')) formePharmaceutique = 'injection';
                else if (nomLower.includes('gouttes')) formePharmaceutique = 'gouttes';
                else if (nomLower.includes('spray')) formePharmaceutique = 'spray';
                else if (nomLower.includes('patch')) formePharmaceutique = 'patch';
                else if (nomLower.includes('suppositoire')) formePharmaceutique = 'suppositoire';
                
                // Extraire le dosage du nom si présent (ex: "Paracétamol 500mg")
                const dosageMatch = medicamentNom.match(/(\d+)\s*(mg|g|ml|mg\/ml)/i);
                if (dosageMatch) {
                    dosageValue = dosageMatch[0];
                }
                
                // Créer le médicament
                const newMedicament = await Medicament.create({
                    nom_commercial: medicamentNom,
                    denomination_commune: medicamentNom,
                    forme_pharmaceutique: formePharmaceutique,
                    dosage: dosageValue,
                    unite_dosage: 'mg',
                    statut: 'actif'
                });
                
                console.log(`✅ Médicament créé: ${medicamentNom} (ID: ${newMedicament.id_medicament})`);
                return newMedicament.id_medicament;
            } catch (error) {
                console.error(`⚠️ Erreur lors de la création du médicament ${medicamentNom}:`, error);
                // En cas d'erreur, essayer de récupérer un médicament générique
                try {
                    const { executeQuery } = require('../config/database');
                    const generic = await executeQuery(
                        'SELECT id_medicament FROM medicaments WHERE nom_commercial = "Autre" OR denomination_commune = "Autre" LIMIT 1'
                    );
                    if (generic && generic.length > 0) {
                        return generic[0].id_medicament;
                    }
                    
                    // Créer un médicament "Autre" par défaut
                    const Medicament = require('../models/Medicament');
                    const autreMedicament = await Medicament.create({
                        nom_commercial: 'Autre',
                        denomination_commune: 'Autre',
                        forme_pharmaceutique: 'autre',
                        dosage: 'N/A',
                        unite_dosage: 'mg',
                        statut: 'actif'
                    });
                    return autreMedicament.id_medicament;
                } catch (e) {
                    console.error('❌ Erreur critique: Impossible de créer un médicament', e);
                    // Dernier recours : essayer de trouver n'importe quel médicament actif
                    try {
                        const { executeQuery } = require('../config/database');
                        const anyMedicament = await executeQuery(
                            'SELECT id_medicament FROM medicaments WHERE statut = "actif" LIMIT 1'
                        );
                        if (anyMedicament && anyMedicament.length > 0) {
                            console.log(`⚠️ Utilisation médicament de secours: ID ${anyMedicament[0].id_medicament}`);
                            return anyMedicament[0].id_medicament;
                        }
                    } catch (finalError) {
                        console.error('❌ Erreur finale: Aucun médicament disponible', finalError);
                    }
                    throw new Error(`Impossible de créer ou trouver un médicament pour la prescription: ${e.message}`);
                }
            }
        };
        
        // Gérer les prescriptions si présentes
        const prescriptions = ficheData.prescriptions || [];
        let prescriptionsCreated = [];
        
        if (prescriptions.length > 0) {
            const Prescription = require('../models/Prescription');
            
            // Transformer les prescriptions du formulaire vers le format attendu par le modèle
            const prescriptionsWithFiche = await Promise.all(
                prescriptions
                    .filter(p => p.medicament && p.medicament.trim() !== '') // Filtrer les prescriptions vides
                    .map(async (p) => {
                        // Rechercher ou créer le médicament
                        const medicamentId = await findOrCreateMedicament(p.medicament, p.dosage);
                        
                        // Calculer les dates de début et fin
                        const dateConsultation = new Date(ficheData.date_consultation || new Date());
                        const dateDebut = dateConsultation.toISOString().split('T')[0];
                        
                        // Parser la durée (peut être "7 jours", "7", "1 semaine", etc.)
                        let dureeJours = 7; // Par défaut 7 jours
                        if (p.duree) {
                            const dureeMatch = p.duree.toString().match(/(\d+)/);
                            if (dureeMatch) {
                                dureeJours = parseInt(dureeMatch[1]);
                            }
                        }
                        
                        // Calculer la date de fin
                        const dateFin = new Date(dateConsultation);
                        dateFin.setDate(dateFin.getDate() + dureeJours);
                        const dateFinStr = dateFin.toISOString().split('T')[0];
                        
                        // Estimer la quantité totale (fréquence × durée)
                        // Ex: "3 fois/jour" × 7 jours = 21
                        let quantiteTotale = dureeJours; // Par défaut
                        if (p.frequence) {
                            const freqMatch = p.frequence.toString().match(/(\d+)/);
                            if (freqMatch) {
                                const foisParJour = parseInt(freqMatch[1]);
                                quantiteTotale = foisParJour * dureeJours;
                            }
                        }
                        
                        // Construire les instructions spécifiques
                        let instructions = '';
                        if (p.dosage && String(p.dosage).trim()) {
                            instructions += `${String(p.dosage).trim()} `;
                        }
                        if (p.frequence && String(p.frequence).trim()) {
                            instructions += `${String(p.frequence).trim()} `;
                        }
                        if (p.duree && String(p.duree).trim()) {
                            instructions += `pendant ${String(p.duree).trim()}`;
                        }
                        instructions = instructions.trim() || null;
                        
                        // S'assurer qu'aucune valeur n'est undefined et que les champs NOT NULL ont des valeurs valides
                        const prescriptionData = {
                            fiche_medicale_id: fiche.id_fiche,
                            medicament_id: medicamentId,
                            // NOT NULL - s'assurer d'avoir une valeur valide
                            dosage_prescrit: (p.dosage && String(p.dosage).trim()) 
                                ? String(p.dosage).trim() 
                                : (p.medicament && String(p.medicament).trim()) 
                                    ? String(p.medicament).trim() 
                                    : 'N/A',
                            // NOT NULL - s'assurer d'avoir une valeur valide
                            frequence: (p.frequence && String(p.frequence).trim()) 
                                ? String(p.frequence).trim() 
                                : 'Selon prescription',
                            // NOT NULL - s'assurer d'avoir un nombre valide
                            duree_traitement: (dureeJours && dureeJours > 0) ? dureeJours : 7,
                            // NOT NULL - s'assurer d'avoir un nombre valide
                            quantite_totale: (quantiteTotale && quantiteTotale > 0) ? quantiteTotale : (dureeJours && dureeJours > 0) ? dureeJours : 7,
                            // Peut être NULL
                            instructions_specifiques: (instructions && String(instructions).trim()) 
                                ? String(instructions).trim() 
                                : null,
                            moment_prise: p.moment_prise || 'selon_besoin',
                            // NOT NULL - doit être présent
                            date_debut: dateDebut,
                            // Peut être NULL
                            date_fin: dateFinStr || null,
                            statut: 'active'
                        };
                        
                        // Vérifier qu'aucune valeur n'est undefined (ne devrait jamais arriver avec les valeurs par défaut)
                        Object.keys(prescriptionData).forEach(key => {
                            if (prescriptionData[key] === undefined) {
                                console.error(`❌ ERREUR: Valeur undefined pour ${key}`, prescriptionData);
                                // Pour les champs NOT NULL, utiliser une valeur par défaut
                                if (key === 'fiche_medicale_id' || key === 'medicament_id' || key === 'date_debut') {
                                    throw new Error(`Champ requis ${key} est undefined`);
                                }
                                prescriptionData[key] = null;
                            }
                        });
                        
                        console.log('📋 Prescription data préparée:', prescriptionData);
                        return prescriptionData;
                    })
            );
            
            if (prescriptionsWithFiche.length > 0) {
                prescriptionsCreated = await Prescription.createMultiple(prescriptionsWithFiche);
                console.log(`✅ ${prescriptionsCreated.length} prescription(s) créée(s)`);
            }
        }
        
        // Terminer le rendez-vous si demandé (automatiquement)
        const rdv_id = ficheData.rdv_id;
        const terminer_rdv = ficheData.terminer_rdv !== false; // Par défaut, terminer automatiquement si rdv_id présent
        let rdvTermine = false;
        let dureeReelleCalculee = null;
        
        if (rdv_id) {
            const RendezVous = require('../models/RendezVous');
            const rdv = await RendezVous.findById(rdv_id);
            
            if (rdv) {
                // Vérifier que c'est bien le médecin qui a créé le RDV
                if (rdv.medecin_id != medecinId) {
                    console.log(`⚠️ Médecin ${medecinId} essaie de terminer un RDV du médecin ${rdv.medecin_id}`);
                } else {
                    // Calculer automatiquement la durée réelle si heure_debut_consultation existe
                    if (rdv.heure_debut_consultation) {
                        const result = await executeQuery(
                            `SELECT TIMESTAMPDIFF(MINUTE, heure_debut_consultation, NOW()) as duree_minutes
                             FROM rendez_vous 
                             WHERE id_rdv = ?`,
                            [rdv_id]
                        );
                        
                        if (result.length > 0 && result[0].duree_minutes !== null) {
                            dureeReelleCalculee = Math.max(1, result[0].duree_minutes); // Au moins 1 minute
                            console.log(`⏱️ Durée réelle calculée: ${dureeReelleCalculee} minutes`);
                        }
                    }
                    
                    // Si pas de durée calculée, utiliser la durée estimée ou 30 min par défaut
                    if (!dureeReelleCalculee) {
                        dureeReelleCalculee = rdv.duree_estimee || 30;
                        console.log(`⏱️ Utilisation durée estimée: ${dureeReelleCalculee} minutes`);
                    }
                    
                    // Terminer le RDV avec la durée calculée
                    if (terminer_rdv) {
                        const noteMedecin = `Consultation enregistrée automatiquement. Fiche #${fiche.id_fiche}`;
                        await RendezVous.terminer(rdv_id, dureeReelleCalculee, noteMedecin);
                        rdvTermine = true;
                        console.log(`✅ RDV ${rdv_id} terminé automatiquement avec durée réelle: ${dureeReelleCalculee} min`);
                    }
                }
            }
        }
        
        res.status(201).json({
            success: true,
            message: rdvTermine 
                ? `Consultation créée et rendez-vous terminé avec succès (durée: ${dureeReelleCalculee} min)`
                : 'Fiche de consultation créée avec succès',
            data: {
                fiche,
                prescriptions: prescriptionsCreated,
                rdv_termine: rdvTermine,
                duree_reelle_minutes: dureeReelleCalculee
            }
        });
    });
    
    /**
     * Récupérer toutes les fiches de consultation
     * GET /api/consultations
     */
    static getAll = asyncHandler(async (req, res) => {
        const user = req.user;
        const { limit = 50, offset = 0, patient_id } = req.query;
        
        // Si c'est un médecin, récupérer son id_medecin
        let medecinId = null;
        if (user.role === 'medecin') {
            const medecinLink = await executeQuery(
                'SELECT id_medecin FROM medecins WHERE user_id = ?',
                [user.id]
            );
            
            if (medecinLink.length > 0) {
                medecinId = medecinLink[0].id_medecin;
            }
        }
        
        const filters = {};
        if (medecinId) filters.medecin_id = medecinId;
        if (patient_id) filters.patient_id = patient_id;
        
        const fiches = await FicheMedicale.findAll(parseInt(limit), parseInt(offset), filters);
        const total = await FicheMedicale.count(filters);
        
        res.json({
            success: true,
            data: fiches,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
    });
    
    /**
     * Récupérer une fiche de consultation par ID
     * GET /api/consultations/:id
     */
    static getById = asyncHandler(async (req, res) => {
        const { id } = req.params;
        
        const fiche = await FicheMedicale.findById(id);
        
        if (!fiche) {
            throw Errors.NOT_FOUND('Fiche de consultation');
        }
        
        res.json({
            success: true,
            data: fiche
        });
    });
    
    /**
     * Mettre à jour une fiche de consultation
     * PUT /api/consultations/:id
     */
    static update = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const updateData = req.body;
        const user = req.user;
        
        // Vérifier que la fiche existe
        const existingFiche = await FicheMedicale.findById(id);
        if (!existingFiche) {
            throw Errors.NOT_FOUND('Fiche de consultation');
        }
        
        // Vérifier que c'est bien le médecin qui a créé la fiche
        if (user.role === 'medecin') {
            const medecinLink = await executeQuery(
                'SELECT id_medecin FROM medecins WHERE user_id = ?',
                [user.id]
            );
            
            if (medecinLink.length === 0) {
                throw Errors.NOT_FOUND('Médecin');
            }
            
            const medecinId = medecinLink[0].id_medecin;
            
            if (existingFiche.medecin_id != medecinId) {
                throw Errors.FORBIDDEN('Vous ne pouvez modifier que vos propres fiches');
            }
        }
        
        // Mettre à jour la fiche
        const fiche = await FicheMedicale.update(id, updateData);
        
        res.json({
            success: true,
            message: 'Fiche de consultation mise à jour avec succès',
            data: fiche
        });
    });
    
    /**
     * Supprimer une fiche de consultation
     * DELETE /api/consultations/:id
     */
    static delete = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const user = req.user;
        
        // Vérifier que la fiche existe
        const existingFiche = await FicheMedicale.findById(id);
        if (!existingFiche) {
            throw Errors.NOT_FOUND('Fiche de consultation');
        }
        
        // Vérifier que c'est bien le médecin qui a créé la fiche ou un admin
        if (user.role === 'medecin') {
            const medecinLink = await executeQuery(
                'SELECT id_medecin FROM medecins WHERE user_id = ?',
                [user.id]
            );
            
            if (medecinLink.length > 0) {
                const medecinId = medecinLink[0].id_medecin;
                
                if (existingFiche.medecin_id != medecinId) {
                    throw Errors.FORBIDDEN('Vous ne pouvez supprimer que vos propres fiches');
                }
            }
        }
        
        await FicheMedicale.delete(id);
        
        res.json({
            success: true,
            message: 'Fiche de consultation supprimée avec succès'
        });
    });
    
    /**
     * Récupérer les consultations d'un patient
     * GET /api/consultations/patient/:patient_id
     */
    static getByPatientId = asyncHandler(async (req, res) => {
        const { patient_id } = req.params;
        const { limit = 50, offset = 0 } = req.query;
        
        const fiches = await FicheMedicale.findByPatientId(patient_id, parseInt(limit), parseInt(offset));
        
        res.json({
            success: true,
            data: fiches
        });
    });

    /**
     * Rediriger un patient vers un spécialiste dans le même centre
     * POST /api/consultations/rediriger
     */
    static rediriger = asyncHandler(async (req, res) => {
        const user = req.user;
        const { executeQuery } = require('../config/database');
        const {
            patient_id,
            medecin_specialiste_id,
            fiche_medicale_id,
            rdv_id, // ID du RDV actuel à terminer
            motif_redirection,
            diagnostic_initial,
            symptomes,
            date_rdv, // Optionnel, sera ignoré si prochain créneau trouvé
            heure_rdv, // Optionnel, sera ignoré si prochain créneau trouvé
            note_medecin
        } = req.body;

        console.log('🔄 Redirection patient:', { patient_id, medecin_specialiste_id, fiche_medicale_id, rdv_id });

        // Validation
        if (!patient_id || !medecin_specialiste_id) {
            throw Errors.VALIDATION_ERROR('patient_id et medecin_specialiste_id sont requis');
        }

        // Vérifier que le patient existe
        const patient = await Patient.findById(patient_id);
        if (!patient) {
            throw Errors.NOT_FOUND('Patient');
        }

        // Récupérer le médecin spécialiste
        const medecinSpecialiste = await executeQuery(
            `SELECT m.*, cs.id_centre as centre_id, cs.nom as centre_nom 
             FROM medecins m 
             LEFT JOIN centres_sante cs ON m.centre_id = cs.id_centre 
             WHERE m.id_medecin = ? AND m.statut = 'actif'`,
            [medecin_specialiste_id]
        );

        if (medecinSpecialiste.length === 0) {
            throw Errors.NOT_FOUND('Médecin spécialiste non trouvé ou inactif');
        }

        const specialiste = medecinSpecialiste[0];

        // Récupérer le médecin qui fait la rédirection (médecin connecté)
        const medecinLink = await executeQuery(
            'SELECT id_medecin, centre_id FROM medecins WHERE user_id = ?',
            [user.id]
        );

        if (medecinLink.length === 0) {
            throw Errors.NOT_FOUND('Médecin');
        }

        const medecinId = medecinLink[0].id_medecin;
        const medecinCentreId = medecinLink[0].centre_id;

        // Vérifier que le médecin spécialiste est dans le même centre que le médecin qui fait la consultation
        if (specialiste.centre_id !== medecinCentreId) {
            throw Errors.VALIDATION_ERROR(
                `Le médecin spécialiste doit être dans le même centre que le médecin qui fait la consultation. ` +
                `Médecin actuel: centre ${medecinCentreId}, Spécialiste: centre ${specialiste.centre_id}`
            );
        }

        // Créer un rendez-vous avec le spécialiste
        const RendezVous = require('../models/RendezVous');
        const { formatDateTimeForMySQL, formatTimeForMySQL } = require('../utils/dateFormatter');
        
        // Trouver le prochain créneau disponible pour le spécialiste
        const prochainCreneau = await trouverProchainCreneauLibre(
            medecin_specialiste_id, 
            medecinCentreId, 
            'normale'
        );
        
        if (!prochainCreneau) {
            throw Errors.VALIDATION_ERROR('Aucun créneau disponible pour ce spécialiste dans les 7 prochains jours');
        }
        
        // Formater la date et l'heure du créneau trouvé en DATETIME (format MySQL)
        const dateRdv = formatDateTimeForMySQL(prochainCreneau); // Format: 'YYYY-MM-DD HH:MM:SS'
        const heureRdv = formatTimeForMySQL(prochainCreneau); // Format: 'HH:MM:SS' (pour affichage)
        
        console.log('📅 Créneau trouvé pour spécialiste:', { 
            date_rdv: dateRdv, 
            heure_rdv: heureRdv, 
            creneau: prochainCreneau,
            maintenant: new Date()
        });

        // Préparer le motif de rédirection
        const motifRDV = motif_redirection || 
            `Consultation spécialisée en ${specialiste.specialite} - Redirection depuis consultation générale`;

        // Préparer les notes pour le RDV
        const noteRDV = note_medecin || 
            `Patient redirigé par Dr. (médecin généraliste) pour consultation spécialisée en ${specialiste.specialite}. ` +
            (diagnostic_initial ? `Diagnostic initial: ${diagnostic_initial}. ` : '') +
            (symptomes ? `Symptômes: ${symptomes}` : '');

        // Traiter les symptômes pour le format JSON MySQL
        // Note: RendezVous.create() fait déjà JSON.stringify(), donc on doit passer un objet/tableau, pas une chaîne JSON
        let symptomesFormatted = null;
        if (symptomes) {
            if (typeof symptomes === 'string') {
                // Si c'est une chaîne vide, mettre null
                if (symptomes.trim() === '') {
                    symptomesFormatted = null;
                } else {
                    // Vérifier si c'est déjà du JSON valide
                    try {
                        const parsed = JSON.parse(symptomes);
                        // Si c'est déjà du JSON valide, utiliser l'objet parsé
                        symptomesFormatted = parsed;
                    } catch (e) {
                        // Si ce n'est pas du JSON (chaîne simple comme "fkjf"), créer un objet simple
                        symptomesFormatted = { description: symptomes };
                    }
                }
            } else if (Array.isArray(symptomes)) {
                // Si c'est un tableau, l'utiliser tel quel
                symptomesFormatted = symptomes;
            } else if (typeof symptomes === 'object') {
                // Si c'est un objet, l'utiliser tel quel
                symptomesFormatted = symptomes;
            }
        }
        
        // Créer le RDV
        // Note: date_rdv doit être un DATETIME (YYYY-MM-DD HH:MM:SS), pas une date séparée
        const maintenant = new Date();
        const rdvData = {
            patient_id: patient_id,
            medecin_id: medecin_specialiste_id,
            centre_id: medecinCentreId, // Utiliser le centre du médecin qui fait la consultation (même centre que le spécialiste)
            date_rdv: dateRdv, // DATETIME format: 'YYYY-MM-DD HH:MM:SS'
            symptomes: symptomesFormatted,
            orientation: 'specialiste',
            note_patient: noteRDV,
            duree_estimee: 30,
            statut: 'attente', // RDV en attente, pas confirmé par défaut
            heure_arrivee: formatTimeForMySQL(maintenant) // Le patient est déjà là (en consultation)
        };
        
        console.log('📍 Création RDV avec centre_id:', medecinCentreId, '(centre du médecin qui fait la consultation)');
        console.log('📋 RDV Data:', { 
            date_rdv: dateRdv, 
            heure_arrivee: rdvData.heure_arrivee,
            patient_id: patient_id,
            medecin_id: medecin_specialiste_id,
            statut: rdvData.statut,
            duree_estimee: rdvData.duree_estimee
        });

        // Vérifier une dernière fois qu'il n'y a pas de chevauchement avant de créer le RDV
        // (sécurité supplémentaire - double vérification pour éviter les race conditions)
        console.log('🔍 Vérification finale de disponibilité avant création...');
        const disponibiliteVerifiee = await RendezVous.verifierDisponibilite(
            medecin_specialiste_id,
            dateRdv, // DATETIME format: 'YYYY-MM-DD HH:MM:SS'
            rdvData.duree_estimee
        );
        
        if (!disponibiliteVerifiee) {
            console.error('❌ Conflit détecté lors de la vérification finale!');
            throw Errors.VALIDATION_ERROR(
                'Le créneau sélectionné est maintenant occupé. Veuillez réessayer ou choisir un autre créneau.'
            );
        }
        
        console.log('✅ Vérification de disponibilité réussie, création du RDV...');
        const nouveauRDV = await RendezVous.create(rdvData);
        console.log('✅ RDV créé pour spécialiste:', nouveauRDV.id, '- Statut:', rdvData.statut, '(en attente, pas confirmé)');

        // Terminer automatiquement le RDV actuel si rdv_id est fourni
        let rdvActuelTermine = false;
        if (rdv_id) {
            try {
                const rdvActuel = await RendezVous.findById(rdv_id);
                if (rdvActuel && (rdvActuel.statut === 'en_cours' || rdvActuel.statut === 'confirme')) {
                    // Calculer la durée réelle si heure_debut_consultation existe
                    let dureeReelle = null;
                    if (rdvActuel.heure_debut_consultation) {
                        const result = await executeQuery(
                            `SELECT TIMESTAMPDIFF(MINUTE, heure_debut_consultation, NOW()) as duree_minutes
                             FROM rendez_vous 
                             WHERE id_rdv = ?`,
                            [rdv_id]
                        );
                        if (result.length > 0 && result[0].duree_minutes !== null) {
                            dureeReelle = Math.max(1, result[0].duree_minutes);
                        }
                    }
                    
                    // Utiliser la durée estimée si pas de durée réelle calculée
                    if (!dureeReelle) {
                        dureeReelle = rdvActuel.duree_estimee || 30;
                    }
                    
                    const noteTerminaison = `Consultation terminée - Patient redirigé vers Dr. ${specialiste.prenom} ${specialiste.nom} (${specialiste.specialite})`;
                    await RendezVous.terminer(rdv_id, dureeReelle, noteTerminaison);
                    rdvActuelTermine = true;
                    console.log(`✅ RDV actuel ${rdv_id} terminé automatiquement (durée: ${dureeReelle} min)`);
                }
            } catch (error) {
                console.error('⚠️ Erreur lors de la terminaison du RDV actuel (non bloquant):', error);
                // Ne pas bloquer la rédirection si la terminaison du RDV échoue
            }
        }

        // Mettre à jour la fiche médicale si fiche_medicale_id est fourni
        if (fiche_medicale_id) {
            try {
                const fiche = await FicheMedicale.findById(fiche_medicale_id);
                if (fiche) {
                    // Ajouter la rédirection dans les recommandations ou observations
                    const noteRedirection = `\n\n[Rédirection] Patient redirigé vers Dr. ${specialiste.prenom} ${specialiste.nom} ` +
                        `(${specialiste.specialite}) le ${dateRdv} à ${heureRdv}. ` +
                        (motif_redirection ? `Motif: ${motif_redirection}. ` : '') +
                        (diagnostic_initial ? `Diagnostic initial: ${diagnostic_initial}` : '');

                    // Mettre à jour les observations ou recommandations
                    await executeQuery(
                        `UPDATE fiches_medicales 
                         SET observations_medecin = CONCAT(COALESCE(observations_medecin, ''), ?),
                             recommandations = CONCAT(COALESCE(recommandations, ''), ?),
                             suivi_necessaire = TRUE,
                             date_prochain_rdv = ?
                         WHERE id_fiche = ?`,
                        [noteRedirection, noteRedirection, dateRdv, fiche_medicale_id]
                    );

                    console.log('✅ Fiche médicale mise à jour avec rédirection');
                }
            } catch (error) {
                console.error('⚠️ Erreur lors de la mise à jour de la fiche médicale (non bloquant):', error);
                // Ne pas bloquer la rédirection si la mise à jour de la fiche échoue
            }
        }

        res.json({
            success: true,
            message: 'Patient redirigé vers spécialiste avec succès',
            data: {
                rdv_id: nouveauRDV.id,
                patient_id: patient_id,
                medecin_specialiste: {
                    id: specialiste.id_medecin,
                    nom: specialiste.nom,
                    prenom: specialiste.prenom,
                    specialite: specialiste.specialite,
                    centre_nom: specialiste.centre_nom
                },
                date_rdv: dateRdv, // DATETIME format
                heure_rdv: heureRdv, // Pour affichage seulement
                motif: motifRDV,
                rdv_actuel_termine: rdvActuelTermine,
                creneau_automatique: true
            }
        });
    });
}

// Fonction helper pour trouver le prochain créneau libre (adaptée de walkInController)
async function trouverProchainCreneauLibre(medecinId, centreId, priorite = 'normale', pointDepartMin = null) {
    try {
        const { executeQuery } = require('../config/database');
        // Utiliser le point de départ minimum fourni ou maintenant
        const maintenant = pointDepartMin || new Date();
        const aujourdhui = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate());
        
        console.log('🔍 Recherche créneau libre:', {
            medecinId,
            centreId,
            maintenant: maintenant.toLocaleString(),
            pointDepartMin: pointDepartMin ? pointDepartMin.toLocaleString() : 'null'
        });
        
        // Récupérer les horaires du médecin
        const medecinInfo = await executeQuery(
            'SELECT horaires_medecin, statut_operationnel FROM medecins WHERE id_medecin = ?',
            [medecinId]
        );
        
        if (medecinInfo.length === 0) {
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
        const jourActuel = joursMap[maintenant.getDay()];
        const horaireJour = horaires[jourActuel] || {};
        
        // Vérifier si le médecin a des horaires configurés
        const hasHoraires = horaires && typeof horaires === 'object' && Object.keys(horaires).length > 0;
        const hasHorairesAujourdhui = hasHoraires && horaireJour && horaireJour.actif === true;
        
        // Horaires par défaut : 8h-17h du lundi au vendredi, 8h-12h le samedi
        const horairesParDefaut = {
            lundi: { actif: true, debut: '08:00', fin: '17:00' },
            mardi: { actif: true, debut: '08:00', fin: '17:00' },
            mercredi: { actif: true, debut: '08:00', fin: '17:00' },
            jeudi: { actif: true, debut: '08:00', fin: '17:00' },
            vendredi: { actif: true, debut: '08:00', fin: '17:00' },
            samedi: { actif: true, debut: '08:00', fin: '12:00' },
            dimanche: { actif: false, debut: '08:00', fin: '17:00' }
        };
        
        // Utiliser les horaires du médecin s'ils existent, sinon les horaires par défaut
        const horairesAUtiliser = hasHoraires ? horaires : horairesParDefaut;
        const horaireJourFinal = horairesAUtiliser[jourActuel] || horairesParDefaut[jourActuel];
        
        // Heures de travail (avec valeurs par défaut)
        const heureDebut = horaireJourFinal.debut ? horaireJourFinal.debut.split(':') : [8, 0];
        const heureFin = horaireJourFinal.fin ? horaireJourFinal.fin.split(':') : [17, 0];
        
        console.log('📅 Horaires médecin:', {
            hasHoraires,
            hasHorairesAujourdhui,
            jourActuel,
            horaireJour: horaireJourFinal,
            heureDebut: `${heureDebut[0]}:${String(heureDebut[1]).padStart(2, '0')}`,
            heureFin: `${heureFin[0]}:${String(heureFin[1]).padStart(2, '0')}`,
            statut_operationnel: medecinInfo[0].statut_operationnel
        });
        
        // Si le médecin est indisponible, chercher le prochain jour ouvrable
        // Mais si pas d'horaires configurés, on utilise les horaires par défaut (donc on reste aujourd'hui)
        let dateTest = new Date(aujourdhui);
        let jourTest = jourActuel;
        let horaireTest = horaireJourFinal;
        
        // Seulement chercher un autre jour si :
        // 1. Le médecin a des horaires configurés ET le jour actuel n'est pas actif
        // 2. OU le médecin est explicitement indisponible
        if (medecinInfo[0].statut_operationnel === 'indisponible') {
            console.log('⚠️ Médecin indisponible, recherche du prochain jour ouvrable...');
            // Chercher le prochain jour ouvrable avec horaires actifs
            for (let i = 1; i <= 7; i++) {
                dateTest = new Date(aujourdhui);
                dateTest.setDate(dateTest.getDate() + i);
                jourTest = joursMap[dateTest.getDay()];
                horaireTest = horairesAUtiliser[jourTest] || horairesParDefaut[jourTest];
                
                if (horaireTest && horaireTest.actif) {
                    const debut = horaireTest.debut ? horaireTest.debut.split(':') : [8, 0];
                    heureDebut[0] = parseInt(debut[0]);
                    heureDebut[1] = parseInt(debut[1]);
                    const fin = horaireTest.fin ? horaireTest.fin.split(':') : [17, 0];
                    heureFin[0] = parseInt(fin[0]);
                    heureFin[1] = parseInt(fin[1]);
                    console.log(`✅ Jour ouvrable trouvé: ${jourTest} (${debut[0]}:${debut[1]} - ${fin[0]}:${fin[1]})`);
                    break;
                }
            }
        } else if (hasHoraires && !hasHorairesAujourdhui) {
            // Le médecin a des horaires configurés mais ne travaille pas aujourd'hui
            console.log('⚠️ Médecin ne travaille pas aujourd\'hui, recherche du prochain jour ouvrable...');
            for (let i = 1; i <= 7; i++) {
                dateTest = new Date(aujourdhui);
                dateTest.setDate(dateTest.getDate() + i);
                jourTest = joursMap[dateTest.getDay()];
                horaireTest = horairesAUtiliser[jourTest] || {};
                
                if (horaireTest && horaireTest.actif) {
                    const debut = horaireTest.debut ? horaireTest.debut.split(':') : [8, 0];
                    heureDebut[0] = parseInt(debut[0]);
                    heureDebut[1] = parseInt(debut[1]);
                    const fin = horaireTest.fin ? horaireTest.fin.split(':') : [17, 0];
                    heureFin[0] = parseInt(fin[0]);
                    heureFin[1] = parseInt(fin[1]);
                    console.log(`✅ Jour ouvrable trouvé: ${jourTest} (${debut[0]}:${debut[1]} - ${fin[0]}:${fin[1]})`);
                    break;
                }
            }
        } else {
            // Le médecin travaille aujourd'hui (avec horaires configurés ou par défaut)
            console.log('✅ Médecin travaille aujourd\'hui, utilisation des horaires du jour');
        }
        
        // Récupérer tous les RDV du médecin pour aujourd'hui (ou le jour trouvé)
        // Formater dateTest en format MySQL DATE pour la comparaison
        const { formatDateForMySQL } = require('../utils/dateFormatter');
        const dateTestStr = formatDateForMySQL(dateTest);
        
        console.log('🔍 Recherche créneaux pour:', {
            medecinId,
            centreId,
            dateTest: dateTestStr,
            dateTestObj: dateTest.toLocaleDateString(),
            maintenant: maintenant.toLocaleString()
        });
        
        // Récupérer tous les RDV qui peuvent bloquer un créneau (tous les statuts actifs)
        // Inclure aussi les RDV "en_cours" qui peuvent se prolonger
        const rdvs = await executeQuery(`
            SELECT date_rdv, duree_estimee, duree_reelle, priorite, statut, heure_debut_consultation
            FROM rendez_vous
            WHERE medecin_id = ?
            AND centre_id = ?
            AND DATE(date_rdv) = ?
            AND statut NOT IN ('annule', 'termine', 'absent')
            ORDER BY date_rdv ASC
        `, [medecinId, centreId, dateTestStr]);
        
        console.log('📊 RDV existants trouvés:', rdvs.length, rdvs.map(r => ({
            date_rdv: r.date_rdv,
            duree_estimee: r.duree_estimee,
            duree_reelle: r.duree_reelle,
            statut: r.statut,
            heure_debut_consultation: r.heure_debut_consultation
        })));
        
        // Si c'est aujourd'hui, commencer à partir de maintenant + 15 min minimum
        // Sinon, commencer à l'heure de début du jour
        let heureDebutTest;
        if (dateTest.getTime() === aujourdhui.getTime()) {
            // Aujourd'hui : commencer à partir de maintenant + 15 min minimum
            // Si le médecin est disponible maintenant, essayer dans 15 min
            // Sinon, trouver le prochain créneau libre
            const maintenantPlus15 = new Date(maintenant.getTime() + 15 * 60 * 1000);
            const heureDebutJour = new Date(aujourdhui);
            heureDebutJour.setHours(parseInt(heureDebut[0]), parseInt(heureDebut[1]), 0, 0);
            
            heureDebutTest = new Date(Math.max(
                maintenantPlus15.getTime(),
                heureDebutJour.getTime()
            ));
        } else {
            // Jour futur : commencer à l'heure de début
            heureDebutTest = new Date(dateTest);
            heureDebutTest.setHours(parseInt(heureDebut[0]), parseInt(heureDebut[1]), 0, 0);
        }
        
        const heureFinJour = new Date(dateTest);
        heureFinJour.setHours(parseInt(heureFin[0]), parseInt(heureFin[1]), 0, 0);
        
        // Durée du RDV (30 minutes pour une consultation spécialisée)
        const dureeRDV = 30;
        
        // Si le médecin est disponible maintenant et qu'on est aujourd'hui, essayer maintenant + 15 min
        if (dateTest.getTime() === aujourdhui.getTime() && medecinInfo[0].statut_operationnel === 'disponible') {
            const maintenantPlus15 = new Date(maintenant.getTime() + 15 * 60 * 1000);
            const heureDebutJour = new Date(aujourdhui);
            heureDebutJour.setHours(parseInt(heureDebut[0]), parseInt(heureDebut[1]), 0, 0);
            
            console.log('🔍 Vérification créneau immédiat:', {
                maintenant: maintenant.toLocaleString(),
                maintenantPlus15: maintenantPlus15.toLocaleString(),
                heureDebutJour: heureDebutJour.toLocaleString(),
                heureFinJour: heureFinJour.toLocaleString(),
                statut_operationnel: medecinInfo[0].statut_operationnel
            });
            
            if (maintenantPlus15 < heureFinJour && maintenantPlus15 >= heureDebutJour) {
                // Vérifier si le créneau est libre (vérification robuste des chevauchements)
                const creneauFinPlus15 = new Date(maintenantPlus15.getTime() + dureeRDV * 60 * 1000);
                const conflit = rdvs.find(rdv => {
                    const rdvDebut = new Date(rdv.date_rdv);
                    
                    // Utiliser la durée réelle si le RDV est en cours, sinon la durée estimée
                    let dureeRDVExistant = rdv.duree_estimee || 30;
                    if (rdv.statut === 'en_cours' && rdv.heure_debut_consultation) {
                        // Si le RDV est en cours, calculer la durée écoulée + durée restante estimée
                        const heureDebutConsultation = new Date(rdv.heure_debut_consultation);
                        const dureeEcoulee = Math.max(0, Math.floor((maintenant.getTime() - heureDebutConsultation.getTime()) / (60 * 1000)));
                        const dureeRestante = Math.max(15, dureeRDVExistant - dureeEcoulee); // Minimum 15 min restantes
                        dureeRDVExistant = dureeEcoulee + dureeRestante;
                    }
                    
                    const rdvFin = new Date(rdvDebut.getTime() + dureeRDVExistant * 60 * 1000);
                    
                    // Vérifier le chevauchement : deux créneaux se chevauchent si
                    // (creneauDebut < rdvFin) ET (creneauFin > rdvDebut)
                    const chevauche = maintenantPlus15 < rdvFin && creneauFinPlus15 > rdvDebut;
                    
                    if (chevauche) {
                        console.log(`⚠️ Conflit immédiat détecté:`, {
                            creneau: `${maintenantPlus15.toLocaleString()} - ${creneauFinPlus15.toLocaleString()}`,
                            rdv: `${rdvDebut.toLocaleString()} - ${rdvFin.toLocaleString()}`,
                            statut: rdv.statut,
                            duree: dureeRDVExistant
                        });
                    }
                    
                    return chevauche;
                });
                
                if (!conflit) {
                    console.log('✅ Créneau disponible dans 15 minutes (médecin disponible):', maintenantPlus15.toLocaleString());
                    return maintenantPlus15;
                } else {
                    console.log('⚠️ Créneau dans 15 min occupé, recherche du prochain créneau libre...');
                }
            } else {
                console.log('⚠️ Créneau dans 15 min hors horaires de travail');
            }
        }
        
        // Trouver le prochain créneau libre (par tranches de 15 minutes)
        let creneauActuel = new Date(heureDebutTest);
        
        // Arrondir à la tranche de 15 minutes supérieure
        const minutes = creneauActuel.getMinutes();
        const roundedMinutes = Math.ceil((minutes + 1) / 15) * 15;
        if (roundedMinutes >= 60) {
            creneauActuel.setHours(creneauActuel.getHours() + 1, 0, 0, 0);
        } else {
            creneauActuel.setMinutes(roundedMinutes, 0, 0);
        }
        
        console.log('🔍 Recherche créneau libre à partir de:', creneauActuel.toLocaleString(), 'jusqu\'à', heureFinJour.toLocaleString());
        console.log('📊 Nombre de RDV existants:', rdvs.length);
        
        while (creneauActuel < heureFinJour) {
            // Vérifier si ce créneau est libre (vérification robuste des chevauchements)
            const creneauFin = new Date(creneauActuel.getTime() + dureeRDV * 60 * 1000);
            const conflit = rdvs.find(rdv => {
                // rdv.date_rdv est un DATETIME MySQL (string), le convertir en Date JavaScript
                const rdvDebut = new Date(rdv.date_rdv);
                
                // Calculer la durée du RDV existant pour la vérification de chevauchement
                let dureeRDVExistant = rdv.duree_estimee || 30;
                
                // Pour les RDV en cours, utiliser la durée estimée complète
                // car on ne sait pas exactement quand il se terminera
                // (il peut se prolonger au-delà de la durée estimée)
                if (rdv.statut === 'en_cours') {
                    // Utiliser la durée estimée complète pour éviter les chevauchements
                    // Un RDV en cours peut durer plus longtemps que prévu
                    dureeRDVExistant = Math.max(dureeRDVExistant, 30); // Minimum 30 min
                    console.log(`   ℹ️ RDV en cours détecté (statut: ${rdv.statut}), utilisation durée complète: ${dureeRDVExistant} min`);
                }
                
                const rdvFin = new Date(rdvDebut.getTime() + dureeRDVExistant * 60 * 1000);
                
                // Vérifier le chevauchement : deux créneaux se chevauchent si
                // (creneauDebut < rdvFin) ET (creneauFin > rdvDebut)
                // Cette formule détecte tous les types de chevauchements :
                // - Chevauchement partiel (début avant fin de l'autre)
                // - Chevauchement complet (un créneau contient l'autre)
                // - Chevauchement exact (même heure)
                const chevauche = creneauActuel < rdvFin && creneauFin > rdvDebut;
                
                if (chevauche) {
                    console.log(`⚠️ Conflit détecté:`, {
                        creneau: `${creneauActuel.toLocaleString()} - ${creneauFin.toLocaleString()}`,
                        rdv: `${rdvDebut.toLocaleString()} - ${rdvFin.toLocaleString()}`,
                        statut: rdv.statut,
                        duree: dureeRDVExistant,
                        duree_estimee: rdv.duree_estimee,
                        duree_reelle: rdv.duree_reelle
                    });
                }
                
                return chevauche;
            });
            
            if (!conflit) {
                console.log('✅ Créneau libre trouvé:', {
                    creneau: creneauActuel.toLocaleString(),
                    heure: creneauActuel.toTimeString().slice(0, 5),
                    date: creneauActuel.toLocaleDateString()
                });
                return creneauActuel;
            }
            
            // Passer au créneau suivant (toutes les 15 minutes)
            creneauActuel = new Date(creneauActuel.getTime() + 15 * 60 * 1000);
        }
        
        console.log('⚠️ Aucun créneau libre trouvé aujourd\'hui entre', heureDebutTest.toLocaleString(), 'et', heureFinJour.toLocaleString());
        
        // Si aucun créneau trouvé aujourd'hui, chercher le lendemain (jusqu'à 7 jours)
        if (dateTest.getTime() === aujourdhui.getTime()) {
            for (let i = 1; i <= 7; i++) {
                const dateSuivante = new Date(aujourdhui);
                dateSuivante.setDate(dateSuivante.getDate() + i);
                const jourSuivant = joursMap[dateSuivante.getDay()];
                const horaireSuivant = horaires[jourSuivant] || {};
                
                if (horaireSuivant.actif) {
                    const debut = horaireSuivant.debut ? horaireSuivant.debut.split(':') : [9, 0];
                    const creneauSuivant = new Date(dateSuivante);
                    creneauSuivant.setHours(parseInt(debut[0]), parseInt(debut[1]), 0, 0);
                    console.log('✅ Créneau trouvé pour le jour suivant:', creneauSuivant);
                    return creneauSuivant;
                }
            }
        }
        
        return null;
    } catch (error) {
        console.error('❌ Erreur recherche créneau libre:', error);
        // En cas d'erreur, retourner maintenant + 15 min comme fallback
        return new Date(new Date().getTime() + 15 * 60 * 1000);
    }
}

module.exports = ConsultationController;

