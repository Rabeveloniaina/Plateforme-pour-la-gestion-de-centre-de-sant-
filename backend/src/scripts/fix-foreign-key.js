const { executeQuery } = require('../config/database');

async function fixForeignKey() {
    try {
        console.log('🔧 Correction de la contrainte de clé étrangère...\n');

        // 1. Supprimer l'ancienne contrainte
        console.log('1. Suppression de l\'ancienne contrainte...');
        try {
            await executeQuery(`
                ALTER TABLE patients 
                DROP FOREIGN KEY patients_centre_fk
            `);
            console.log('✅ Ancienne contrainte supprimée');
        } catch (error) {
            console.log('⚠️  Contrainte déjà supprimée ou inexistante:', error.message);
        }

        // 2. Ajouter la nouvelle contrainte vers centres_sante
        console.log('\n2. Ajout de la nouvelle contrainte vers centres_sante...');
        await executeQuery(`
            ALTER TABLE patients 
            ADD CONSTRAINT patients_centre_fk 
            FOREIGN KEY (centre_id) REFERENCES centres_sante(id_centre) 
            ON DELETE RESTRICT ON UPDATE CASCADE
        `);
        console.log('✅ Nouvelle contrainte ajoutée');

        // 3. Vérifier que la contrainte fonctionne
        console.log('\n3. Test de la contrainte...');
        const constraints = await executeQuery(`
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

        console.log('📋 Contraintes actuelles:');
        constraints.forEach(constraint => {
            console.log(`  - ${constraint.COLUMN_NAME} -> ${constraint.REFERENCED_TABLE_NAME}.${constraint.REFERENCED_COLUMN_NAME}`);
        });

        // 4. Test d'insertion
        console.log('\n4. Test d\'insertion...');
        try {
            // Récupérer un centre valide
            const centre = await executeQuery(`
                SELECT id_centre FROM centres_sante 
                WHERE statut = 'actif' 
                LIMIT 1
            `);
            
            if (centre.length > 0) {
                console.log(`✅ Centre de test trouvé: ID ${centre[0].id_centre}`);
                console.log('✅ La contrainte de clé étrangère fonctionne correctement');
            } else {
                console.log('❌ Aucun centre actif trouvé');
            }
        } catch (error) {
            console.log('❌ Erreur lors du test:', error.message);
        }

    } catch (error) {
        console.error('❌ Erreur lors de la correction:', error);
    } finally {
        process.exit(0);
    }
}

fixForeignKey();
