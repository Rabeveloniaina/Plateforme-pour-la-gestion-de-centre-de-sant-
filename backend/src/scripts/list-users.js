/**
 * Liste tous les utilisateurs de test disponibles
 */

const { executeQuery } = require('../config/database');

async function listUsers() {
    try {
        const users = await executeQuery(`
            SELECT nom_utilisateur, role, email, statut 
            FROM utilisateurs 
            ORDER BY 
                CASE role
                    WHEN 'ministere' THEN 1
                    WHEN 'admin_centre' THEN 2
                    WHEN 'admin' THEN 3
                    WHEN 'medecin' THEN 4
                    WHEN 'personnel' THEN 5
                    WHEN 'patient' THEN 6
                END
        `);
        
        console.log('\n╔═══════════════════════════════════════════════════════════╗');
        console.log('║        UTILISATEURS DE TEST DISPONIBLES                  ║');
        console.log('╚═══════════════════════════════════════════════════════════╝\n');
        
        let currentRole = '';
        users.forEach(user => {
            if (user.role !== currentRole) {
                currentRole = user.role;
                console.log(`\n┌─ ${user.role.toUpperCase()}`);
            }
            console.log(`│  Username: ${user.nom_utilisateur.padEnd(20)} | Email: ${user.email || 'N/A'}`);
        });
        
        console.log('\n\n📝 MOT DE PASSE PAR DÉFAUT POUR TOUS: admin123');
        console.log('\n💡 EXEMPLES DE CONNEXION:');
        console.log('   • Admin:         admin / admin123');
        console.log('   • Patient:       fatou.diop / admin123');
        console.log('   • Médecin:       dr.diallo / admin123');
        
        console.log('\n⚠️  IMPORTANT: Ces mots de passe sont hashés en base de données');
        console.log('   Le hash visible dans la BDD est: $2b$10$rQZ8K9vX3mN2pL1qR4sT5u...\n');
        
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Erreur:', error.message);
        process.exit(1);
    }
}

listUsers();

