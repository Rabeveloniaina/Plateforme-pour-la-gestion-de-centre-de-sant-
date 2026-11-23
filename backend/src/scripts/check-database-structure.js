const { executeQuery } = require('../config/database');

async function checkDatabaseStructure() {
    try {
        console.log('🔍 Vérification de la structure de la base de données...\n');

        // Vérifier si la table centres_sante existe
        const tables = await executeQuery(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = 'sante_db' 
            AND TABLE_NAME IN ('centres_sante', 'centres', 'patients', 'regions')
            ORDER BY TABLE_NAME
        `);

        console.log('📋 Tables trouvées:');
        tables.forEach(table => {
            console.log(`  - ${table.TABLE_NAME}`);
        });

        // Vérifier la structure de la table centres_sante
        if (tables.some(t => t.TABLE_NAME === 'centres_sante')) {
            console.log('\n🔍 Structure de la table centres_sante:');
            const structure = await executeQuery(`
                SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY
                FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = 'sante_db' 
                AND TABLE_NAME = 'centres_sante'
                ORDER BY ORDINAL_POSITION
            `);
            
            structure.forEach(col => {
                console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'} ${col.COLUMN_KEY ? `(${col.COLUMN_KEY})` : ''}`);
            });

            // Compter les centres
            const centreCount = await executeQuery('SELECT COUNT(*) as count FROM centres_sante');
            console.log(`\n📊 Nombre de centres: ${centreCount[0].count}`);

            // Lister quelques centres
            const centres = await executeQuery(`
                SELECT id_centre, nom, region_id, statut 
                FROM centres_sante 
                ORDER BY id_centre 
                LIMIT 5
            `);
            
            console.log('\n📋 Premiers centres:');
            centres.forEach(centre => {
                console.log(`  - ID: ${centre.id_centre} | ${centre.nom} | Région: ${centre.region_id} | Statut: ${centre.statut}`);
            });
        }

        // Vérifier la structure de la table patients
        if (tables.some(t => t.TABLE_NAME === 'patients')) {
            console.log('\n🔍 Structure de la table patients:');
            const structure = await executeQuery(`
                SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY
                FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = 'sante_db' 
                AND TABLE_NAME = 'patients'
                ORDER BY ORDINAL_POSITION
            `);
            
            structure.forEach(col => {
                console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'} ${col.COLUMN_KEY ? `(${col.COLUMN_KEY})` : ''}`);
            });

            // Vérifier les contraintes de clé étrangère
            const foreignKeys = await executeQuery(`
                SELECT 
                    CONSTRAINT_NAME,
                    COLUMN_NAME,
                    REFERENCED_TABLE_NAME,
                    REFERENCED_COLUMN_NAME
                FROM information_schema.KEY_COLUMN_USAGE 
                WHERE TABLE_SCHEMA = 'sante_db' 
                AND TABLE_NAME = 'patients'
                AND REFERENCED_TABLE_NAME IS NOT NULL
            `);

            console.log('\n🔗 Contraintes de clé étrangère:');
            foreignKeys.forEach(fk => {
                console.log(`  - ${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
            });
        }

        // Test de la requête d'inscription
        console.log('\n🧪 Test de la requête d\'inscription:');
        try {
            const testQuery = `
                SELECT c.id_centre, c.nom as nom_centre, c.adresse, c.telephone, c.email, 
                       c.region_id, r.nom as nom_region, r.code_region
                FROM centres_sante c
                LEFT JOIN regions r ON c.region_id = r.id_region
                WHERE c.statut = 'actif'
                ORDER BY c.nom
                LIMIT 3
            `;
            
            const testCentres = await executeQuery(testQuery);
            console.log('✅ Requête d\'inscription fonctionne:');
            testCentres.forEach(centre => {
                console.log(`  - ${centre.nom_centre} (ID: ${centre.id_centre}, Région: ${centre.region_id})`);
            });
        } catch (error) {
            console.log('❌ Erreur dans la requête d\'inscription:', error.message);
        }

    } catch (error) {
        console.error('❌ Erreur lors de la vérification:', error);
    } finally {
        process.exit(0);
    }
}

checkDatabaseStructure();
