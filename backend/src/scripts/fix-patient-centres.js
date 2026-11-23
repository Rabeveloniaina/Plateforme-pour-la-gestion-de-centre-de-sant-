const { executeQuery } = require('../config/database');

async function fixPatientCentres() {
    try {
        console.log('🔧 Correction des références de centres dans la table patients...\n');

        // 1. Vérifier les patients avec des centre_id invalides
        console.log('1. Vérification des patients avec des centre_id invalides...');
        const invalidPatients = await executeQuery(`
            SELECT p.id_patient, p.nom, p.prenom, p.centre_id, p.region_id
            FROM patients p
            LEFT JOIN centres_sante c ON p.centre_id = c.id_centre
            WHERE c.id_centre IS NULL
        `);

        console.log(`📊 Patients avec centre_id invalide: ${invalidPatients.length}`);
        if (invalidPatients.length > 0) {
            console.log('📋 Détails:');
            invalidPatients.forEach(patient => {
                console.log(`  - Patient ${patient.id_patient}: ${patient.nom} ${patient.prenom} (centre_id: ${patient.centre_id}, region_id: ${patient.region_id})`);
            });
        }

        // 2. Trouver des centres valides pour chaque région
        console.log('\n2. Recherche de centres valides par région...');
        const regionsWithCentres = await executeQuery(`
            SELECT DISTINCT p.region_id, c.id_centre, c.nom as centre_nom
            FROM patients p
            LEFT JOIN centres_sante c ON p.region_id = c.region_id AND c.statut = 'actif'
            WHERE p.centre_id NOT IN (SELECT id_centre FROM centres_sante)
            AND c.id_centre IS NOT NULL
            ORDER BY p.region_id, c.id_centre
        `);

        console.log('📋 Centres disponibles par région:');
        const regionCentres = {};
        regionsWithCentres.forEach(item => {
            if (!regionCentres[item.region_id]) {
                regionCentres[item.region_id] = [];
            }
            regionCentres[item.region_id].push({ id: item.id_centre, nom: item.centre_nom });
        });

        Object.entries(regionCentres).forEach(([regionId, centres]) => {
            console.log(`  - Région ${regionId}:`);
            centres.forEach(centre => {
                console.log(`    * ${centre.nom} (ID: ${centre.id})`);
            });
        });

        // 3. Mettre à jour les patients avec des centres valides
        console.log('\n3. Mise à jour des patients...');
        for (const patient of invalidPatients) {
            const regionId = patient.region_id;
            const availableCentres = regionCentres[regionId];
            
            if (availableCentres && availableCentres.length > 0) {
                // Prendre le premier centre disponible de la région
                const newCentreId = availableCentres[0].id;
                
                await executeQuery(`
                    UPDATE patients 
                    SET centre_id = ? 
                    WHERE id_patient = ?
                `, [newCentreId, patient.id_patient]);
                
                console.log(`✅ Patient ${patient.id_patient} mis à jour: centre_id ${patient.centre_id} -> ${newCentreId}`);
            } else {
                console.log(`❌ Aucun centre valide trouvé pour la région ${regionId} du patient ${patient.id_patient}`);
            }
        }

        // 4. Vérifier qu'il n'y a plus de patients avec des centre_id invalides
        console.log('\n4. Vérification finale...');
        const remainingInvalid = await executeQuery(`
            SELECT COUNT(*) as count
            FROM patients p
            LEFT JOIN centres_sante c ON p.centre_id = c.id_centre
            WHERE c.id_centre IS NULL
        `);

        console.log(`📊 Patients avec centre_id invalide restants: ${remainingInvalid[0].count}`);

        if (remainingInvalid[0].count === 0) {
            console.log('✅ Tous les patients ont maintenant des centre_id valides');
            
            // 5. Maintenant, ajouter la contrainte de clé étrangère
            console.log('\n5. Ajout de la contrainte de clé étrangère...');
            try {
                await executeQuery(`
                    ALTER TABLE patients 
                    ADD CONSTRAINT patients_centre_fk 
                    FOREIGN KEY (centre_id) REFERENCES centres_sante(id_centre) 
                    ON DELETE RESTRICT ON UPDATE CASCADE
                `);
                console.log('✅ Contrainte de clé étrangère ajoutée avec succès');
            } catch (error) {
                console.log('⚠️  Erreur lors de l\'ajout de la contrainte:', error.message);
            }
        } else {
            console.log('❌ Il reste des patients avec des centre_id invalides');
        }

    } catch (error) {
        console.error('❌ Erreur lors de la correction:', error);
    } finally {
        process.exit(0);
    }
}

fixPatientCentres();
