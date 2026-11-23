# 📂 STRUCTURE DU PROJET - Plateforme de Gestion des Centres de Santé

**Date :** 7 novembre 2025

---

## 🗂️ Vue d'Ensemble

```
NINSANP/
├── backend/           # API Node.js/Express (Backend)
├── frontend/          # Application React/TypeScript (Frontend)
├── database/          # Scripts SQL et migrations
├── docs/              # Documentation du projet
├── node_modules/      # Dépendances racine
├── README.md          # Guide principal
├── ETAT_PROJET.md     # État actuel du projet ⭐
├── GUIDE_RAPIDE.md    # Guide de démarrage rapide
├── COMPTES_TEST.md    # Comptes de test
└── start-system.*     # Scripts de démarrage
```

---

## 🔧 Backend (`backend/`)

```
backend/
├── src/
│   ├── config/                    # Configuration
│   │   ├── database.js           # Connexion MySQL
│   │   ├── db.js                 # Pool de connexions
│   │   ├── default.js            # Config par défaut
│   │   ├── env.js                # Variables d'environnement
│   │   ├── swagger.js            # Configuration Swagger
│   │   └── upload.js             # Configuration upload fichiers
│   │
│   ├── controllers/               # Contrôleurs API (16 fichiers)
│   │   ├── authController.js                 # Authentification
│   │   ├── patientController.js              # Patients CRUD
│   │   ├── medecinController.js              # Médecins CRUD
│   │   ├── medecinWorkflowController.js      # Workflow médecin ⭐
│   │   ├── rendezVousController.js           # Rendez-vous ⭐
│   │   ├── centreController.js               # Centres de santé
│   │   ├── statistiqueController.js          # Statistiques
│   │   ├── notificationController.js         # Notifications
│   │   ├── ficheMedicaleController.js        # Fiches médicales
│   │   ├── medicamentController.js           # Médicaments
│   │   ├── prescriptionController.js         # Prescriptions
│   │   ├── vaccinationController.js          # Vaccinations
│   │   ├── documentMedicalController.js      # Documents
│   │   ├── userController.js                 # Utilisateurs
│   │   ├── registrationController.js         # Inscription
│   │   └── approvalController.js             # Approbations
│   │
│   ├── middlewares/               # Middlewares
│   │   ├── auth.js               # Authentification JWT
│   │   ├── centreSecurity.js     # Sécurité centres
│   │   ├── errorHandler.js       # Gestion d'erreurs
│   │   └── validate.js           # Validation des données
│   │
│   ├── models/                    # Modèles de données (11 fichiers)
│   │   ├── Patient.js            # Modèle Patient
│   │   ├── Medecin.js            # Modèle Médecin ⭐
│   │   ├── RendezVous.js         # Modèle Rendez-vous ⭐
│   │   ├── Centre.js             # Modèle Centre
│   │   ├── User.js               # Modèle Utilisateur
│   │   ├── FicheMedicale.js      # Modèle Fiche médicale
│   │   ├── Medicament.js         # Modèle Médicament
│   │   ├── Prescription.js       # Modèle Prescription
│   │   ├── Vaccination.js        # Modèle Vaccination
│   │   ├── DocumentMedical.js    # Modèle Document
│   │   ├── Notification.js       # Modèle Notification
│   │   └── ApprovalRequest.js    # Modèle Approbation
│   │
│   ├── routes/                    # Routes API (20 fichiers)
│   │   ├── index.js              # Routes principales
│   │   ├── auth.js               # Routes authentification
│   │   ├── patients.js           # Routes patients
│   │   ├── medecins.js           # Routes médecins
│   │   ├── medecinWorkflow.js    # Routes workflow médecin ⭐
│   │   ├── rendezVous.js         # Routes rendez-vous ⭐
│   │   ├── centres.js            # Routes centres
│   │   ├── statistiques.js       # Routes statistiques
│   │   ├── notifications.js      # Routes notifications
│   │   ├── fichesMedicales.js    # Routes fiches médicales
│   │   ├── medicaments.js        # Routes médicaments
│   │   ├── prescriptions.js      # Routes prescriptions
│   │   ├── vaccinations.js       # Routes vaccinations
│   │   ├── documents.js          # Routes documents
│   │   ├── regions.js            # Routes régions
│   │   ├── users.js              # Routes utilisateurs
│   │   ├── registration.js       # Routes inscription
│   │   ├── public.js             # Routes publiques
│   │   ├── auth.swagger.js       # Documentation Swagger Auth
│   │   ├── rendezVous.swagger.js # Documentation Swagger RDV
│   │   └── swagger.js            # Documentation Swagger générale
│   │
│   ├── services/                  # Services métier (6 fichiers)
│   │   ├── statutDynamiqueService.js         # Statut dynamique médecins ⭐
│   │   ├── orientationService.js             # Orientation automatique
│   │   ├── reajustementCreneauxService.js    # Réajustement créneaux ⭐
│   │   ├── notificationSchedulerService.js   # Scheduler notifications
│   │   ├── walkInService.js                  # Gestion walk-in
│   │   └── exportService.js                  # Export données
│   │
│   ├── validators/                # Validateurs (10 fichiers)
│   │   ├── patientValidators.js
│   │   ├── rdvValidators.js
│   │   ├── userValidators.js
│   │   └── ...
│   │
│   ├── scripts/                   # Scripts utilitaires (16+ scripts)
│   │   ├── test-db.js            # Test connexion DB
│   │   ├── test-api.js           # Test API
│   │   ├── backup-database.js    # Backup DB
│   │   ├── restore-database.js   # Restauration DB
│   │   └── ...
│   │
│   ├── utils/                     # Utilitaires (2 fichiers)
│   │   ├── date.js               # Manipulation dates
│   │   └── format.js             # Formatage données
│   │
│   ├── app.js                     # Configuration Express ⭐
│   └── server.js                  # Point d'entrée serveur
│
├── __tests__/                     # Tests Jest (26 fichiers)
│   ├── auth_protected.test.js
│   ├── patients.controller.test.js
│   ├── rendez-vous.controller.test.js
│   ├── workflow-complet-rdv.test.js
│   └── ...
│
├── uploads/                       # Fichiers uploadés
│   └── documents/
│
├── package.json                   # Dépendances backend
├── .env.example                   # Template configuration ⭐
├── DOCUMENTATION_API.md           # Documentation API
└── CONFIGURATION_COMPLETE.md      # Guide configuration
```

