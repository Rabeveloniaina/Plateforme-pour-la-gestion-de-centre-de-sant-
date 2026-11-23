/**
 * Utilitaires pour les exports (CSV, PDF, etc.)
 */

import { buildApiUrl } from '../config/api.config';

/**
 * Télécharge un fichier depuis l'API
 * @param url - URL de l'endpoint API (sans /api)
 * @param filename - Nom du fichier à télécharger
 * @param defaultErrorMessage - Message d'erreur par défaut
 */
export const downloadFile = async (
  url: string,
  filename: string,
  defaultErrorMessage: string = 'Erreur lors du téléchargement'
): Promise<void> => {
  try {
    const token = localStorage.getItem('token');
    const fullUrl = buildApiUrl(url);
    
    const response = await fetch(fullUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (response.ok) {
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(anchor);
    } else {
      const errorData = await response.json().catch(() => ({ message: 'Erreur inconnue' }));
      throw new Error(errorData.message || defaultErrorMessage);
    }
  } catch (error: any) {
    console.error('Erreur lors du téléchargement:', error);
    throw new Error(error.message || defaultErrorMessage);
  }
};

/**
 * Exporte des statistiques en CSV
 * @param scope - Scope de l'export (centre, region, etc.)
 * @param periode - Période (jour, semaine, mois)
 */
export const exportStatsCSV = async (scope: string = 'centre', periode: string = 'mois'): Promise<void> => {
  const url = `/statistiques/export?scope=${scope}&periode=${periode}`;
  const filename = `statistiques-${periode}.csv`;
  await downloadFile(url, filename, 'Erreur lors de l\'export CSV');
};

/**
 * Exporte des statistiques en PDF
 * @param scope - Scope de l'export (centre, region, etc.)
 * @param periode - Période (jour, semaine, mois)
 */
export const exportStatsPDF = async (scope: string = 'centre', periode: string = 'mois'): Promise<void> => {
  const url = `/statistiques/export-pdf?scope=${scope}&periode=${periode}`;
  const filename = `rapport-statistiques-${periode}.pdf`;
  await downloadFile(url, filename, 'Erreur lors de l\'export PDF');
};

