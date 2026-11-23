/**
 * Script de configuration de la base de données de test
 * Crée la base de données de test et exécute tous les scripts SQL nécessaires
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 3306,
  multipleStatements: true
};

const TEST_DB_NAME = process.env.DB_TEST_NAME || 'sante_db_test';

// Ordre d'exécution des scripts SQL
const SQL_SCRIPTS = [
  '001_regions.sql',
  '002_centres.sql',
  '003_utilisateurs.sql',
  '004_patients.sql',
  '005_medecins.sql',
  '006_fiches_medicales.sql',
  '006_medicaments.sql',  // Doit être avant prescriptions
  '007_rendez_vous.sql',
  '007_prescriptions.sql',
  '008_vaccinations.sql',
  '008_statistiques.sql',
  '009_notifications.sql',
  '011_documents_medicaux.sql'
];

async function setupTestDatabase() {
  let connection;
  
  try {
    console.log('🔧 Configuration de la base de données de test...\n');
    
    // Connexion sans base de données spécifique
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Connexion à MySQL établie');
    
    // Supprimer la base de données de test si elle existe
    console.log(`🗑️  Suppression de la base de données '${TEST_DB_NAME}' si elle existe...`);
    await connection.query(`DROP DATABASE IF EXISTS \`${TEST_DB_NAME}\``);
    console.log('✅ Base de données supprimée (si elle existait)');
    
    // Créer la base de données de test
    console.log(`📦 Création de la base de données '${TEST_DB_NAME}'...`);
    await connection.query(`CREATE DATABASE \`${TEST_DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log('✅ Base de données créée');
    
    // Sélectionner la base de données
    await connection.query(`USE \`${TEST_DB_NAME}\``);
    console.log(`✅ Base de données '${TEST_DB_NAME}' sélectionnée\n`);
    
    // Chemin vers les scripts SQL
    const sqlDir = path.join(__dirname, '../../../database/sql/parts');
    
    // Exécuter chaque script SQL dans l'ordre
    for (const script of SQL_SCRIPTS) {
      const scriptPath = path.join(sqlDir, script);
      
      if (!fs.existsSync(scriptPath)) {
        console.log(`⚠️  Script non trouvé: ${script} - ignoré`);
        continue;
      }
      
      console.log(`📄 Exécution de ${script}...`);
      const sql = fs.readFileSync(scriptPath, 'utf8');
      
      // Remplacer USE sante_db par USE test database
      const modifiedSql = sql.replace(/USE\s+sante_db\s*;/gi, `USE \`${TEST_DB_NAME}\`;`);
      
      await connection.query(modifiedSql);
      console.log(`✅ ${script} exécuté avec succès`);
    }
    
    console.log('\n✅ Base de données de test configurée avec succès!');
    console.log(`📊 Base de données: ${TEST_DB_NAME}`);
    console.log(`🔗 Host: ${DB_CONFIG.host}:${DB_CONFIG.port}\n`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la configuration de la base de données de test:');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    if (error.sql) {
      console.error('SQL:', error.sql.substring(0, 200));
    }
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connexion fermée');
    }
  }
}

// Exécuter le script
if (require.main === module) {
  setupTestDatabase()
    .then(() => {
      console.log('\n✨ Configuration terminée!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Échec de la configuration:', error);
      process.exit(1);
    });
}

module.exports = { setupTestDatabase };