### Points Clés Backend

- **200+ endpoints API** organisés par domaine
- **Swagger UI** accessible sur `/api-docs`
- **26 fichiers de tests** Jest
- **6 services métier** pour logique complexe
- **Sécurité** : JWT, rate limiting, helmet, validation

---

## 💻 Frontend (`frontend/`)

```
frontend/
├── src/
│   ├── pages/                     # Pages React (40 pages) ⭐
│   │   ├── Login.tsx / LoginSimple.tsx           # Connexion
│   │   ├── Register.tsx                          # Inscription
│   │   │
│   │   ├── Dashboard.tsx                         # Dashboard générique
│   │   ├── AdminDashboard.tsx                    # Dashboard admin centre
│   │   ├── MedecinDashboard.tsx                  # Dashboard médecin ⭐
│   │   ├── PatientDashboard.tsx                  # Dashboard patient
│   │   ├── PersonnelDashboard.tsx                # Dashboard personnel
│   │   ├── MinistereDashboard.tsx                # Dashboard ministère
│   │   │
│   │   ├── Patients.tsx                          # Liste patients
│   │   ├── PatientDetail.tsx                     # Détails patient
│   │   ├── PatientForm.tsx / PatientFormNew.tsx  # Formulaires patient
│   │   ├── CompletePatientProfile.tsx            # Complétion profil
│   │   │
│   │   ├── RendezVous.tsx                        # Liste RDV
│   │   ├── RendezVousDetail.tsx                  # Détails RDV
│   │   ├── RendezVousForm.tsx                    # Formulaire RDV
│   │   ├── BookAppointment.tsx                   # Prise RDV
│   │   ├── BookAppointmentNew.tsx                # Prise RDV améliorée ⭐
│   │   │
│   │   ├── Medecins.tsx                          # Liste médecins
│   │   ├── MedecinDetail.tsx                     # Détails médecin
│   │   ├── MedecinForm.tsx                       # Formulaire médecin
│   │   │
│   │   ├── Centres.tsx                           # Liste centres
│   │   ├── CentreDetail.tsx                      # Détails centre
│   │   ├── CentreForm.tsx                        # Formulaire centre
│   │   │
│   │   ├── FichesMedicales.tsx                   # Fiches médicales
│   │   ├── FicheMedicaleForm.tsx                 # Formulaire fiche
│   │   ├── MedicalRecordForm.tsx                 # Saisie consultation
│   │   │
│   │   ├── Medicaments.tsx                       # Médicaments
│   │   ├── MedicamentForm.tsx                    # Formulaire médicament
│   │   ├── Prescriptions.tsx                     # Prescriptions
│   │   ├── PrescriptionForm.tsx                  # Formulaire prescription
│   │   ├── PrescriptionDetail.tsx                # Détails prescription
│   │   │
│   │   ├── Vaccinations.tsx                      # Vaccinations
│   │   ├── VaccinationForm.tsx                   # Formulaire vaccination
│   │   │
│   │   ├── Users.tsx                             # Gestion utilisateurs
│   │   ├── Configuration.tsx                     # Configuration
│   │   ├── Statistiques.tsx / Stats.tsx          # Statistiques
│   │   ├── Notifications.tsx                     # Notifications
│   │   └── App.tsx                               # App principale
│   │
│   ├── components/                # Composants réutilisables (17)
│   │   ├── Layout.tsx                            # Layout principal
│   │   ├── AuthGuard.tsx                         # Protection auth
│   │   ├── ProtectedRoute.tsx                    # Route protégée
│   │   ├── RoleProtected.tsx                     # Composant protégé par rôle
│   │   ├── RoleBasedNavigation.tsx               # Navigation par rôle
│   │   ├── DashboardRedirect.tsx                 # Redirection dashboard
│   │   ├── Calendar.tsx / CalendarEnhanced.tsx   # Calendriers
│   │   ├── Charts.tsx / StatisticsChart.tsx      # Graphiques
│   │   ├── Table.tsx                             # Table de données
│   │   ├── Card.tsx                              # Carte
│   │   ├── Modal.tsx                             # Modale
│   │   ├── Toast.tsx / Toaster.tsx               # Notifications toast
│   │   ├── Loader.tsx                            # Chargement
│   │   ├── EmptyState.tsx                        # État vide
│   │   └── RouteDebugger.tsx                     # Débug routes
│   │
│   ├── context/                   # Context API
│   │   ├── AuthContext.tsx                       # Context authentification ⭐
│   │   └── ToastContext.tsx                      # Context notifications
│   │
│   ├── hooks/                     # Hooks personnalisés (3)
│   │   ├── useErrorHandler.ts                    # Gestion erreurs
│   │   ├── useLogout.ts                          # Déconnexion
│   │   └── usePermissions.ts                     # Permissions
│   │
│   ├── lib/                       # Bibliothèques
│   │   ├── api.ts                                # Client API ⭐
│   │   └── date.ts                               # Utilitaires dates
│   │
│   ├── utils/                     # Utilitaires
│   │   ├── apiFetch.ts                           # Fetch API centralisé ⭐
│   │   └── exportUtils.ts                        # Export données
│   │
│   ├── types/                     # Types TypeScript
│   │   └── index.ts                              # Types globaux
│   │
│   ├── config/                    # Configuration
│   │   └── api.config.ts                         # Config API
│   │
│   ├── main.tsx                   # Point d'entrée React
│   ├── App.css                    # Styles globaux
│   └── index.css                  # Styles Tailwind
│
├── public/                        # Fichiers publics
├── package.json                   # Dépendances frontend
├── vite.config.ts                 # Configuration Vite
├── tsconfig.json                  # Configuration TypeScript
├── tailwind.config.js             # Configuration Tailwind
└── README.md                      # Documentation frontend
```

