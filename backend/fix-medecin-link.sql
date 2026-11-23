-- ============================================
-- Script pour diagnostiquer et corriger le lien user_id -> medecin_id
-- À exécuter dans phpMyAdmin
-- ============================================

-- 1. Vérifier l'utilisateur medecin1
SELECT '=== UTILISATEUR medecin1 ===' as '';
SELECT id_user, nom_utilisateur, role, email 
FROM utilisateurs 
WHERE nom_utilisateur = 'medecin1';

-- 2. Vérifier les médecins liés à des utilisateurs
SELECT '=== MÉDECINS LIÉS À DES UTILISATEURS ===' as '';
SELECT m.id_medecin, m.nom, m.prenom, m.user_id, u.nom_utilisateur, m.specialite
FROM medecins m
LEFT JOIN utilisateurs u ON u.id_user = m.user_id
LIMIT 10;

-- 3. Chercher si user_id=12 est lié à un médecin
SELECT '=== LIEN POUR USER_ID=12 ===' as '';
SELECT m.id_medecin, m.nom, m.prenom, m.user_id
FROM medecins m
WHERE m.user_id = 12;

-- 4. SI AUCUN RÉSULTAT CI-DESSUS, exécuter la correction :
-- (Décommentez UNIQUEMENT si nécessaire)

/*
-- Option A: Lier un médecin existant sans user_id
UPDATE medecins 
SET user_id = 12 
WHERE id_medecin = (SELECT id FROM (SELECT id_medecin as id FROM medecins WHERE user_id IS NULL LIMIT 1) as tmp);
*/

/*
-- Option B: Créer un nouveau médecin
INSERT INTO medecins (nom, prenom, sexe, date_naissance, specialite, telephone, email, centre_id, user_id, statut)
VALUES ('Rakoto', 'Jean', 'M', '1985-05-15', 'Médecine générale', '0340001234', 'medecin1@sante.sn', 1, 12, 'actif');
*/

-- 5. Vérifier le résultat final
SELECT '=== VÉRIFICATION FINALE ===' as '';
SELECT 
    u.id_user,
    u.nom_utilisateur,
    m.id_medecin,
    m.nom,
    m.prenom
FROM utilisateurs u
LEFT JOIN medecins m ON m.user_id = u.id_user
WHERE u.nom_utilisateur = 'medecin1';

