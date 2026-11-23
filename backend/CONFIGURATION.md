# 🔧 Guide de Configuration

## Variables d'Environnement

Créez un fichier `.env` dans le dossier `backend/` avec les variables suivantes :

```env
# Configuration de la Base de Données
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=sante_db
DB_PORT=3306

# Configuration du Serveur
PORT=5000
NODE_ENV=development

# Configuration JWT
JWT_SECRET=votre_secret_jwt_ici_changez_en_production
JWT_EXPIRES_IN=24h

# Configuration CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# Configuration Email (Nodemailer) - Optionnel
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre_email@gmail.com
SMTP_PASS=votre_mot_de_passe_application

# Configuration SMS (Twilio) - Optionnel
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

## Valeurs par Défaut

Si le fichier `.env` n'existe pas, l'application utilisera ces valeurs par défaut :

- **DB_HOST**: `localhost`
- **DB_USER**: `root`
- **DB_PASSWORD**: `` (vide)
- **DB_NAME**: `sante_db`
- **DB_PORT**: `3306`
- **PORT**: `5000` (backend) ou `3000` (selon config)
- **JWT_SECRET**: `secret_jwt_par_defaut_changez_en_production`
- **JWT_EXPIRES_IN**: `24h`

## Configuration des Services Externes

### Email (Nodemailer)

Pour activer les notifications par email :

1. Configurez un compte Gmail ou un serveur SMTP
2. Pour Gmail, créez un "Mot de passe d'application" :
   - Allez dans votre compte Google
   - Sécurité → Validation en 2 étapes
   - Mots de passe des applications → Créer
3. Utilisez ce mot de passe dans `SMTP_PASS`

### SMS (Twilio)

Pour activer les notifications par SMS :

1. Créez un compte sur [Twilio](https://www.twilio.com/)
2. Récupérez votre `Account SID` et `Auth Token`
3. Obtenez un numéro de téléphone Twilio
4. Configurez les variables dans `.env`

## Vérification de la Configuration

Pour vérifier votre configuration, exécutez :

```bash
cd backend
node src/scripts/check-config.js
```

## Tests

Pour tester l'authentification avec les données existantes :

```bash
cd backend
node src/scripts/test-auth-with-data.js
```

