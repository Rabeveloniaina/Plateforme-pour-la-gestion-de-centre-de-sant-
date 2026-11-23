/**
 * Script d'audit complet du système
 * Teste toutes les fonctionnalités implémentées pour déterminer ce qui fonctionne réellement
 */

const { testConnection, executeQuery } = require('../config/database');
const axios = require('axios');

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000/api';
const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

class AuditSysteme {
  constructor() {
    this.results = {
      database: { status: 'unknown', details: [] },
      api: { status: 'unknown', endpoints: {} },
      models: { status: 'unknown', tables: {} },
      routes: { status: 'unknown', routes: {} },
      frontend: { status: 'unknown', pages: {} },
      fonctionnalites: {
        gestion_patients: { status: 'unknown', details: [] },
        gestion_rdv: { status: 'unknown', details: [] },
        gestion_personnel: { status: 'unknown', details: [] },
        administration: { status: 'unknown', details: [] },
        statistiques: { status: 'unknown', details: [] },
        notifications: { status: 'unknown', details: [] }
      }
    };
    this.authToken = null;
  }

  log(message, color = 'reset') {
    console.log(`${COLORS[color]}${message}${COLORS.reset}`);
  }

  async testDatabase() {
    this.log('\n📊 TEST DE LA BASE DE DONNÉES', 'cyan');
    try {
      const connected = await testConnection();
      if (!connected) {
        this.results.database.status = 'failed';
        return;
      }

      this.results.database.status = 'success';
      this.log('✅ Connexion à la base de données réussie', 'green');

      // Vérifier les tables principales
      const tables = [
        'utilisateurs', 'patients', 'medecins', 'centres_sante',
        'rendez_vous', 'fiches_medicales', 'prescriptions', 'vaccinations',
        'medicaments', 'notifications', 'regions', 'documents_medicaux'
      ];

      for (const table of tables) {
        try {
          const result = await executeQuery(`SHOW TABLES LIKE '${table}'`);
          if (result.length > 0) {
            const count = await executeQuery(`SELECT COUNT(*) as count FROM ${table}`);
            this.results.models.tables[table] = {
              exists: true,
              count: count[0].count
            };
            this.log(`  ✅ Table ${table}: ${count[0].count} enregistrements`, 'green');
          } else {
            this.results.models.tables[table] = { exists: false };
            this.log(`  ❌ Table ${table}: n'existe pas`, 'red');
          }
        } catch (error) {
          this.results.models.tables[table] = { exists: false, error: error.message };
          this.log(`  ❌ Table ${table}: erreur - ${error.message}`, 'red');
        }
      }

      this.results.models.status = 'success';
    } catch (error) {
      this.results.database.status = 'failed';
      this.results.database.details.push(error.message);
      this.log(`❌ Erreur base de données: ${error.message}`, 'red');
    }
  }

