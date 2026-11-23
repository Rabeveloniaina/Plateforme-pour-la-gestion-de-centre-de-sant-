const app = require('./app');
const { testConnection } = require('./config/database');
const port = process.env.PORT || 5000;

(async () => {
  try {
    // Test de la connexion à la base de données
    console.log('🔍 Test de la connexion à la base de données...');
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.error('❌ Impossible de se connecter à la base de données');
      process.exit(1);
    }
    
    // Démarrer le serveur
    app.listen(port, () => {
      console.log(`🚀 Serveur démarré sur le port ${port}`);
      console.log(`📱 API accessible sur http://localhost:${port}`);
      console.log(`🔍 Test de la base de données: npm run db:test`);
      
      // Démarrer le scheduler de notifications automatiques
      try {
        const scheduler = require('./services/notificationScheduler');
        scheduler.start();
        // Note: Le scheduler affichera lui-même si node-cron n'est pas disponible
      } catch (error) {
        console.warn('⚠️  Impossible de démarrer le scheduler de notifications:', error.message);
        console.warn('   Les rappels automatiques ne seront pas envoyés.');
        console.warn('   Solution: npm install node-cron (dans le dossier backend)');
      }

      // Démarrer le scheduler de gestion dynamique des statuts
      try {
        const statutScheduler = require('./services/statutDynamiqueScheduler');
        statutScheduler.start();
        // Note: Le scheduler affichera lui-même si node-cron n'est pas disponible
      } catch (error) {
        console.warn('⚠️  Impossible de démarrer le scheduler de statut dynamique:', error.message);
      }
    });
    
  } catch (err) {
    console.error('❌ Erreur au démarrage:', err);
    process.exit(1);
  }
})();
