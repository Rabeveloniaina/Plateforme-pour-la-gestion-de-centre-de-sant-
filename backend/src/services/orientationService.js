/**
 * Service d'orientation automatique patient (généraliste vs spécialiste)
 * Basé sur l'analyse des symptômes et leur intensité
 */

const { executeQuery } = require('../config/database');

class OrientationService {
    // Règles d'orientation basées sur les symptômes
    static SYMPTOMES_SPECIALISTES = {
        // Cardiologie
        cardiologie: {
            symptomes: ['douleur thoracique', 'palpitations', 'essoufflement', 'syncope', 'arythmie'],
            keywords: ['cardiaque', 'cœur', 'pouls', 'tension artérielle élevée']
        },
        // Pneumologie
        pneumologie: {
            symptomes: ['difficulté respiratoire', 'toux persistante', 'sifflement', 'oppression thoracique'],
            keywords: ['respiration', 'poumon', 'asthme', 'bronchite chronique']
        },
        // Neurologie
        neurologie: {
            symptomes: ['mal de tête sévère', 'vertige', 'perte de conscience', 'crise', 'tremblements', 'paralysie'],
            keywords: ['migraine', 'épilepsie', 'AVC', 'neurologique']
        },
        // Gastro-entérologie
        gastro: {
            symptomes: ['douleur abdominale sévère', 'vomissements persistants', 'sang dans selles', 'jaunisse'],
            keywords: ['digestif', 'foie', 'estomac', 'intestin']
        },
        // Gynécologie
        gynecologie: {
            symptomes: ['douleur pelvienne', 'saignement anormal', 'règles irrégulières', 'grossesse'],
            keywords: ['menstruel', 'gynécologique', 'obstétrique']
        },
        // Dermatologie
        dermatologie: {
            symptomes: ['éruption cutanée', 'démangeaisons sévères', 'lésion cutanée', 'brûlure'],
            keywords: ['peau', 'dermatologique', 'allergie cutanée']
        },
        // Ophtalmologie
        ophtalmologie: {
            symptomes: ['perte de vision', 'douleur oculaire', 'vision trouble', 'douleur oeil'],
            keywords: ['œil', 'vue', 'ophtalmologique']
        },
        // ORL
        orl: {
            symptomes: ['perte auditive', 'douleur oreille', 'vertiges', 'acouphènes'],
            keywords: ['oreille', 'auditif', 'otite']
        },
        // Orthopédie
        orthopedie: {
            symptomes: ['fracture', 'douleur articulaire sévère', 'luxation', 'traumatisme osseux'],
            keywords: ['os', 'articulation', 'fracture', 'traumatisme']
        },
        // Psychiatrie
        psychiatrie: {
            symptomes: ['dépression sévère', 'anxiété sévère', 'hallucinations', 'pensées suicidaires'],
            keywords: ['psychologique', 'dépression', 'anxiété', 'mental']
        }
    };

    /**
     * Analyser les symptômes et déterminer l'orientation automatique
     * @param {Object} symptomesData - { motif, symptomes: [], intensite }
     * @returns {Object} { orientation: 'generaliste'|'specialiste', specialite?: string, raison: string }
     */
    static async analyserOrientation(symptomesData) {
        const { motif = '', symptomes = [], intensite = 'moderee' } = symptomesData;
        
        // Normaliser les données
        const symptomesNormalises = Array.isArray(symptomes) ? symptomes : 
            (typeof symptomes === 'string' ? symptomes.split(',').map(s => s.trim().toLowerCase()) : []);
        const motifNormalise = motif.toLowerCase();
        const texteComplet = [...symptomesNormalises, motifNormalise].join(' ').toLowerCase();

        // Vérifier l'intensité
        const intensiteSevere = intensite === 'severe' || intensite === 'sévère';

        // Si intensité sévère, toujours orienter vers spécialiste
        if (intensiteSevere && texteComplet.length > 0) {
            const specialite = this.identifierSpecialite(texteComplet);
            if (specialite) {
                return {
                    orientation: 'specialiste',
                    specialite: specialite,
                    raison: `Intensité sévère et symptômes nécessitant un spécialiste (${specialite})`
                };
            }
        }

        // Analyser les symptômes pour identifier un spécialiste
        const specialiteIdentifiee = this.identifierSpecialite(texteComplet);
        
        if (specialiteIdentifiee) {
            return {
                orientation: 'specialiste',
                specialite: specialiteIdentifiee,
                raison: `Symptômes nécessitant une consultation spécialisée en ${specialiteIdentifiee}`
            };
        }

        // Par défaut : généraliste
        return {
            orientation: 'generaliste',
            raison: 'Symptômes pouvant être pris en charge par un médecin généraliste'
        };
    }

