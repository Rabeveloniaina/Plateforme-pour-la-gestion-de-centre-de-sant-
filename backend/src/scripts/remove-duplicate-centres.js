const { executeQuery } = require('../config/database');

async function removeDuplicateCentres() {
    try {
        console.log('🧹 Suppression des centres en doublon...\n');

        // 1. Identifier les doublons
        console.log('1. Identification des doublons...');
        const duplicates = await executeQuery(`
            SELECT nom, region_id, COUNT(*) as count, GROUP_CONCAT(id_centre ORDER BY id_centre) as ids
            FROM centres_sante 
            WHERE statut = 'actif'
            GROUP BY nom, region_id 
            HAVING COUNT(*) > 1
            ORDER BY nom, region_id
        `);

        console.log(`📊 ${duplicates.length} groupes de doublons trouvés`);

        if (duplicates.length === 0) {
            console.log('✅ Aucun doublon trouvé');
            return;
        }

        // 2. Afficher les doublons
        console.log('\n📋 Détails des doublons:');
        duplicates.forEach(dup => {
            const ids = dup.ids.split(',').map(id => parseInt(id));
            console.log(`  - "${dup.nom}" (région ${dup.region_id}): ${dup.count} occurrences`);
            console.log(`    IDs: ${ids.join(', ')}`);
        });

        // 3. Supprimer les doublons (garder le plus petit ID)
        console.log('\n2. Suppression des doublons...');
        let totalDeleted = 0;

        for (const duplicate of duplicates) {
            const ids = duplicate.ids.split(',').map(id => parseInt(id)).sort((a, b) => a - b);
            const keepId = ids[0]; // Garder le plus petit ID
            const deleteIds = ids.slice(1); // Supprimer les autres

            console.log(`\n🔄 Traitement: "${duplicate.nom}"`);
            console.log(`  - Garder: ID ${keepId}`);
            console.log(`  - Supprimer: IDs ${deleteIds.join(', ')}`);

            // Vérifier s'il y a des patients et médecins liés aux centres à supprimer
            for (const deleteId of deleteIds) {
                const patients = await executeQuery(`
                    SELECT COUNT(*) as count FROM patients WHERE centre_id = ?
                `, [deleteId]);

                const medecins = await executeQuery(`
                    SELECT COUNT(*) as count FROM medecins WHERE centre_id = ?
                `, [deleteId]);

                if (patients[0].count > 0) {
                    console.log(`  ⚠️  ${patients[0].count} patients liés au centre ID ${deleteId}`);
                    
                    // Transférer les patients vers le centre gardé
                    await executeQuery(`
                        UPDATE patients 
                        SET centre_id = ? 
                        WHERE centre_id = ?
                    `, [keepId, deleteId]);
                    
                    console.log(`  ✅ Patients transférés vers le centre ID ${keepId}`);
                }

                if (medecins[0].count > 0) {
                    console.log(`  ⚠️  ${medecins[0].count} médecins liés au centre ID ${deleteId}`);
                    
                    // Transférer les médecins vers le centre gardé
                    await executeQuery(`
                        UPDATE medecins 
                        SET centre_id = ? 
                        WHERE centre_id = ?
                    `, [keepId, deleteId]);
                    
                    console.log(`  ✅ Médecins transférés vers le centre ID ${keepId}`);
                }

                // Supprimer le centre
                await executeQuery(`
                    DELETE FROM centres_sante WHERE id_centre = ?
                `, [deleteId]);
                
                console.log(`  ✅ Centre ID ${deleteId} supprimé`);
                totalDeleted++;
            }
        }

        // 4. Vérification finale
        console.log(`\n3. Vérification finale...`);
        const finalDuplicates = await executeQuery(`
            SELECT nom, region_id, COUNT(*) as count
            FROM centres_sante 
            WHERE statut = 'actif'
            GROUP BY nom, region_id 
            HAVING COUNT(*) > 1
        `);

        console.log(`📊 Doublons restants: ${finalDuplicates.length}`);
        console.log(`📊 Total des centres supprimés: ${totalDeleted}`);

        if (finalDuplicates.length === 0) {
            console.log('✅ Tous les doublons ont été supprimés !');
        } else {
            console.log('⚠️  Il reste des doublons:');
            finalDuplicates.forEach(dup => {
                console.log(`  - "${dup.nom}" (région ${dup.region_id}): ${dup.count} occurrences`);
            });
        }

        // 5. Afficher le nombre final de centres
        const finalCount = await executeQuery(`
            SELECT COUNT(*) as count FROM centres_sante WHERE statut = 'actif'
        `);
        console.log(`\n📊 Nombre total de centres actifs: ${finalCount[0].count}`);

    } catch (error) {
        console.error('❌ Erreur lors de la suppression des doublons:', error);
    } finally {
        process.exit(0);
    }
}

removeDuplicateCentres();
