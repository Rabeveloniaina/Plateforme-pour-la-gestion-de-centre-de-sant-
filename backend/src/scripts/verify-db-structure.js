/**
 * VÉRIFICATION STRUCTURE BASE DE DONNÉES
 * Vérifie quelle version des tables est utilisée et leur structure exacte
 */

const { executeQuery, testConnection } = require('../config/database');

const COLORS = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

async function verifyStructure() {
    console.log(`${COLORS.magenta}=== VÉRIFICATION STRUCTURE BASE DE DONNÉES ===${COLORS.reset}\n`);
    
    try {
        const connected = await testConnection();
        if (!connected) {
            console.log(`${COLORS.red}❌ Impossible de se connecter à la base de données${COLORS.reset}`);
            process.exit(1);
        }
        
        console.log(`${COLORS.green}✅ Connexion à la base de données réussie${COLORS.reset}\n`);
        
        // Liste des tables
        console.log(`${COLORS.cyan}📋 TABLES EXISTANTES:${COLORS.reset}`);
        const tables = await executeQuery('SHOW TABLES');
        tables.forEach(table => {
            const tableName = Object.values(table)[0];
            console.log(`  - ${tableName}`);
        });
        
        // Structure détaillée des tables critiques
        const criticalTables = [
            'fiches_medicales',
            'patients_infos_medicales', 
            'prescriptions',
            'rendez_vous',
            'vaccinations',
            'medicaments',
            'patients',
            'medecins',
            'utilisateurs'
        ];
        
        console.log(`\n${COLORS.cyan}📊 STRUCTURE DÉTAILLÉE DES TABLES CRITIQUES:${COLORS.reset}\n`);
        
        for (const tableName of criticalTables) {
            try {
                const structure = await executeQuery(`DESCRIBE ${tableName}`);
                console.log(`${COLORS.yellow}TABLE: ${tableName}${COLORS.reset}`);
                console.log('─'.repeat(80));
                
                structure.forEach(col => {
                    const nullInfo = col.Null === 'NO' ? 'NOT NULL' : 'NULL';
                    const keyInfo = col.Key ? ` [${col.Key}]` : '';
                    const defaultInfo = col.Default ? ` DEFAULT ${col.Default}` : '';
                    console.log(`  ${col.Field.padEnd(30)} ${col.Type.padEnd(25)} ${nullInfo}${keyInfo}${defaultInfo}`);
                });
                
                // Compter les enregistrements
                const count = await executeQuery(`SELECT COUNT(*) as count FROM ${tableName}`);
                console.log(`${COLORS.green}  → ${count[0].count} enregistrement(s)${COLORS.reset}\n`);
                
            } catch (error) {
                console.log(`${COLORS.red}  ❌ Table ${tableName} n'existe pas${COLORS.reset}\n`);
            }
        }
        
        // Vérifier les clés étrangères
        console.log(`${COLORS.cyan}🔗 CLÉS ÉTRANGÈRES:${COLORS.reset}\n`);
        const foreignKeys = await executeQuery(`
            SELECT 
                TABLE_NAME,
                COLUMN_NAME,
                CONSTRAINT_NAME,
                REFERENCED_TABLE_NAME,
                REFERENCED_COLUMN_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
            AND REFERENCED_TABLE_NAME IS NOT NULL
            ORDER BY TABLE_NAME, COLUMN_NAME
        `);
        
        let currentTable = '';
        foreignKeys.forEach(fk => {
            if (fk.TABLE_NAME !== currentTable) {
                console.log(`\n${COLORS.yellow}${fk.TABLE_NAME}:${COLORS.reset}`);
                currentTable = fk.TABLE_NAME;
            }
            console.log(`  ${fk.COLUMN_NAME} → ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
        });
        
        // Vérifier les index
        console.log(`\n\n${COLORS.cyan}📑 INDEX CRÉÉS:${COLORS.reset}\n`);
        const indexes = await executeQuery(`
            SELECT 
                TABLE_NAME,
                INDEX_NAME,
                COLUMN_NAME,
                NON_UNIQUE
            FROM INFORMATION_SCHEMA.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME IN ('${criticalTables.join("','")}')
            ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX
        `);
        
        currentTable = '';
        indexes.forEach(idx => {
            if (idx.TABLE_NAME !== currentTable) {
                console.log(`\n${COLORS.yellow}${idx.TABLE_NAME}:${COLORS.reset}`);
                currentTable = idx.TABLE_NAME;
            }
            const uniqueInfo = idx.NON_UNIQUE === 0 ? ' [UNIQUE]' : '';
            console.log(`  ${idx.INDEX_NAME.padEnd(30)} sur ${idx.COLUMN_NAME}${uniqueInfo}`);
        });
        
        // Détection de la version utilisée
        console.log(`\n\n${COLORS.magenta}=== DÉTECTION DE VERSION ===${COLORS.reset}\n`);
        
        const patientsInfoExists = tables.some(t => Object.values(t)[0] === 'patients_infos_medicales');
        const fichesColumns = await executeQuery('DESCRIBE fiches_medicales');
        const hasMedecinId = fichesColumns.some(col => col.Field === 'medecin_id');
        const hasDateConsultation = fichesColumns.some(col => col.Field === 'date_consultation');
        
        if (hasMedecinId && hasDateConsultation) {
            console.log(`${COLORS.green}✅ Version ENHANCED des fiches médicales (avec consultations)${COLORS.reset}`);
        } else {
            console.log(`${COLORS.yellow}⚠️  Version BASIC des fiches médicales (sans consultations)${COLORS.reset}`);
        }
        
        if (patientsInfoExists) {
            console.log(`${COLORS.green}✅ Table patients_infos_medicales présente (informations patients)${COLORS.reset}`);
        } else {
            console.log(`${COLORS.red}❌ Table patients_infos_medicales manquante${COLORS.reset}`);
        }
        
        // Vérifier si table examens_complementaires existe
        const hasExamens = tables.some(t => Object.values(t)[0] === 'examens_complementaires');
        if (hasExamens) {
            console.log(`${COLORS.green}✅ Table examens_complementaires présente${COLORS.reset}`);
        } else {
            console.log(`${COLORS.yellow}⚠️  Table examens_complementaires manquante (optionnel)${COLORS.reset}`);
        }
        
        console.log(`\n${COLORS.cyan}✓ Vérification terminée${COLORS.reset}\n`);
        
    } catch (error) {
        console.error(`${COLORS.red}❌ Erreur:${COLORS.reset}`, error.message);
        process.exit(1);
    }
    
    process.exit(0);
}

verifyStructure();

