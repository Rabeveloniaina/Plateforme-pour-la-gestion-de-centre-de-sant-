const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const { requestIdMiddleware, errorHandler, notFoundMiddleware } = require('./middlewares/errorHandler');

const app = express();

// Middleware de sécurité
app.use(helmet());

// Configuration CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Rate limiting - Configuration générale
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite chaque IP à 100 requêtes par fenêtre
  message: {
    success: false,
    message: 'Trop de requêtes. Veuillez réessayer plus tard.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Retourne le rate limit dans les headers `RateLimit-*`
  legacyHeaders: false, // Désactive les headers `X-RateLimit-*`
});

// Rate limiting spécifique pour l'authentification (plus souple en développement)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 100 : 30, // Plus souple en développement
  message: {
    success: false,
    message: 'Trop de tentatives de connexion. Veuillez réessayer dans quelques minutes.',
    retryAfter: '15 minutes'
  },
  skipSuccessfulRequests: true, // Ne compte pas les connexions réussies
  standardHeaders: true,
  legacyHeaders: false,
});

// IMPORTANT: L'ordre est crucial ici
// Les routes d'authentification doivent être montées APRÈS le rate limiting
// pour que le rate limiting spécifique s'applique correctement

// Appliquer le rate limiting général aux routes API (sauf auth qui a son propre limiter)
// Note: Express applique les middlewares dans l'ordre, donc on doit être précis
app.use('/api/', (req, res, next) => {
  // Ne pas appliquer le limiter général aux routes d'authentification
  if (req.path.startsWith('/auth/login') || req.path.startsWith('/auth/register')) {
    return next();
  }
  return limiter(req, res, next);
});

// Appliquer le rate limiting spécifique aux routes d'authentification
// (doit être après le middleware général pour avoir priorité)
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Middleware pour parser le JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Correlation / Request ID
app.use(requestIdMiddleware);

// Route de santé
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Plateforme de Gestion des Centres de Santé',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Route pour réinitialiser le rate limit en développement uniquement
if (process.env.NODE_ENV === 'development') {
  app.post('/reset-rate-limit', (req, res) => {
    // Note: express-rate-limit stocke les données en mémoire
    // Pour vraiment réinitialiser, il faudrait redémarrer le serveur
    // Mais on peut au moins informer l'utilisateur
    res.json({
      success: true,
      message: 'Le rate limit est géré en mémoire. Pour le réinitialiser complètement, redémarrez le serveur backend.',
      note: 'En développement, la limite est de 100 requêtes par 15 minutes pour l\'authentification.'
    });
  });
}

// Route racine
app.get('/', (req, res) => {
  res.json({
    message: '🏥 API de la Plateforme de Gestion des Centres de Santé',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api'
    },
    documentation: {
      swagger: '/api-docs',
      readme: 'Consultez le README.md pour plus d\'informations'
    }
  });
});

// Routes API
const routes = require('./routes');

// Middleware de débogage pour toutes les requêtes API
app.use('/api', (req, res, next) => {
    console.log(`📥 Requête API reçue: ${req.method} ${req.originalUrl}`);
    console.log(`   Path: ${req.path}, Base URL: ${req.baseUrl || 'N/A'}`);
    next();
});

app.use('/api', routes);

// Middleware de débogage pour tracer les routes non trouvées
app.use('/api', (req, res, next) => {
    // Ce middleware ne s'exécute que si aucune route n'a été trouvée
    console.log(`⚠️ Route non trouvée après routage: ${req.method} ${req.originalUrl}`);
    next();
});

// Documentation Swagger (accessible sans authentification pour faciliter l'accès)
// Rendre Swagger optionnel au cas où les dépendances ne seraient pas installées
try {
    const swaggerRoutes = require('./routes/swagger');
    app.use('/api-docs', swaggerRoutes);
    console.log('✅ Documentation Swagger disponible à /api-docs');
} catch (error) {
    console.warn('⚠️  Swagger non disponible:', error.message);
    console.warn('   Pour activer Swagger, installez les dépendances:');
    console.warn('   npm install swagger-jsdoc swagger-ui-express');
    // Route de fallback pour Swagger
    app.use('/api-docs', (req, res) => {
        res.status(503).json({
            success: false,
            message: 'Documentation Swagger non disponible',
            error: 'Les dépendances swagger-jsdoc et swagger-ui-express doivent être installées',
            instruction: 'Exécutez: npm install swagger-jsdoc swagger-ui-express'
        });
    });
}

// Middleware de gestion d'erreurs (centralisé)
app.use(errorHandler);

// Route 404
app.use('*', notFoundMiddleware);

module.exports = app;
