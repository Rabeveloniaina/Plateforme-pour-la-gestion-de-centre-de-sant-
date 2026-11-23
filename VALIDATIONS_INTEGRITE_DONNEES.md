# Documentation des Validations d'Intégrité des Données

Ce document récapitule toutes les validations d'intégrité des données implémentées dans l'application de gestion des centres de santé.

## 📋 Vue d'ensemble

Les validations sont centralisées dans le module `backend/src/validators/dataIntegrityValidators.js` et sont intégrées dans tous les contrôleurs pour assurer la cohérence et la validité des données avant leur insertion ou modification en base de données.

## ✅ Validations Implémentées

### 1. **Validations des Patients**

#### Date de naissance
- ✅ **Doit être antérieure à aujourd'hui** : Un patient ne peut pas être né dans le futur
- ✅ **Doit être raisonnable** : Ne peut pas être plus ancienne que 150 ans
- ✅ **Format valide** : Doit être au format YYYY-MM-DD

#### Prénom
- ✅ **Optionnel** : Le prénom est optionnel pour les malgaches (peut être vide ou null)
- ✅ **Longueur maximale** : Si fourni, ne peut pas dépasser 100 caractères

#### Nom
- ✅ **Requis** : Le nom est obligatoire
- ✅ **Non vide** : Ne peut pas être une chaîne vide
- ✅ **Longueur maximale** : Ne peut pas dépasser 100 caractères

#### Téléphone
- ✅ **Requis** : Le numéro de téléphone est obligatoire
- ✅ **Format valide** : Doit contenir entre 8 et 15 chiffres
- ✅ **Format accepté** : Peut inclure un préfixe + (ex: +261 XX XX XX XXX)
- ✅ **Nettoyage** : Les espaces, tirets et parenthèses sont automatiquement supprimés pour la validation

#### Email
- ✅ **Optionnel** : L'email est optionnel pour les patients
- ✅ **Format valide** : Si fourni, doit respecter le format email standard (exemple@domaine.com)
- ✅ **Longueur maximale** : Ne peut pas dépasser 100 caractères

#### Sexe
- ✅ **Requis** : Le sexe est obligatoire
- ✅ **Valeurs acceptées** : Doit être "M" (Masculin) ou "F" (Féminin)

#### Adresse
- ✅ **Requis** : L'adresse est obligatoire
- ✅ **Non vide** : Ne peut pas être une chaîne vide
- ✅ **Longueur maximale** : Ne peut pas dépasser 255 caractères

#### Statut
- ✅ **Patient actif pour RDV** : Un patient inactif ne peut pas prendre de rendez-vous
- ✅ **Message clair** : Message d'erreur explicite si tentative de création de RDV pour un patient inactif

---

### 2. **Validations des Médecins**

#### Date de naissance
- ✅ **Doit être antérieure à aujourd'hui** : Un médecin ne peut pas être né dans le futur
- ✅ **Doit être raisonnable** : Ne peut pas être plus ancienne que 150 ans
- ✅ **Format valide** : Doit être au format YYYY-MM-DD

#### Âge minimum
- ✅ **18 ans minimum** : Un médecin doit avoir au moins 18 ans
- ✅ **Calcul automatique** : L'âge est calculé automatiquement à partir de la date de naissance
- ✅ **Message d'erreur clair** : Affiche l'âge calculé si la validation échoue

#### Date d'embauche
- ✅ **Optionnel** : La date d'embauche est optionnelle
- ✅ **Ne peut pas être dans le futur** : Doit être une date passée ou aujourd'hui
- ✅ **Cohérence avec l'âge** : Ne peut pas être antérieure aux 18 ans du médecin
- ✅ **Message d'erreur détaillé** : Affiche la date des 18 ans si la validation échoue

#### Prénom
- ✅ **Optionnel** : Le prénom est optionnel pour les malgaches
- ✅ **Longueur maximale** : Si fourni, ne peut pas dépasser 100 caractères

#### Nom
- ✅ **Requis** : Le nom est obligatoire
- ✅ **Non vide** : Ne peut pas être une chaîne vide
- ✅ **Longueur maximale** : Ne peut pas dépasser 100 caractères

