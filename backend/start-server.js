const app = require('./src/app');
const { testConnection } = require('./src/config/database');
const port = process.env.PORT || 3000;

console.log('🚀 Démarrage du serveur...');

(async () => {
  try {
    // Test de la connexion à la base de données
    console.log('🔍 Test de la connexion à la base de données...');
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.error('❌ Impossible de se connecter à la base de données');
      process.exit(1);
    }
    
    console.log('✅ Connexion à la base de données MySQL établie avec succès');
    console.log('   📊 Base: sante_db sur localhost:3306');
    
    // Démarrer le serveur
    const server = app.listen(port, () => {
      console.log(`🚀 Serveur démarré sur le port ${port}`);
      console.log(`📱 API accessible sur http://localhost:${port}`);
      console.log(`🔍 Test de la base de données: npm run db:test`);
    });
    
    // Gestion des erreurs du serveur
    server.on('error', (err) => {
      console.error('❌ Erreur du serveur:', err);
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Le port ${port} est déjà utilisé`);
        process.exit(1);
      }
    });
    
    // Gestion de l'arrêt propre
    process.on('SIGINT', () => {
      console.log('\n🛑 Arrêt du serveur...');
      server.close(() => {
        console.log('✅ Serveur arrêté proprement');
        process.exit(0);
      });
    });
    
    process.on('SIGTERM', () => {
      console.log('\n🛑 Arrêt du serveur...');
      server.close(() => {
        console.log('✅ Serveur arrêté proprement');
        process.exit(0);
      });
    });
    
  } catch (err) {
    console.error('❌ Erreur au démarrage:', err);
    process.exit(1);
  }
})();
