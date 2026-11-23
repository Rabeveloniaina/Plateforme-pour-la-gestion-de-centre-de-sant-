/**
 * Configuration centralisée de l'API
 * Gère automatiquement les URLs selon l'environnement (dev/prod)
 */

// URL de base de l'API
export const getApiBaseUrl = (): string => {
  // En développement, utilise le proxy Vite configuré dans vite.config.ts
  // En production, utilise l'URL de l'API définie dans les variables d'environnement
  if (import.meta.env.MODE === 'development') {
    // Proxy Vite redirige automatiquement /api vers http://localhost:3000/api
    return '/api';
  }
  
  // En production, utilise l'URL de l'API depuis les variables d'environnement
  // ou fallback sur l'URL par défaut
  return import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
};

// Fonction helper pour construire une URL API complète
export const buildApiUrl = (path: string): string => {
  const baseUrl = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

// Export de la constante pour utilisation directe si nécessaire
export const API_BASE_URL = getApiBaseUrl();

