const mysql = require('mysql2/promise');

async function verifyFichesTable() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'sante_db'
        });

        console.log('🔗 Connexion à la base de données établie');

        // Vérifier la structure de la table
        const [columns] = await connection.execute(`
            DESCRIBE fiches_medicales
        `);

        console.log('\n📋 Structure actuelle de la table fiches_medicales:');
        columns.forEach(col => {
            console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });

        // Vérifier si la table a des enregistrements
        const [count] = await connection.execute(`
            SELECT COUNT(*) as total FROM fiches_medicales
        `);

        console.log(`\n📊 Nombre d'enregistrements: ${count[0].total}`);

        // Afficher quelques exemples
        if (count[0].total > 0) {
            const [examples] = await connection.execute(`
                SELECT * FROM fiches_medicales LIMIT 3
            `);
            console.log('\n🔍 Exemples d\'enregistrements:');
            examples.forEach((fiche, index) => {
                console.log(`\n  Fiche #${index + 1}:`);
                console.log(`    - patient_id: ${fiche.patient_id}`);
                console.log(`    - groupe_sanguin: ${fiche.groupe_sanguin || 'Non renseigné'}`);
                console.log(`    - poids: ${fiche.poids || 'Non renseigné'} kg`);
                console.log(`    - taille: ${fiche.taille || 'Non renseigné'} cm`);
                console.log(`    - allergies: ${fiche.allergies || 'Aucune'}`);
            });
        }

        await connection.end();
        console.log('\n✅ Vérification terminée !');
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    }
}

verifyFichesTable();

