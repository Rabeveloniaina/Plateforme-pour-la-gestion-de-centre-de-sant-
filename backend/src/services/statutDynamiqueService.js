/**
 * Service pour la gestion dynamique du statut opérationnel des médecins
 * basée sur leurs horaires de travail
 */

const { executeQuery } = require('../config/database');

class StatutDynamiqueService {
    /**
     * Vérifier si un médecin est en congé (statut administratif)
     */
    static async estEnConge(id_medecin) {
        try {
            const query = `
                SELECT statut 
                FROM medecins 
                WHERE id_medecin = ?
            `;
            const result = await executeQuery(query, [id_medecin]);
            
            if (result.length === 0) {
                return false;
            }
            
            return result[0].statut === 'conges';
        } catch (error) {
            console.error('❌ Erreur vérification congé:', error);
            return false;
        }
    }

    /**
     * Vérifier si la gestion dynamique est activée pour un médecin
     */
    static async gestionDynamiqueActivee(id_medecin) {
        try {
            const query = `
                SELECT gestion_dynamique_statut 
                FROM medecins 
                WHERE id_medecin = ?
            `;
            const result = await executeQuery(query, [id_medecin]);
            
            if (result.length === 0) {
                return false;
            }
            
            // Si la colonne n'existe pas encore, retourner true par défaut
            return result[0].gestion_dynamique_statut !== false;
        } catch (error) {
            // Si la colonne n'existe pas, retourner true par défaut
            if (error.message.includes('Unknown column')) {
                return true;
            }
            console.error('❌ Erreur vérification gestion dynamique:', error);
            return false;
        }
    }

    /**
     * Récupérer les horaires d'un médecin
     */
    static async getHoraires(id_medecin) {
        try {
            const query = `
                SELECT horaires_medecin, disponibilite
                FROM medecins 
                WHERE id_medecin = ?
            `;
            const result = await executeQuery(query, [id_medecin]);
            
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
            console.error('❌ Erreur récupération horaires:', error);
            return null;
        }
    }

    /**
     * Déterminer le statut opérationnel basé sur les horaires actuels
     */
    static determinerStatutParHoraires(horaires) {
        if (!horaires || typeof horaires !== 'object') {
            console.log('⚠️  Pas d\'horaires fournis');
            return null; // Pas de gestion automatique si pas d'horaires
        }

        const maintenant = new Date();
        const jourActuel = maintenant.getDay(); // 0 = Dimanche, 1 = Lundi, etc.
        const heureActuelle = maintenant.getHours();
        const minuteActuelle = maintenant.getMinutes();
        const heureActuelleStr = `${String(heureActuelle).padStart(2, '0')}:${String(minuteActuelle).padStart(2, '0')}`;

        // Mapper les jours (0 = Dimanche, 1 = Lundi, etc.)
        const joursMap = {
            0: 'dimanche',
            1: 'lundi',
            2: 'mardi',
            3: 'mercredi',
            4: 'jeudi',
            5: 'vendredi',
            6: 'samedi'
        };

        const jourNom = joursMap[jourActuel];
        console.log(`📅 Jour actuel: ${jourNom} (${jourActuel}), heure: ${heureActuelleStr}`);
        
        // Vérifier si le médecin travaille aujourd'hui
        const horaireJour = horaires[jourNom];
        
        if (!horaireJour || !horaireJour.actif) {
            console.log(`❌ Médecin ne travaille pas le ${jourNom}`);
            return 'indisponible'; // Le médecin ne travaille pas ce jour
        }

        const heureDebut = horaireJour.debut || '09:00';
        const heureFin = horaireJour.fin || '17:00';

        console.log(`⏰ Horaires du jour: ${heureDebut} - ${heureFin}`);

        // Comparer les heures
        if (this.compareHeures(heureActuelleStr, heureDebut) < 0) {
            console.log(`⏰ Avant les heures de travail: ${heureActuelleStr} < ${heureDebut}`);
            return 'indisponible'; // Avant les heures de travail
        }
        
        if (this.compareHeures(heureActuelleStr, heureFin) > 0) {
            console.log(`⏰ Après les heures de travail: ${heureActuelleStr} > ${heureFin}`);
            return 'indisponible'; // Après les heures de travail
        }

        // Le médecin est dans ses heures de travail
        // Vérifier s'il est en pause (si défini)
        if (horaireJour.pause_debut && horaireJour.pause_fin) {
            const pauseDebut = horaireJour.pause_debut;
            const pauseFin = horaireJour.pause_fin;
            
            console.log(`🍽️  Pause définie: ${pauseDebut} - ${pauseFin}`);
            
            // Vérifier si on est dans la période de pause
            const estApresPauseDebut = this.compareHeures(heureActuelleStr, pauseDebut) >= 0;
            const estAvantPauseFin = this.compareHeures(heureActuelleStr, pauseFin) <= 0;
            
            console.log(`🔍 Comparaison pause: ${heureActuelleStr} >= ${pauseDebut} = ${estApresPauseDebut}, ${heureActuelleStr} <= ${pauseFin} = ${estAvantPauseFin}`);
            
            if (estApresPauseDebut && estAvantPauseFin) {
                console.log(`⏸️  Statut: PAUSE (${heureActuelleStr} est entre ${pauseDebut} et ${pauseFin})`);
                return 'pause'; // Le médecin est en pause
            }
            
            // Si on est après la pause, on est disponible (si toujours dans les heures de travail)
            console.log(`✅ Statut: DISPONIBLE (après pause: ${heureActuelleStr} > ${pauseFin})`);
        } else {
            console.log(`✅ Statut: DISPONIBLE (dans les heures de travail, pas de pause définie)`);
        }

        return 'disponible'; // Dans les heures de travail, pas en pause
    }

