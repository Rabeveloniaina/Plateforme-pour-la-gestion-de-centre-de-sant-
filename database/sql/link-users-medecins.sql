-- ============================================
-- Script de migration : Lier les utilisateurs médecins aux enregistrements médecins
-- ============================================

-- 1. Afficher l'état actuel
SELECT '=== ÉTAT ACTUEL DES UTILISATEURS MÉDECINS ===' as '';
SELECT 
    u.id_user,
    u.nom_utilisateur,
    u.email,
    m.id_medecin,
    m.nom,
    m.prenom
FROM utilisateurs u
LEFT JOIN medecins m ON m.user_id = u.id_user
WHERE u.role = 'medecin';

-- 2. Lier automatiquement par email (si les emails correspondent)
UPDATE medecins m
JOIN utilisateurs u ON u.email = m.email
SET m.user_id = u.id_user
WHERE u.role = 'medecin' 
  AND m.user_id IS NULL;

-- 3. Vérifier les utilisateurs médecins NON liés après la liaison par email
SELECT '=== UTILISATEURS MÉDECINS NON LIÉS ===' as '';
SELECT 
    u.id_user,
    u.nom_utilisateur,
    u.email,
    'Aucun médecin lié' as statut
FROM utilisateurs u
LEFT JOIN medecins m ON m.user_id = u.id_user
WHERE u.role = 'medecin' 
  AND m.id_medecin IS NULL;

-- 4. Afficher le résultat final
SELECT '=== RÉSULTAT FINAL ===' as '';
SELECT 
    u.id_user,
    u.nom_utilisateur,
    u.email,
    m.id_medecin,
    m.nom,
    m.prenom,
    m.specialite
FROM utilisateurs u
JOIN medecins m ON m.user_id = u.id_user
WHERE u.role = 'medecin';

