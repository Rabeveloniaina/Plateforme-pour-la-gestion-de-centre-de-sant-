# Guide d'Installation de la Base de Données

## 🚀 Démarrage Rapide

### 1. Prérequis
- XAMPP installé et démarré
- MySQL démarré dans XAMPP
- phpMyAdmin accessible via http://localhost/phpmyadmin

### 2. Création de la Base de Données
1. Ouvrir phpMyAdmin
2. Cliquer sur "Nouvelle base de données"
3. Nom : `sante_db`
4. Interclassement : `utf8mb4_unicode_ci`
5. Cliquer sur "Créer"

### 3. Exécution des Scripts SQL

**IMPORTANT : Exécuter les scripts dans l'ordre exact !**

#### Étape 1 : Régions
```sql
-- Copier et exécuter le contenu de 001_regions.sql
```

#### Étape 2 : Centres de Santé
```sql
-- Copier et exécuter le contenu de 002_centres.sql
```

#### Étape 3 : Utilisateurs
```sql
-- Copier et exécuter le contenu de 003_utilisateurs.sql
```

#### Étape 4 : Patients
```sql
-- Copier et exécuter le contenu de 004_patients.sql
```

#### Étape 5 : Médecins
```sql
-- Copier et exécuter le contenu de 005_medecins.sql
```

#### Étape 6 : Fiches Médicales
```sql
-- Copier et exécuter le contenu de 006_fiches_medicales.sql
```

#### Étape 7 : Rendez-vous
```sql
-- Copier et exécuter le contenu de 007_rendez_vous.sql
```

#### Étape 8 : Statistiques
```sql
-- Copier et exécuter le contenu de 008_statistiques.sql
```

#### Étape 9 : Notifications
```sql
-- Copier et exécuter le contenu de 009_notifications.sql
```

#### Étape 10 : Données de Test
```sql
-- Copier et exécuter le contenu de 010_donnees_test.sql
```

### 4. Vérification
```sql
-- Copier et exécuter le contenu de verification.sql
```

## 📊 Structure de la Base de Données

### Tables Principales
- **regions** : Régions géographiques
- **centres_sante** : Centres de santé par région
- **utilisateurs** : Comptes utilisateurs (patients, médecins, admin)
- **patients** : Informations des patients
- **medecins** : Informations des médecins
- **fiches_medicales** : Dossiers médicaux des patients
- **rendez_vous** : Gestion des consultations
- **statistiques** : Données statistiques par centre/région
- **notifications** : Système de notifications

### Relations Clés
- 1 Région → N Centres de santé
- 1 Centre → N Patients, N Médecins, N Rendez-vous
- 1 Patient → 1 Fiche médicale, N Rendez-vous
- 1 Médecin → N Rendez-vous

## 🔧 Configuration Backend

### Variables d'Environnement
Créer un fichier `.env` dans le dossier `backend/` :

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=sante_db
DB_PORT=3306
JWT_SECRET=votre_secret_jwt_ici
PORT=3000
```

## ✅ Vérification de l'Installation

### Test de Connexion
1. Démarrer le serveur backend : `npm run dev`
2. Vérifier que la connexion à la base de données fonctionne
3. Tester les endpoints API de base

### Données de Test
- **Admin** : `admin` / `admin123`
- **Patients** : `fatou.diop`, `mamadou.sall`, etc.
- **Médecins** : `dr.diallo`, `dr.sow`, etc.

## 🚨 Dépannage

### Erreurs Courantes
1. **Erreur de connexion MySQL** : Vérifier que XAMPP est démarré
2. **Erreur de clé étrangère** : Vérifier l'ordre d'exécution des scripts
3. **Erreur de caractères** : Vérifier l'interclassement UTF8MB4

### Logs
- Vérifier les logs MySQL dans XAMPP
- Vérifier les logs du serveur backend

## 📝 Notes Importantes

- Toujours exécuter les scripts dans l'ordre
- Sauvegarder la base avant modifications
- Tester chaque étape avant de passer à la suivante
- Utiliser des mots de passe sécurisés en production
