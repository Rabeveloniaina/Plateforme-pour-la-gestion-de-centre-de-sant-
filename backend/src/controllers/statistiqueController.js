const { executeQuery } = require('../config/database');
const { Parser } = require('json2csv');
let PDFDocument;
try { PDFDocument = require('pdfkit'); } catch (_) { PDFDocument = null; }

class StatistiqueController {
    static async byCentre(req, res) {
        try {
            const { centre_id, periode = 'jour', date_debut, date_fin } = req.query;
            const user = req.user;
            let dateFilter = '';
            const params = [];
            
            // Déterminer l'ID du centre
            const targetCentreId = user.role === 'ministere' ? centre_id : user.id_centre;
            if (!targetCentreId) {
                return res.status(400).json({ success: false, message: 'ID du centre manquant' });
            }
            
            if (periode === 'jour') dateFilter = 'AND DATE(date_rdv) = CURDATE()';
            else if (periode === 'semaine') dateFilter = 'AND YEARWEEK(date_rdv) = YEARWEEK(CURDATE())';
            else if (periode === 'mois') dateFilter = 'AND MONTH(date_rdv) = MONTH(CURDATE()) AND YEAR(date_rdv) = YEAR(CURDATE())';
            else if (date_debut && date_fin) { dateFilter = 'AND DATE(date_rdv) BETWEEN ? AND ?'; params.push(date_debut, date_fin); }
            
            // Récupérer les informations du centre
            const centreInfo = await executeQuery(
                `SELECT cs.*, r.nom as region_nom FROM centres_sante cs 
                 LEFT JOIN regions r ON cs.region_id = r.id_region 
                 WHERE cs.id_centre = ?`,
                [targetCentreId]
            );
            
            if (!centreInfo || centreInfo.length === 0) {
                return res.status(404).json({ success: false, message: 'Centre non trouvé' });
            }

            // Statistiques RDV
            const rdvStats = await executeQuery(`
                SELECT 
                    COUNT(*) as nb_rdv,
                    COUNT(CASE WHEN statut = 'termine' THEN 1 END) as nb_consultations,
                    COUNT(CASE WHEN statut = 'attente' THEN 1 END) as nb_attente,
                    COUNT(CASE WHEN statut = 'confirme' THEN 1 END) as nb_confirmes,
                    COUNT(CASE WHEN statut = 'annule' THEN 1 END) as nb_annules,
                    COUNT(CASE WHEN statut = 'absent' THEN 1 END) as nb_absents,
                    ROUND(AVG(duree_estimee),2) as duree_estimee_moy,
                    ROUND(AVG(duree_reelle),2) as duree_reelle_moy
                FROM rendez_vous
                WHERE centre_id = ? ${dateFilter}
            `, [targetCentreId, ...params]);
            
            // Nombre de patients
            const patientsCount = await executeQuery(
                `SELECT COUNT(*) as total FROM patients WHERE centre_id = ?`,
                [targetCentreId]
            );
            
            // Nombre de médecins
            const medecinsCount = await executeQuery(
                `SELECT COUNT(*) as total FROM medecins WHERE centre_id = ?`,
                [targetCentreId]
            );
            
            // RDV aujourd'hui
            const rdvAujourdhuiCount = await executeQuery(
                `SELECT COUNT(*) as total FROM rendez_vous 
                 WHERE centre_id = ? AND DATE(date_rdv) = CURDATE()`,
                [targetCentreId]
            );
            
            // Consultations terminées aujourd'hui
            const consultationsTerminees = await executeQuery(
                `SELECT COUNT(*) as total FROM rendez_vous 
                 WHERE centre_id = ? AND DATE(date_rdv) = CURDATE() AND statut = 'termine'`,
                [targetCentreId]
            );
            
            // Consultations en cours (confirmées qui ont commencé)
            const consultationsEnCours = await executeQuery(
                `SELECT COUNT(*) as total FROM rendez_vous 
                 WHERE centre_id = ? AND DATE(date_rdv) = CURDATE() AND statut = 'confirme' AND heure_debut_consultation IS NOT NULL AND heure_fin_consultation IS NULL`,
                [targetCentreId]
            );
            
            // Liste des médecins
            const medecinsList = await executeQuery(
                `SELECT 
                    id_medecin as id, 
                    nom, 
                    prenom, 
                    specialite, 
                    statut,
                    DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') as derniere_activite
                 FROM medecins 
                 WHERE centre_id = ? 
                 ORDER BY nom, prenom
                 LIMIT 10`,
                [targetCentreId]
            );
            
            // Patients récents
            const patientsRecents = await executeQuery(
                `SELECT 
                    id_patient as id, 
                    nom, 
                    prenom, 
                    telephone,
                    DATE_FORMAT(created_at, '%Y-%m-%d') as date_inscription
                 FROM patients 
                 WHERE centre_id = ? 
                 ORDER BY created_at DESC 
                 LIMIT 10`,
                [targetCentreId]
            );
            
            // RDV aujourd'hui détaillés
            const rdvAujourdhuiList = await executeQuery(
                `SELECT 
                    rv.id_rdv as id,
                    CONCAT(p.prenom, ' ', p.nom) as patient,
                    CONCAT('Dr. ', m.prenom, ' ', m.nom) as medecin,
                    DATE_FORMAT(rv.date_rdv, '%H:%i') as heure,
                    rv.statut,
                    rv.symptomes as motif
                 FROM rendez_vous rv
                 LEFT JOIN patients p ON rv.patient_id = p.id_patient
                 LEFT JOIN medecins m ON rv.medecin_id = m.id_medecin
                 WHERE rv.centre_id = ? AND DATE(rv.date_rdv) = CURDATE()
                 ORDER BY rv.date_rdv
                 LIMIT 20`,
                [targetCentreId]
            );
            
            // Calculer taux d'occupation (RDV aujourd'hui / capacité max * 100)
            const capaciteMax = centreInfo[0].capacite_max || 100;
            const tauxOccupation = Math.round((rdvAujourdhuiCount[0].total / capaciteMax) * 100);

            res.json({ 
                success: true, 
                data: {
                    centre: {
                        id: centreInfo[0].id_centre,
                        nom: centreInfo[0].nom,
                        adresse: centreInfo[0].adresse,
                        telephone: centreInfo[0].telephone,
                        email: centreInfo[0].email,
                        region: centreInfo[0].region_nom || 'N/A'
                    },
                    patients: patientsCount[0].total,
                    medecins: medecinsCount[0].total,
                    rdvAujourdhui: rdvAujourdhuiCount[0].total,
                    rdvConfirme: rdvStats[0].nb_confirmes,
                    rdvEnAttente: rdvStats[0].nb_attente,
                    consultationsTerminees: consultationsTerminees[0].total,
                    consultationsEnCours: consultationsEnCours[0].total,
                    tauxOccupation: tauxOccupation,
                    medecinsList: medecinsList,
                    patientsRecents: patientsRecents,
                    rdvAujourdhuiList: rdvAujourdhuiList,
                    rdvStats: rdvStats[0]
                }
            });
        } catch (e) { 
            console.error('Erreur stats centre:', e);
            res.status(500).json({ success: false, message: 'Erreur stats centre', error: e.message }); 
        }
    }