### Points Clés Frontend

- **40 pages React** avec TypeScript
- **17 composants réutilisables** pour DRY
- **React Router DOM 7.8** pour navigation
- **Context API** pour état global (auth, toasts)
- **TailwindCSS** pour styling moderne
- **Recharts** pour graphiques
- **Framer Motion** pour animations

---

## 🗄️ Database (`database/`)

```
database/
├── sql/
│   ├── parts/                     # Scripts SQL individuels
│   │   ├── 001_regions.sql
│   │   ├── 002_centres_sante.sql
│   │   ├── 003_utilisateurs.sql
│   │   ├── 004_patients.sql
│   │   ├── 005_medecins.sql
│   │   ├── 006_fiches_medicales.sql
│   │   ├── 007_rendez_vous.sql
│   │   ├── 008_notifications.sql
│   │   ├── 009_medicaments.sql
│   │   └── 010_donnees_test.sql
│   │
│   ├── create_database.sql        # Script création complète
│   └── verification.sql           # Script vérification
│
└── INSTALLATION.md                # Guide installation DB
```

### Tables principales (15)

1. **regions** : Régions administratives
2. **centres_sante** : Centres de santé
3. **utilisateurs** : Comptes utilisateurs (tous types)
4. **patients** : Informations patients
5. **patients_infos_medicales** : Infos médicales complémentaires
6. **medecins** : Informations médecins + horaires JSON
7. **fiches_medicales** : Dossiers médicaux
8. **rendez_vous** : Consultations avec horodatage ⭐
9. **notifications** : Notifications système
10. **medicaments** : Base de médicaments
11. **prescriptions** : Prescriptions médicales
12. **prescriptions_medicaments** : Relation N:N
13. **vaccinations** : Carnet de vaccination
14. **documents_medicaux** : Documents uploadés
15. **statistiques** : Données statistiques

