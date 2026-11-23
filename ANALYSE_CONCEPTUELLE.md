# Chapitre 5. Analyse conceptuelle

## 5.1 Présentation de la méthode utilisée

La méthode UML (Unified Modeling Language) est une approche standardisée d'analyse et de conception des systèmes d'information orientée objet. Elle repose sur une modélisation visuelle qui permet de représenter les différents aspects d'un système : la structure des données (diagrammes de classes), le comportement (diagrammes de séquence, d'activité), les interactions (diagrammes de cas d'utilisation), et l'architecture (diagrammes de déploiement, de paquetage).

UML se distingue par sa capacité à modéliser un système sous plusieurs perspectives complémentaires, facilitant ainsi la communication entre les différents acteurs du projet (analystes, développeurs, utilisateurs). Sa rigueur et sa standardisation en font un outil privilégié pour les projets complexes nécessitant une modélisation précise des besoins fonctionnels et techniques, ainsi qu'une traçabilité claire entre les différents niveaux d'abstraction.

Dans le cadre de notre projet de plateforme de gestion des centres de santé, UML nous permettra de modéliser efficacement les entités métier (patients, médecins, rendez-vous, centres de santé), leurs relations, ainsi que les processus opérationnels (prise de rendez-vous, consultations, gestion des prescriptions, etc.).

## 5.2 Dictionnaire de données

La base de données de l'application doit intégrer l'ensemble des fonctionnalités nécessaires pour répondre aux besoins des utilisateurs. 

Le dictionnaire de données correspondant est présenté dans le tableau suivant. Il détaille les structures de données essentielles pour assurer la cohérence, l'accessibilité et la fiabilité de l'information au sein de l'application.

**Tableau 1 : Dictionnaire de données de la plateforme de gestion des centres de santé**

| Table | Attribut | Définition | Type | Longueur | Observation |
|-------|----------|------------|------|----------|-------------|
| **regions** | id_region | Identifiant unique de la région | Numérique | INT | Clé primaire, Auto-incrément |
| | nom | Nom de la région | Alphanumérique | VARCHAR(100) | Unique, Obligatoire |
| | population | Nombre d'habitants de la région | Numérique | INT | Valeur par défaut : 0 |
| | code_region | Code d'identification de la région | Alphanumérique | VARCHAR(10) | Unique |
| **centres_sante** | id_centre | Identifiant unique du centre de santé | Numérique | INT | Clé primaire, Auto-incrément |
| | nom | Nom du centre de santé | Alphanumérique | VARCHAR(200) | Obligatoire |
| | adresse | Adresse complète du centre | Texte | TEXT | Obligatoire |
| | region_id | Identifiant de la région | Numérique | INT | Clé étrangère → regions |
| | capacite_max | Capacité maximale d'accueil | Numérique | INT | Valeur par défaut : 100 |
| | telephone | Numéro de téléphone du centre | Alphanumérique | VARCHAR(20) | |
| | email | Adresse email du centre | Alphanumérique | VARCHAR(100) | |
| | type_centre | Type de centre (poste, centre, hôpital, clinique) | Enumération | ENUM | Valeurs : poste_sante, centre_sante, hopital, clinique |
| | statut | Statut opérationnel du centre | Enumération | ENUM | Valeurs : actif, inactif, maintenance |
| **utilisateurs** | id_user | Identifiant unique de l'utilisateur | Numérique | INT | Clé primaire, Auto-incrément |
| | nom_utilisateur | Nom d'utilisateur pour connexion | Alphanumérique | VARCHAR(50) | Unique, Obligatoire |
| | mot_de_passe | Mot de passe hashé | Alphanumérique | VARCHAR(255) | Obligatoire, Hashé avec bcrypt |
| | email | Adresse email de l'utilisateur | Alphanumérique | VARCHAR(100) | Unique |
| | role | Rôle de l'utilisateur dans le système | Enumération | ENUM | Valeurs : patient, medecin, admin, personnel, admin_centre, ministere |
| | statut | Statut du compte utilisateur | Enumération | ENUM | Valeurs : actif, inactif, suspendu |
| | derniere_connexion | Date et heure de dernière connexion | Date/Heure | TIMESTAMP | Nullable |
| **patients** | id_patient | Identifiant unique du patient | Numérique | INT | Clé primaire, Auto-incrément |
| | user_id | Identifiant de l'utilisateur associé | Numérique | INT | Clé étrangère → utilisateurs, Nullable |
| | nom | Nom de famille du patient | Alphanumérique | VARCHAR(100) | Obligatoire |
| | prenom | Prénom du patient | Alphanumérique | VARCHAR(100) | Obligatoire |
| | date_naissance | Date de naissance du patient | Date | DATE | Obligatoire, Format : AAAA-MM-JJ |
| | sexe | Sexe du patient | Enumération | ENUM | Valeurs : M, F |
| | adresse | Adresse complète du patient | Texte | TEXT | Obligatoire |
| | telephone | Numéro de téléphone du patient | Alphanumérique | VARCHAR(20) | Obligatoire |
| | email | Adresse email du patient | Alphanumérique | VARCHAR(100) | Nullable |
| | centre_id | Identifiant du centre de santé | Numérique | INT | Clé étrangère → centres_sante |
| | groupe_sanguin | Groupe sanguin du patient | Enumération | ENUM | Valeurs : A+, A-, B+, B-, AB+, AB-, O+, O- |
| | taux_no_show | Taux d'absence aux rendez-vous | Numérique | DECIMAL(5,2) | Valeur par défaut : 0.00 |
| | statut | Statut du patient | Enumération | ENUM | Valeurs : actif, inactif, decede |
| **medecins** | id_medecin | Identifiant unique du médecin | Numérique | INT | Clé primaire, Auto-incrément |
| | user_id | Identifiant de l'utilisateur associé | Numérique | INT | Clé étrangère → utilisateurs, Nullable |
| | nom | Nom de famille du médecin | Alphanumérique | VARCHAR(100) | Obligatoire |
| | prenom | Prénom du médecin | Alphanumérique | VARCHAR(100) | Obligatoire |
| | sexe | Sexe du médecin | Enumération | ENUM | Valeurs : M, F |
| | date_naissance | Date de naissance du médecin | Date | DATE | Obligatoire |
| | specialite | Spécialité médicale | Alphanumérique | VARCHAR(100) | Obligatoire |
| | experience | Années d'expérience | Numérique | INT | Valeur par défaut : 0 |
| | diplome | Diplômes obtenus | Alphanumérique | VARCHAR(200) | Nullable |
| | numero_licence | Numéro de licence médicale | Alphanumérique | VARCHAR(50) | Unique, Obligatoire |
| | telephone | Numéro de téléphone du médecin | Alphanumérique | VARCHAR(20) | Obligatoire |
| | email | Adresse email du médecin | Alphanumérique | VARCHAR(100) | Obligatoire |
| | centre_id | Identifiant du centre de santé | Numérique | INT | Clé étrangère → centres_sante |
| | disponibilite | Horaires de disponibilité | JSON | JSON | Format JSON |
| | statut | Statut du médecin | Enumération | ENUM | Valeurs : actif, inactif, conges, retraite |
| **rendez_vous** | id_rdv | Identifiant unique du rendez-vous | Numérique | INT | Clé primaire, Auto-incrément |
| | patient_id | Identifiant du patient | Numérique | INT | Clé étrangère → patients |
| | medecin_id | Identifiant du médecin | Numérique | INT | Clé étrangère → medecins |
| | centre_id | Identifiant du centre de santé | Numérique | INT | Clé étrangère → centres_sante |
| | date_rdv | Date et heure du rendez-vous | Date/Heure | DATETIME | Obligatoire |
| | statut | Statut du rendez-vous | Enumération | ENUM | Valeurs : attente, confirme, annule, termine, absent |
| | symptomes | Symptômes déclarés par le patient | JSON | JSON | Format JSON |
| | orientation | Type d'orientation | Enumération | ENUM | Valeurs : generaliste, specialiste, auto |
| | note_medecin | Notes du médecin | Texte | TEXT | Nullable |
| | note_patient | Notes du patient | Texte | TEXT | Nullable |
| | duree_estimee | Durée estimée en minutes | Numérique | INT | Valeur par défaut : 30 |
| | duree_reelle | Durée réelle en minutes | Numérique | INT | Nullable |
| | heure_arrivee | Heure d'arrivée du patient | Heure | TIME | Nullable |
| | heure_debut_consultation | Heure de début de consultation | Heure | TIME | Nullable |
| | heure_fin_consultation | Heure de fin de consultation | Heure | TIME | Nullable |
| **fiches_medicales** | id_fiche | Identifiant unique de la fiche médicale | Numérique | INT | Clé primaire, Auto-incrément |
| | patient_id | Identifiant du patient | Numérique | INT | Clé étrangère → patients |
| | medecin_id | Identifiant du médecin | Numérique | INT | Clé étrangère → medecins |
| | date_consultation | Date et heure de la consultation | Date/Heure | DATETIME | Obligatoire |
| | poids | Poids du patient en kg | Numérique | DECIMAL(5,2) | Nullable |
| | taille | Taille du patient en cm | Numérique | DECIMAL(5,2) | Nullable |
| | imc | Indice de masse corporelle | Numérique | DECIMAL(4,2) | Calculé automatiquement |
| | tension_systolique | Tension artérielle systolique | Numérique | INT | Nullable |
| | tension_diastolique | Tension artérielle diastolique | Numérique | INT | Nullable |
| | frequence_cardiaque | Fréquence cardiaque en bpm | Numérique | INT | Nullable |
| | temperature | Température corporelle en °C | Numérique | DECIMAL(4,2) | Nullable |
| | motif_consultation | Motif de la consultation | Texte | TEXT | Obligatoire |
| | symptomes | Symptômes observés | JSON | JSON | Format JSON |
| | examen_physique | Résultats de l'examen physique | Texte | TEXT | Nullable |
| | diagnostic_principal | Diagnostic principal | Alphanumérique | VARCHAR(500) | Nullable |
| | diagnostics_secondaires | Diagnostics secondaires | JSON | JSON | Format JSON |
| | observations_medecin | Observations du médecin | Texte | TEXT | Nullable |
| | recommandations | Recommandations médicales | Texte | TEXT | Nullable |
| | suivi_necessaire | Indique si un suivi est nécessaire | Booléen | BOOLEAN | Valeur par défaut : FALSE |
| | date_prochain_rdv | Date du prochain rendez-vous | Date | DATE | Nullable |
| | statut | Statut de la consultation | Enumération | ENUM | Valeurs : en_cours, termine, annule |
| **medicaments** | id_medicament | Identifiant unique du médicament | Numérique | INT | Clé primaire, Auto-incrément |
| | nom_commercial | Nom commercial du médicament | Alphanumérique | VARCHAR(200) | Obligatoire |
| | denomination_commune | Dénomination commune internationale | Alphanumérique | VARCHAR(200) | Obligatoire |
| | forme_pharmaceutique | Forme pharmaceutique | Enumération | ENUM | Valeurs : comprime, gelule, sirop, injection, pommade, etc. |
| | dosage | Dosage du médicament | Alphanumérique | VARCHAR(100) | Obligatoire |
| | unite_dosage | Unité de dosage | Alphanumérique | VARCHAR(50) | Obligatoire |
| | fabricant | Fabricant du médicament | Alphanumérique | VARCHAR(200) | Nullable |
| | code_atc | Code ATC du médicament | Alphanumérique | VARCHAR(20) | Nullable |
| | contre_indications | Contre-indications | Texte | TEXT | Nullable |
| | effets_secondaires | Effets secondaires | Texte | TEXT | Nullable |
| | interactions | Interactions médicamenteuses | Texte | TEXT | Nullable |
| | statut | Statut du médicament | Enumération | ENUM | Valeurs : actif, inactif, retire |
| **prescriptions** | id_prescription | Identifiant unique de la prescription | Numérique | INT | Clé primaire, Auto-incrément |
| | fiche_medicale_id | Identifiant de la fiche médicale | Numérique | INT | Clé étrangère → fiches_medicales |
| | medicament_id | Identifiant du médicament | Numérique | INT | Clé étrangère → medicaments |
| | dosage_prescrit | Dosage prescrit | Alphanumérique | VARCHAR(100) | Obligatoire |
| | frequence | Fréquence de prise | Alphanumérique | VARCHAR(100) | Obligatoire |
| | duree_traitement | Durée du traitement en jours | Numérique | INT | Obligatoire |
| | quantite_totale | Quantité totale prescrite | Numérique | INT | Obligatoire |
| | instructions_specifiques | Instructions spécifiques | Texte | TEXT | Nullable |
| | moment_prise | Moment de prise du médicament | Enumération | ENUM | Valeurs : avant_repas, pendant_repas, apres_repas, etc. |
| | date_debut | Date de début du traitement | Date | DATE | Obligatoire |
| | date_fin | Date de fin du traitement | Date | DATE | Obligatoire |
| | statut | Statut de la prescription | Enumération | ENUM | Valeurs : active, terminee, arretee, suspendue |
| **vaccinations** | id_vaccination | Identifiant unique de la vaccination | Numérique | INT | Clé primaire, Auto-incrément |
| | patient_id | Identifiant du patient | Numérique | INT | Clé étrangère → patients |
| | medecin_id | Identifiant du médecin | Numérique | INT | Clé étrangère → medecins |
| | nom_vaccin | Nom du vaccin | Alphanumérique | VARCHAR(200) | Obligatoire |
| | type_vaccin | Type de vaccination | Enumération | ENUM | Valeurs : obligatoire, recommande, voyage, professionnel |
| | fabricant | Fabricant du vaccin | Alphanumérique | VARCHAR(200) | Nullable |
| | numero_lot | Numéro de lot du vaccin | Alphanumérique | VARCHAR(100) | Nullable |
| | date_expiration | Date d'expiration du vaccin | Date | DATE | Nullable |
| | date_administration | Date d'administration | Date | DATE | Obligatoire |
| | site_injection | Site d'injection | Enumération | ENUM | Valeurs : bras_gauche, bras_droit, cuisse_gauche, etc. |
| | voie_administration | Voie d'administration | Enumération | ENUM | Valeurs : intramusculaire, sous_cutanee, intradermique, etc. |
| | reactions_adverses | Réactions adverses observées | Texte | TEXT | Nullable |
| | date_rappel_prevu | Date de rappel prévue | Date | DATE | Nullable |
| | statut | Statut de la vaccination | Enumération | ENUM | Valeurs : administre, reporte, contre_indique |
| **notifications** | id | Identifiant unique de la notification | Numérique | INT | Clé primaire, Auto-incrément |
| | patient_id | Identifiant du patient | Numérique | INT | Clé étrangère → patients, Nullable |
| | medecin_id | Identifiant du médecin | Numérique | INT | Clé étrangère → medecins, Nullable |
| | type | Type de notification | Enumération | ENUM | Valeurs : SMS, email, push |
| | message | Contenu du message | Texte | TEXT | Obligatoire |
| | statut | Statut de la notification | Enumération | ENUM | Valeurs : en_attente, envoye, echoue |
| | date_envoi | Date et heure d'envoi | Date/Heure | TIMESTAMP | Nullable |
| | tentatives | Nombre de tentatives d'envoi | Numérique | INT | Valeur par défaut : 0 |
| **documents_medicaux** | id_document | Identifiant unique du document | Numérique | INT | Clé primaire, Auto-incrément |
| | fiche_medicale_id | Identifiant de la fiche médicale | Numérique | INT | Clé étrangère → fiches_medicales, Nullable |
| | patient_id | Identifiant du patient | Numérique | INT | Clé étrangère → patients |
| | rendez_vous_id | Identifiant du rendez-vous | Numérique | INT | Clé étrangère → rendez_vous, Nullable |
| | prescription_id | Identifiant de la prescription | Numérique | INT | Clé étrangère → prescriptions, Nullable |
| | nom_fichier | Nom du fichier stocké | Alphanumérique | VARCHAR(255) | Obligatoire |
| | nom_fichier_original | Nom original du fichier | Alphanumérique | VARCHAR(255) | Obligatoire |
| | chemin_fichier | Chemin d'accès au fichier | Alphanumérique | VARCHAR(500) | Obligatoire |
| | type_fichier | Type MIME du fichier | Alphanumérique | VARCHAR(100) | Obligatoire |
| | taille_fichier | Taille du fichier en octets | Numérique | BIGINT | Obligatoire |
| | type_document | Type de document médical | Enumération | ENUM | Valeurs : analyse_laboratoire, radiologie, echographie, etc. |
| | description | Description du document | Texte | TEXT | Nullable |
| | upload_par | Identifiant de l'utilisateur ayant uploadé | Numérique | INT | Clé étrangère → utilisateurs |
| | statut | Statut du document | Enumération | ENUM | Valeurs : actif, archive, supprime |
| | date_examen | Date de l'examen/document | Date | DATE | Nullable |
| **statistiques** | id_stat | Identifiant unique de la statistique | Numérique | INT | Clé primaire, Auto-incrément |
| | centre_id | Identifiant du centre de santé | Numérique | INT | Clé étrangère → centres_sante, Nullable |
| | region_id | Identifiant de la région | Numérique | INT | Clé étrangère → regions, Nullable |
| | periode | Période de la statistique | Alphanumérique | VARCHAR(20) | Valeurs : jour, semaine, mois, annee |
| | date_debut | Date de début de la période | Date | DATE | Obligatoire |
| | date_fin | Date de fin de la période | Date | DATE | Obligatoire |
| | nb_consultations | Nombre de consultations | Numérique | INT | Valeur par défaut : 0 |
| | nb_patients | Nombre de patients | Numérique | INT | Valeur par défaut : 0 |
| | nb_rdv | Nombre de rendez-vous | Numérique | INT | Valeur par défaut : 0 |
| | nb_sans_rdv | Nombre de consultations sans rendez-vous | Numérique | INT | Valeur par défaut : 0 |
| | temps_moyen_consultation | Temps moyen de consultation en minutes | Numérique | DECIMAL(5,2) | Valeur par défaut : 0.00 |
| | taux_respect_rdv | Taux de respect des rendez-vous en % | Numérique | DECIMAL(5,2) | Valeur par défaut : 0.00 |
| | maladies_tendance | Tendances des maladies | JSON | JSON | Format JSON |
| | couverture_vaccinale | Données de couverture vaccinale | JSON | JSON | Format JSON |

## 5.3 Règles de gestion

Les règles de gestion suivantes régissent le fonctionnement de la plateforme de gestion des centres de santé :

- **RG1** : Aucune création de compte patient ne peut être validée sans un identifiant unique (id_patient) et les informations obligatoires (nom, prénom, date de naissance, sexe, adresse, téléphone, centre_id).

- **RG2** : Tous les champs obligatoires doivent être renseignés pour chaque patient, médecin et rendez-vous.

- **RG3** : Le sexe doit être limité aux valeurs disponibles (M pour Masculin, F pour Féminin).

- **RG4** : La date de naissance d'un patient ou d'un médecin doit être antérieure à la date actuelle et le patient doit avoir au moins 18 ans pour créer un compte autonome.

- **RG5** : Chaque patient doit être affecté à un centre de santé spécifique, qui doit figurer dans la liste des centres disponibles dans la base de données.

- **RG6** : Chaque médecin doit être affecté à un centre de santé et posséder un numéro de licence médicale unique et valide.

- **RG7** : Le statut de chaque rendez-vous (en_attente, confirme, annule, termine, absent) doit être mis à jour selon les événements opérationnels (confirmation, annulation, réalisation).

- **RG8** : Un rendez-vous ne peut être créé que si le médecin est disponible (statut = 'actif') et si le créneau horaire est libre.

- **RG9** : Une fiche médicale ne peut être créée que lors d'une consultation effective, associée à un rendez-vous confirmé et terminé.

- **RG10** : Une prescription ne peut être créée que si elle est associée à une fiche médicale valide et à un médicament actif dans la base de données.

- **RG11** : L'accès aux informations médicales sensibles doit être limité aux utilisateurs autorisés (médecins, personnel médical, administrateurs).

- **RG12** : Les notifications de rappel de rendez-vous doivent être envoyées au moins 24 heures avant la date prévue.

- **RG13** : Le taux de no-show d'un patient doit être recalculé automatiquement après chaque absence à un rendez-vous confirmé.

- **RG14** : Les statistiques doivent être générées quotidiennement pour chaque centre de santé et chaque région.

- **RG15** : Un document médical ne peut être uploadé que par un utilisateur autorisé (médecin, personnel médical) et doit être associé à un patient.

## 5.4 Représentation et spécification des besoins

### 5.4.1 Diagramme des cas d'utilisation

Le diagramme des cas d'utilisation représente les interactions entre les acteurs du système et les fonctionnalités offertes par la plateforme. Les acteurs principaux identifiés sont :

- **Patient** : Peut prendre rendez-vous, consulter son dossier médical, recevoir des notifications
- **Médecin** : Peut gérer ses consultations, créer des fiches médicales, prescrire des médicaments, gérer son planning
- **Personnel administratif** : Peut gérer les patients, les rendez-vous, les centres de santé
- **Administrateur de centre** : Peut gérer le personnel, les statistiques du centre, la configuration
- **Ministère de la Santé** : Peut consulter les statistiques régionales et nationales, générer des rapports

Les cas d'utilisation principaux incluent :
- Gestion des patients (création, modification, consultation)
- Prise de rendez-vous (en ligne, par téléphone, sur place)
- Gestion des consultations (création de fiches médicales, prescriptions, vaccinations)
- Gestion des médicaments et prescriptions
- Gestion des vaccinations
- Consultation des statistiques
- Gestion des notifications
- Gestion des documents médicaux

### 5.4.2 Priorisation des cas d'utilisation

La priorisation des cas d'utilisation suit la méthode MoSCoW (Must have, Should have, Could have, Won't have) :

