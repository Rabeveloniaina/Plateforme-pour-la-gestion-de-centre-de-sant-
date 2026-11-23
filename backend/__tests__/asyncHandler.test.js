/**
 * Tests pour l'utilitaire asyncHandler
 */

const { asyncHandler, createError, Errors } = require('../src/utils/asyncHandler');

describe('asyncHandler', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {}, params: {}, query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  test('devrait exécuter une fonction async sans erreur', async () => {
    const handler = asyncHandler(async (req, res) => {
      res.json({ success: true });
    });

    await handler(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ success: true });
    expect(next).not.toHaveBeenCalled();
  });

  test('devrait capturer les erreurs et les passer à next', async () => {
    const error = new Error('Test error');
    const handler = asyncHandler(async (req, res) => {
      throw error;
    });

    await handler(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
  });

  test('devrait gérer les erreurs HttpError', async () => {
    const httpError = createError(404, 'Not found', 'NOT_FOUND');
    const handler = asyncHandler(async (req, res) => {
      throw httpError;
    });

    await handler(req, res, next);

    expect(next).toHaveBeenCalledWith(httpError);
    expect(httpError.statusCode).toBe(404);
    expect(httpError.message).toBe('Not found');
    expect(httpError.code).toBe('NOT_FOUND');
  });

  test('devrait gérer les promesses rejetées', async () => {
    const error = new Error('Promise rejected');
    const handler = asyncHandler(async (req, res) => {
      throw error; // Utiliser throw au lieu de Promise.reject
    });

    await handler(req, res, next);

    // Vérifier que next a été appelé avec l'erreur
    expect(next).toHaveBeenCalledWith(error);
  });
});

describe('createError', () => {
  test('devrait créer une erreur HTTP avec statusCode et message', () => {
    const error = createError(400, 'Bad request', 'BAD_REQUEST');

    expect(error).toBeInstanceOf(Error);
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Bad request');
    expect(error.code).toBe('BAD_REQUEST');
  });

  test('devrait utiliser UNEXPECTED_ERROR comme code par défaut', () => {
    const error = createError(500, 'Internal error');

    expect(error.code).toBe('UNEXPECTED_ERROR');
  });
});

describe('Errors', () => {
  test('NOT_FOUND devrait créer une erreur 404', () => {
    const error = Errors.NOT_FOUND('Patient');

    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Patient non trouvé(e)');
    expect(error.code).toBe('NOT_FOUND');
  });

  test('ALREADY_EXISTS devrait créer une erreur 409', () => {
    const error = Errors.ALREADY_EXISTS('Médicament');

    expect(error.statusCode).toBe(409);
    expect(error.message).toBe('Médicament existe déjà');
    expect(error.code).toBe('ALREADY_EXISTS');
  });

  test('UNAUTHORIZED devrait créer une erreur 401', () => {
    const error = Errors.UNAUTHORIZED('Non autorisé');

    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Non autorisé');
    expect(error.code).toBe('UNAUTHORIZED');
  });

  test('FORBIDDEN devrait créer une erreur 403', () => {
    const error = Errors.FORBIDDEN('Accès interdit');

    expect(error.statusCode).toBe(403);
    expect(error.message).toBe('Accès interdit');
    expect(error.code).toBe('FORBIDDEN');
  });

  test('BAD_REQUEST devrait créer une erreur 400', () => {
    const error = Errors.BAD_REQUEST('Requête invalide');

    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Requête invalide');
    expect(error.code).toBe('BAD_REQUEST');
  });

  test('VALIDATION_ERROR devrait créer une erreur 400', () => {
    const error = Errors.VALIDATION_ERROR('Champs manquants');

    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Champs manquants');
    expect(error.code).toBe('VALIDATION_ERROR');
  });

  test('INTERNAL_ERROR devrait créer une erreur 500', () => {
    const error = Errors.INTERNAL_ERROR('Erreur serveur');

    expect(error.statusCode).toBe(500);
    expect(error.message).toBe('Erreur serveur');
    expect(error.code).toBe('INTERNAL_ERROR');
  });

  test('devrait utiliser des messages par défaut', () => {
    const error1 = Errors.NOT_FOUND();
    const error2 = Errors.ALREADY_EXISTS();
    const error3 = Errors.UNAUTHORIZED();
    const error4 = Errors.FORBIDDEN();
    const error5 = Errors.BAD_REQUEST();
    const error6 = Errors.VALIDATION_ERROR();
    const error7 = Errors.INTERNAL_ERROR();

    expect(error1.message).toBe('Ressource non trouvé(e)');
    expect(error2.message).toBe('Ressource existe déjà');
    expect(error3.message).toBe('Non autorisé');
    expect(error4.message).toBe('Accès interdit');
    expect(error5.message).toBe('Requête invalide');
    expect(error6.message).toBe('Erreur de validation');
    expect(error7.message).toBe('Erreur interne du serveur');
  });
});

