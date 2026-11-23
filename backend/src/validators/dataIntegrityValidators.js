/**
 * Validateurs d'intégrité des données
 * Assure que les données sont cohérentes et valides avant insertion/modification
 */

class DataIntegrityValidators {
    /**
     * Valider la date de naissance
     * La date de naissance doit être inférieure à aujourd'hui
     * @param {string|Date} dateNaissance - Date de naissance au format YYYY-MM-DD ou Date
     * @param {string} entityType - Type d'entité ('patient' ou 'medecin')
     * @returns {Object} { valid: boolean, message: string }
     */
    static validateDateNaissance(dateNaissance, entityType = 'patient') {
        if (!dateNaissance) {
            return {
                valid: false,
                message: 'La date de naissance est requise'
            };
        }

        const date = new Date(dateNaissance);
        const aujourdhui = new Date();
        aujourdhui.setHours(0, 0, 0, 0); // Réinitialiser l'heure à minuit pour comparer uniquement les dates
        
        // Vérifier que la date est valide
        if (isNaN(date.getTime())) {
            return {
                valid: false,
                message: 'Format de date de naissance invalide. Format attendu: YYYY-MM-DD'
            };
        }

        // La date de naissance doit être dans le passé
        if (date >= aujourdhui) {
            return {
                valid: false,
                message: `La date de naissance doit être antérieure à aujourd'hui. Vous ne pouvez pas être né dans le futur.`
            };
        }

        // Vérifier que la date n'est pas trop ancienne (par exemple, plus de 150 ans)
        const centCinquanteAns = new Date();
        centCinquanteAns.setFullYear(centCinquanteAns.getFullYear() - 150);
        if (date < centCinquanteAns) {
            return {
                valid: false,
                message: 'La date de naissance semble invalide (plus de 150 ans). Veuillez vérifier.'
            };
        }

        return { valid: true, message: '' };
    }

    /**
     * Valider l'âge minimum d'un médecin (18 ans)
     * @param {string|Date} dateNaissance - Date de naissance
     * @returns {Object} { valid: boolean, message: string, age: number }
     */
    static validateAgeMinimumMedecin(dateNaissance) {
        if (!dateNaissance) {
            return {
                valid: false,
                message: 'La date de naissance est requise pour valider l\'âge minimum',
                age: null
            };
        }

        const date = new Date(dateNaissance);
        const aujourdhui = new Date();
        
        if (isNaN(date.getTime())) {
            return {
                valid: false,
                message: 'Format de date de naissance invalide',
                age: null
            };
        }

        // Calculer l'âge
        let age = aujourdhui.getFullYear() - date.getFullYear();
        const moisDiff = aujourdhui.getMonth() - date.getMonth();
        if (moisDiff < 0 || (moisDiff === 0 && aujourdhui.getDate() < date.getDate())) {
            age--;
        }

        // Un médecin doit avoir au moins 18 ans
        if (age < 18) {
            return {
                valid: false,
                message: `Un médecin doit avoir au moins 18 ans. L'âge calculé est de ${age} ans.`,
                age: age
            };
        }

        return { valid: true, message: '', age: age };
    }

    /**
     * Valider la date d'embauche d'un médecin
     * La date d'embauche ne doit pas être antérieure à ses 18 ans
     * @param {string|Date} dateNaissance - Date de naissance du médecin
     * @param {string|Date} dateEmbauche - Date d'embauche (optionnelle)
     * @returns {Object} { valid: boolean, message: string }
     */
    static validateDateEmbauche(dateNaissance, dateEmbauche) {
        // Si pas de date d'embauche, c'est valide (champ optionnel)
        if (!dateEmbauche) {
            return { valid: true, message: '' };
        }

        if (!dateNaissance) {
            return {
                valid: false,
                message: 'La date de naissance est requise pour valider la date d\'embauche'
            };
        }

        const dateNaiss = new Date(dateNaissance);
        const dateEmb = new Date(dateEmbauche);
        const aujourdhui = new Date();

        if (isNaN(dateNaiss.getTime())) {
            return {
                valid: false,
                message: 'Format de date de naissance invalide'
            };
        }

        if (isNaN(dateEmb.getTime())) {
            return {
                valid: false,
                message: 'Format de date d\'embauche invalide. Format attendu: YYYY-MM-DD'
            };
        }

        // La date d'embauche ne doit pas être dans le futur
        if (dateEmb > aujourdhui) {
            return {
                valid: false,
                message: 'La date d\'embauche ne peut pas être dans le futur'
            };
        }

        // Calculer la date des 18 ans
        const date18Ans = new Date(dateNaiss);
        date18Ans.setFullYear(date18Ans.getFullYear() + 18);

        // La date d'embauche ne doit pas être antérieure aux 18 ans
        if (dateEmb < date18Ans) {
            const date18AnsFormatee = date18Ans.toLocaleDateString('fr-FR');
            return {
                valid: false,
                message: `La date d'embauche ne peut pas être antérieure au ${date18AnsFormatee} (date des 18 ans du médecin). Un médecin doit avoir au moins 18 ans pour être embauché.`
            };
        }

        return { valid: true, message: '' };
    }