#### Numéro de licence
- ✅ **Requis** : Le numéro de licence est obligatoire
- ✅ **Longueur minimale** : Doit contenir au moins 3 caractères
- ✅ **Longueur maximale** : Ne peut pas dépasser 50 caractères
- ✅ **Non vide** : Ne peut pas être une chaîne vide (après trim)

#### Spécialité
- ✅ **Requis** : La spécialité est obligatoire
- ✅ **Non vide** : Ne peut pas être une chaîne vide
- ✅ **Longueur maximale** : Ne peut pas dépasser 100 caractères

#### Téléphone
- ✅ **Requis** : Le numéro de téléphone est obligatoire
- ✅ **Format valide** : Doit contenir entre 8 et 15 chiffres
- ✅ **Format accepté** : Peut inclure un préfixe + (ex: +261 XX XX XX XXX)

#### Email
- ✅ **Requis** : L'email est obligatoire pour les médecins
- ✅ **Format valide** : Doit respecter le format email standard
- ✅ **Longueur maximale** : Ne peut pas dépasser 100 caractères

#### Sexe
- ✅ **Requis** : Le sexe est obligatoire
- ✅ **Valeurs acceptées** : Doit être "M" (Masculin) ou "F" (Féminin)

#### Statut
- ✅ **Médecin actif pour RDV** : Seuls les médecins actifs peuvent recevoir des patients
- ✅ **Message clair** : Message d'erreur explicite si tentative de création de RDV avec un médecin inactif

---

### 3. **Validations des Rendez-vous**

#### Date et heure du rendez-vous
- ✅ **Doit être aujourd'hui ou dans le futur** : Ne peut pas être dans le passé (tolérance de 5 minutes pour les décalages)
- ✅ **Format valide** : Doit être au format DATETIME (YYYY-MM-DD HH:MM:SS)
- ✅ **Limite dans le futur** : Ne peut pas être programmé plus de 12 mois à l'avance
- ✅ **Message d'erreur clair** : Affiche la date demandée et la date actuelle si la validation échoue

#### Durée estimée
- ✅ **Optionnel** : La durée estimée est optionnelle à la création
- ✅ **Doit être positive** : Si fournie, doit être supérieure à 0 minutes
- ✅ **Durée minimale** : Doit être d'au moins 5 minutes
- ✅ **Durée maximale** : Ne peut pas dépasser 8 heures (480 minutes)
- ✅ **Nombre valide** : Doit être un nombre entier (en minutes)

#### Durée réelle
- ✅ **Optionnel** : La durée réelle est optionnelle
- ✅ **Doit être positive** : Si fournie, doit être supérieure à 0 minutes
- ✅ **Durée minimale** : Doit être d'au moins 5 minutes
- ✅ **Durée maximale** : Ne peut pas dépasser 8 heures (480 minutes)
- ✅ **Nombre valide** : Doit être un nombre entier (en minutes)

#### Réajustement de rendez-vous
- ✅ **Ne peut pas être dans le passé** : Impossible de réajuster un RDV à une heure déjà passée
- ✅ **Tolérance de 5 minutes** : Accepte jusqu'à 5 minutes dans le passé pour gérer les décalages
- ✅ **Message d'erreur clair** : Affiche la nouvelle heure demandée et l'heure actuelle

#### Heure d'arrivée
- ✅ **Optionnel** : L'heure d'arrivée est optionnelle
- ✅ **Cohérence avec le RDV** : Ne peut pas être plus d'un jour avant le rendez-vous
- ✅ **Ne peut pas être dans le futur** : Ne peut pas être dans le futur (tolérance de 5 minutes)

#### Statut médecin et patient
- ✅ **Médecin actif** : Le médecin doit être actif pour créer un RDV
- ✅ **Patient actif** : Le patient doit être actif pour créer un RDV
- ✅ **Messages d'erreur clairs** : Messages explicites si le médecin ou le patient est inactif

---

### 4. **Validations des Consultations Médicales**

