/**
 * Fonctions utilitaires pour formater les réponses API
 */

/**
 * Formater une réponse de succès
 * @param {*} data - Données à retourner
 * @param {string} message - Message de succès optionnel
 * @returns {object} Réponse formatée
 */
const successResponse = (data = null, message = 'Opération réussie') => {
    return {
        success: true,
        message,
        data
    };
};

/**
 * Formater une réponse d'erreur
 * @param {string} message - Message d'erreur
 * @param {*} errors - Détails des erreurs optionnels
 * @returns {object} Réponse formatée
 */
const errorResponse = (message = 'Une erreur est survenue', errors = null) => {
    const response = {
        success: false,
        message
    };
    
    if (errors) {
        response.errors = errors;
    }
    
    return response;
};

module.exports = {
    successResponse,
    errorResponse
};