---

## 📚 Documentation (`docs/`)

```
docs/
├── archives/                      # 🗄️ Anciens fichiers de documentation
│   ├── ameliorations/            # (85+ fichiers archivés)
│   ├── audits/
│   ├── corrections/
│   ├── tests/
│   ├── sessions/
│   └── migrations/
│
├── NETTOYAGE.md                   # Explication du nettoyage
└── STRUCTURE_PROJET.md            # Ce fichier
```

---

## 📄 Fichiers Racine Importants

```
NINSANP/
├── README.md                      # 📘 Guide principal ⭐
├── ETAT_PROJET.md                 # 📊 État actuel du projet ⭐
├── GUIDE_RAPIDE.md                # 🚀 Guide de démarrage rapide ⭐
├── COMPTES_TEST.md                # 🔑 Comptes de test
├── JOURNAL.md                     # 📓 Journal de développement
│
├── package.json                   # Dépendances racine
├── docker-compose.yml             # Configuration Docker
│
├── start-system.bat               # 🚀 Démarrage Windows
├── start-system.ps1               # 🚀 Démarrage PowerShell
└── start-system-complete.ps1      # 🚀 Démarrage complet
```

---

## 🎯 Fichiers Essentiels à Connaître

### Pour comprendre le projet

| Fichier | Description | Priorité |
|---------|-------------|----------|
| **`README.md`** | Guide complet d'installation | ⭐⭐⭐ |
| **`ETAT_PROJET.md`** | État actuel et fonctionnalités | ⭐⭐⭐ |
| **`GUIDE_RAPIDE.md`** | Démarrage rapide | ⭐⭐⭐ |
| `COMPTES_TEST.md` | Comptes de test | ⭐⭐ |
| `backend/.env.example` | Configuration backend | ⭐⭐ |

### Pour le développement backend

