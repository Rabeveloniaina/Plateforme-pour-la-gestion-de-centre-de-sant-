const mysql = require('mysql2/promise');

async function fixFichesTable() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'sante_db'
        });

        console.log('🔗 Connexion à la base de données établie');

        // 1. Vérifier si la table existe
        const [tables] = await connection.execute(`
            SHOW TABLES LIKE 'fiches_medicales'
        `);

        if (tables.length === 0) {
            console.log('❌ La table fiches_medicales n\'existe pas !');
            console.log('📝 Création de la table...');
            
            // Créer la table complète
            await connection.execute(`
                CREATE TABLE fiches_medicales (
                    id_fiche INT AUTO_INCREMENT PRIMARY KEY,
                    patient_id INT NOT NULL,
                    groupe_sanguin ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
                    poids DECIMAL(5,2),
                    taille DECIMAL(5,2),
                    tension VARCHAR(20),
                    allergies TEXT,
                    antecedents TEXT,
                    infos_complementaires JSON,
                    date_maj TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (patient_id) REFERENCES patients(id_patient) ON DELETE CASCADE ON UPDATE CASCADE,
                    INDEX idx_patient (patient_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            
            console.log('✅ Table fiches_medicales créée avec succès !');
        } else {
            console.log('✅ La table fiches_medicales existe');
            
            // Vérifier la structure actuelle
            const [columns] = await connection.execute(`
                DESCRIBE fiches_medicales
            `);
            
            console.log('\n📋 Structure actuelle:');
            const columnNames = columns.map(col => col.Field);
            columns.forEach(col => {
                console.log(`  - ${col.Field}: ${col.Type}`);
            });
            
            // Vérifier et ajouter les colonnes manquantes
            const requiredColumns = {
                'groupe_sanguin': "ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')",
                'poids': "DECIMAL(5,2)",
                'taille': "DECIMAL(5,2)",
                'tension': "VARCHAR(20)",
                'allergies': "TEXT",
                'antecedents': "TEXT",
                'infos_complementaires': "JSON"
            };
            
            for (const [colName, colType] of Object.entries(requiredColumns)) {
                if (!columnNames.includes(colName)) {
                    console.log(`\n➕ Ajout de la colonne: ${colName}`);
                    await connection.execute(`
                        ALTER TABLE fiches_medicales 
                        ADD COLUMN ${colName} ${colType}
                    `);
                    console.log(`✅ Colonne ${colName} ajoutée`);
                }
            }
        }

        // Afficher la structure finale
        const [finalColumns] = await connection.execute(`
            DESCRIBE fiches_medicales
        `);
        
        console.log('\n📊 Structure finale de la table:');
        finalColumns.forEach(col => {
            console.log(`  ✅ ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });

        await connection.end();
        console.log('\n🎉 Table fiches_medicales prête à l\'emploi !');
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

fixFichesTable();

