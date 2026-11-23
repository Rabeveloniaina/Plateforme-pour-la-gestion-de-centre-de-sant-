// Configuration des variables d'environnement
require('dotenv').config();

const config = {
    // Base de données
    database: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        name: process.env.DB_NAME || 'sante_db',
        port: process.env.DB_PORT || 3306
    },
    
    // Serveur
    server: {
        port: process.env.PORT || 3000,
        nodeEnv: process.env.NODE_ENV || 'development'
    },
    
    // JWT
    jwt: {
        secret: process.env.JWT_SECRET || 'secret_jwt_par_defaut_changez_en_production',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    },
    
    // Notifications
    notifications: {
        twilio: {
            accountSid: process.env.TWILIO_ACCOUNT_SID || '',
            authToken: process.env.TWILIO_AUTH_TOKEN || '',
            phoneNumber: process.env.TWILIO_PHONE_NUMBER || ''
        },
        email: {
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || ''
        }
    },
    
    // CORS
    cors: {
        origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000', 'http://localhost:3001']
    }
};

// Validation de la configuration
const validateConfig = () => {
    const required = ['database.host', 'database.user', 'database.name'];
    const missing = [];
    
    required.forEach(key => {
        const value = key.split('.').reduce((obj, k) => obj && obj[k], config);
        if (!value) {
            missing.push(key);
        }
    });
    
    if (missing.length > 0) {
        console.warn('⚠️  Variables d\'environnement manquantes:', missing.join(', '));
        console.warn('📝 Utilisation des valeurs par défaut');
    }
    
    return missing.length === 0;
};

module.exports = {
    config,
    validateConfig
};
