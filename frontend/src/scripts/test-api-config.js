/**
 * Script de test pour vérifier la configuration API
 * À exécuter dans la console du navigateur
 */

console.log('🧪 Test de la configuration API...\n');

// Test 1: Vérifier que api.config.ts existe
try {
  const { getApiBaseUrl, buildApiUrl } = require('../config/api.config');
  console.log('✅ api.config.ts chargé');
  console.log('   Base URL:', getApiBaseUrl());
  console.log('   Test URL:', buildApiUrl('/test'));
} catch (error) {
  console.error('❌ Erreur chargement api.config.ts:', error);
}

// Test 2: Vérifier que apiFetch existe
try {
  const { apiFetch } = require('../utils/apiFetch');
  console.log('✅ apiFetch.ts chargé');
} catch (error) {
  console.error('❌ Erreur chargement apiFetch.ts:', error);
}

// Test 3: Vérifier que exportUtils existe
try {
  const { exportStatsCSV, exportStatsPDF } = require('../utils/exportUtils');
  console.log('✅ exportUtils.ts chargé');
} catch (error) {
  console.error('❌ Erreur chargement exportUtils.ts:', error);
}

// Test 4: Vérifier les URLs dans le code
console.log('\n🔍 Vérification des URLs hardcodées...');
const hasHardcodedUrls = document.body.innerHTML.includes('localhost:3000');
if (hasHardcodedUrls) {
  console.warn('⚠️ Des URLs hardcodées ont été détectées dans le HTML');
} else {
  console.log('✅ Aucune URL hardcodée détectée dans le HTML');
}

console.log('\n✅ Tests terminés');

