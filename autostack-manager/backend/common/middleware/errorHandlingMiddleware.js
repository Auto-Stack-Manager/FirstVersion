/**
 * Middleware de gestion d'erreurs centralisé pour AutoStack Manager
 * Gère les erreurs courantes et fournit des réponses formatées
 */

/**
 * Middleware de gestion d'erreurs
 * @param {Error} err - L'erreur capturée
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction next d'Express
 */
const errorHandler = (err, req, res, next) => {
  // Journalisation de l'erreur (en production, cela pourrait être envoyé à un service de logging)
  console.error('Erreur:', err);

  // Structure de base de la réponse d'erreur
  const errorResponse = {
    success: false,
    message: err.message || 'Erreur serveur',
    timestamp: new Date().toISOString()
  };

  // Ajouter l'ID de requête s'il existe
  if (req.id) {
    errorResponse.requestId = req.id;
  }

  // Gestion des différents types d'erreurs
  
  // Erreur de validation Mongoose
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(error => error.message);
    return res.status(400).json({
      ...errorResponse,
      message: 'Erreur de validation',
      errors,
      code: 'VALIDATION_ERROR'
    });
  }

  // Erreur de duplication (clé unique)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      ...errorResponse,
      message: `La valeur '${err.keyValue[field]}' pour le champ '${field}' est déjà utilisée`,
      field,
      value: err.keyValue[field],
      code: 'DUPLICATE_KEY'
    });
  }

  // Erreur de cast (ID invalide)
  if (err.name === 'CastError') {
    return res.status(400).json({
      ...errorResponse,
      message: `ID invalide: ${err.value}`,
      field: err.path,
      value: err.value,
      code: 'INVALID_ID'
    });
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      ...errorResponse,
      message: 'Token invalide',
      code: 'INVALID_TOKEN'
    });
  }

  // Erreur d'expiration JWT
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      ...errorResponse,
      message: 'Token expiré',
      expiredAt: err.expiredAt,
      code: 'TOKEN_EXPIRED'
    });
  }

  // Erreurs HTTP personnalisées
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      ...errorResponse,
      code: err.code || `HTTP_${err.statusCode}`
    });
  }

  // Erreur par défaut (500 Internal Server Error)
  const statusCode = 500;
  
  // En développement, inclure la stack trace
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json({
    ...errorResponse,
    code: 'INTERNAL_SERVER_ERROR'
  });
};

/**
 * Créer une erreur HTTP avec un code de statut et un message
 * @param {string} message - Message d'erreur
 * @param {number} statusCode - Code de statut HTTP
 * @param {string} code - Code d'erreur personnalisé
 * @returns {Error} Erreur avec propriétés supplémentaires
 */
const createHttpError = (message, statusCode = 500, code = null) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (code) {
    error.code = code;
  }
  return error;
};

/**
 * Middleware pour capturer les erreurs asynchrones
 * @param {Function} fn - Fonction asynchrone à exécuter
 * @returns {Function} Middleware Express
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Middleware pour gérer les routes non trouvées
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction next d'Express
 */
const notFoundHandler = (req, res, next) => {
  const error = createHttpError(`Route non trouvée: ${req.originalUrl}`, 404, 'NOT_FOUND');
  next(error);
};

module.exports = {
  errorHandler,
  createHttpError,
  asyncHandler,
  notFoundHandler
};