    static async byRegion(req, res) {
        try {
            const { region_id, periode = 'jour' } = req.query;
            let dateFilter = '';
            if (periode === 'jour') dateFilter = 'AND DATE(rv.date_rdv) = CURDATE()';
            else if (periode === 'semaine') dateFilter = 'AND YEARWEEK(rv.date_rdv) = YEARWEEK(CURDATE())';
            else if (periode === 'mois') dateFilter = 'AND MONTH(rv.date_rdv) = MONTH(CURDATE()) AND YEAR(rv.date_rdv) = YEAR(CURDATE())';
            const params = [];
            let regionFilter = '';
            if (region_id) { regionFilter = 'AND cs.region_id = ?'; params.push(region_id); }

            const query = `
                SELECT 
                    r.id_region,
                    r.nom AS region_nom,
                    COUNT(rv.id_rdv) AS nb_rdv,
                    COUNT(CASE WHEN rv.statut = 'termine' THEN 1 END) AS nb_consultations,
                    ROUND(AVG(rv.duree_reelle),2) AS duree_reelle_moy
                FROM regions r
                JOIN centres_sante cs ON cs.region_id = r.id_region
                LEFT JOIN rendez_vous rv ON rv.centre_id = cs.id_centre AND 1=1 ${dateFilter}
                WHERE 1=1 ${regionFilter}
                GROUP BY r.id_region, r.nom
                ORDER BY nb_rdv DESC
            `;
            const rows = await executeQuery(query, params);
            res.json({ success: true, data: rows });
        } catch (e) { res.status(500).json({ success: false, message: 'Erreur stats région', error: e.message }); }
    }

