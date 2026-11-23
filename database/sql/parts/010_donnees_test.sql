-- Script de données de test supplémentaires
-- Exécuter en dernier pour tester le système

-- Mise à jour des utilisateurs pour lier aux patients et médecins
UPDATE utilisateurs SET email = 'admin@sante.sn' WHERE nom_utilisateur = 'admin';

-- Création d'utilisateurs pour les patients
INSERT INTO utilisateurs (nom_utilisateur, mot_de_passe, email, role) VALUES
('fatou.diop', '$2b$10$rQZ8K9vX3mN2pL1qR4sT5uV6wX7yZ8aB9cC0dE1fG2hI3jJ4kL5mN6oP7', 'fatou.diop@email.com', 'patient'),
('mamadou.sall', '$2b$10$rQZ8K9vX3mN2pL1qR4sT5uV6wX7yZ8aB9cC0dE1fG2hI3jJ4kL5mN6oP7', 'mamadou.sall@email.com', 'patient'),
('aissatou.ndiaye', '$2b$10$rQZ8K9vX3mN2pL1qR4sT5uV6wX7yZ8aB9cC0dE1fG2hI3jJ4kL5mN6oP7', 'aissatou.ndiaye@email.com', 'patient'),
('ousmane.ba', '$2b$10$rQZ8K9vX3mN2pL1qR4sT5uV6wX7yZ8aB9cC0dE1fG2hI3jJ4kL5mN6oP7', 'ousmane.ba@email.com', 'patient');

-- Création d'utilisateurs pour les médecins
INSERT INTO utilisateurs (nom_utilisateur, mot_de_passe, email, role) VALUES
('dr.diallo', '$2b$10$rQZ8K9vX3mN2pL1qR4sT5uV6wX7yZ8aB9cC0dE1fG2hI3jJ4kL5mN6oP7', 'dr.diallo@sante.sn', 'medecin'),
('dr.sow', '$2b$10$rQZ8K9vX3mN2pL1qR4sT5uV6wX7yZ8aB9cC0dE1fG2hI3jJ4kL5mN6oP7', 'dr.sow@sante.sn', 'medecin'),
('dr.cisse', '$2b$10$rQZ8K9vX3mN2pL1qR4sT5uV6wX7yZ8aB9cC0dE1fG2hI3jJ4kL5mN6oP7', 'dr.cisse@sante.sn', 'medecin'),
('dr.thiam', '$2b$10$rQZ8K9vX3mN2pL1qR4sT5uV6wX7yZ8aB9cC0dE1fG2hI3jJ4kL5mN6oP7', 'dr.thiam@sante.sn', 'medecin');

-- Liaison des utilisateurs aux patients
UPDATE patients SET user_id = (SELECT id_user FROM utilisateurs WHERE nom_utilisateur = 'fatou.diop') WHERE id_patient = 1;
UPDATE patients SET user_id = (SELECT id_user FROM utilisateurs WHERE nom_utilisateur = 'mamadou.sall') WHERE id_patient = 2;
UPDATE patients SET user_id = (SELECT id_user FROM utilisateurs WHERE nom_utilisateur = 'aissatou.ndiaye') WHERE id_patient = 3;
UPDATE patients SET user_id = (SELECT id_user FROM utilisateurs WHERE nom_utilisateur = 'ousmane.ba') WHERE id_patient = 4;

-- Liaison des utilisateurs aux médecins
UPDATE medecins SET user_id = (SELECT id_user FROM utilisateurs WHERE nom_utilisateur = 'dr.diallo') WHERE id_medecin = 1;
UPDATE medecins SET user_id = (SELECT id_user FROM utilisateurs WHERE nom_utilisateur = 'dr.sow') WHERE id_medecin = 2;
UPDATE medecins SET user_id = (SELECT id_user FROM utilisateurs WHERE nom_utilisateur = 'dr.cisse') WHERE id_medecin = 3;
UPDATE medecins SET user_id = (SELECT id_user FROM utilisateurs WHERE nom_utilisateur = 'dr.thiam') WHERE id_medecin = 4;

-- Ajout de quelques rendez-vous supplémentaires
INSERT INTO rendez_vous (patient_id, medecin_id, centre_id, date_rdv, statut, symptomes, duree_estimee) VALUES
(1, 2, 1, '2024-01-16 10:00:00', 'attente', '{"symptomes": ["fatigue"], "intensite": "legere"}', 25),
(2, 1, 1, '2024-01-16 14:30:00', 'attente', '{"symptomes": ["douleur articulaire"], "intensite": "moderee"}', 40),
(3, 2, 3, '2024-01-17 09:00:00', 'attente', '{"symptomes": ["nausées"], "intensite": "legere"}', 30);

SELECT 'Données de test ajoutées avec succès!' as message;
SELECT 'Base de données complète et prête pour les tests!' as message;