**Priorité 1 - Must have (Critiques) :**
- Authentification et gestion des utilisateurs
- Gestion des patients (CRUD)
- Prise de rendez-vous
- Gestion des consultations et fiches médicales
- Gestion des prescriptions
- Consultation des statistiques de base

**Priorité 2 - Should have (Importants) :**
- Gestion des vaccinations
- Notifications automatiques
- Gestion des documents médicaux
- Statistiques avancées par région
- Export de données (CSV, PDF)

**Priorité 3 - Could have (Souhaitables) :**
- Système de recherche avancée
- Rapports personnalisés
- Intégration SMS/Email avancée
- Tableau de bord interactif

**Priorité 4 - Won't have (Non prioritaires pour cette version) :**
- Application mobile native
- Intégration avec systèmes externes
- Intelligence artificielle pour diagnostics

### 5.4.3 Diagramme de séquence système pour chaque cas d'utilisation

Les diagrammes de séquence système décrivent les interactions entre les acteurs et le système pour chaque cas d'utilisation principal. Ils permettent de visualiser l'ordre chronologique des messages échangés et les responsabilités de chaque composant.

**Exemple : Cas d'utilisation "Prise de rendez-vous"**

1. Le patient accède à l'interface de prise de rendez-vous
2. Le système affiche les centres de santé disponibles
3. Le patient sélectionne un centre et un médecin
4. Le système affiche les créneaux disponibles
5. Le patient sélectionne un créneau et confirme
6. Le système vérifie la disponibilité du créneau
7. Le système crée le rendez-vous avec le statut "en_attente"
8. Le système envoie une notification de confirmation au patient
9. Le système affiche un message de confirmation au patient

