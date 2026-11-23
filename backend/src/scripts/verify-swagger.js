/**
 * Script de vérification que Swagger est correctement configuré
 */

const swaggerSpec = require('../config/swagger');

console.log('🔍 Vérification de la configuration Swagger...\n');

try {
    // Vérifier que la spécification est générée
    if (!swaggerSpec) {
        console.error('❌ La spécification Swagger n\'a pas pu être générée');
        process.exit(1);
    }

    console.log('✅ Spécification Swagger générée avec succès\n');

    // Afficher les informations de base
    console.log('📋 Informations de l\'API :');
    console.log(`   Titre : ${swaggerSpec.info.title}`);
    console.log(`   Version : ${swaggerSpec.info.version}`);
    console.log(`   OpenAPI : ${swaggerSpec.openapi}\n`);

    // Compter les tags
    const tagsCount = swaggerSpec.tags ? swaggerSpec.tags.length : 0;
    console.log(`📑 Tags définis : ${tagsCount}`);
    if (swaggerSpec.tags) {
        swaggerSpec.tags.forEach(tag => {
            console.log(`   - ${tag.name}`);
        });
    }

    // Compter les paths
    const pathsCount = swaggerSpec.paths ? Object.keys(swaggerSpec.paths).length : 0;
    console.log(`\n🛣️  Endpoints documentés : ${pathsCount}`);

    if (swaggerSpec.paths) {
        console.log('\n   Endpoints disponibles :');
        Object.keys(swaggerSpec.paths).forEach(path => {
            const methods = Object.keys(swaggerSpec.paths[path]);
            methods.forEach(method => {
                const endpoint = swaggerSpec.paths[path][method];
                console.log(`   ${method.toUpperCase()} ${path} - ${endpoint.summary || 'Pas de description'}`);
            });
        });
    }

    // Vérifier les schémas
    const schemasCount = swaggerSpec.components?.schemas ? Object.keys(swaggerSpec.components.schemas).length : 0;
    console.log(`\n📦 Schémas définis : ${schemasCount}`);

    // Vérifier la sécurité
    if (swaggerSpec.components?.securitySchemes) {
        console.log(`\n🔐 Schémas de sécurité : ${Object.keys(swaggerSpec.components.securitySchemes).length}`);
        Object.keys(swaggerSpec.components.securitySchemes).forEach(scheme => {
            console.log(`   - ${scheme}`);
        });
    }

    console.log('\n✅ Vérification terminée avec succès !');
    console.log('\n💡 Pour accéder à la documentation :');
    console.log('   1. Démarrer le serveur : npm run dev');
    console.log('   2. Ouvrir : http://localhost:3000/api-docs');

} catch (error) {
    console.error('❌ Erreur lors de la vérification :', error.message);
    console.error(error.stack);
    process.exit(1);
}

