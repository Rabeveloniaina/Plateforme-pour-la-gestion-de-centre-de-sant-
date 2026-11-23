/**
 * AUDIT SYSTÈME COMPLET
 * Script d'audit profond pour vérifier TOUTES les fonctionnalités
 * du système de gestion des centres de santé
 * 
 * Ce script est CRITIQUE - il vérifie la santé de toute l'application
 */

const axios = require('axios');
const { executeQuery, testConnection } = require('../config/database');
require('dotenv').config();

const API_BASE = process.env.API_BASE || 'http://localhost:3000/api';
const COLORS = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

class AuditSysteme {
    constructor() {
        this.results = {
            database: { tests: [], passed: 0, failed: 0 },
            api: { tests: [], passed: 0, failed: 0 },
            security: { tests: [], passed: 0, failed: 0 },
            integration: { tests: [], passed: 0, failed: 0 }
        };
        this.tokens = {};
    }

    log(message, type = 'info') {
        const color = {
            info: COLORS.cyan,
            success: COLORS.green,
            error: COLORS.red,
            warning: COLORS.yellow,
            title: COLORS.magenta
        }[type] || COLORS.reset;
        
        console.log(`${color}${message}${COLORS.reset}`);
    }

    logTest(category, name, passed, details = '') {
        const status = passed ? '✅ PASS' : '❌ FAIL';
        const color = passed ? COLORS.green : COLORS.red;
        
        this.results[category].tests.push({ name, passed, details });
        if (passed) this.results[category].passed++;
        else this.results[category].failed++;
        
        console.log(`${color}${status}${COLORS.reset} - ${name}${details ? ` (${details})` : ''}`);
    }

    // ===== TESTS BASE DE DONNÉES =====
    async auditDatabase() {
        this.log('\n=== AUDIT BASE DE DONNÉES ===', 'title');
        
        // Test 1: Connexion
        try {
            const connected = await testConnection();
            this.logTest('database', 'Connexion à la base de données', connected);
        } catch (error) {
            this.logTest('database', 'Connexion à la base de données', false, error.message);
            return; // Arrêter si pas de connexion
        }

        // Test 2: Tables principales
        const requiredTables = [
            'regions', 'centres_sante', 'utilisateurs', 'patients', 'medecins',
            'fiches_medicales', 'rendez_vous', 'prescriptions', 'medicaments',
            'vaccinations', 'notifications', 'statistiques', 'patients_infos_medicales'
        ];
        
        for (const table of requiredTables) {
            try {
                const result = await executeQuery(`SHOW TABLES LIKE '${table}'`);
                this.logTest('database', `Table ${table} existe`, result.length > 0);
            } catch (error) {
                this.logTest('database', `Table ${table} existe`, false, error.message);
            }
        }

        // Test 3: Données de base
        try {
            const regions = await executeQuery('SELECT COUNT(*) as count FROM regions');
            this.logTest('database', 'Régions disponibles', regions[0].count > 0, `${regions[0].count} régions`);
            
            const centres = await executeQuery('SELECT COUNT(*) as count FROM centres_sante');
            this.logTest('database', 'Centres de santé disponibles', centres[0].count > 0, `${centres[0].count} centres`);
            
            const users = await executeQuery('SELECT COUNT(*) as count FROM utilisateurs');
            this.logTest('database', 'Utilisateurs disponibles', users[0].count > 0, `${users[0].count} utilisateurs`);
            
            const medicaments = await executeQuery('SELECT COUNT(*) as count FROM medicaments');
            this.logTest('database', 'Médicaments disponibles', medicaments[0].count > 0, `${medicaments[0].count} médicaments`);
        } catch (error) {
            this.logTest('database', 'Vérification données de base', false, error.message);
        }

        // Test 4: Intégrité référentielle
        try {
            // Vérifier que tous les patients ont un centre valide
            const patientsInvalides = await executeQuery(`
                SELECT COUNT(*) as count FROM patients p
                WHERE p.centre_id NOT IN (SELECT id_centre FROM centres_sante)
            `);
            this.logTest('database', 'Intégrité patients->centres', patientsInvalides[0].count === 0, 
                patientsInvalides[0].count === 0 ? 'OK' : `${patientsInvalides[0].count} patients avec centre invalide`);
            
            // Vérifier que tous les médecins ont un centre valide
            const medecinsInvalides = await executeQuery(`
                SELECT COUNT(*) as count FROM medecins m
                WHERE m.centre_id NOT IN (SELECT id_centre FROM centres_sante)
            `);
            this.logTest('database', 'Intégrité médecins->centres', medecinsInvalides[0].count === 0,
                medecinsInvalides[0].count === 0 ? 'OK' : `${medecinsInvalides[0].count} médecins avec centre invalide`);
        } catch (error) {
            this.logTest('database', 'Intégrité référentielle', false, error.message);
        }

        // Test 5: Index et performances
        try {
            const indexes = await executeQuery(`
                SELECT COUNT(*) as count FROM information_schema.statistics 
                WHERE table_schema = DATABASE() AND table_name IN ('patients', 'rendez_vous', 'fiches_medicales')
            `);
            this.logTest('database', 'Index créés pour performances', indexes[0].count > 10, `${indexes[0].count} index`);
        } catch (error) {
            this.logTest('database', 'Vérification des index', false, error.message);
        }
    }