## 5.5 Spécification des besoins techniques

### 5.5.1 Technologies utilisées

- **Frontend** : React 19.1.1 avec TypeScript, TailwindCSS, Vite
- **Backend** : Node.js avec Express 4.18
- **Base de données** : MySQL avec le moteur InnoDB
- **Authentification** : JWT (JSON Web Tokens) avec bcrypt pour le hachage des mots de passe
- **Sécurité** : Helmet pour la protection CSRF, rate limiting
- **Tests** : Jest et Supertest pour les tests unitaires et d'intégration

### 5.5.2 Contraintes techniques

- Compatibilité avec les navigateurs modernes (Chrome, Firefox, Safari, Edge)
- Responsive design pour les tablettes et smartphones
- Performance : temps de réponse API < 500ms pour 95% des requêtes
- Sécurité : conformité aux standards de protection des données de santé (RGPD)
- Disponibilité : 99% de disponibilité en production

## 5.6 Modélisation du domaine

### 5.6.1 Modèle conceptuel des données (MCD)

Le modèle conceptuel des données représente les entités du domaine métier et leurs relations, indépendamment de toute considération technique d'implémentation.

**Entités principales identifiées :**

- **REGION** : Représente les régions géographiques
- **CENTRE_SANTE** : Représente les centres de santé
- **UTILISATEUR** : Représente les comptes utilisateurs du système
- **PATIENT** : Représente les patients
- **MEDECIN** : Représente les médecins
- **RENDEZ_VOUS** : Représente les rendez-vous médicaux
- **FICHE_MEDICALE** : Représente les consultations et dossiers médicaux
- **MEDICAMENT** : Représente les médicaments disponibles
- **PRESCRIPTION** : Représente les prescriptions médicales
- **VACCINATION** : Représente les vaccinations administrées
- **NOTIFICATION** : Représente les notifications envoyées
- **DOCUMENT_MEDICAL** : Représente les documents médicaux uploadés
- **STATISTIQUE** : Représente les statistiques générées