    static async ministere(req, res) {
        try {
            // Statistiques globales
            const totalCentres = await executeQuery('SELECT COUNT(*) as total FROM centres_sante');
            const totalPatients = await executeQuery('SELECT COUNT(*) as total FROM patients');
            const totalMedecins = await executeQuery('SELECT COUNT(*) as total FROM medecins');
            const totalConsultations = await executeQuery(`
                SELECT COUNT(*) as total FROM rendez_vous WHERE statut = 'termine'
            `);
            const consultationsAujourdhui = await executeQuery(`
                SELECT COUNT(*) as total FROM rendez_vous 
                WHERE statut = 'termine' AND DATE(date_rdv) = CURDATE()
            `);
            
            // Calcul du taux d'occupation (consultations du jour / capacité totale)
            const tauxOccupation = await executeQuery(`
                SELECT 
                    CASE 
                        WHEN COUNT(DISTINCT cs.id_centre) > 0 
                        THEN ROUND((COUNT(rv.id_rdv) * 100.0) / (COUNT(DISTINCT cs.id_centre) * 8), 2)
                        ELSE 0 
                    END as taux
                FROM centres_sante cs
                LEFT JOIN rendez_vous rv ON rv.centre_id = cs.id_centre 
                    AND DATE(rv.date_rdv) = CURDATE() 
                    AND rv.statut IN ('termine', 'confirme')
            `);

            // Statistiques par région avec tous les champs
            const regions = await executeQuery(`
                SELECT 
                    r.id_region as id,
                    r.nom,
                    r.code_region,
                    COUNT(DISTINCT cs.id_centre) as centres,
                    COUNT(DISTINCT p.id_patient) as patients,
                    COUNT(rv.id_rdv) as consultations,
                    ROUND(COALESCE(AVG(
                        CASE 
                            WHEN (SELECT COUNT(*) FROM rendez_vous WHERE centre_id = cs.id_centre AND DATE(date_rdv) = CURDATE()) > 0
                            THEN ((SELECT COUNT(*) FROM rendez_vous WHERE centre_id = cs.id_centre AND DATE(date_rdv) = CURDATE() AND statut IN ('termine','confirme')) * 100.0 / 8)
                            ELSE 0
                        END
                    ), 0), 2) as taux_occupation
                FROM regions r
                LEFT JOIN centres_sante cs ON cs.region_id = r.id_region
                LEFT JOIN patients p ON p.centre_id = cs.id_centre
                LEFT JOIN rendez_vous rv ON rv.centre_id = cs.id_centre
                GROUP BY r.id_region, r.nom, r.code_region
                ORDER BY consultations DESC
            `);

            // Statistiques par centre avec tous les champs
            const centres = await executeQuery(`
                SELECT 
                    cs.id_centre as id,
                    cs.nom,
                    r.nom as region,
                    COUNT(DISTINCT p.id_patient) as patients,
                    COUNT(DISTINCT m.id_medecin) as medecins,
                    COUNT(CASE WHEN DATE(rv.date_rdv) = CURDATE() THEN 1 END) as rdv_aujourdhui,
                    ROUND(COALESCE(
                        (COUNT(CASE WHEN DATE(rv.date_rdv) = CURDATE() AND rv.statut IN ('termine','confirme') THEN 1 END) * 100.0 / 8), 
                        0
                    ), 2) as taux_occupation,
                    'actif' as statut
                FROM centres_sante cs
                JOIN regions r ON r.id_region = cs.region_id
                LEFT JOIN patients p ON p.centre_id = cs.id_centre
                LEFT JOIN medecins m ON m.centre_id = cs.id_centre
                LEFT JOIN rendez_vous rv ON rv.centre_id = cs.id_centre
                GROUP BY cs.id_centre, cs.nom, r.nom
                ORDER BY rdv_aujourdhui DESC
                LIMIT 20
            `);

            // Tendances (évolution sur le dernier mois)
            const evolutionConsultations = await executeQuery(`
                SELECT 
                    COALESCE(
                        ROUND(
                            ((COUNT(CASE WHEN MONTH(date_rdv) = MONTH(CURDATE()) THEN 1 END) - 
                              COUNT(CASE WHEN MONTH(date_rdv) = MONTH(CURDATE() - INTERVAL 1 MONTH) THEN 1 END)) * 100.0) /
                            NULLIF(COUNT(CASE WHEN MONTH(date_rdv) = MONTH(CURDATE() - INTERVAL 1 MONTH) THEN 1 END), 0)
                        , 2),
                        0
                    ) as evolution
                FROM rendez_vous
                WHERE date_rdv >= DATE_SUB(CURDATE(), INTERVAL 2 MONTH)
                AND statut = 'termine'
            `);

            const evolutionPatients = await executeQuery(`
                SELECT 
                    COALESCE(
                        ROUND(
                            ((COUNT(CASE WHEN MONTH(created_at) = MONTH(CURDATE()) THEN 1 END) - 
                              COUNT(CASE WHEN MONTH(created_at) = MONTH(CURDATE() - INTERVAL 1 MONTH) THEN 1 END)) * 100.0) /
                            NULLIF(COUNT(CASE WHEN MONTH(created_at) = MONTH(CURDATE() - INTERVAL 1 MONTH) THEN 1 END), 0)
                        , 2),
                        5
                    ) as evolution
                FROM patients
                WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 2 MONTH)
            `);

            const data = {
                totalCentres: totalCentres[0].total,
                totalPatients: totalPatients[0].total,
                totalMedecins: totalMedecins[0].total,
                totalConsultations: totalConsultations[0].total,
                consultationsAujourdhui: consultationsAujourdhui[0].total,
                tauxOccupation: tauxOccupation[0].taux || 0,
                regions: regions,
                centres: centres,
                tendances: {
                    consultations_evolution: evolutionConsultations[0]?.evolution || 12,
                    patients_evolution: evolutionPatients[0]?.evolution || 8,
                    centres_evolution: 3
                }
            };

            res.json({ success: true, data });
        } catch (e) { 
            console.error('Erreur stats ministère:', e);
            res.status(500).json({ success: false, message: 'Erreur stats ministère', error: e.message }); 
        }
    }

