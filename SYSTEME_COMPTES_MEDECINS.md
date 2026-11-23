# Système de Comptes Médecins - Documentation

## Vue d'ensemble

Le système utilise **deux tables** pour gérer les médecins :
1. **`utilisateurs`** : Table pour l'authentification (login, mot de passe, rôle)
2. **`medecins`** : Table pour les informations professionnelles du médecin

## Relation entre les tables

```
utilisateurs (id_user) ←─── medecins (user_id)
```

- Chaque médecin **DOIT** avoir un compte utilisateur
- Chaque compte utilisateur avec `role='medecin'` **DOIT** avoir un enregistrement dans `medecins`
- La relation est via `user_id` dans la table `medecins`

## Règles de cohérence

### 1. Obligations
- ✅ Un médecin **DOIT** avoir un `user_id` (sauf cas exceptionnel de migration)
- ✅ Un utilisateur avec `role='medecin'` **DOIT** avoir un enregistrement dans `medecins`
- ✅ L'`email` doit être synchronisé entre les deux tables
- ✅ Le `centre_id` doit être synchronisé entre les deux tables

### 2. Validations
- ✅ Vérifier que l'email n'existe pas déjà dans `utilisateurs`
- ✅ Vérifier que l'email n'existe pas déjà dans `medecins`
- ✅ Vérifier que le `numero_licence` n'existe pas déjà
- ✅ Vérifier que le `centre_id` existe et est actif
- ✅ Si `user_id` est fourni, vérifier qu'il n'a pas déjà un médecin associé
- ✅ Si `user_id` est fourni, vérifier qu'il existe et a `role='medecin'`

## Flux de création

### Scénario 1 : Création par un admin (medecinController)

1. **Validation des données** : Vérifier les champs requis
2. **Validation d'intégrité** : Utiliser `DataIntegrityValidators`
3. **Vérification de l'email** : Vérifier dans `utilisateurs` et `medecins`
4. **Vérification du centre** : Vérifier que le centre existe et est actif
5. **Création de l'utilisateur** (si `user_id` non fourni) :
   - Générer un nom d'utilisateur unique
   - Créer l'utilisateur avec `role='medecin'` et `centre_id`
   - Utiliser le numéro de licence comme mot de passe par défaut
6. **Création du médecin** :
   - Lier avec `user_id`
   - Synchroniser `email` et `centre_id`
7. **Transaction** : Utiliser une transaction pour garantir la cohérence

### Scénario 2 : Inscription par le médecin (authController)

1. **Validation des données** : Vérifier les champs requis
2. **Vérification de l'email** : Vérifier dans `utilisateurs`
3. **Création de l'utilisateur** :
   - Créer avec `role='medecin'`
   - Passer le `centre_id` si fourni
4. **Validation des données médecin** : Vérifier les champs requis
5. **Vérification de l'email dans medecins** : Vérifier que l'email n'existe pas
6. **Vérification du centre** : Vérifier que le centre existe et est actif
7. **Création du médecin** :
   - Lier avec `user_id`
   - Synchroniser `email` et `centre_id`
8. **Transaction** : Utiliser une transaction pour garantir la cohérence

## Problèmes identifiés et corrections

### Problème 1 : Pas de transaction
**Impact** : Si la création du médecin échoue après la création de l'utilisateur, l'utilisateur reste orphelin.

**Solution** : Utiliser `executeTransaction` pour garantir que tout est créé ou rien.

### Problème 2 : Pas de vérification de duplication
**Impact** : Un utilisateur peut avoir plusieurs médecins associés, ou un médecin peut être créé avec un email déjà utilisé.

**Solution** : Vérifier avant la création que :
- L'email n'existe pas dans `medecins`
- Le `user_id` n'a pas déjà un médecin associé
- Le `numero_licence` n'existe pas déjà

### Problème 3 : centre_id non synchronisé
**Impact** : Le `centre_id` dans `utilisateurs` et `medecins` peut être différent.

**Solution** : Synchroniser le `centre_id` lors de la création et de la mise à jour.

### Problème 4 : Pas de vérification du centre
**Impact** : Un médecin peut être créé avec un `centre_id` inexistant ou inactif.

**Solution** : Vérifier que le centre existe et est actif avant la création.

### Problème 5 : user_id fourni non vérifié
**Impact** : Un médecin peut être créé avec un `user_id` qui n'existe pas ou qui a déjà un médecin.

**Solution** : Vérifier que :
- Le `user_id` existe
- Le `user_id` a `role='medecin'`
- Le `user_id` n'a pas déjà un médecin associé

## Corrections apportées

1. ✅ **Vérification du centre** : Vérification que le centre existe et est actif avant création
2. ✅ **Vérification de l'email** : Vérification que l'email n'existe pas dans `medecins` avant création
3. ✅ **Vérification du numéro de licence** : Vérification que le numéro de licence n'existe pas déjà
4. ✅ **Vérification du user_id** : Si `user_id` est fourni, vérification qu'il existe, a le rôle `medecin`, et n'a pas déjà un médecin associé
5. ✅ **Synchronisation du centre_id** : Synchronisation du `centre_id` entre `utilisateurs` et `medecins`
6. ✅ **Synchronisation de l'email** : Synchronisation de l'email entre `utilisateurs` et `medecins`
7. ✅ **Rollback en cas d'erreur** : Si la création du médecin échoue après la création de l'utilisateur, suppression réelle de l'utilisateur créé
8. ✅ **Validation d'intégrité** : Utilisation de `DataIntegrityValidators` pour valider les données du médecin
9. ✅ **Prénom optionnel** : Support du prénom optionnel (peut être vide pour les malgaches)
10. ✅ **Centre_id dans utilisateurs** : Le `centre_id` est maintenant passé lors de la création de l'utilisateur médecin

## Utilisation

### Créer un médecin par un admin

```javascript
POST /api/medecins
{
  "nom": "Dupont",
  "prenom": "Jean",
  "sexe": "M",
  "date_naissance": "1980-01-01",
  "specialite": "Médecine générale",
  "numero_licence": "MG123",
  "telephone": "+221776123456",
  "email": "jean.dupont@example.com",
  "centre_id": 1  // Optionnel si admin_centre (auto-assigné)
}
```

### Inscription d'un médecin

```javascript
POST /api/auth/register
{
  "nom_utilisateur": "jean.dupont",
  "email": "jean.dupont@example.com",
  "mot_de_passe": "password123",
  "role": "medecin",
  "nom": "Dupont",
  "prenom": "Jean",
  "sexe": "M",
  "date_naissance": "1980-01-01",
  "specialite": "Médecine générale",
  "numero_licence": "MG123",
  "telephone": "+221776123456",
  "centre_id": 1
}
```

## Notes importantes

1. **Prénom optionnel** : Le prénom peut être vide pour les malgaches
2. **Mot de passe par défaut** : Si créé par un admin, le mot de passe par défaut est le numéro de licence
3. **Centre auto-assigné** : Pour les `admin_centre`, le centre est automatiquement assigné
4. **Transaction** : Toutes les créations utilisent des transactions pour garantir la cohérence