    /**
     * Valider la date et l'heure d'un rendez-vous
     * Le rendez-vous doit être aujourd'hui ou dans le futur (par rapport à l'heure actuelle)
     * @param {string|Date} dateRdv - Date et heure du rendez-vous (format DATETIME)
     * @returns {Object} { valid: boolean, message: string }
     */
    static validateDateRendezVous(dateRdv) {
        if (!dateRdv) {
            return {
                valid: false,
                message: 'La date et l\'heure du rendez-vous sont requises'
            };
        }

        const date = new Date(dateRdv);
        const maintenant = new Date();

        if (isNaN(date.getTime())) {
            return {
                valid: false,
                message: 'Format de date/heure invalide. Format attendu: YYYY-MM-DD HH:MM:SS'
            };
        }

        // Le rendez-vous doit être aujourd'hui ou dans le futur
        // On accepte les rendez-vous jusqu'à 5 minutes dans le passé pour gérer les décalages
        const cinqMinutes = 5 * 60 * 1000; // 5 minutes en millisecondes
        if (date.getTime() < (maintenant.getTime() - cinqMinutes)) {
            const dateFormatee = date.toLocaleString('fr-FR', {
                dateStyle: 'short',
                timeStyle: 'short'
            });
            const maintenantFormate = maintenant.toLocaleString('fr-FR', {
                dateStyle: 'short',
                timeStyle: 'short'
            });
            return {
                valid: false,
                message: `Le rendez-vous ne peut pas être dans le passé. Date demandée: ${dateFormatee}, Date actuelle: ${maintenantFormate}`
            };
        }

        return { valid: true, message: '' };
    }

    /**
     * Valider le réajustement d'un rendez-vous
     * On ne peut pas réajuster un rendez-vous à une heure déjà passée
     * @param {string|Date} nouvelleDate - Nouvelle date/heure du rendez-vous
     * @param {string|Date} dateOriginale - Date/heure originale du rendez-vous
     * @returns {Object} { valid: boolean, message: string }
     */
    static validateReajustementRendezVous(nouvelleDate, dateOriginale = null) {
        if (!nouvelleDate) {
            return {
                valid: false,
                message: 'La nouvelle date et heure sont requises'
            };
        }

        const nouvelle = new Date(nouvelleDate);
        const maintenant = new Date();

        if (isNaN(nouvelle.getTime())) {
            return {
                valid: false,
                message: 'Format de date/heure invalide. Format attendu: YYYY-MM-DDTHH:MM'
            };
        }

        // On ne peut pas réajuster à une heure déjà passée
        // On accepte jusqu'à 5 minutes dans le passé pour gérer les décalages
        const cinqMinutes = 5 * 60 * 1000;
        if (nouvelle.getTime() < (maintenant.getTime() - cinqMinutes)) {
            const nouvelleFormatee = nouvelle.toLocaleString('fr-FR', {
                dateStyle: 'short',
                timeStyle: 'short'
            });
            const maintenantFormate = maintenant.toLocaleString('fr-FR', {
                dateStyle: 'short',
                timeStyle: 'short'
            });
            return {
                valid: false,
                message: `Impossible de réajuster le rendez-vous à une heure déjà passée. Nouvelle heure demandée: ${nouvelleFormatee}, Heure actuelle: ${maintenantFormate}`
            };
        }

        // Si on a la date originale, vérifier qu'on ne la recule pas trop dans le passé
        if (dateOriginale) {
            const originale = new Date(dateOriginale);
            if (!isNaN(originale.getTime())) {
                // On peut avancer ou reculer, mais pas dans le passé absolu
                if (nouvelle.getTime() < (maintenant.getTime() - cinqMinutes)) {
                    return {
                        valid: false,
                        message: 'Impossible de réajuster le rendez-vous à une heure déjà passée'
                    };
                }
            }
        }

        return { valid: true, message: '' };
    }

    /**
     * Valider le prénom (optionnel pour les malgaches)
     * Le prénom peut être vide ou null
     * @param {string} prenom - Prénom
     * @returns {Object} { valid: boolean, message: string, isOptional: boolean }
     */
    static validatePrenom(prenom) {
        // Le prénom est optionnel (les malgaches peuvent ne pas avoir de prénom)
        // Mais s'il est fourni, il ne doit pas être une chaîne vide après trim
        if (prenom === null || prenom === undefined || prenom === '') {
            return { valid: true, message: '', isOptional: true };
        }

        if (typeof prenom === 'string' && prenom.trim() === '') {
            // Chaîne vide après trim = pas de prénom, c'est valide
            return { valid: true, message: '', isOptional: true };
        }

        return { valid: true, message: '', isOptional: false };
    }