**Relations principales :**

- Une REGION contient plusieurs CENTRE_SANTE (1,n)
- Un CENTRE_SANTE appartient à une REGION (1,1)
- Un CENTRE_SANTE accueille plusieurs PATIENT (1,n)
- Un PATIENT est associé à un UTILISATEUR (0,1)
- Un PATIENT a plusieurs RENDEZ_VOUS (1,n)
- Un RENDEZ_VOUS concerne un PATIENT (1,1) et un MEDECIN (1,1)
- Un RENDEZ_VOUS génère une FICHE_MEDICALE (0,1)
- Une FICHE_MEDICALE est créée par un MEDECIN (1,1) pour un PATIENT (1,1)
- Une FICHE_MEDICALE contient plusieurs PRESCRIPTION (1,n)
- Une PRESCRIPTION concerne un MEDICAMENT (1,1)
- Un PATIENT reçoit plusieurs VACCINATION (1,n)
- Une VACCINATION est administrée par un MEDECIN (1,1)
- Un PATIENT ou un MEDECIN reçoit plusieurs NOTIFICATION (1,n)
- Un PATIENT a plusieurs DOCUMENT_MEDICAL (1,n)
- Un CENTRE_SANTE ou une REGION génère plusieurs STATISTIQUE (1,n)

### 5.6.2 Modèle logique des données (MLD)

