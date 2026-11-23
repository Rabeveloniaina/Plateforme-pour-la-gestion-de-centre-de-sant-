import { useState, useCallback } from 'react';
import { useToast } from '../context/ToastContext';

/**
 * Hook pour standardiser la gestion d'erreurs dans les composants
 * 
 * @example
 * const { handleError, error, clearError } = useErrorHandler();
 * 
 * try {
 *   await api.post('/endpoint', data);
 * } catch (err) {
 *   handleError(err);
 * }
 */
export function useErrorHandler() {
  const { showToast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  /**
   * Gère une erreur de manière standardisée
   * 
   * @param error - L'erreur à gérer (Error, Response, ou string)
   * @param options - Options de gestion d'erreur
   */
  const handleError = useCallback(async (
    error: any,
    options: {
      showToast?: boolean;
      toastMessage?: string;
      logError?: boolean;
    } = {}
  ) => {
    const {
      showToast: showToastOption = true,
      toastMessage,
      logError = true,
    } = options;

    let errorMessage = 'Une erreur est survenue';
    let validationErrors: Record<string, string> = {};

    // Log l'erreur si demandé
    if (logError) {
      console.error('❌ Erreur capturée:', error);
    }

    // Gérer différents types d'erreurs
    if (typeof error === 'string') {
      errorMessage = error;
    } else if (error instanceof Error) {
      errorMessage = error.message || errorMessage;
    } else if (error?.response) {
      // Erreur axios/fetch avec response
      const response = error.response;
      const data = response.data || {};
      
      // Message d'erreur depuis la réponse
      errorMessage = data.message || data.error || errorMessage;
      
      // Gérer les erreurs de validation (400)
      if (response.status === 400 && data.errors) {
        if (Array.isArray(data.errors)) {
          data.errors.forEach((err: any) => {
            const field = err.param || err.path || 'general';
            validationErrors[field] = err.msg || err.message || '';
          });
        } else if (typeof data.errors === 'object') {
          validationErrors = data.errors;
        }
      }
      
      // Messages spécifiques par code de statut
      if (response.status === 401) {
        errorMessage = 'Non autorisé. Veuillez vous reconnecter.';
      } else if (response.status === 403) {
        errorMessage = 'Accès interdit.';
      } else if (response.status === 404) {
        errorMessage = 'Ressource non trouvée.';
      } else if (response.status === 409) {
        errorMessage = data.message || 'Conflit : cette ressource existe déjà.';
      } else if (response.status === 500) {
        errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
      }
    } else if (error?.message) {
      errorMessage = error.message;
    }

    // Définir l'erreur dans l'état
    setError(errorMessage);
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
    }

    // Afficher le toast si demandé
    if (showToastOption) {
      showToast(toastMessage || errorMessage, 'error');
    }

    return {
      message: errorMessage,
      fieldErrors: validationErrors,
      hasFieldErrors: Object.keys(validationErrors).length > 0,
    };
  }, [showToast]);

  /**
   * Efface l'erreur actuelle
   */
  const clearError = useCallback(() => {
    setError(null);
    setFieldErrors({});
  }, []);

  /**
   * Gère une erreur avec un message personnalisé
   */
  const handleErrorWithMessage = useCallback((
    error: any,
    customMessage: string
  ) => {
    return handleError(error, {
      toastMessage: customMessage,
    });
  }, [handleError]);

  /**
   * Gère une erreur silencieusement (sans toast)
   */
  const handleErrorSilent = useCallback((error: any) => {
    return handleError(error, {
      showToast: false,
    });
  }, [handleError]);

  return {
    error,
    fieldErrors,
    handleError,
    handleErrorWithMessage,
    handleErrorSilent,
    clearError,
    hasError: error !== null,
    hasFieldErrors: Object.keys(fieldErrors).length > 0,
  };
}

