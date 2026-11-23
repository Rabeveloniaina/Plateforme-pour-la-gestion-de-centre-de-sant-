#!/usr/bin/env node

/**
 * Script de vérification de la configuration
 * Vérifie que toutes les variables d'environnement nécessaires sont configurées
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');
const twilio = require('twilio');

console.log('🔧 Vérification de la configuration de la Plateforme Santé...\n');

// Couleurs pour l'affichage
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

const success = (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`);
const error = (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`);
const warning = (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`);
const info = (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`);

let hasErrors = false;
let hasWarnings = false;

// 1. Vérification des variables essentielles
console.log(`${colors.bold}1. Variables d'environnement essentielles${colors.reset}`);

const requiredVars = [
    { name: 'DB_HOST', value: process.env.DB_HOST, default: 'localhost' },
    { name: 'DB_USER', value: process.env.DB_USER, default: 'root' },
    { name: 'DB_NAME', value: process.env.DB_NAME, default: 'sante_db' },
    { name: 'JWT_SECRET', value: process.env.JWT_SECRET, minLength: 32 }
];

requiredVars.forEach(variable => {
    if (!variable.value && !variable.default) {
        error(`${variable.name} n'est pas définie`);
        hasErrors = true;
    } else if (!variable.value && variable.default) {
        warning(`${variable.name} utilise la valeur par défaut: ${variable.default}`);
        hasWarnings = true;
    } else if (variable.minLength && variable.value.length < variable.minLength) {
        error(`${variable.name} doit faire au moins ${variable.minLength} caractères`);
        hasErrors = true;
    } else {
        success(`${variable.name} configurée`);
    }
});

// Vérification spéciale pour JWT_SECRET
if (process.env.JWT_SECRET === 'secret_jwt_par_defaut_changez_en_production') {
    error('JWT_SECRET utilise encore la valeur par défaut ! Changez-la immédiatement.');
    hasErrors = true;
}

console.log();

// 2. Test de connexion à la base de données
console.log(`${colors.bold}2. Connexion à la base de données MySQL${colors.reset}`);

async function testDatabase() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'sante_db',
            port: process.env.DB_PORT || 3306
        });

        // Test de requête simple
        const [rows] = await connection.execute('SELECT 1 as test');
        await connection.end();

        success('Connexion à MySQL réussie');

        // Vérification des tables essentielles
        const connection2 = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'sante_db',
            port: process.env.DB_PORT || 3306
        });

        const tables = ['patients', 'medecins', 'rendez_vous', 'centres_sante', 'fiches_medicales', 'medicaments', 'prescriptions', 'vaccinations'];
        for (const table of tables) {
            try {
                await connection2.execute(`SELECT 1 FROM ${table} LIMIT 1`);
                success(`Table ${table} existe`);
            } catch (e) {
                if (table === 'fiches_medicales' || table === 'medicaments' || table === 'prescriptions' || table === 'vaccinations') {
                    warning(`Table ${table} manquante (nouvelles fonctionnalités) - Exécutez le script SQL`);
                    hasWarnings = true;
                } else {
                    error(`Table ${table} manquante - Base de données incomplète`);
                    hasErrors = true;
                }
            }
        }

        await connection2.end();

    } catch (err) {
        error(`Impossible de se connecter à MySQL: ${err.message}`);
        info('Vérifiez que MySQL est démarré et que les credentials sont corrects');
        hasErrors = true;
    }
}

// 3. Test des notifications SMS (Twilio)
console.log(`\n${colors.bold}3. Configuration Twilio (SMS)${colors.reset}`);

function testTwilio() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !phoneNumber) {
        warning('Twilio non configuré - Les SMS seront désactivés');
        info('Configurez TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN et TWILIO_PHONE_NUMBER pour activer les SMS');
        hasWarnings = true;
        return;
    }

    try {
        const client = twilio(accountSid, authToken);
        success('Credentials Twilio configurés');
        info('Test d\'envoi SMS non effectué (éviter les frais)');
    } catch (err) {
        error(`Configuration Twilio invalide: ${err.message}`);
        hasErrors = true;
    }
}

// 4. Test des notifications Email (SMTP)
console.log(`\n${colors.bold}4. Configuration SMTP (Email)${colors.reset}`);

async function testSMTP() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
        warning('SMTP non configuré - Les emails seront désactivés');
        info('Configurez SMTP_HOST, SMTP_USER et SMTP_PASS pour activer les emails');
        hasWarnings = true;
        return;
    }

    try {
        const transporter = nodemailer.createTransporter({
            host: host,
            port: process.env.SMTP_PORT || 587,
            secure: false,
            auth: {
                user: user,
                pass: pass
            }
        });

        await transporter.verify();
        success('Configuration SMTP valide');
        info('Test d\'envoi email non effectué');
    } catch (err) {
        error(`Configuration SMTP invalide: ${err.message}`);
        info('Vérifiez vos credentials SMTP et la configuration du serveur');
        hasErrors = true;
    }
}

// 5. Vérification de la configuration CORS
console.log(`\n${colors.bold}5. Configuration CORS${colors.reset}`);

function testCORS() {
    const corsOrigin = process.env.CORS_ORIGIN;
    
    if (!corsOrigin) {
        warning('CORS_ORIGIN non définie - Utilisation des valeurs par défaut');
        hasWarnings = true;
    } else {
        const origins = corsOrigin.split(',');
        success(`CORS configuré pour ${origins.length} origine(s):`);
        origins.forEach(origin => info(`  - ${origin.trim()}`));
    }
}

// Exécution des tests
async function runTests() {
    await testDatabase();
    testTwilio();
    await testSMTP();
    testCORS();

    // Résumé final
    console.log(`\n${colors.bold}📋 Résumé de la configuration${colors.reset}`);
    
    if (hasErrors) {
        error('Configuration incomplète - Des erreurs doivent être corrigées');
        console.log('\n🔧 Actions requises:');
        console.log('1. Corrigez les erreurs listées ci-dessus');
        console.log('2. Consultez CONFIGURATION_ENVIRONNEMENT.md pour plus de détails');
        console.log('3. Relancez ce script après les corrections');
        process.exit(1);
    } else if (hasWarnings) {
        warning('Configuration partiellement complète - Certaines fonctionnalités sont désactivées');
        console.log('\n💡 Recommandations:');
        console.log('- Configurez Twilio pour activer les SMS');
        console.log('- Configurez SMTP pour activer les emails');
        console.log('- Exécutez les scripts SQL manquants');
        console.log('\n✅ Le système peut fonctionner avec ces limitations');
        process.exit(0);
    } else {
        success('Configuration complète - Tous les services sont opérationnels !');
        console.log('\n🚀 Votre plateforme est prête à être utilisée');
        process.exit(0);
    }
}

runTests().catch(err => {
    error(`Erreur lors de la vérification: ${err.message}`);
    process.exit(1);
});
