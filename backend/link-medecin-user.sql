-- Script pour lier l'utilisateur medecin1 (id_user=12) à un médecin dans la table medecins

-- 1. Vérifier quel médecin existe
SELECT 'Médecins existants:' as info;
SELECT id_medecin, nom, prenom, user_id FROM medecins LIMIT 5;

-- 2. Vérifier l'utilisateur medecin1
SELECT 'Utilisateur medecin1:' as info;
SELECT id_user, nom_utilisateur, role FROM utilisateurs WHERE nom_utilisateur = 'medecin1';

-- 3. OPTION A: Si un médecin existe SANS user_id, le lier à medecin1
-- (Décommente et ajuste l'id_medecin si nécessaire)
-- UPDATE medecins SET user_id = 12 WHERE id_medecin = 1;

-- 4. OPTION B: Si aucun médecin n'existe, en créer un
-- (Décommente si nécessaire)
/*
INSERT INTO medecins (nom, prenom, sexe, date_naissance, specialite, telephone, email, centre_id, user_id, statut)
VALUES 
('Rakoto', 'Jean', 'M', '1985-05-15', 'Médecine générale', '0340001234', 'medecin1@sante.sn', 1, 12, 'actif');
*/

-- 5. Vérifier le résultat
SELECT 'Lien user -> medecin:' as info;
SELECT m.id_medecin, m.nom, m.prenom, m.user_id, u.nom_utilisateur 
FROM medecins m 
LEFT JOIN utilisateurs u ON u.id_user = m.user_id 
WHERE m.user_id = 12 OR u.nom_utilisateur = 'medecin1';