#### Date de consultation
- ✅ **Ne peut pas être dans le futur** : Une consultation ne peut pas être enregistrée pour une date future
- ✅ **Tolérance** : Accepte jusqu'à la fin de la journée actuelle
- ✅ **Format valide** : Doit être au format DATE (YYYY-MM-DD)

#### Valeurs médicales

##### Poids
- ✅ **Optionnel** : Le poids est optionnel
- ✅ **Doit être positif** : Si fourni, doit être un nombre positif
- ✅ **Plage valide** : Doit être entre 0.5 kg et 500 kg
- ✅ **Format valide** : Doit être un nombre (peut être décimal)

##### Taille
- ✅ **Optionnel** : La taille est optionnelle
- ✅ **Doit être positive** : Si fournie, doit être un nombre positif
- ✅ **Plage valide** : Doit être entre 30 cm et 250 cm
- ✅ **Format valide** : Doit être un nombre (peut être décimal)

##### Tension artérielle
- ✅ **Optionnel** : La tension est optionnelle
- ✅ **Tension systolique** : Doit être entre 50 et 300 mmHg
- ✅ **Tension diastolique** : Doit être entre 30 et 200 mmHg
- ✅ **Cohérence** : La tension systolique doit être supérieure à la tension diastolique
- ✅ **Format valide** : Doit être un nombre entier

##### Fréquence cardiaque
- ✅ **Optionnel** : La fréquence cardiaque est optionnelle
- ✅ **Plage valide** : Doit être entre 30 et 250 bpm (battements par minute)
- ✅ **Format valide** : Doit être un nombre entier

##### Température
- ✅ **Optionnel** : La température est optionnelle
- ✅ **Plage valide** : Doit être entre 30°C et 45°C
- ✅ **Format valide** : Doit être un nombre (peut être décimal)

#### Date du prochain rendez-vous
- ✅ **Optionnel** : La date du prochain RDV est optionnelle
- ✅ **Doit être dans le futur** : Si fournie, doit être postérieure à la date de consultation
- ✅ **Cohérence** : La date de fin (prochain RDV) doit être après la date de début (consultation)

---

### 5. **Validations des Prescriptions**

#### Dates
- ✅ **Date de début** : Doit être fournie
- ✅ **Date de fin** : Doit être fournie
- ✅ **Cohérence** : La date de fin doit être postérieure à la date de début
- ✅ **Format valide** : Doit être au format DATE (YYYY-MM-DD)

#### Durée de traitement
- ✅ **Requis** : La durée de traitement est obligatoire
- ✅ **Doit être positive** : Doit être un nombre positif (en jours)
- ✅ **Format valide** : Doit être un nombre entier

#### Quantité totale
- ✅ **Requis** : La quantité totale est obligatoire
- ✅ **Doit être positive** : Doit être un nombre positif
- ✅ **Format valide** : Doit être un nombre entier

---

### 6. **Validations Centre/Région**

#### Cohérence centre/région
- ✅ **Centre existe** : Le centre de santé doit exister dans la base de données
- ✅ **Centre actif** : Le centre de santé doit être actif
- ✅ **Appartenance** : Le centre doit appartenir à la région spécifiée
- ✅ **Message d'erreur clair** : Affiche le centre ID et la région ID en cas d'incohérence

#### Médecin/Patient même centre
- ✅ **Cohérence pour consultations** : Le médecin et le patient doivent appartenir au même centre pour une consultation
- ✅ **Message d'erreur clair** : Message explicite si le médecin et le patient sont dans des centres différents

---

## 🔧 Intégration dans les Contrôleurs

Les validations sont intégrées dans les contrôleurs suivants :

1. **`registrationController.js`** : Inscription des patients
2. **`patientController.js`** : Création et mise à jour des patients
3. **`medecinController.js`** : Création et mise à jour des médecins
4. **`rendezVousController.js`** : Création, confirmation et finalisation des rendez-vous
5. **`reprogrammationController.js`** : Réajustement des rendez-vous
6. **`walkInController.js`** : Enregistrement des patients walk-in
7. **`consultationController.js`** : Création des fiches de consultation
8. **`medecinWorkflowController.js`** : Enregistrement des consultations par les médecins
9. **`prescriptionController.js`** : Création des prescriptions
10. **`authController.js`** : Création de médecins via l'inscription

