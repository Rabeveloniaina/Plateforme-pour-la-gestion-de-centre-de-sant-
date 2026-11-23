const { executeQuery } = require('../config/database');

async function checkDuplicateCentres() {
    try {
        console.log('🔍 Vérification des doublons dans la table centres_sante...\n');

        // Vérifier les doublons par nom
        const duplicatesByName = await executeQuery(`
            SELECT nom, COUNT(*) as count
            FROM centres_sante 
            WHERE statut = 'actif'
            GROUP BY nom 
            HAVING COUNT(*) > 1
        `);

        if (duplicatesByName.length > 0) {
            console.log('❌ Doublons trouvés par nom:');
            duplicatesByName.forEach(dup => {
                console.log(`  - "${dup.nom}": ${dup.count} occurrences`);
            });
        } else {
            console.log('✅ Aucun doublon par nom trouvé');
        }

        // Vérifier les doublons par combinaison nom + région
        const duplicatesByNameRegion = await executeQuery(`
            SELECT nom, region_id, COUNT(*) as count
            FROM centres_sante 
            WHERE statut = 'actif'
            GROUP BY nom, region_id 
            HAVING COUNT(*) > 1
        `);

        if (duplicatesByNameRegion.length > 0) {
            console.log('\n❌ Doublons trouvés par nom + région:');
            duplicatesByNameRegion.forEach(dup => {
                console.log(`  - "${dup.nom}" (région ${dup.region_id}): ${dup.count} occurrences`);
            });
        } else {
            console.log('\n✅ Aucun doublon par nom + région trouvé');
        }

        // Lister tous les centres avec leurs régions
        const allCentres = await executeQuery(`
            SELECT c.id_centre, c.nom, c.region_id, r.nom as nom_region
            FROM centres_sante c
            LEFT JOIN regions r ON c.region_id = r.id_region
            WHERE c.statut = 'actif'
            ORDER BY c.nom
        `);

        console.log(`\n📊 Total des centres actifs: ${allCentres.length}`);
        console.log('\n📋 Liste des centres:');
        allCentres.forEach(centre => {
            console.log(`  - ID: ${centre.id_centre} | ${centre.nom} (${centre.nom_region})`);
        });

        // Vérifier la requête utilisée par l'API
        console.log('\n🔍 Test de la requête API:');
        const apiCentres = await executeQuery(`
            SELECT DISTINCT c.id_centre, c.nom as nom_centre, c.adresse, c.telephone, c.email, 
                   c.region_id, r.nom as nom_region, r.code_region
            FROM centres_sante c
            LEFT JOIN regions r ON c.region_id = r.id_region
            WHERE c.statut = 'actif'
            ORDER BY c.nom
        `);

        console.log(`📊 Centres retournés par l'API: ${apiCentres.length}`);
        
        // Vérifier s'il y a des doublons dans les résultats de l'API
        const uniqueIds = new Set(apiCentres.map(c => c.id_centre));
        if (uniqueIds.size !== apiCentres.length) {
            console.log('❌ DOUBLONS DÉTECTÉS dans les résultats de l\'API!');
            
            // Trouver les doublons
            const idCounts = {};
            apiCentres.forEach(centre => {
                idCounts[centre.id_centre] = (idCounts[centre.id_centre] || 0) + 1;
            });
            
            Object.entries(idCounts).forEach(([id, count]) => {
                if (count > 1) {
                    console.log(`  - ID ${id}: ${count} occurrences`);
                }
            });
        } else {
            console.log('✅ Aucun doublon dans les résultats de l\'API');
        }

    } catch (error) {
        console.error('❌ Erreur lors de la vérification:', error);
    } finally {
        process.exit(0);
    }
}

checkDuplicateCentres();
