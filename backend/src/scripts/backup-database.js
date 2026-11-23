/**
 * Script de backup automatique de la base de données
 * 
 * Utilisation:
 *   node src/scripts/backup-database.js
 * 
 * Ou avec cron:
 *   0 2 * * * node /chemin/vers/backend/src/scripts/backup-database.js
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'sante_db';
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '../../backups');

// Créer le dossier de backup s'il n'existe pas
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log('✅ Dossier de backup créé:', BACKUP_DIR);
}

// Nom du fichier de backup
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const backupFile = path.join(BACKUP_DIR, `backup_${DB_NAME}_${timestamp}.sql`);

// Commande mysqldump
const passwordPart = DB_PASSWORD ? `-p${DB_PASSWORD}` : '';
const command = `mysqldump -h ${DB_HOST} -u ${DB_USER} ${passwordPart} ${DB_NAME} > "${backupFile}"`;

console.log('🔄 Démarrage du backup...');
console.log(`   Base de données: ${DB_NAME}`);
console.log(`   Fichier de sortie: ${backupFile}`);

exec(command, (error, stdout, stderr) => {
    if (error) {
        console.error('❌ Erreur lors du backup:', error.message);
        
        // Si mysqldump n'est pas trouvé, afficher instructions
        if (error.message.includes('mysqldump')) {
            console.error('\n💡 Solution:');
            console.error('   mysqldump doit être dans le PATH système');
            console.error('   Ou utiliser le chemin complet vers mysqldump');
            console.error('   Exemple: C:\\xampp\\mysql\\bin\\mysqldump.exe');
        }
        
        process.exit(1);
    }

    if (stderr && !stderr.includes('Using a password')) {
        console.warn('⚠️  Avertissement:', stderr);
    }

    // Vérifier que le fichier a été créé
    if (fs.existsSync(backupFile)) {
        const stats = fs.statSync(backupFile);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        
        console.log('✅ Backup terminé avec succès !');
        console.log(`   Fichier: ${backupFile}`);
        console.log(`   Taille: ${fileSizeMB} MB`);
        
        // Nettoyer les anciens backups (garder les 30 derniers)
        cleanupOldBackups();
        
    } else {
        console.error('❌ Le fichier de backup n\'a pas été créé');
        process.exit(1);
    }
});

// Nettoyer les anciens backups
function cleanupOldBackups() {
    try {
        const files = fs.readdirSync(BACKUP_DIR)
            .filter(file => file.startsWith('backup_') && file.endsWith('.sql'))
            .map(file => ({
                name: file,
                path: path.join(BACKUP_DIR, file),
                time: fs.statSync(path.join(BACKUP_DIR, file)).mtime.getTime()
            }))
            .sort((a, b) => b.time - a.time);

        // Garder les 30 derniers backups
        const maxBackups = 30;
        if (files.length > maxBackups) {
            const toDelete = files.slice(maxBackups);
            console.log(`\n🗑️  Nettoyage des anciens backups (${toDelete.length} fichiers)...`);
            
            toDelete.forEach(file => {
                try {
                    fs.unlinkSync(file.path);
                    console.log(`   Supprimé: ${file.name}`);
                } catch (error) {
                    console.error(`   ❌ Erreur suppression ${file.name}:`, error.message);
                }
            });
        }
    } catch (error) {
        console.error('⚠️  Erreur lors du nettoyage:', error.message);
    }
}

