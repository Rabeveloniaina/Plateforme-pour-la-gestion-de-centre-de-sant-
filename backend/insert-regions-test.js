const mysql = require('mysql2/promise');

async function insertRegionsTest() {
    let connection;
    try {
        console.log('🔗 Connexion à la base de données...');
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'sante_db'
        });

        console.log('✅ Connexion établie\n');

        // Vérifier si des régions existent
        const [existingRegions] = await connection.execute('SELECT COUNT(*) as count FROM regions');
        console.log(`📊 Régions existantes: ${existingRegions[0].count}`);

        if (existingRegions[0].count === 0) {
            console.log('\n🌍 Insertion des régions de Madagascar...\n');

            const regions = [
                { nom: 'Analamanga', code: 'ANA' },
                { nom: 'Vakinankaratra', code: 'VAK' },
                { nom: 'Itasy', code: 'ITA' },
                { nom: 'Bongolava', code: 'BON' },
                { nom: 'Haute Matsiatra', code: 'MAT' },
                { nom: 'Amoron\'i Mania', code: 'AMO' },
                { nom: 'Vatovavy-Fitovinany', code: 'VAT' },
                { nom: 'Ihorombe', code: 'IHO' },
                { nom: 'Atsimo-Atsinanana', code: 'ATS' },
                { nom: 'Atsinanana', code: 'ATN' },
                { nom: 'Analanjirofo', code: 'ALA' },
                { nom: 'Alaotra-Mangoro', code: 'ALM' },
                { nom: 'Boeny', code: 'BOE' },
                { nom: 'Sofia', code: 'SOF' },
                { nom: 'Betsiboka', code: 'BET' },
                { nom: 'Melaky', code: 'MEL' },
                { nom: 'Atsimo-Andrefana', code: 'AAN' },
                { nom: 'Androy', code: 'AND' },
                { nom: 'Anosy', code: 'ANO' },
                { nom: 'Menabe', code: 'MEN' },
                { nom: 'Diana', code: 'DIA' },
                { nom: 'Sava', code: 'SAV' }
            ];

            for (const region of regions) {
                await connection.execute(
                    'INSERT INTO regions (nom, code_region) VALUES (?, ?)',
                    [region.nom, region.code]
                );
                console.log(`  ✅ ${region.nom} (${region.code})`);
            }

            console.log(`\n🎉 ${regions.length} régions insérées avec succès!`);
        } else {
            console.log('\n✅ Des régions existent déjà dans la base de données');
            
            // Afficher les régions existantes
            const [regions] = await connection.execute('SELECT id_region, nom, code_region FROM regions ORDER BY nom LIMIT 10');
            console.log('\n📋 Régions dans la base:');
            regions.forEach(r => {
                console.log(`  - ${r.nom} (ID: ${r.id_region}, Code: ${r.code_region || 'N/A'})`);
            });
        }

        // Vérifier si des centres existent
        console.log('\n---\n');
        const [existingCentres] = await connection.execute('SELECT COUNT(*) as count FROM centres_sante');
        console.log(`🏥 Centres de santé existants: ${existingCentres[0].count}`);

        if (existingCentres[0].count === 0) {
            console.log('\n🏥 Insertion de centres de santé de test...\n');

            // Récupérer les 3 premières régions
            const [regions] = await connection.execute('SELECT id_region, nom FROM regions LIMIT 5');

            for (const region of regions) {
                // Créer 2 centres par région
                await connection.execute(
                    `INSERT INTO centres_sante (nom, adresse, telephone, email, region_id, statut) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        `Centre de Santé ${region.nom} 1`,
                        `Adresse principale, ${region.nom}`,
                        '261 20 22 123 45',
                        `centre1.${region.nom.toLowerCase().replace(/\s/g, '')}@sante.mg`,
                        region.id_region,
                        'actif'
                    ]
                );
                console.log(`  ✅ Centre 1 créé pour ${region.nom}`);

                await connection.execute(
                    `INSERT INTO centres_sante (nom, adresse, telephone, email, region_id, statut) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        `Centre de Santé ${region.nom} 2`,
                        `Adresse secondaire, ${region.nom}`,
                        '261 20 22 123 46',
                        `centre2.${region.nom.toLowerCase().replace(/\s/g, '')}@sante.mg`,
                        region.id_region,
                        'actif'
                    ]
                );
                console.log(`  ✅ Centre 2 créé pour ${region.nom}`);
            }

            console.log(`\n🎉 ${regions.length * 2} centres créés avec succès!`);
        } else {
            console.log('✅ Des centres existent déjà');
            
            // Afficher quelques centres
            const [centres] = await connection.execute(
                'SELECT c.id_centre, c.nom, r.nom as region_nom FROM centres_sante c LEFT JOIN regions r ON c.region_id = r.id_region LIMIT 10'
            );
            console.log('\n📋 Centres dans la base:');
            centres.forEach(c => {
                console.log(`  - ${c.nom} (Région: ${c.region_nom || 'N/A'})`);
            });
        }

        // Vérifier si des médecins existent
        console.log('\n---\n');
        const [existingMedecins] = await connection.execute('SELECT COUNT(*) as count FROM medecins');
        console.log(`👨‍⚕️ Médecins existants: ${existingMedecins[0].count}`);

        if (existingMedecins[0].count === 0) {
            console.log('\n👨‍⚕️ Insertion de médecins de test...\n');

            // Récupérer les centres
            const [centres] = await connection.execute('SELECT id_centre, nom FROM centres_sante LIMIT 5');

            const specialites = ['Médecine générale', 'Pédiatrie', 'Gynécologie', 'Cardiologie', 'Chirurgie'];

            for (const centre of centres) {
                // Créer 2 médecins par centre
                await connection.execute(
                    `INSERT INTO medecins (nom, prenom, specialite, centre_id, telephone, email, statut) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        'Rakoto',
                        'Jean',
                        specialites[0],
                        centre.id_centre,
                        '261 32 12 345 67',
                        'dr.rakoto@sante.mg',
                        'actif'
                    ]
                );
                console.log(`  ✅ Dr. Jean Rakoto créé pour ${centre.nom}`);

                await connection.execute(
                    `INSERT INTO medecins (nom, prenom, specialite, centre_id, telephone, email, statut) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        'Rasoamanana',
                        'Marie',
                        specialites[1],
                        centre.id_centre,
                        '261 32 12 345 68',
                        'dr.rasoamanana@sante.mg',
                        'actif'
                    ]
                );
                console.log(`  ✅ Dr. Marie Rasoamanana créée pour ${centre.nom}`);
            }

            console.log(`\n🎉 ${centres.length * 2} médecins créés avec succès!`);
        } else {
            console.log('✅ Des médecins existent déjà');
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ VÉRIFICATION ET INSERTION DES DONNÉES DE TEST TERMINÉE');
        console.log('='.repeat(60) + '\n');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Connexion fermée');
        }
    }
}

insertRegionsTest();
