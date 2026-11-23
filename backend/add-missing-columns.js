const mysql = require('mysql2/promise');

async function addMissingColumns() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'sante_db'
        });

        console.log('🔗 Connexion à la base de données établie\n');

        // Vérifier la structure actuelle
        const [columns] = await connection.execute(`DESCRIBE fiches_medicales`);
        
        console.log('📋 Structure actuelle de la table:');
        const existingColumns = columns.map(col => col.Field);
        columns.forEach(col => {
            console.log(`  - ${col.Field}: ${col.Type}`);
        });
        
        console.log('\n🔍 Vérification des colonnes manquantes...\n');

        // Colonnes requises
        const requiredColumns = [
            { name: 'groupe_sanguin', type: "ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')" },
            { name: 'poids', type: 'DECIMAL(5,2)' },
            { name: 'taille', type: 'DECIMAL(5,2)' },
            { name: 'tension', type: 'VARCHAR(20)' },
            { name: 'allergies', type: 'TEXT' },
            { name: 'antecedents', type: 'TEXT' },
            { name: 'infos_complementaires', type: 'JSON' }
        ];

        let added = 0;
        
        for (const col of requiredColumns) {
            if (!existingColumns.includes(col.name)) {
                console.log(`➕ Ajout de la colonne: ${col.name} (${col.type})`);
                
                try {
                    await connection.execute(`
                        ALTER TABLE fiches_medicales 
                        ADD COLUMN ${col.name} ${col.type}
                    `);
                    console.log(`   ✅ Colonne ${col.name} ajoutée avec succès`);
                    added++;
                } catch (error) {
                    console.error(`   ❌ Erreur lors de l'ajout de ${col.name}:`, error.message);
                }
            } else {
                console.log(`✓ Colonne ${col.name} existe déjà`);
            }
        }

        // Afficher la structure finale
        console.log('\n📊 Structure finale de la table:');
        const [finalColumns] = await connection.execute(`DESCRIBE fiches_medicales`);
        finalColumns.forEach(col => {
            const marker = requiredColumns.some(rc => rc.name === col.Field) ? '✅' : '  ';
            console.log(`${marker} ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });

        await connection.end();
        
        console.log(`\n🎉 Terminé ! ${added} colonne(s) ajoutée(s)`);
        
    } catch (error) {
        console.error('\n❌ Erreur:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

addMissingColumns();