  async testAPIHealth() {
    this.log('\n🌐 TEST DE L\'API', 'cyan');
    try {
      const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`);
      if (response.status === 200) {
        this.results.api.status = 'success';
        this.log('✅ API accessible', 'green');
        return true;
      }
    } catch (error) {
      this.results.api.status = 'failed';
      this.log(`❌ API non accessible: ${error.message}`, 'red');
      this.log('   💡 Assurez-vous que le serveur backend est démarré (npm start dans backend/)', 'yellow');
      return false;
    }
  }

  async testAuth() {
    this.log('\n🔐 TEST DE L\'AUTHENTIFICATION', 'cyan');
    try {
      // Test de connexion
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: 'admin@test.com',
        mot_de_passe: 'admin123'
      });

      if (loginResponse.data.success && loginResponse.data.token) {
        this.authToken = loginResponse.data.token;
        this.results.api.endpoints['/auth/login'] = { status: 'success' };
        this.log('✅ Authentification réussie', 'green');
        return true;
      }
    } catch (error) {
      this.results.api.endpoints['/auth/login'] = { 
        status: 'failed', 
        error: error.response?.data?.message || error.message 
      };
      this.log(`⚠️  Authentification échouée (normal si pas de données de test)`, 'yellow');
      return false;
    }
  }

  async testEndpoints() {
    this.log('\n🔍 TEST DES ENDPOINTS API', 'cyan');
    
    const endpoints = [
      { method: 'GET', path: '/patients', requiresAuth: true },
      { method: 'GET', path: '/medecins', requiresAuth: true },
      { method: 'GET', path: '/centres', requiresAuth: true },
      { method: 'GET', path: '/rendez-vous', requiresAuth: true },
      { method: 'GET', path: '/fiches-medicales', requiresAuth: true },
      { method: 'GET', path: '/prescriptions', requiresAuth: true },
      { method: 'GET', path: '/vaccinations', requiresAuth: true },
      { method: 'GET', path: '/medicaments', requiresAuth: true },
      { method: 'GET', path: '/statistiques/centre', requiresAuth: true },
      { method: 'GET', path: '/notifications', requiresAuth: true },
      { method: 'GET', path: '/regions', requiresAuth: false },
      { method: 'GET', path: '/public/centres', requiresAuth: false }
    ];

    for (const endpoint of endpoints) {
      try {
        const config = {
          method: endpoint.method,
          url: `${API_BASE_URL}${endpoint.path}`,
          headers: endpoint.requiresAuth && this.authToken 
            ? { Authorization: `Bearer ${this.authToken}` }
            : {}
        };

        const response = await axios(config);
        this.results.api.endpoints[endpoint.path] = {
          status: 'success',
          method: endpoint.method,
          statusCode: response.status
        };
        this.log(`  ✅ ${endpoint.method} ${endpoint.path}`, 'green');
      } catch (error) {
        const status = error.response?.status;
        const isAuthError = status === 401 || status === 403;
        this.results.api.endpoints[endpoint.path] = {
          status: isAuthError ? 'auth_required' : 'failed',
          method: endpoint.method,
          statusCode: status,
          error: error.response?.data?.message || error.message
        };
        if (isAuthError) {
          this.log(`  ⚠️  ${endpoint.method} ${endpoint.path} (authentification requise)`, 'yellow');
        } else {
          this.log(`  ❌ ${endpoint.method} ${endpoint.path}: ${error.response?.data?.message || error.message}`, 'red');
        }
      }
    }
  }

  async testFonctionnalites() {
    this.log('\n⚙️  TEST DES FONCTIONNALITÉS', 'cyan');

    // Test gestion patients
    this.log('\n  1️⃣  Gestion des patients', 'blue');
    try {
      if (this.authToken) {
        const response = await axios.get(`${API_BASE_URL}/patients`, {
          headers: { Authorization: `Bearer ${this.authToken}` }
        });
        if (response.data.success) {
          this.results.fonctionnalites.gestion_patients.status = 'success';
          this.results.fonctionnalites.gestion_patients.details.push(
            `Liste patients: ${response.data.data?.length || 0} patients`
          );
          this.log('     ✅ Liste des patients fonctionnelle', 'green');
        }
      } else {
        this.results.fonctionnalites.gestion_patients.status = 'auth_required';
        this.log('     ⚠️  Authentification requise pour tester', 'yellow');
      }
    } catch (error) {
      this.results.fonctionnalites.gestion_patients.status = 'failed';
      this.log(`     ❌ Erreur: ${error.message}`, 'red');
    }

    // Test gestion RDV
    this.log('\n  2️⃣  Gestion des rendez-vous', 'blue');
    try {
      if (this.authToken) {
        const response = await axios.get(`${API_BASE_URL}/rendez-vous`, {
          headers: { Authorization: `Bearer ${this.authToken}` }
        });
        if (response.data.success) {
          this.results.fonctionnalites.gestion_rdv.status = 'success';
          this.results.fonctionnalites.gestion_rdv.details.push(
            `Liste RDV: ${response.data.data?.length || 0} rendez-vous`
          );
          this.log('     ✅ Liste des rendez-vous fonctionnelle', 'green');
        }
      } else {
        this.results.fonctionnalites.gestion_rdv.status = 'auth_required';
        this.log('     ⚠️  Authentification requise pour tester', 'yellow');
      }
    } catch (error) {
      this.results.fonctionnalites.gestion_rdv.status = 'failed';
      this.log(`     ❌ Erreur: ${error.message}`, 'red');
    }

    // Test statistiques
    this.log('\n  3️⃣  Statistiques', 'blue');
    try {
      if (this.authToken) {
        const response = await axios.get(`${API_BASE_URL}/statistiques/centre`, {
          headers: { Authorization: `Bearer ${this.authToken}` }
        });
        if (response.data.success) {
          this.results.fonctionnalites.statistiques.status = 'success';
          this.log('     ✅ Statistiques par centre fonctionnelles', 'green');
        }
      } else {
        this.results.fonctionnalites.statistiques.status = 'auth_required';
        this.log('     ⚠️  Authentification requise pour tester', 'yellow');
      }
    } catch (error) {
      this.results.fonctionnalites.statistiques.status = 'failed';
      this.log(`     ❌ Erreur: ${error.message}`, 'red');
    }
  }

  async checkFrontendFiles() {
    this.log('\n🎨 VÉRIFICATION DU FRONTEND', 'cyan');
    const fs = require('fs');
    const path = require('path');

    const pagesDir = path.join(__dirname, '../../../frontend/src/pages');
    try {
      const files = fs.readdirSync(pagesDir);
      const pages = files.filter(f => f.endsWith('.tsx'));
      
      this.results.frontend.pages = {};
      for (const page of pages) {
        this.results.frontend.pages[page] = { exists: true };
        this.log(`  ✅ Page ${page}`, 'green');
      }
      this.results.frontend.status = 'success';
    } catch (error) {
      this.results.frontend.status = 'failed';
      this.log(`  ❌ Erreur lecture frontend: ${error.message}`, 'red');
    }
  }

  generateReport() {
    this.log('\n📋 RAPPORT D\'AUDIT', 'cyan');
    this.log('='.repeat(60), 'cyan');

    // Résumé
    this.log('\n📊 RÉSUMÉ', 'blue');
    this.log(`Base de données: ${this.results.database.status === 'success' ? '✅' : '❌'}`, 
      this.results.database.status === 'success' ? 'green' : 'red');
    this.log(`API: ${this.results.api.status === 'success' ? '✅' : '❌'}`, 
      this.results.api.status === 'success' ? 'green' : 'red');
    this.log(`Modèles: ${this.results.models.status === 'success' ? '✅' : '❌'}`, 
      this.results.models.status === 'success' ? 'green' : 'red');
    this.log(`Frontend: ${this.results.frontend.status === 'success' ? '✅' : '❌'}`, 
      this.results.frontend.status === 'success' ? 'green' : 'red');

    // Détails
    this.log('\n📝 DÉTAILS', 'blue');
    this.log(`Tables vérifiées: ${Object.keys(this.results.models.tables).length}`);
    this.log(`Endpoints testés: ${Object.keys(this.results.api.endpoints).length}`);

    return this.results;
  }

  async run() {
    this.log('🚀 DÉMARRAGE DE L\'AUDIT COMPLET DU SYSTÈME', 'cyan');
    this.log('='.repeat(60), 'cyan');

    await this.testDatabase();
    const apiAvailable = await this.testAPIHealth();
    
    if (apiAvailable) {
      await this.testAuth();
      await this.testEndpoints();
      await this.testFonctionnalites();
    }

    await this.checkFrontendFiles();

    const report = this.generateReport();
    
    // Sauvegarder le rapport
    const fs = require('fs');
    const path = require('path');
    const reportPath = path.join(__dirname, '../../../AUDIT_RESULTS.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    this.log(`\n💾 Rapport sauvegardé dans: ${reportPath}`, 'green');

    return report;
  }
}

// Exécution
if (require.main === module) {
  const audit = new AuditSysteme();
  audit.run().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('❌ Erreur lors de l\'audit:', error);
    process.exit(1);
  });
}

module.exports = AuditSysteme;

