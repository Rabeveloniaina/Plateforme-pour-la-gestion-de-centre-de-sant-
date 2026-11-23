-- Script de vérification de la base de données
-- Exécuter après tous les autres scripts pour vérifier l'installation

USE sante_db;

-- Vérification des tables créées
SELECT 
    TABLE_NAME as 'Table',
    TABLE_ROWS as 'Lignes',
    ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) AS 'Taille (MB)'
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'sante_db'
ORDER BY TABLE_NAME;

-- Vérification des relations entre tables
SELECT 
    CONSTRAINT_NAME as 'Contrainte',
    TABLE_NAME as 'Table',
    COLUMN_NAME as 'Colonne',
    REFERENCED_TABLE_NAME as 'Table Référencée',
    REFERENCED_COLUMN_NAME as 'Colonne Référencée'
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = 'sante_db' 
AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, CONSTRAINT_NAME;

-- Vérification des données insérées
SELECT 'Régions' as Table, COUNT(*) as Total FROM regions
UNION ALL
SELECT 'Centres de santé', COUNT(*) FROM centres_sante
UNION ALL
SELECT 'Utilisateurs', COUNT(*) FROM utilisateurs
UNION ALL
SELECT 'Patients', COUNT(*) FROM patients
UNION ALL
SELECT 'Médecins', COUNT(*) FROM medecins
UNION ALL
SELECT 'Fiches médicales', COUNT(*) FROM fiches_medicales
UNION ALL
SELECT 'Rendez-vous', COUNT(*) FROM rendez_vous
UNION ALL
SELECT 'Statistiques', COUNT(*) FROM statistiques
UNION ALL
SELECT 'Notifications', COUNT(*) FROM notifications;

-- Test des requêtes de base
SELECT 'Test 1: Patients par centre' as Test;
SELECT 
    cs.nom as 'Centre',
    COUNT(p.id_patient) as 'Nombre de patients'
FROM centres_sante cs
LEFT JOIN patients p ON cs.id_centre = p.centre_id
GROUP BY cs.id_centre, cs.nom
ORDER BY cs.nom;

SELECT 'Test 2: Médecins par spécialité' as Test;
SELECT 
    specialite,
    COUNT(*) as 'Nombre de médecins'
FROM medecins
GROUP BY specialite
ORDER BY specialite;

SELECT 'Test 3: Rendez-vous du jour' as Test;
SELECT 
    p.nom as 'Patient',
    p.prenom as 'Prénom',
    m.nom as 'Médecin',
    m.specialite as 'Spécialité',
    rv.date_rdv as 'Date RDV',
    rv.statut as 'Statut'
FROM rendez_vous rv
JOIN patients p ON rv.patient_id = p.id_patient
JOIN medecins m ON rv.medecin_id = m.id_medecin
WHERE DATE(rv.date_rdv) = CURDATE()
ORDER BY rv.date_rdv;

SELECT 'Vérification terminée avec succès!' as message;