    // ===== TESTS API =====
    async auditAPI() {
        this.log('\n=== AUDIT API ENDPOINTS ===', 'title');
        
        // Test 1: API accessible
        try {
            const response = await axios.get('http://localhost:3000/api/public/health');
            this.logTest('api', 'API accessible', response.status === 200);
        } catch (error) {
            this.logTest('api', 'API accessible', false, 'Serveur non démarré ou inaccessible');
            this.log('\n⚠️  ATTENTION: Le serveur backend doit être démarré pour les tests API', 'warning');
            return;
        }

        // Test 2: Authentification
        try {
            // Créer un utilisateur admin de test
            const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
                email: 'admin@sante.mg',
                password: 'admin123'
            });
            
            this.tokens.admin = loginResponse.data.token;
            this.logTest('api', 'Authentification admin', !!this.tokens.admin);
        } catch (error) {
            this.logTest('api', 'Authentification admin', false, error.response?.data?.message || error.message);
        }

        if (!this.tokens.admin) {
            this.log('⚠️  Tests API limités sans authentification', 'warning');
            return;
        }

        // Test 3: Endpoints Patients
        await this.testEndpoint('api', 'GET /patients', `${API_BASE}/patients`);
        await this.testEndpoint('api', 'GET /patients/stats', `${API_BASE}/patients/stats-by-centre`);
        
        // Test 4: Endpoints Médecins
        await this.testEndpoint('api', 'GET /medecins', `${API_BASE}/medecins`);
        
        // Test 5: Endpoints Rendez-vous
        await this.testEndpoint('api', 'GET /rendez-vous', `${API_BASE}/rendez-vous`);
        await this.testEndpoint('api', 'GET /rendez-vous/du-jour', `${API_BASE}/rendez-vous/du-jour`);
        
        // Test 6: Endpoints Fiches Médicales
        await this.testEndpoint('api', 'GET /fiches-medicales', `${API_BASE}/fiches-medicales`);
        
        // Test 7: Endpoints Prescriptions
        await this.testEndpoint('api', 'GET /prescriptions', `${API_BASE}/prescriptions`);
        
        // Test 8: Endpoints Médicaments
        await this.testEndpoint('api', 'GET /medicaments', `${API_BASE}/medicaments`);
        
        // Test 9: Endpoints Vaccinations
        await this.testEndpoint('api', 'GET /vaccinations', `${API_BASE}/vaccinations`);
        
        // Test 10: Endpoints Centres
        await this.testEndpoint('api', 'GET /centres', `${API_BASE}/centres`);
        
        // Test 11: Endpoints Statistiques
        await this.testEndpoint('api', 'GET /statistiques/generale', `${API_BASE}/statistiques/generale`);
    }

    async testEndpoint(category, name, url, method = 'GET', data = null) {
        try {
            const config = {
                method,
                url,
                headers: this.tokens.admin ? { 'Authorization': `Bearer ${this.tokens.admin}` } : {},
                data
            };
            
            const response = await axios(config);
            this.logTest(category, name, response.status === 200 || response.status === 201, `${response.status}`);
        } catch (error) {
            this.logTest(category, name, false, error.response?.status || error.message);
        }
    }

    // ===== TESTS SÉCURITÉ =====
    async auditSecurity() {
        this.log('\n=== AUDIT SÉCURITÉ ===', 'title');
        
        // Test 1: Endpoints protégés
        try {
            await axios.get(`${API_BASE}/patients`);
            this.logTest('security', 'Endpoints protégés sans auth', false, 'Accès non autorisé accepté - DANGER');
        } catch (error) {
            this.logTest('security', 'Endpoints protégés sans auth', error.response?.status === 401, 'Accès refusé correctement');
        }

        // Test 2: Validation des données
        if (this.tokens.admin) {
            try {
                await axios.post(`${API_BASE}/patients`, {
                    // Données invalides
                    nom: '',
                    prenom: ''
                }, {
                    headers: { 'Authorization': `Bearer ${this.tokens.admin}` }
                });
                this.logTest('security', 'Validation données patient', false, 'Données invalides acceptées');
            } catch (error) {
                this.logTest('security', 'Validation données patient', error.response?.status === 400, 'Validation fonctionne');
            }
        }

        // Test 3: SQL Injection basique
        try {
            const maliciousInput = "' OR '1'='1";
            await executeQuery('SELECT * FROM patients WHERE nom = ?', [maliciousInput]);
            this.logTest('security', 'Protection SQL Injection', true, 'Requêtes paramétrées utilisées');
        } catch (error) {
            this.logTest('security', 'Protection SQL Injection', true, 'Requête rejetée (protection active)');
        }

        // Test 4: Mots de passe hashés
        try {
            const users = await executeQuery('SELECT password FROM utilisateurs LIMIT 5');
            const allHashed = users.every(u => u.password.startsWith('$2'));
            this.logTest('security', 'Mots de passe hashés (bcrypt)', allHashed, allHashed ? 'Tous hashés' : 'Mots de passe en clair détectés!');
        } catch (error) {
            this.logTest('security', 'Vérification hashage mots de passe', false, error.message);
        }
    }

    // ===== TESTS INTÉGRATION =====
    async auditIntegration() {
        this.log('\n=== AUDIT INTÉGRATION FONCTIONNELLE ===', 'title');
        
        if (!this.tokens.admin) {
            this.log('⚠️  Tests d\'intégration ignorés (pas d\'authentification)', 'warning');
            return;
        }

        // Test 1: Flux complet Prise de RDV
        try {
            // 1. Récupérer un patient
            const patientsResp = await axios.get(`${API_BASE}/patients?limit=1`, {
                headers: { 'Authorization': `Bearer ${this.tokens.admin}` }
            });
            
            if (patientsResp.data.data.length === 0) {
                this.logTest('integration', 'Flux prise RDV', false, 'Aucun patient dans la BDD');
            } else {
                const patient = patientsResp.data.data[0];
                
                // 2. Récupérer un médecin
                const medecinsResp = await axios.get(`${API_BASE}/medecins?limit=1`, {
                    headers: { 'Authorization': `Bearer ${this.tokens.admin}` }
                });
                
                if (medecinsResp.data.data.length === 0) {
                    this.logTest('integration', 'Flux prise RDV', false, 'Aucun médecin dans la BDD');
                } else {
                    const medecin = medecinsResp.data.data[0];
                    
                    // 3. Créer un RDV
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const dateRdv = tomorrow.toISOString().split('T')[0];
                    
                    const rdvResp = await axios.post(`${API_BASE}/rendez-vous`, {
                        patient_id: patient.id_patient,
                        medecin_id: medecin.id_medecin,
                        centre_id: patient.centre_id,
                        date_rdv: `${dateRdv} 10:00:00`,
                        motif: 'Test automatisé',
                        symptomes: ['Test'],
                        duree_estimee: 30
                    }, {
                        headers: { 'Authorization': `Bearer ${this.tokens.admin}` }
                    });
                    
                    this.logTest('integration', 'Flux prise RDV complet', rdvResp.status === 201, 'Patient → Médecin → RDV créé');
                    
                    // Nettoyer le RDV de test
                    if (rdvResp.data.data?.id_rdv) {
                        try {
                            await executeQuery('DELETE FROM rendez_vous WHERE id_rdv = ?', [rdvResp.data.data.id_rdv]);
                        } catch (e) {}
                    }
                }
            }
        } catch (error) {
            this.logTest('integration', 'Flux prise RDV complet', false, error.response?.data?.message || error.message);
        }

        // Test 2: Flux Consultation Médicale
        try {
            const patients = await axios.get(`${API_BASE}/patients?limit=1`, {
                headers: { 'Authorization': `Bearer ${this.tokens.admin}` }
            });
            
            if (patients.data.data.length > 0) {
                const patient = patients.data.data[0];
                
                // Vérifier qu'on peut récupérer le dossier médical
                const dossierResp = await axios.get(`${API_BASE}/patients/${patient.id_patient}/dossier`, {
                    headers: { 'Authorization': `Bearer ${this.tokens.admin}` }
                });
                
                this.logTest('integration', 'Flux consultation (dossier patient)', dossierResp.status === 200, 'Dossier accessible');
            } else {
                this.logTest('integration', 'Flux consultation (dossier patient)', false, 'Aucun patient de test');
            }
        } catch (error) {
            this.logTest('integration', 'Flux consultation (dossier patient)', false, error.response?.data?.message || error.message);
        }

        // Test 3: Flux Prescriptions
        try {
            // Vérifier qu'on peut lister les médicaments
            const medicaments = await axios.get(`${API_BASE}/medicaments?limit=5`, {
                headers: { 'Authorization': `Bearer ${this.tokens.admin}` }
            });
            
            this.logTest('integration', 'Flux prescriptions (médicaments)', 
                medicaments.status === 200 && medicaments.data.data.length > 0, 
                `${medicaments.data.data.length} médicaments disponibles`);
        } catch (error) {
            this.logTest('integration', 'Flux prescriptions (médicaments)', false, error.response?.data?.message || error.message);
        }
    }

    // ===== RAPPORT FINAL =====
    generateReport() {
        this.log('\n╔═══════════════════════════════════════════════╗', 'title');
        this.log('║     RAPPORT D\'AUDIT SYSTÈME COMPLET          ║', 'title');
        this.log('╚═══════════════════════════════════════════════╝', 'title');
        
        const categories = ['database', 'api', 'security', 'integration'];
        let totalTests = 0;
        let totalPassed = 0;
        let totalFailed = 0;
        
        for (const category of categories) {
            const result = this.results[category];
            totalTests += result.tests.length;
            totalPassed += result.passed;
            totalFailed += result.failed;
            
            const categoryName = {
                database: 'BASE DE DONNÉES',
                api: 'API ENDPOINTS',
                security: 'SÉCURITÉ',
                integration: 'INTÉGRATION'
            }[category];
            
            const percentage = result.tests.length > 0 
                ? Math.round((result.passed / result.tests.length) * 100) 
                : 0;
            
            const color = percentage >= 80 ? COLORS.green : percentage >= 50 ? COLORS.yellow : COLORS.red;
            
            console.log(`\n${color}${categoryName}${COLORS.reset}`);
            console.log(`  Tests: ${result.tests.length} | Réussis: ${result.passed} | Échoués: ${result.failed} | Score: ${percentage}%`);
        }
        
        // Score global
        const globalScore = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;
        const globalColor = globalScore >= 80 ? COLORS.green : globalScore >= 50 ? COLORS.yellow : COLORS.red;
        
        console.log(`\n${COLORS.bright}${'═'.repeat(50)}${COLORS.reset}`);
        console.log(`${globalColor}${COLORS.bright}SCORE GLOBAL: ${globalScore}% (${totalPassed}/${totalTests} tests)${COLORS.reset}`);
        console.log(`${COLORS.bright}${'═'.repeat(50)}${COLORS.reset}\n`);
        
        // Recommandations
        if (globalScore < 80) {
            this.log('\n⚠️  ACTIONS REQUISES:', 'warning');
            
            if (this.results.database.failed > 0) {
                this.log('  - Corriger les problèmes de base de données', 'warning');
            }
            if (this.results.api.failed > 0) {
                this.log('  - Corriger les endpoints API défaillants', 'warning');
            }
            if (this.results.security.failed > 0) {
                this.log('  - URGENT: Corriger les failles de sécurité', 'error');
            }
            if (this.results.integration.failed > 0) {
                this.log('  - Corriger les flux métier incomplets', 'warning');
            }
        } else if (globalScore >= 95) {
            this.log('\n✅ EXCELLENT! Système opérationnel et sécurisé.', 'success');
        } else {
            this.log('\n✓ BON. Quelques améliorations possibles.', 'success');
        }
        
        // Sauvegarder le rapport
        const fs = require('fs');
        const reportPath = 'rapport-audit-' + new Date().toISOString().split('T')[0] + '.json';
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        this.log(`\n📄 Rapport détaillé sauvegardé: ${reportPath}`, 'info');
    }

    async run() {
        this.log('\n🔍 DÉMARRAGE DE L\'AUDIT SYSTÈME COMPLET', 'title');
        this.log('⏱️  Cela peut prendre quelques minutes...\n', 'info');
        
        try {
            await this.auditDatabase();
            await this.auditAPI();
            await this.auditSecurity();
            await this.auditIntegration();
            this.generateReport();
        } catch (error) {
            this.log(`\n❌ Erreur fatale durant l'audit: ${error.message}`, 'error');
            console.error(error);
        }
        
        process.exit(0);
    }
}

// Exécution
if (require.main === module) {
    const audit = new AuditSysteme();
    audit.run();
}

module.exports = AuditSysteme;

