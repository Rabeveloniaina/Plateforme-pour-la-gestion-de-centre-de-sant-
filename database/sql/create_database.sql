-- Script de création de la base de données pour la Plateforme de Gestion des Centres de Santé
-- À exécuter dans phpMyAdmin après avoir créé la base 'sante_db'

USE sante_db;

-- Création des tables dans l'ordre pour respecter les contraintes de clés étrangères
-- Les scripts individuels sont dans le dossier 'parts/'

-- Exécuter les scripts dans cet ordre :
-- 1. 001_regions.sql
-- 2. 002_centres.sql  
-- 3. 003_utilisateurs.sql
-- 4. 004_patients.sql
-- 5. 005_medecins.sql
-- 6. 006_fiches_medicales.sql
-- 7. 007_rendez_vous.sql
-- 8. 008_statistiques.sql
-- 9. 009_notifications.sql
-- 10. 010_donnees_test.sql

SELECT 'Base de données créée avec succès!' as message;