    /**
     * Valider toutes les données d'un patient
     * @param {Object} patientData - Données du patient
     * @returns {Object} { valid: boolean, errors: Array<string> }
     */
    static validatePatient(patientData) {
        const errors = [];

        // Valider le nom
        if (patientData.nom !== undefined) {
            const nomValidation = this.validateNom(patientData.nom, 'nom');
            if (!nomValidation.valid) {
                errors.push(nomValidation.message);
            }
        }

        // Valider le prénom (optionnel)
        if (patientData.prenom !== undefined) {
            const prenomValidation = this.validatePrenom(patientData.prenom);
            // Le prénom est optionnel, donc on ne génère pas d'erreur si vide
        }

        // Valider la date de naissance
        if (patientData.date_naissance) {
            const dateNaissValidation = this.validateDateNaissance(patientData.date_naissance, 'patient');
            if (!dateNaissValidation.valid) {
                errors.push(dateNaissValidation.message);
            }
        }

        // Valider le sexe
        if (patientData.sexe !== undefined) {
            const sexeValidation = this.validateSexe(patientData.sexe);
            if (!sexeValidation.valid) {
                errors.push(sexeValidation.message);
            }
        }

        // Valider le téléphone
        if (patientData.telephone !== undefined) {
            const telephoneValidation = this.validateTelephone(patientData.telephone);
            if (!telephoneValidation.valid) {
                errors.push(telephoneValidation.message);
            }
        }

        // Valider l'email (optionnel)
        if (patientData.email !== undefined) {
            const emailValidation = this.validateEmail(patientData.email, false);
            if (!emailValidation.valid) {
                errors.push(emailValidation.message);
            }
        }

        // Valider l'adresse
        if (patientData.adresse !== undefined) {
            const adresseValidation = this.validateAdresse(patientData.adresse);
            if (!adresseValidation.valid) {
                errors.push(adresseValidation.message);
            }
        }

        // Valider le groupe sanguin (optionnel)
        if (patientData.groupe_sanguin !== undefined) {
            const groupeSanguinValidation = this.validateGroupeSanguin(patientData.groupe_sanguin);
            if (!groupeSanguinValidation.valid) {
                errors.push(groupeSanguinValidation.message);
            }
        }

        // Valider le statut (si création de RDV)
        if (patientData.statut !== undefined && patientData.checkActiveForRdv) {
            const statutValidation = this.validatePatientActif(patientData.statut);
            if (!statutValidation.valid) {
                errors.push(statutValidation.message);
            }
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Valider toutes les données d'un médecin
     * @param {Object} medecinData - Données du médecin
     * @returns {Object} { valid: boolean, errors: Array<string> }
     */
    static validateMedecin(medecinData) {
        const errors = [];

        // Valider le nom
        if (medecinData.nom !== undefined) {
            const nomValidation = this.validateNom(medecinData.nom, 'nom');
            if (!nomValidation.valid) {
                errors.push(nomValidation.message);
            }
        }

        // Valider le prénom (optionnel)
        if (medecinData.prenom !== undefined) {
            const prenomValidation = this.validatePrenom(medecinData.prenom);
            // Le prénom est optionnel, donc on ne génère pas d'erreur si vide
        }

        // Valider le sexe
        if (medecinData.sexe !== undefined) {
            const sexeValidation = this.validateSexe(medecinData.sexe);
            if (!sexeValidation.valid) {
                errors.push(sexeValidation.message);
            }
        }

        // Valider la date de naissance
        if (medecinData.date_naissance) {
            const dateNaissValidation = this.validateDateNaissance(medecinData.date_naissance, 'medecin');
            if (!dateNaissValidation.valid) {
                errors.push(dateNaissValidation.message);
            }

            // Valider l'âge minimum (18 ans)
            const ageValidation = this.validateAgeMinimumMedecin(medecinData.date_naissance);
            if (!ageValidation.valid) {
                errors.push(ageValidation.message);
            }

            // Valider la date d'embauche si fournie
            if (medecinData.date_embauche) {
                const embaucheValidation = this.validateDateEmbauche(
                    medecinData.date_naissance,
                    medecinData.date_embauche
                );
                if (!embaucheValidation.valid) {
                    errors.push(embaucheValidation.message);
                }
            }
        }

        // Valider la spécialité
        if (medecinData.specialite !== undefined) {
            const specialiteValidation = this.validateSpecialite(medecinData.specialite);
            if (!specialiteValidation.valid) {
                errors.push(specialiteValidation.message);
            }
        }

        // Valider le numéro de licence
        if (medecinData.numero_licence !== undefined) {
            const licenceValidation = this.validateNumeroLicence(medecinData.numero_licence);
            if (!licenceValidation.valid) {
                errors.push(licenceValidation.message);
            }
        }

        // Valider le téléphone
        if (medecinData.telephone !== undefined) {
            const telephoneValidation = this.validateTelephone(medecinData.telephone);
            if (!telephoneValidation.valid) {
                errors.push(telephoneValidation.message);
            }
        }

        // Valider l'email (requis pour les médecins)
        if (medecinData.email !== undefined) {
            const emailValidation = this.validateEmail(medecinData.email, true);
            if (!emailValidation.valid) {
                errors.push(emailValidation.message);
            }
        }

        // Valider l'expérience (optionnelle)
        if (medecinData.experience !== undefined) {
            const experienceValidation = this.validateExperience(medecinData.experience);
            if (!experienceValidation.valid) {
                errors.push(experienceValidation.message);
            }
        }

        // Valider le statut (si création de RDV)
        if (medecinData.statut !== undefined && medecinData.checkActiveForRdv) {
            const statutValidation = this.validateMedecinActif(medecinData.statut);
            if (!statutValidation.valid) {
                errors.push(statutValidation.message);
            }
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Valider toutes les données d'un rendez-vous
     * @param {Object} rdvData - Données du rendez-vous
     * @returns {Object} { valid: boolean, errors: Array<string> }
     */
    static validateRendezVous(rdvData) {
        const errors = [];

        // Valider la date et l'heure du rendez-vous
        if (rdvData.date_rdv) {
            const dateRdvValidation = this.validateDateRendezVous(rdvData.date_rdv);
            if (!dateRdvValidation.valid) {
                errors.push(dateRdvValidation.message);
            } else {
                // Valider que la date n'est pas trop loin dans le futur
                const dateFuturValidation = this.validateDateRendezVousFutur(rdvData.date_rdv, 12);
                if (!dateFuturValidation.valid) {
                    errors.push(dateFuturValidation.message);
                }
            }
        }

        // Valider la durée estimée si fournie
        if (rdvData.duree_estimee !== undefined && rdvData.duree_estimee !== null) {
            const dureeValidation = this.validateDureeConsultation(rdvData.duree_estimee);
            if (!dureeValidation.valid) {
                errors.push(dureeValidation.message);
            }
        }

        // Valider l'heure d'arrivée si fournie
        if (rdvData.heure_arrivee && rdvData.date_rdv) {
            const heureArriveeValidation = this.validateHeureArrivee(rdvData.heure_arrivee, rdvData.date_rdv);
            if (!heureArriveeValidation.valid) {
                errors.push(heureArriveeValidation.message);
            }
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Valider le format d'un téléphone
     * @param {string} telephone - Numéro de téléphone
     * @returns {Object} { valid: boolean, message: string }
     */
    static validateTelephone(telephone) {
        if (!telephone) {
            return {
                valid: false,
                message: 'Le numéro de téléphone est requis'
            };
        }

        // Nettoyer le numéro (enlever espaces, tirets, parenthèses)
        const telNettoye = telephone.toString().replace(/[\s\-\(\)]/g, '');

        // Vérifier que c'est composé uniquement de chiffres (et éventuellement + au début)
        if (!/^\+?[0-9]{8,15}$/.test(telNettoye)) {
            return {
                valid: false,
                message: 'Le numéro de téléphone doit contenir entre 8 et 15 chiffres. Format accepté: +261 XX XX XX XXX ou XX XX XX XX'
            };
        }

        return { valid: true, message: '' };
    }

    /**
     * Valider le format d'un email
     * @param {string} email - Adresse email
     * @param {boolean} required - Si l'email est requis (défaut: false)
     * @returns {Object} { valid: boolean, message: string }
     */
    static validateEmail(email, required = false) {
        if (!email) {
            if (required) {
                return {
                    valid: false,
                    message: 'L\'adresse email est requise'
                };
            }
            return { valid: true, message: '' }; // Email optionnel
        }

        // Regex pour valider le format email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return {
                valid: false,
                message: 'Format d\'adresse email invalide. Format attendu: exemple@domaine.com'
            };
        }

        // Vérifier la longueur
        if (email.length > 100) {
            return {
                valid: false,
                message: 'L\'adresse email est trop longue (maximum 100 caractères)'
            };
        }

        return { valid: true, message: '' };
    }

    /**
     * Valider le sexe (M ou F)
     * @param {string} sexe - Sexe
     * @returns {Object} { valid: boolean, message: string }
     */
    static validateSexe(sexe) {
        if (!sexe) {
            return {
                valid: false,
                message: 'Le sexe est requis'
            };
        }

        const sexeUpper = sexe.toUpperCase();
        if (sexeUpper !== 'M' && sexeUpper !== 'F') {
            return {
                valid: false,
                message: 'Le sexe doit être "M" (Masculin) ou "F" (Féminin)'
            };
        }

        return { valid: true, message: '' };
    }

    /**
     * Valider la durée d'une consultation
     * @param {number} duree - Durée en minutes
     * @returns {Object} { valid: boolean, message: string }
     */
    static validateDureeConsultation(duree) {
        if (duree === null || duree === undefined) {
            return { valid: true, message: '' }; // Durée optionnelle
        }

        const dureeNum = parseInt(duree);
        if (isNaN(dureeNum)) {
            return {
                valid: false,
                message: 'La durée doit être un nombre (en minutes)'
            };
        }

        // La durée doit être positive
        if (dureeNum <= 0) {
            return {
                valid: false,
                message: 'La durée de consultation doit être supérieure à 0 minutes'
            };
        }

        // La durée ne peut pas être trop longue (par exemple, plus de 8 heures = 480 minutes)
        if (dureeNum > 480) {
            return {
                valid: false,
                message: 'La durée de consultation ne peut pas dépasser 8 heures (480 minutes). Veuillez vérifier la valeur.'
            };
        }

        // Durée minimale raisonnable (au moins 5 minutes)
        if (dureeNum < 5) {
            return {
                valid: false,
                message: 'La durée de consultation doit être d\'au moins 5 minutes'
            };
        }

        return { valid: true, message: '' };
    }

    /**
     * Valider que la date d'un rendez-vous n'est pas trop loin dans le futur
     * @param {string|Date} dateRdv - Date du rendez-vous
     * @param {number} maxMonths - Nombre maximum de mois à l'avance (défaut: 12)
     * @returns {Object} { valid: boolean, message: string }
     */
    static validateDateRendezVousFutur(dateRdv, maxMonths = 12) {
        if (!dateRdv) {
            return { valid: true, message: '' };
        }

        const date = new Date(dateRdv);
        const maintenant = new Date();
        const maxDate = new Date();
        maxDate.setMonth(maxDate.getMonth() + maxMonths);

        if (isNaN(date.getTime())) {
            return {
                valid: false,
                message: 'Format de date invalide'
            };
        }

        if (date > maxDate) {
            const maxDateFormatee = maxDate.toLocaleDateString('fr-FR');
            return {
                valid: false,
                message: `Le rendez-vous ne peut pas être programmé plus de ${maxMonths} mois à l'avance. Date maximum: ${maxDateFormatee}`
            };
        }

        return { valid: true, message: '' };
    }

    /**
     * Valider le numéro de licence d'un médecin
     * @param {string} numeroLicence - Numéro de licence
     * @returns {Object} { valid: boolean, message: string }
     */
    static validateNumeroLicence(numeroLicence) {
        if (!numeroLicence) {
            return {
                valid: false,
                message: 'Le numéro de licence est requis'
            };
        }

        const numeroStr = numeroLicence.toString().trim();
        
        // Vérifier la longueur (minimum 3 caractères, maximum 50)
        if (numeroStr.length < 3) {
            return {
                valid: false,
                message: 'Le numéro de licence doit contenir au moins 3 caractères'
            };
        }

        if (numeroStr.length > 50) {
            return {
                valid: false,
                message: 'Le numéro de licence ne peut pas dépasser 50 caractères'
            };
        }

        // Vérifier qu'il ne contient pas que des espaces
        if (numeroStr.replace(/\s/g, '').length === 0) {
            return {
                valid: false,
                message: 'Le numéro de licence ne peut pas être vide'
            };
        }

        return { valid: true, message: '' };
    }

    /**
     * Valider qu'une date de consultation n'est pas dans le futur
     * @param {string|Date} dateConsultation - Date de consultation
     * @returns {Object} { valid: boolean, message: string }
     */
    static validateDateConsultationPasFutur(dateConsultation) {
        if (!dateConsultation) {
            return { valid: true, message: '' };
        }

        const date = new Date(dateConsultation);
        const maintenant = new Date();
        maintenant.setHours(23, 59, 59, 999); // Fin de la journée

        if (isNaN(date.getTime())) {
            return {
                valid: false,
                message: 'Format de date de consultation invalide'
            };
        }

        // Une consultation ne peut pas être dans le futur (on accepte jusqu'à la fin de la journée)
        if (date > maintenant) {
            const dateFormatee = date.toLocaleDateString('fr-FR');
            return {
                valid: false,
                message: `La date de consultation ne peut pas être dans le futur. Date fournie: ${dateFormatee}`
            };
        }

        return { valid: true, message: '' };
    }

    /**
     * Valider que la date de fin est après la date de début
     * @param {string|Date} dateDebut - Date de début
     * @param {string|Date} dateFin - Date de fin
     * @param {string} entityName - Nom de l'entité (pour le message d'erreur)
     * @returns {Object} { valid: boolean, message: string }
     */
    static validateDateFinApresDebut(dateDebut, dateFin, entityName = 'événement') {
        if (!dateDebut || !dateFin) {
            return { valid: true, message: '' }; // Si une des dates est absente, on ne valide pas
        }

        const debut = new Date(dateDebut);
        const fin = new Date(dateFin);

        if (isNaN(debut.getTime()) || isNaN(fin.getTime())) {
            return {
                valid: false,
                message: 'Format de date invalide'
            };
        }

        if (fin <= debut) {
            const debutFormatee = debut.toLocaleString('fr-FR');
            const finFormatee = fin.toLocaleString('fr-FR');
            return {
                valid: false,
                message: `La date de fin doit être postérieure à la date de début. Début: ${debutFormatee}, Fin: ${finFormatee}`
            };
        }

        return { valid: true, message: '' };
    }

    /**
     * Valider l'heure d'arrivée d'un patient
     * @param {string|Date} heureArrivee - Heure d'arrivée
     * @param {string|Date} dateRdv - Date du rendez-vous
     * @returns {Object} { valid: boolean, message: string }
     */
    static validateHeureArrivee(heureArrivee, dateRdv) {
        if (!heureArrivee) {
            return { valid: true, message: '' }; // Heure d'arrivée optionnelle
        }

        if (!dateRdv) {
            return { valid: true, message: '' }; // Si pas de date RDV, on ne valide pas
        }

        const arrivee = new Date(heureArrivee);
        const rdv = new Date(dateRdv);
        const maintenant = new Date();

        if (isNaN(arrivee.getTime()) || isNaN(rdv.getTime())) {
            return {
                valid: false,
                message: 'Format de date/heure invalide'
            };
        }

        // L'heure d'arrivée ne peut pas être trop loin dans le passé (plus de 1 jour avant le RDV)
        const unJourAvant = new Date(rdv);
        unJourAvant.setDate(unJourAvant.getDate() - 1);

        if (arrivee < unJourAvant) {
            return {
                valid: false,
                message: 'L\'heure d\'arrivée ne peut pas être plus d\'un jour avant le rendez-vous'
            };
        }

        // L'heure d'arrivée ne peut pas être dans le futur (on accepte jusqu'à 5 minutes)
        const cinqMinutes = 5 * 60 * 1000;
        if (arrivee.getTime() > (maintenant.getTime() + cinqMinutes)) {
            return {
                valid: false,
                message: 'L\'heure d\'arrivée ne peut pas être dans le futur'
            };
        }

        return { valid: true, message: '' };
    }

    /**
     * Valider les valeurs médicales (poids, taille, tension, etc.)
     * @param {Object} valeurs - Objet contenant les valeurs médicales
     * @returns {Object} { valid: boolean, errors: Array<string> }
     */
    static validateValeursMedicales(valeurs) {
        const errors = [];

        // Valider le poids (en kg)
        if (valeurs.poids !== undefined && valeurs.poids !== null) {
            const poids = parseFloat(valeurs.poids);
            if (isNaN(poids) || poids <= 0) {
                errors.push('Le poids doit être un nombre positif');
            } else if (poids < 0.5 || poids > 500) {
                errors.push('Le poids doit être entre 0.5 kg et 500 kg');
            }
        }

        // Valider la taille (en cm)
        if (valeurs.taille !== undefined && valeurs.taille !== null) {
            const taille = parseFloat(valeurs.taille);
            if (isNaN(taille) || taille <= 0) {
                errors.push('La taille doit être un nombre positif');
            } else if (taille < 30 || taille > 250) {
                errors.push('La taille doit être entre 30 cm et 250 cm');
            }
        }

        // Valider la tension artérielle
        if (valeurs.tension_systolique !== undefined && valeurs.tension_systolique !== null) {
            const systolique = parseInt(valeurs.tension_systolique);
            if (isNaN(systolique) || systolique < 50 || systolique > 300) {
                errors.push('La tension systolique doit être entre 50 et 300 mmHg');
            }
        }

        if (valeurs.tension_diastolique !== undefined && valeurs.tension_diastolique !== null) {
            const diastolique = parseInt(valeurs.tension_diastolique);
            if (isNaN(diastolique) || diastolique < 30 || diastolique > 200) {
                errors.push('La tension diastolique doit être entre 30 et 200 mmHg');
            }
        }

        // Valider la cohérence entre tension systolique et diastolique
        if (valeurs.tension_systolique !== undefined && valeurs.tension_systolique !== null &&
            valeurs.tension_diastolique !== undefined && valeurs.tension_diastolique !== null) {
            const systolique = parseInt(valeurs.tension_systolique);
            const diastolique = parseInt(valeurs.tension_diastolique);
            if (!isNaN(systolique) && !isNaN(diastolique)) {
                if (systolique <= diastolique) {
                    errors.push('La tension systolique doit être supérieure à la tension diastolique');
                }
            }
        }

        // Valider la fréquence cardiaque
        if (valeurs.frequence_cardiaque !== undefined && valeurs.frequence_cardiaque !== null) {
            const frequence = parseInt(valeurs.frequence_cardiaque);
            if (isNaN(frequence) || frequence < 30 || frequence > 250) {
                errors.push('La fréquence cardiaque doit être entre 30 et 250 bpm');
            }
        }

        // Valider la température
        if (valeurs.temperature !== undefined && valeurs.temperature !== null) {
            const temperature = parseFloat(valeurs.temperature);
            if (isNaN(temperature) || temperature < 30 || temperature > 45) {
                errors.push('La température doit être entre 30°C et 45°C');
            }
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Valider qu'un médecin est actif avant de créer un RDV
     * @param {string} statut - Statut du médecin
     * @returns {Object} { valid: boolean, message: string }
     */
    static validateMedecinActif(statut) {
        if (!statut) {
            return {
                valid: false,
                message: 'Le statut du médecin n\'est pas défini'
            };
        }

        if (statut !== 'actif') {
            return {
                valid: false,
                message: `Impossible de créer un rendez-vous avec un médecin ${statut}. Seuls les médecins actifs peuvent recevoir des patients.`
            };
        }

        return { valid: true, message: '' };
    }

    /**
     * Valider qu'un patient est actif avant de créer un RDV
     * @param {string} statut - Statut du patient
     * @returns {Object} { valid: boolean, message: string }
     */
    static validatePatientActif(statut) {
        if (!statut) {
            return { valid: true, message: '' }; // Si pas de statut, on considère comme actif par défaut
        }

        if (statut === 'inactif') {
            return {
                valid: false,
                message: 'Impossible de créer un rendez-vous pour un patient inactif. Veuillez réactiver le patient d\'abord.'
            };
        }

        return { valid: true, message: '' };
    }

    /**
     * Valider le nom (non vide, longueur raisonnable)
     * @param {string} nom - Nom
     * @param {string} fieldName - Nom du champ (pour le message d'erreur)
     * @returns {Object} { valid: boolean, message: string }
     */
    static validateNom(nom, fieldName = 'nom') {
        if (!nom) {
            return {
                valid: false,
                message: `Le ${fieldName} est requis`
            };
        }

        const nomStr = nom.toString().trim();
        
        if (nomStr.length === 0) {
            return {
                valid: false,
                message: `Le ${fieldName} ne peut pas être vide`
            };
        }

        if (nomStr.length > 100) {
            return {
                valid: false,
                message: `Le ${fieldName} ne peut pas dépasser 100 caractères`
            };
        }

        // Vérifier qu'il n'y a pas que des caractères spéciaux
        if (!/^[a-zA-ZÀ-ÿ\s\-']+$/.test(nomStr)) {
            // On accepte les lettres, espaces, tirets et apostrophes
            // Mais on autorise aussi les autres caractères pour les noms malgaches
            // On est plus permissif ici
        }

        return { valid: true, message: '' };
    }

    /**
     * Valider l'adresse (non vide, longueur raisonnable)
     * @param {string} adresse - Adresse
     * @returns {Object} { valid: boolean, message: string }
     */
    static validateAdresse(adresse) {
        if (!adresse) {
            return {
                valid: false,
                message: 'L\'adresse est requise'
            };
        }

        const adresseStr = adresse.toString().trim();
        
        if (adresseStr.length === 0) {
            return {
                valid: false,
                message: 'L\'adresse ne peut pas être vide'
            };
        }

        if (adresseStr.length > 255) {
            return {
                valid: false,
                message: 'L\'adresse ne peut pas dépasser 255 caractères'
            };
        }

        return { valid: true, message: '' };
    }

    /**
     * Valider la spécialité d'un médecin
     * @param {string} specialite - Spécialité
     * @returns {Object} { valid: boolean, message: string }
     */
    static validateSpecialite(specialite) {
        if (!specialite) {
            return {
                valid: false,
                message: 'La spécialité est requise'
            };
        }

        const specialiteStr = specialite.toString().trim();
        
        if (specialiteStr.length === 0) {
            return {
                valid: false,
                message: 'La spécialité ne peut pas être vide'
            };
        }

        if (specialiteStr.length > 100) {
            return {
                valid: false,
                message: 'La spécialité ne peut pas dépasser 100 caractères'
            };
        }

        return { valid: true, message: '' };
    }

    /**
     * Valider la cohérence centre/région
     * Vérifie que le centre appartient à la région spécifiée
     * @param {number} centreId - ID du centre
     * @param {number} regionId - ID de la région
     * @param {Function} executeQuery - Fonction pour exécuter des requêtes SQL
     * @returns {Promise<Object>} { valid: boolean, message: string }
     */
    static async validateCentreRegion(centreId, regionId, executeQuery) {
        if (!centreId || !regionId) {
            return {
                valid: false,
                message: 'Centre ID et Region ID sont requis'
            };
        }

        try {
            const centre = await executeQuery(
                'SELECT region_id, statut FROM centres_sante WHERE id_centre = ?',
                [centreId]
            );

            if (!centre || centre.length === 0) {
                return {
                    valid: false,
                    message: 'Centre de santé non trouvé'
                };
            }

            if (centre[0].statut !== 'actif') {
                return {
                    valid: false,
                    message: 'Le centre de santé sélectionné est inactif. Veuillez choisir un centre actif.'
                };
            }

            if (centre[0].region_id !== parseInt(regionId)) {
                return {
                    valid: false,
                    message: `Le centre sélectionné n'appartient pas à la région choisie. Le centre appartient à la région ID ${centre[0].region_id}, mais la région ${regionId} a été sélectionnée.`
                };
            }

            return { valid: true, message: '' };
        } catch (error) {
            return {
                valid: false,
                message: `Erreur lors de la validation centre/région: ${error.message}`
            };
        }
    }

    /**
     * Valider qu'un médecin appartient au même centre qu'un patient (pour les consultations)
     * @param {number} medecinCentreId - ID du centre du médecin
     * @param {number} patientCentreId - ID du centre du patient
     * @returns {Object} { valid: boolean, message: string }
     */
    static validateMedecinPatientMemeCentre(medecinCentreId, patientCentreId) {
        if (!medecinCentreId || !patientCentreId) {
            return {
                valid: true,
                message: '' // Si les IDs ne sont pas fournis, on ne valide pas (peut être géré ailleurs)
            };
        }

        if (medecinCentreId !== patientCentreId) {
            return {
                valid: false,
                message: 'Le médecin et le patient doivent appartenir au même centre de santé pour une consultation'
            };
        }

        return { valid: true, message: '' };
    }

    /**
     * Valider le groupe sanguin
     * @param {string} groupeSanguin - Groupe sanguin
     * @returns {Object} { valid: boolean, message: string }
     */
    static validateGroupeSanguin(groupeSanguin) {
        // Le groupe sanguin est optionnel
        if (!groupeSanguin || groupeSanguin === '' || groupeSanguin === null) {
            return { valid: true, message: '' };
        }

        const groupesValides = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
        const groupeUpper = groupeSanguin.toString().toUpperCase();
        
        if (!groupesValides.includes(groupeUpper)) {
            return {
                valid: false,
                message: `Groupe sanguin invalide. Valeurs acceptées: ${groupesValides.join(', ')}`
            };
        }

        return { valid: true, message: '' };
    }

    /**
     * Valider le motif de consultation
     * @param {string} motif - Motif de consultation
     * @returns {Object} { valid: boolean, message: string }
     */
    static validateMotifConsultation(motif) {
        if (!motif) {
            return {
                valid: false,
                message: 'Le motif de consultation est requis'
            };
        }

        const motifStr = motif.toString().trim();
        
        if (motifStr.length === 0) {
            return {
                valid: false,
                message: 'Le motif de consultation ne peut pas être vide'
            };
        }

        if (motifStr.length > 500) {
            return {
                valid: false,
                message: 'Le motif de consultation ne peut pas dépasser 500 caractères'
            };
        }

        return { valid: true, message: '' };
    }

    /**
     * Valider l'expérience d'un médecin
     * @param {number} experience - Années d'expérience
     * @returns {Object} { valid: boolean, message: string }
     */
    static validateExperience(experience) {
        // L'expérience est optionnelle
        if (experience === null || experience === undefined || experience === '') {
            return { valid: true, message: '' };
        }

        const expNum = parseInt(experience);
        if (isNaN(expNum)) {
            return {
                valid: false,
                message: 'L\'expérience doit être un nombre (en années)'
            };
        }

        // L'expérience ne peut pas être négative
        if (expNum < 0) {
            return {
                valid: false,
                message: 'L\'expérience ne peut pas être négative'
            };
        }

        // L'expérience ne peut pas dépasser 70 ans (raisonnable pour un médecin)
        if (expNum > 70) {
            return {
                valid: false,
                message: 'L\'expérience ne peut pas dépasser 70 ans. Veuillez vérifier la valeur.'
            };
        }

        return { valid: true, message: '' };
    }

    /**
     * Valider que la date de début d'une prescription est dans le futur ou aujourd'hui
     * @param {string|Date} dateDebut - Date de début de la prescription
     * @returns {Object} { valid: boolean, message: string }
     */
    static validateDateDebutPrescription(dateDebut) {
        if (!dateDebut) {
            return { valid: true, message: '' };
        }

        const date = new Date(dateDebut);
        const aujourdhui = new Date();
        aujourdhui.setHours(0, 0, 0, 0);

        if (isNaN(date.getTime())) {
            return {
                valid: false,
                message: 'Format de date de début invalide'
            };
        }

        // La date de début peut être aujourd'hui ou dans le futur (pas dans le passé)
        if (date < aujourdhui) {
            const dateFormatee = date.toLocaleDateString('fr-FR');
            return {
                valid: false,
                message: `La date de début de la prescription ne peut pas être dans le passé. Date fournie: ${dateFormatee}`
            };
        }

        return { valid: true, message: '' };
    }
}

module.exports = DataIntegrityValidators;