    /**
     * Comparer deux heures au format "HH:MM"
     * Retourne -1 si heure1 < heure2, 0 si égales, 1 si heure1 > heure2
     */
    static compareHeures(heure1, heure2) {
        const [h1, m1] = heure1.split(':').map(Number);
        const [h2, m2] = heure2.split(':').map(Number);
        
        const total1 = h1 * 60 + m1;
        const total2 = h2 * 60 + m2;
        
        if (total1 < total2) return -1;
        if (total1 > total2) return 1;
        return 0;
    }

    /**
     * Mettre à jour automatiquement le statut opérationnel d'un médecin
     * basé sur ses horaires
     */
    static async mettreAJourStatut(id_medecin) {
        try {
            console.log(`🔍 Vérification statut pour médecin ${id_medecin}...`);
            
            // Vérifier si le médecin est en congé
            const enConge = await this.estEnConge(id_medecin);
            if (enConge) {
                console.log(`🏖️  Médecin ${id_medecin} est en congé - statut indisponible`);
                // Si en congé, mettre le statut à indisponible et ne pas modifier
                await executeQuery(`
                    UPDATE medecins 
                    SET statut_operationnel = 'indisponible'
                    WHERE id_medecin = ? AND statut_operationnel != 'indisponible'
                `, [id_medecin]);
                return { statut: 'indisponible', raison: 'en_conge' };
            }

            // Vérifier si la gestion dynamique est activée
            const gestionActivee = await this.gestionDynamiqueActivee(id_medecin);
            if (!gestionActivee) {
                console.log(`⏸️  Gestion dynamique désactivée pour médecin ${id_medecin}`);
                return null; // Pas de modification si la gestion dynamique est désactivée
            }

            // Récupérer les horaires
            const horaires = await this.getHoraires(id_medecin);
            if (!horaires) {
                console.log(`⚠️  Pas d'horaires définis pour médecin ${id_medecin}`);
                return null; // Pas d'horaires définis, pas de modification automatique
            }

            console.log(`📅 Horaires récupérés pour médecin ${id_medecin}:`, JSON.stringify(horaires));

            // Déterminer le statut basé sur les horaires
            const nouveauStatut = this.determinerStatutParHoraires(horaires);
            
            if (!nouveauStatut) {
                console.log(`⚠️  Impossible de déterminer le statut pour médecin ${id_medecin}`);
                return null;
            }

            // Récupérer le statut actuel
            const medecin = await executeQuery(`
                SELECT statut_operationnel 
                FROM medecins 
                WHERE id_medecin = ?
            `, [id_medecin]);

            const statutActuel = medecin[0]?.statut_operationnel || 'disponible';

            console.log(`📊 Médecin ${id_medecin}: statut actuel = ${statutActuel}, nouveau statut = ${nouveauStatut}`);

            // Ne mettre à jour que si le statut a changé
            if (statutActuel !== nouveauStatut) {
                await executeQuery(`
                    UPDATE medecins 
                    SET statut_operationnel = ?, updated_at = NOW()
                    WHERE id_medecin = ?
                `, [nouveauStatut, id_medecin]);

                console.log(`✅ Statut mis à jour pour médecin ${id_medecin}: ${statutActuel} → ${nouveauStatut}`);
                return { statut: nouveauStatut, ancien_statut: statutActuel };
            } else {
                console.log(`ℹ️  Statut inchangé pour médecin ${id_medecin}: ${statutActuel}`);
            }

            return null; // Pas de changement
        } catch (error) {
            console.error(`❌ Erreur mise à jour statut dynamique pour médecin ${id_medecin}:`, error);
            return null;
        }
    }

    /**
     * Mettre à jour le statut de tous les médecins actifs
     */
    static async mettreAJourTousLesStatuts() {
        try {
            console.log('🔍 Récupération de tous les médecins actifs...');
            const medecins = await executeQuery(`
                SELECT id_medecin, user_id, nom, prenom
                FROM medecins 
                WHERE statut = 'actif'
            `);

            console.log(`📋 ${medecins.length} médecin(s) actif(s) trouvé(s)`);

            const resultats = [];
            for (const medecin of medecins) {
                console.log(`\n👨‍⚕️  Traitement médecin ${medecin.id_medecin} (${medecin.prenom || ''} ${medecin.nom || ''})...`);
                const result = await this.mettreAJourStatut(medecin.id_medecin);
                if (result) {
                    resultats.push({
                        id_medecin: medecin.id_medecin,
                        ...result
                    });
                }
            }

            return resultats;
        } catch (error) {
            console.error('❌ Erreur mise à jour statuts de tous les médecins:', error);
            console.error('Stack:', error.stack);
            return [];
        }
    }
}

module.exports = StatutDynamiqueService;