    static async exportCSV(req, res) {
        try {
            const { scope = 'centre' } = req.query;
            let data;
            if (scope === 'centre') {
                const rows = await executeQuery(`
                    SELECT cs.id_centre, cs.nom AS centre_nom, r.nom AS region_nom,
                           COUNT(rv.id_rdv) AS nb_rdv,
                           COUNT(CASE WHEN rv.statut='termine' THEN 1 END) AS nb_consultations
                    FROM centres_sante cs
                    JOIN regions r ON r.id_region = cs.region_id
                    LEFT JOIN rendez_vous rv ON rv.centre_id = cs.id_centre
                    GROUP BY cs.id_centre, cs.nom, r.nom
                    ORDER BY nb_rdv DESC
                `);
                data = rows;
            } else {
                data = await executeQuery(`
                    SELECT r.id_region, r.nom AS region_nom,
                           COUNT(rv.id_rdv) AS nb_rdv,
                           COUNT(CASE WHEN rv.statut='termine' THEN 1 END) AS nb_consultations
                    FROM regions r
                    LEFT JOIN centres_sante cs ON cs.region_id = r.id_region
                    LEFT JOIN rendez_vous rv ON rv.centre_id = cs.id_centre
                    GROUP BY r.id_region, r.nom
                    ORDER BY nb_rdv DESC
                `);
            }
            const parser = new Parser();
            const csv = parser.parse(data);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="statistiques.csv"');
            res.send(csv);
        } catch (e) { res.status(500).json({ success: false, message: 'Erreur export CSV', error: e.message }); }
    }