    /**
     * Identifier la spécialité nécessaire basée sur les symptômes
     * @param {string} texte - Texte à analyser
     * @returns {string|null} Nom de la spécialité ou null
     */
    static identifierSpecialite(texte) {
        const scores = {};
        
        // Calculer un score pour chaque spécialité
        for (const [specialite, regles] of Object.entries(this.SYMPTOMES_SPECIALISTES)) {
            let score = 0;
            
            // Vérifier les symptômes exacts
            regles.symptomes.forEach(symptome => {
                if (texte.includes(symptome.toLowerCase())) {
                    score += 2;
                }
            });
            
            // Vérifier les mots-clés
            regles.keywords.forEach(keyword => {
                if (texte.includes(keyword.toLowerCase())) {
                    score += 1;
                }
            });
            
            if (score > 0) {
                scores[specialite] = score;
            }
        }
        
        // Retourner la spécialité avec le score le plus élevé
        if (Object.keys(scores).length > 0) {
            const specialiteMax = Object.keys(scores).reduce((a, b) => 
                scores[a] > scores[b] ? a : b
            );
            
            // Seuil minimum pour orientation spécialiste
            if (scores[specialiteMax] >= 2) {
                return this.nomSpecialiteBDD(specialiteMax);
            }
        }
        
        return null;
    }

    /**
     * Mapper le nom de spécialité au format de la base de données
     * @param {string} specialite - Nom de la spécialité interne
     * @returns {string} Nom de spécialité pour la BD
     */
    static nomSpecialiteBDD(specialite) {
        const mapping = {
            'cardiologie': 'Cardiologie',
            'pneumologie': 'Pneumologie',
            'neurologie': 'Neurologie',
            'gastro': 'Gastro-entérologie',
            'gynecologie': 'Gynécologie',
            'dermatologie': 'Dermatologie',
            'ophtalmologie': 'Ophtalmologie',
            'orl': 'ORL',
            'orthopedie': 'Orthopédie',
            'psychiatrie': 'Psychiatrie'
        };
        
        return mapping[specialite] || specialite;
    }

    /**
     * Trouver les médecins spécialistes disponibles pour une spécialité
     * @param {string} specialite - Spécialité recherchée
     * @param {number} centre_id - ID du centre (optionnel)
     * @returns {Array} Liste des médecins spécialistes
     */
    static async trouverSpecialistes(specialite, centre_id = null) {
        let query = `
            SELECT 
                m.id_medecin,
                m.nom,
                m.prenom,
                m.specialite,
                m.telephone,
                m.email,
                m.statut,
                cs.nom as centre_nom,
                cs.id_centre
            FROM medecins m
            LEFT JOIN centres_sante cs ON m.centre_id = cs.id_centre
            WHERE m.specialite LIKE ?
            AND m.statut = 'actif'
        `;
        
        const params = [`%${specialite}%`];
        
        if (centre_id) {
            query += ` AND m.centre_id = ?`;
            params.push(centre_id);
        }
        
        query += ` ORDER BY m.nom, m.prenom LIMIT 10`;
        
        try {
            return await executeQuery(query, params);
        } catch (error) {
            console.error('Erreur recherche spécialistes:', error);
            return [];
        }
    }
}

module.exports = OrientationService;

