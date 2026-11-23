// Configuration par défaut pour le développement
module.exports = {
    // Base de données
    database: {
        host: 'localhost',
        user: 'root',
        password: '',
        name: 'sante_db',
        port: 3306
    },
    
    // Serveur
    server: {
        port: 3000,
        nodeEnv: 'development'
    },
    
    // JWT
    jwt: {
        secret: 'secret_jwt_plateforme_sante_2024_dev',
        expiresIn: '24h'
    },
    
    // Notifications
    notifications: {
        twilio: {
            accountSid: '',
            authToken: '',
            phoneNumber: ''
        },
        email: {
            host: 'smtp.gmail.com',
            port: 587,
            user: '',
            pass: ''
        }
    },
    
    // CORS
    cors: {
        origin: ['http://localhost:3000', 'http://localhost:3001']
    }
};