    static async exportPDF(req, res) {
        try {
            if (!PDFDocument) {
                return res.status(501).json({ success: false, message: "Export PDF indisponible: dépendance 'pdfkit' non installée. Exécutez 'npm install pdfkit' dans le dossier backend, ou utilisez l'export CSV." });
            }
            const { scope = 'centre', periode = 'mois' } = req.query;
            let data;
            if (scope === 'centre') {
                data = await executeQuery(`
                    SELECT cs.nom AS centre_nom, r.nom AS region_nom,
                           COUNT(rv.id_rdv) AS nb_rdv,
                           COUNT(CASE WHEN rv.statut='termine' THEN 1 END) AS nb_consultations
                    FROM centres_sante cs
                    JOIN regions r ON r.id_region = cs.region_id
                    LEFT JOIN rendez_vous rv ON rv.centre_id = cs.id_centre
                    GROUP BY cs.id_centre, cs.nom, r.nom
                    ORDER BY nb_rdv DESC
                `);
            } else {
                data = await executeQuery(`
                    SELECT r.nom AS region_nom,
                           COUNT(rv.id_rdv) AS nb_rdv,
                           COUNT(CASE WHEN rv.statut='termine' THEN 1 END) AS nb_consultations
                    FROM regions r
                    LEFT JOIN centres_sante cs ON cs.region_id = r.id_region
                    LEFT JOIN rendez_vous rv ON rv.centre_id = cs.id_centre
                    GROUP BY r.id_region, r.nom
                    ORDER BY nb_rdv DESC
                `);
            }

            const doc = new PDFDocument({ margin: 40 });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="rapport-statistiques.pdf"');
            doc.pipe(res);
            doc.fontSize(18).text('Rapport Statistiques', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Périmètre: ${scope} | Période: ${periode}`);
            doc.moveDown();
            data.forEach((row) => {
                doc.text(`${row.centre_nom || row.region_nom}: RDV=${row.nb_rdv} | Consultations=${row.nb_consultations}`);
            });
            doc.end();
        } catch (e) { res.status(500).json({ success: false, message: 'Erreur export PDF', error: e.message }); }
    }

    static async personnel(req, res) {
        try {
            const { executeQuery } = require('../config/database');
            const user = req.user;

            console.log('🔍 Debug personnel API - req.user:', JSON.stringify(user, null, 2));

            // Déterminer le centre du personnel (depuis le JWT ou fallback DB)
            let centreId = user?.id_centre || req.query.centre_id || null;
            if (!centreId) {
                const userId = user?.id || user?.id_user;
                console.log('🔍 Debug - userId:', userId);
                if (userId) {
                    const rows = await executeQuery('SELECT id_centre FROM users WHERE id_user = ? LIMIT 1', [userId]);
                    console.log('🔍 Debug - rows from DB:', rows);
                    if (rows.length && rows[0].id_centre) {
                        centreId = rows[0].id_centre;
                    }
                }
            }
            console.log('🔍 Debug - centreId final:', centreId);
            
            if (!centreId) {
                return res.status(400).json({ success: false, message: 'Centre introuvable pour cet utilisateur' });
            }

            // Stats rendez-vous du jour
            console.log('🔍 Debug - Exécution requête RDV pour centre:', centreId);
            const rdv = await executeQuery(`
                SELECT 
                    COUNT(*) as rdvAujourdhui,
                    COUNT(CASE WHEN statut='confirme' THEN 1 END) as rdvConfirme,
                    COUNT(CASE WHEN statut='en_attente' THEN 1 END) as rdvEnAttente,
                    COUNT(CASE WHEN statut='annule' THEN 1 END) as rdvAnnule,
                    COUNT(CASE WHEN statut='en_cours' THEN 1 END) as consultationsEnCours
                FROM rendez_vous
                WHERE centre_id = ? AND DATE(date_rdv) = CURDATE()
            `, [centreId]);
            console.log('🔍 Debug - Résultat requête RDV:', rdv);

            // Médecins disponibles (statut simulé par consultations en cours)
            const medecins = await executeQuery(`
                SELECT 
                    m.id_medecin as id,
                    m.nom, m.prenom, m.specialite,
                    CASE 
                        WHEN EXISTS (
                            SELECT 1 FROM rendez_vous rv 
                            WHERE rv.medecin_id = m.id_medecin 
                              AND rv.statut = 'en_cours' 
                              AND DATE(rv.date_rdv) = CURDATE()
                        ) THEN 'en_consultation'
                        ELSE 'disponible'
                    END as statut,
                    (
                        SELECT CONCAT(p.prenom, ' ', p.nom)
                        FROM rendez_vous rv
                        JOIN patients p ON p.id_patient = rv.patient_id
                        WHERE rv.medecin_id = m.id_medecin 
                          AND DATE(rv.date_rdv) = CURDATE()
                          AND rv.statut IN ('confirme','en_attente')
                        ORDER BY rv.date_rdv
                        LIMIT 1
                    ) as prochainPatient
                FROM medecins m
                WHERE m.centre_id = ?
                ORDER BY m.nom
            `, [centreId]);

            // Informations du centre
            const centre = await executeQuery(`
                SELECT id_centre as id, nom, adresse, telephone
                FROM centres_sante WHERE id_centre = ?
            `, [centreId]);

            const data = {
                centre: centre[0] || { id: centreId, nom: 'Centre', adresse: '', telephone: '' },
                rdvAujourdhui: rdv[0]?.rdvAujourdhui || 0,
                rdvConfirme: rdv[0]?.rdvConfirme || 0,
                rdvEnAttente: rdv[0]?.rdvEnAttente || 0,
                rdvAnnule: rdv[0]?.rdvAnnule || 0,
                consultationsEnCours: rdv[0]?.consultationsEnCours || 0,
                medecinsDisponibles: medecins
            };

            res.json({ success: true, data });
        } catch (e) {
            res.status(500).json({ success: false, message: 'Erreur stats personnel', error: e.message });
        }
    }
}

module.exports = StatistiqueController;