Le modèle logique des données adapte le MCD aux contraintes des bases de données relationnelles, en spécifiant les tables, les clés primaires, les clés étrangères et les contraintes d'intégrité.

**Structure des tables principales :**

| Entité/Relation | Attributs | Clés |
|----------------|-----------|------|
| **REGIONS** | id_region (PK), nom, population, code_region, created_at, updated_at | PK: id_region |
| **CENTRES_SANTE** | id_centre (PK), nom, adresse, region_id (FK), capacite_max, telephone, email, type_centre, statut, created_at, updated_at | PK: id_centre, FK: region_id → REGIONS |
| **UTILISATEURS** | id_user (PK), nom_utilisateur, mot_de_passe, email, role, statut, derniere_connexion, created_at, updated_at | PK: id_user |
| **PATIENTS** | id_patient (PK), user_id (FK), nom, prenom, date_naissance, sexe, adresse, telephone, email, centre_id (FK), groupe_sanguin, taux_no_show, statut, created_at, updated_at | PK: id_patient, FK: user_id → UTILISATEURS, FK: centre_id → CENTRES_SANTE |
| **MEDECINS** | id_medecin (PK), user_id (FK), nom, prenom, sexe, date_naissance, specialite, experience, diplome, numero_licence, telephone, email, centre_id (FK), disponibilite, statut, created_at, updated_at | PK: id_medecin, FK: user_id → UTILISATEURS, FK: centre_id → CENTRES_SANTE |
| **RENDEZ_VOUS** | id_rdv (PK), patient_id (FK), medecin_id (FK), centre_id (FK), date_rdv, statut, symptomes, orientation, note_medecin, note_patient, duree_estimee, duree_reelle, heure_arrivee, heure_debut_consultation, heure_fin_consultation, created_at, updated_at | PK: id_rdv, FK: patient_id → PATIENTS, FK: medecin_id → MEDECINS, FK: centre_id → CENTRES_SANTE |
| **FICHES_MEDICALES** | id_fiche (PK), patient_id (FK), medecin_id (FK), date_consultation, poids, taille, imc, tension_systolique, tension_diastolique, frequence_cardiaque, temperature, motif_consultation, symptomes, examen_physique, diagnostic_principal, diagnostics_secondaires, observations_medecin, recommandations, suivi_necessaire, date_prochain_rdv, statut, created_at, updated_at | PK: id_fiche, FK: patient_id → PATIENTS, FK: medecin_id → MEDECINS |
| **MEDICAMENTS** | id_medicament (PK), nom_commercial, denomination_commune, forme_pharmaceutique, dosage, unite_dosage, fabricant, code_atc, contre_indications, effets_secondaires, interactions, statut, created_at, updated_at | PK: id_medicament |
| **PRESCRIPTIONS** | id_prescription (PK), fiche_medicale_id (FK), medicament_id (FK), dosage_prescrit, frequence, duree_traitement, quantite_totale, instructions_specifiques, moment_prise, date_debut, date_fin, statut, created_at, updated_at | PK: id_prescription, FK: fiche_medicale_id → FICHES_MEDICALES, FK: medicament_id → MEDICAMENTS |
| **VACCINATIONS** | id_vaccination (PK), patient_id (FK), medecin_id (FK), nom_vaccin, type_vaccin, fabricant, numero_lot, date_expiration, date_administration, site_injection, voie_administration, reactions_adverses, date_rappel_prevu, statut, created_at, updated_at | PK: id_vaccination, FK: patient_id → PATIENTS, FK: medecin_id → MEDECINS |
| **NOTIFICATIONS** | id (PK), patient_id (FK), medecin_id (FK), type, message, statut, date_envoi, tentatives, created_at | PK: id, FK: patient_id → PATIENTS, FK: medecin_id → MEDECINS |
| **DOCUMENTS_MEDICAUX** | id_document (PK), fiche_medicale_id (FK), patient_id (FK), rendez_vous_id (FK), prescription_id (FK), nom_fichier, nom_fichier_original, chemin_fichier, type_fichier, taille_fichier, type_document, description, upload_par (FK), statut, date_upload, date_examen, created_at, updated_at | PK: id_document, FK: fiche_medicale_id → FICHES_MEDICALES, FK: patient_id → PATIENTS, FK: rendez_vous_id → RENDEZ_VOUS, FK: prescription_id → PRESCRIPTIONS, FK: upload_par → UTILISATEURS |
| **STATISTIQUES** | id_stat (PK), centre_id (FK), region_id (FK), periode, date_debut, date_fin, nb_consultations, nb_patients, nb_rdv, nb_sans_rdv, temps_moyen_consultation, taux_respect_rdv, maladies_tendance, couverture_vaccinale, created_at | PK: id_stat, FK: centre_id → CENTRES_SANTE, FK: region_id → REGIONS |

**Légende :**
- PK : Clé primaire
- FK : Clé étrangère

