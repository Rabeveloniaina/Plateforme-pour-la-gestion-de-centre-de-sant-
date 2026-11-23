/**
 * Utilitaire pour tester la configuration API dans la console du navigateur
 * Usage : Importer dans la console et appeler testApiConfig()
 */

export const testApiConfig = () => {
  console.log('🧪 Test de la configuration API...\n');

  // Test 1: Vérifier que api.config.ts fonctionne
  try {
    const { getApiBaseUrl, buildApiUrl } = require('../config/api.config');
    const baseUrl = getApiBaseUrl();
    const testUrl = buildApiUrl('/test');
    
    console.log('✅ api.config.ts');
    console.log('   Base URL:', baseUrl);
    console.log('   Test URL:', testUrl);
    
    if (baseUrl !== '/api') {
      console.warn('⚠️ Base URL devrait être "/api" en développement');
    }
  } catch (error) {
    console.error('❌ Erreur api.config.ts:', error);
    return false;
  }

  // Test 2: Vérifier que apiFetch existe
  try {
    const { apiFetch } = require('../utils/apiFetch');
    console.log('✅ apiFetch.ts chargé');
  } catch (error) {
    console.error('❌ Erreur apiFetch.ts:', error);
    return false;
  }

  // Test 3: Vérifier que exportUtils existe
  try {
    const { exportStatsCSV, exportStatsPDF } = require('../utils/exportUtils');
    console.log('✅ exportUtils.ts chargé');
  } catch (error) {
    console.error('❌ Erreur exportUtils.ts:', error);
    return false;
  }

  // Test 4: Vérifier le token
  const token = localStorage.getItem('token');
  if (token) {
    console.log('✅ Token présent dans localStorage');
  } else {
    console.warn('⚠️ Aucun token trouvé (normal si non connecté)');
  }

  // Test 5: Vérifier les URLs dans le code source
  console.log('\n🔍 Vérification des URLs hardcodées...');
  const scripts = Array.from(document.querySelectorAll('script[src]'));
  const hasHardcoded = scripts.some(script => 
    script.getAttribute('src')?.includes('localhost:3000')
  );
  
  if (hasHardcoded) {
    console.warn('⚠️ Des URLs hardcodées ont été détectées');
  } else {
    console.log('✅ Aucune URL hardcodée détectée dans les scripts');
  }

  console.log('\n✅ Tests terminés');
  return true;
};

// Export pour utilisation dans la console
if (typeof window !== 'undefined') {
  (window as any).testApiConfig = testApiConfig;
}

