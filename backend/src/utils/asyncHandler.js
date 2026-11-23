/**
 * Wrapper pour standardiser la gestion d'erreurs dans les contrôleurs
 * Utilise le middleware errorHandler pour une gestion cohérente
 */

const { HttpError } = require('../middlewares/errorHandler');

/**
 * Enveloppe une fonction async pour capturer automatiquement les erreurs
 * et les passer au middleware errorHandler
 * 
 * @param {Function} fn - Fonction async à wrapper
 * @returns {Function} - Fonction wrapper qui gère les erreurs
 * 
 * @example
 * // Au lieu de :
 * static async create(req, res) {
 *   try {
 *     // code
 *   } catch (error) {
 *     // gestion erreur
 *   }
 * }
 * 
 * // Utilisez :
 * static create = asyncHandler(async (req, res) => {
 *   // code - pas besoin de try/catch
 *   // Les erreurs sont automatiquement capturées
 * });
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Crée une erreur HTTP standardisée
 * 
 * @param {number} statusCode - Code de statut HTTP
 * @param {string} message - Message d'erreur
 * @param {string} code - Code d'erreur personnalisé (optionnel)
 * @returns {HttpError}
 */
function createError(statusCode, message, code) {
  return new HttpError(statusCode, message, code);
}

/**
 * Erreurs communes pré-définies
 */
const Errors = {
  NOT_FOUND: (resource = 'Ressource') => createError(404, `${resource} non trouvé(e)`, 'NOT_FOUND'),
  ALREADY_EXISTS: (resource = 'Ressource') => createError(409, `${resource} existe déjà`, 'ALREADY_EXISTS'),
  UNAUTHORIZED: (message = 'Non autorisé') => createError(401, message, 'UNAUTHORIZED'),
  FORBIDDEN: (message = 'Accès interdit') => createError(403, message, 'FORBIDDEN'),
  BAD_REQUEST: (message = 'Requête invalide') => createError(400, message, 'BAD_REQUEST'),
  VALIDATION_ERROR: (message = 'Erreur de validation') => createError(400, message, 'VALIDATION_ERROR'),
  INTERNAL_ERROR: (message = 'Erreur interne du serveur') => createError(500, message, 'INTERNAL_ERROR'),
};

module.exports = {
  asyncHandler,
  createError,
  Errors,
};

