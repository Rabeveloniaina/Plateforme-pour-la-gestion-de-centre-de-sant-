const { v4: uuidv4 } = require('uuid');

class HttpError extends Error {
  constructor(statusCode, message, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || 'UNEXPECTED_ERROR';
  }
}

function requestIdMiddleware(req, res, next) {
  const requestId = (req.headers['x-request-id'] || '').toString().trim() || uuidv4();
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
}

function notFoundMiddleware(req, res) {
  const payload = {
    success: false,
    error: 'NOT_FOUND',
    message: `La route ${req.originalUrl} n'existe pas`,
    requestId: req.requestId,
  };
  res.status(404).json(payload);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;
  const code = err.code || 'UNEXPECTED_ERROR';
  const message = err.message || 'Erreur interne du serveur';

  // Log structuré
  console.error(JSON.stringify({
    level: 'error',
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    statusCode,
    code,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  }));

  res.status(statusCode).json({
    success: false,
    error: code,
    message: process.env.NODE_ENV === 'development' ? message : (statusCode === 500 ? 'Une erreur est survenue' : message),
    requestId: req.requestId,
  });
}

module.exports = { HttpError, requestIdMiddleware, errorHandler, notFoundMiddleware };