---

## 📝 Messages d'Erreur

Tous les messages d'erreur sont :
- ✅ **En français** : Tous les messages sont en français pour faciliter la compréhension
- ✅ **Clairs et explicites** : Chaque message explique précisément le problème
- ✅ **Formatés** : Les dates et heures sont formatées pour une meilleure lisibilité
- ✅ **Contextuels** : Les messages incluent les valeurs attendues et les valeurs fournies quand c'est pertinent

---

## 🎯 Cas de Validation Spécifiques

### Cas 1 : Patient malgache sans prénom
- ✅ Le prénom est optionnel
- ✅ Un patient peut être créé sans prénom
- ✅ Le système accepte une chaîne vide pour le prénom

### Cas 2 : Réajustement de RDV
- ✅ Impossible de réajuster un RDV à une heure déjà passée
- ✅ Tolérance de 5 minutes pour gérer les décalages horaires
- ✅ Validation avant et après le réajustement

### Cas 3 : Médecin de moins de 18 ans
- ✅ Impossible de créer un médecin de moins de 18 ans
- ✅ Message d'erreur affiche l'âge calculé
- ✅ Validation de l'âge minimum lors de la création et de la mise à jour

### Cas 4 : Date d'embauche avant 18 ans
- ✅ Impossible d'embaucher un médecin avant ses 18 ans
- ✅ Message d'erreur affiche la date des 18 ans
- ✅ Validation de la cohérence entre date de naissance et date d'embauche

### Cas 5 : Rendez-vous dans le passé
- ✅ Impossible de créer un RDV dans le passé
- ✅ Tolérance de 5 minutes pour gérer les décalages
- ✅ Validation lors de la création et du réajustement

### Cas 6 : Rendez-vous trop loin dans le futur
- ✅ Impossible de programmer un RDV plus de 12 mois à l'avance
- ✅ Message d'erreur affiche la date maximum
- ✅ Limite configurable (défaut : 12 mois)

### Cas 7 : Consultation dans le futur
- ✅ Impossible d'enregistrer une consultation pour une date future
- ✅ Tolérance jusqu'à la fin de la journée actuelle
- ✅ Validation lors de la création de la fiche médicale

### Cas 8 : Valeurs médicales invalides
- ✅ Validation des plages de valeurs raisonnables
- ✅ Cohérence entre tension systolique et diastolique
- ✅ Messages d'erreur spécifiques pour chaque valeur

### Cas 9 : Durée de consultation invalide
- ✅ Durée minimale : 5 minutes
- ✅ Durée maximale : 8 heures (480 minutes)
- ✅ Doit être un nombre positif
- ✅ Validation pour durée estimée et durée réelle

### Cas 10 : Médecin/Patient inactif
- ✅ Impossible de créer un RDV avec un médecin inactif
- ✅ Impossible de créer un RDV pour un patient inactif
- ✅ Messages d'erreur explicites

### Cas 11 : Centre/Région incohérents
- ✅ Validation que le centre appartient à la région
- ✅ Validation que le centre est actif
- ✅ Message d'erreur avec les IDs du centre et de la région

### Cas 12 : Tension artérielle incohérente
- ✅ La tension systolique doit être supérieure à la tension diastolique
- ✅ Validation des plages de valeurs pour chaque tension
- ✅ Message d'erreur explicite si incohérence

---

## 🚀 Utilisation

### Exemple : Validation d'un patient

```javascript
const DataIntegrityValidators = require('../validators/dataIntegrityValidators');

const patientData = {
    nom: 'Rakoto',
    prenom: '', // Optionnel pour les malgaches
    date_naissance: '1990-05-15',
    sexe: 'M',
    telephone: '+261 34 12 345 67',
    email: 'rakoto@example.com',
    adresse: 'Antananarivo'
};

const validation = DataIntegrityValidators.validatePatient(patientData);
if (!validation.valid) {
    console.error('Erreurs:', validation.errors);
    // Erreurs: ["Le numéro de téléphone doit contenir entre 8 et 15 chiffres..."]
}
```

