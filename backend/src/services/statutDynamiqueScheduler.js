/**
 * Scheduler pour la mise à jour automatique des statuts opérationnels
 * basée sur les horaires des médecins
 */

let cron = null;
try {
    cron = require('node-cron');
} catch (error) {
    console.warn('⚠️  node-cron non disponible - Utilisation de setInterval comme alternative');
}

const StatutDynamiqueService = require('./statutDynamiqueService');

class StatutDynamiqueScheduler {
    constructor() {
        this.job = null;
        this.intervalId = null; // Pour setInterval
        this.isRunning = false;
        this.intervalMinutes = 5; // Vérifier toutes les 5 minutes par défaut
    }

    /**
     * Démarrer le scheduler
     */
    start() {
        if (this.isRunning) {
            console.log('⚠️  Scheduler de statut dynamique déjà en cours d\'exécution');
            return;
        }

        // Intervalle de vérification (par défaut 1 minute pour les tests, 2 minutes en production)
        // Utiliser 1 minute en développement pour tester plus rapidement
        const defaultInterval = process.env.NODE_ENV === 'development' ? 1 : 2;
        const interval = parseInt(process.env.STATUT_DYNAMIQUE_INTERVAL || defaultInterval);
        this.intervalMinutes = interval;
        const intervalMs = interval * 60 * 1000; // Convertir en millisecondes
        
        console.log(`⏱️  Intervalle configuré: ${interval} minute(s) (${intervalMs}ms)`);
        console.log(`📊 Mode: ${process.env.NODE_ENV || 'production'}`);

        // Utiliser node-cron si disponible, sinon setInterval
        if (cron) {
            // Cron expression: toutes les X minutes
            const cronExpression = `*/${interval} * * * *`;
            
            console.log(`📅 Expression cron: ${cronExpression}`);
            
            this.job = cron.schedule(cronExpression, async () => {
                const timestamp = new Date().toLocaleTimeString('fr-FR');
                console.log(`\n🔄 [${timestamp}] [Cron] Mise à jour automatique des statuts opérationnels...`);
                await this.mettreAJourStatuts();
            }, {
                scheduled: true,
                timezone: "Africa/Dakar" // Ajuster selon votre fuseau horaire
            });

            console.log(`✅ Scheduler de statut dynamique démarré (node-cron) - Vérification toutes les ${interval} minutes`);
        } else {
            // Utiliser setInterval comme alternative
            console.log(`⚠️  node-cron non disponible, utilisation de setInterval`);
            
            this.intervalId = setInterval(async () => {
                const timestamp = new Date().toLocaleTimeString('fr-FR');
                console.log(`\n🔄 [${timestamp}] [setInterval] Mise à jour automatique des statuts opérationnels...`);
                await this.mettreAJourStatuts();
            }, intervalMs);

            console.log(`✅ Scheduler de statut dynamique démarré (setInterval) - Vérification toutes les ${interval} minutes`);
            console.log(`   ⚠️  Pour de meilleures performances, installez node-cron: npm install node-cron`);
        }

        this.isRunning = true;
        
        // Exécuter immédiatement au démarrage
        console.log('🔧 Exécution initiale de la mise à jour des statuts...');
        setTimeout(() => {
            this.mettreAJourStatuts();
        }, 2000); // Attendre 2 secondes pour laisser le serveur démarrer complètement
    }

    /**
     * Arrêter le scheduler
     */
    stop() {
        if (this.job) {
            this.job.stop();
            this.isRunning = false;
            console.log('🛑 Scheduler de statut dynamique arrêté (cron)');
        } else if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            this.isRunning = false;
            console.log('🛑 Scheduler de statut dynamique arrêté (setInterval)');
        }
    }

    /**
     * Mettre à jour les statuts de tous les médecins
     */
    async mettreAJourStatuts() {
        try {
            const timestamp = new Date().toLocaleTimeString('fr-FR');
            console.log(`\n${'='.repeat(60)}`);
            console.log(`🔄 [${timestamp}] Début de la mise à jour automatique des statuts...`);
            console.log(`${'='.repeat(60)}`);
            
            const resultats = await StatutDynamiqueService.mettreAJourTousLesStatuts();
            
            if (resultats.length > 0) {
                console.log(`\n✅ ${resultats.length} statut(s) mis à jour automatiquement:`);
                resultats.forEach(r => {
                    console.log(`   • Médecin ${r.id_medecin}: ${r.ancien_statut || 'N/A'} → ${r.statut}${r.raison ? ` (${r.raison})` : ''}`);
                });
            } else {
                console.log(`\nℹ️  Aucun changement de statut nécessaire (tous les statuts sont à jour)`);
            }
            
            console.log(`${'='.repeat(60)}\n`);
        } catch (error) {
            console.error('\n❌ Erreur lors de la mise à jour automatique des statuts:');
            console.error('   Message:', error.message);
            console.error('   Stack:', error.stack);
            console.error('');
        }
    }

    /**
     * Mettre à jour le statut d'un médecin spécifique
     */
    async mettreAJourStatutMedecin(id_medecin) {
        try {
            return await StatutDynamiqueService.mettreAJourStatut(id_medecin);
        } catch (error) {
            console.error(`❌ Erreur mise à jour statut médecin ${id_medecin}:`, error);
            return null;
        }
    }
}

// Singleton
const scheduler = new StatutDynamiqueScheduler();

module.exports = scheduler;

