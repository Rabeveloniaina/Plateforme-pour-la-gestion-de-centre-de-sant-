/**
 * Utilitaire pour remplacer les fetch avec localhost:3000 hardcodés
 * Utilise la configuration centralisée de l'API
 */

import { buildApiUrl } from '../config/api.config';

/**
 * Fetch avec authentification automatique et gestion d'erreurs
 * Remplace les appels fetch directs avec localhost:3000
 * 
 * @param endpoint - Endpoint API (sans /api)
 * @param options - Options de fetch (headers personnalisés écraseront les headers par défaut)
 * @param skipAuth - Si true, n'ajoute pas le token d'authentification
 */
export const apiFetch = async (
  endpoint: string,
  options: RequestInit = {},
  skipAuth: boolean = false
): Promise<Response> => {
  const token = localStorage.getItem('token');
  const fullUrl = buildApiUrl(endpoint);
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  
  // Ajouter le token seulement si pas skipAuth et si token disponible
  if (!skipAuth && token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return fetch(fullUrl, {
    ...options,
    headers,
  });
};

/**
 * Fetch JSON avec gestion automatique des erreurs
 */
export const apiFetchJson = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const response = await apiFetch(endpoint, options);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Erreur inconnue' }));
    throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
  }
  
  return response.json();
};