### Exemple : Validation d'un médecin

```javascript
const medecinData = {
    nom: 'Razafy',
    prenom: 'Dr. Jean',
    date_naissance: '1985-03-20',
    sexe: 'M',
    specialite: 'Médecine générale',
    numero_licence: 'MG12345',
    telephone: '+261 34 12 345 68',
    email: 'dr.razafy@example.com',
    date_embauche: '2005-06-01' // Après ses 18 ans
};

const validation = DataIntegrityValidators.validateMedecin(medecinData);
if (!validation.valid) {
    console.error('Erreurs:', validation.errors);
}
```

### Exemple : Validation d'un rendez-vous

```javascript
const rdvData = {
    date_rdv: '2024-12-25 14:30:00',
    duree_estimee: 30,
    heure_arrivee: '2024-12-25 14:25:00'
};

const validation = DataIntegrityValidators.validateRendezVous(rdvData);
if (!validation.valid) {
    console.error('Erreurs:', validation.errors);
}
```

---

## 📊 Résumé des Validations par Entité

| Entité | Validations | Statut |
|--------|-------------|--------|
| **Patient** | Date naissance, Prénom (optionnel), Nom, Téléphone, Email, Sexe, Adresse, Statut | ✅ Complet |
| **Médecin** | Date naissance, Âge minimum (18 ans), Date embauche, Prénom (optionnel), Nom, Numéro licence, Spécialité, Téléphone, Email, Sexe, Statut | ✅ Complet |
| **Rendez-vous** | Date/heure, Durée estimée, Durée réelle, Heure arrivée, Statut médecin/patient, Limite futur | ✅ Complet |
| **Consultation** | Date consultation, Valeurs médicales (poids, taille, tension, etc.), Date prochain RDV | ✅ Complet |
| **Prescription** | Dates (début/fin), Durée traitement, Quantité totale | ✅ Complet |
| **Centre/Région** | Cohérence centre/région, Centre actif, Médecin/Patient même centre | ✅ Complet |

---

## 🔍 Points d'Attention

1. **Tolérances temporelles** : Certaines validations incluent des tolérances (5 minutes pour les dates, fin de journée pour les consultations) pour gérer les décalages horaires et les cas limites.

2. **Champs optionnels** : Certains champs sont optionnels (prénom, email pour patients) mais sont validés si fournis.

3. **Validation asynchrone** : La validation centre/région est asynchrone car elle nécessite une requête à la base de données.

4. **Messages d'erreur** : Tous les messages sont en français et incluent les valeurs attendues et fournies quand c'est pertinent.

5. **Performance** : Les validations sont rapides et ne nécessitent généralement pas de requêtes à la base de données (sauf pour centre/région).

---

## 📌 Prochaines Étapes (Optionnel)

Validations supplémentaires qui pourraient être ajoutées à l'avenir :

1. **Validation du format du numéro de licence** : Vérifier un format spécifique (ex: MG####)
2. **Validation des horaires de travail** : Vérifier que les RDV sont dans les horaires de travail du médecin
3. **Validation des chevauchements** : Vérifier qu'il n'y a pas de chevauchement entre RDV (déjà fait mais pourrait être amélioré)
4. **Validation des groupes sanguins** : Vérifier que le groupe sanguin est dans une liste valide
5. **Validation des spécialités** : Vérifier que la spécialité est dans une liste valide
6. **Validation des statuts** : Vérifier que les transitions de statut sont logiques
7. **Validation des motifs de consultation** : Vérifier que le motif n'est pas vide et a une longueur raisonnable

---

## ✅ Conclusion

Toutes les validations d'intégrité des données sont maintenant implémentées et intégrées dans les contrôleurs. Le système assure la cohérence et la validité des données avant leur insertion ou modification en base de données, avec des messages d'erreur clairs et explicites en français.

Les validations couvrent tous les cas mentionnés par l'utilisateur ainsi que d'autres cas logiques identifiés pour améliorer la robustesse du système.

