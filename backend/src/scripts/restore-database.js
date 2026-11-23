/**
 * Script de restauration de la base de données depuis un backup
 * 
 * Utilisation:
 *   node src/scripts/restore-database.js <chemin_vers_backup.sql>
 * 
 * Exemple:
 *   node src/scripts/restore-database.js backups/backup_sante_db_2025-01-15T10-30-00.sql
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
require('dotenv').config();

// Configuration
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'sante_db';

// Vérifier les arguments
const backupFile = process.argv[2];

if (!backupFile) {
    console.error('❌ Erreur: Spécifiez le fichier de backup');
    console.error('\nUtilisation:');
    console.error('  node src/scripts/restore-database.js <chemin_vers_backup.sql>');
    console.error('\nExemple:');
    console.error('  node src/scripts/restore-database.js backups/backup_sante_db_2025-01-15T10-30-00.sql');
    process.exit(1);
}

// Vérifier que le fichier existe
const backupPath = path.isAbsolute(backupFile) 
    ? backupFile 
    : path.join(__dirname, '../../', backupFile);

if (!fs.existsSync(backupPath)) {
    console.error(`❌ Erreur: Le fichier de backup n'existe pas: ${backupPath}`);
    process.exit(1);
}

// Interface readline pour confirmation
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('⚠️  ATTENTION: Cette opération va remplacer toutes les données de la base de données !');
console.log(`   Base de données: ${DB_NAME}`);
console.log(`   Fichier de backup: ${backupPath}`);
console.log('\n');

rl.question('Êtes-vous sûr de vouloir continuer ? (tapez "OUI" pour confirmer): ', (answer) => {
    rl.close();
    
    if (answer !== 'OUI') {
        console.log('❌ Restauration annulée');
        process.exit(0);
    }

    console.log('\n🔄 Démarrage de la restauration...');

    // Commande mysql pour restaurer
    const passwordPart = DB_PASSWORD ? `-p${DB_PASSWORD}` : '';
    const command = `mysql -h ${DB_HOST} -u ${DB_USER} ${passwordPart} ${DB_NAME} < "${backupPath}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error('❌ Erreur lors de la restauration:', error.message);
            
            if (error.message.includes('mysql')) {
                console.error('\n💡 Solution:');
                console.error('   mysql doit être dans le PATH système');
                console.error('   Ou utiliser le chemin complet vers mysql');
                console.error('   Exemple: C:\\xampp\\mysql\\bin\\mysql.exe');
            }
            
            process.exit(1);
        }

        if (stderr && !stderr.includes('Using a password')) {
            console.warn('⚠️  Avertissement:', stderr);
        }

        console.log('✅ Restauration terminée avec succès !');
        console.log(`   Base de données ${DB_NAME} restaurée depuis ${path.basename(backupPath)}`);
    });
});

