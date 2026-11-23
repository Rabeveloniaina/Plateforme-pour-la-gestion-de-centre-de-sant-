const mysql = require('mysql2/promise');

async function checkMedecin() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'sante_db'
    });

    try {
        console.log('🔍 Vérification du médecin...\n');

        // 1. Chercher l'utilisateur
        const [users] = await connection.execute(
            'SELECT * FROM utilisateurs WHERE nom_utilisateur = ?',
            ['medecin1']
        );
        console.log('👤 Utilisateur:', users[0]);

        if (users.length > 0) {
            const userId = users[0].id_user;
            
            // 2. Chercher le médecin correspondant
            const [medecins] = await connection.execute(
                'SELECT * FROM medecins WHERE user_id = ?',
                [userId]
            );
            console.log('\n👨‍⚕️ Médecin trouvé:', medecins[0]);

            if (medecins.length === 0) {
                console.log('\n❌ Aucun médecin trouvé pour user_id:', userId);
                console.log('💡 Solution: Lier l\'utilisateur à un médecin dans la table medecins');
            }
        }

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await connection.end();
    }
}

checkMedecin();