| Fichier | Description | Priorité |
|---------|-------------|----------|
| **`backend/src/app.js`** | Configuration Express | ⭐⭐⭐ |
| **`backend/src/routes/index.js`** | Routes principales | ⭐⭐⭐ |
| `backend/src/models/Medecin.js` | Logique médecins | ⭐⭐ |
| `backend/src/models/RendezVous.js` | Logique RDV | ⭐⭐ |
| `backend/src/controllers/medecinWorkflowController.js` | Workflow médecin | ⭐⭐ |
| `backend/src/controllers/rendezVousController.js` | Contrôleur RDV | ⭐⭐ |
| `backend/DOCUMENTATION_API.md` | Documentation API | ⭐⭐ |

### Pour le développement frontend

| Fichier | Description | Priorité |
|---------|-------------|----------|
| **`frontend/src/context/AuthContext.tsx`** | Authentification | ⭐⭐⭐ |
| **`frontend/src/utils/apiFetch.ts`** | Client API | ⭐⭐⭐ |
| `frontend/src/pages/MedecinDashboard.tsx` | Dashboard médecin | ⭐⭐ |
| `frontend/src/pages/BookAppointmentNew.tsx` | Prise de RDV | ⭐⭐ |
| `frontend/src/components/Layout.tsx` | Layout principal | ⭐⭐ |
| `frontend/tailwind.config.js` | Configuration styles | ⭐ |

---

## 🔍 Navigation Rapide

### Rechercher une fonctionnalité

| Fonctionnalité | Backend | Frontend |
|----------------|---------|----------|
| **Authentification** | `src/controllers/authController.js` | `context/AuthContext.tsx` |
| **Patients** | `src/controllers/patientController.js` | `pages/Patients.tsx` |
| **Rendez-vous** | `src/controllers/rendezVousController.js` | `pages/BookAppointmentNew.tsx` |
| **Workflow médecin** | `src/controllers/medecinWorkflowController.js` | `pages/MedecinDashboard.tsx` |
| **Statut dynamique** | `src/services/statutDynamiqueService.js` | - |
| **Prescriptions** | `src/controllers/prescriptionController.js` | `pages/Prescriptions.tsx` |
| **Statistiques** | `src/controllers/statistiqueController.js` | `pages/Statistiques.tsx` |

### Rechercher un bug

| Type de bug | Où chercher |
|-------------|-------------|
| **Erreur API 404/500** | `backend/src/routes/`, logs serveur |
| **Erreur frontend** | Console navigateur, `utils/apiFetch.ts` |
| **Erreur DB** | `backend/src/config/database.js`, logs MySQL |
| **Erreur auth** | `backend/src/middlewares/auth.js`, `AuthContext.tsx` |
| **Erreur validation** | `backend/src/validators/`, `backend/src/middlewares/validate.js` |

---

## 📊 Statistiques du Projet

### Code
- **Lignes de code backend** : ~15,000+
- **Lignes de code frontend** : ~12,000+
- **Fichiers backend** : 100+
- **Fichiers frontend** : 65+
- **Fichiers de tests** : 26

### Structure
- **Pages React** : 40
- **Composants** : 17
- **Contrôleurs** : 16
- **Modèles** : 11
- **Routes** : 20 fichiers (200+ endpoints)
- **Services** : 6
- **Middlewares** : 4
- **Validators** : 10
- **Tables DB** : 15

---

## 🎓 Pour Bien Naviguer

### Nouveau développeur ?

1. **Comprendre la structure**
   - Lire ce fichier (10 min)
   - Explorer `backend/src/routes/index.js`
   - Explorer `frontend/src/pages/`

2. **Comprendre le flow**
   - **Frontend** : User → Pages → API call (`apiFetch.ts`)
   - **Backend** : Request → Routes → Middlewares → Controllers → Models → DB
   - **Response** : DB → Models → Controllers → Middlewares → Routes → Frontend

3. **Première contribution**
   - Choisir une page/feature simple
   - Lire le code backend ET frontend associé
   - Faire une petite modification
   - Tester localement
   - Documenter dans `ETAT_PROJET.md`

---

**Dernière mise à jour :** 7 novembre 2025  
**Version :** 1.0.0  
**Contributeurs :** Équipe NINSANP

---

✨ **Structure claire = Code maintenable !** ✨

