/**
 * Middleware d'authentification unifié pour AutoStack Manager
 * Combine les fonctionnalités des deux implémentations précédentes
 */
const jwt = require('jsonwebtoken');

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'autostack_secret_key';

/**
 * Middleware pour vérifier le token JWT et protéger les routes
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction next d'Express
 */
const verifyToken = async (req, res, next) => {
  try {
    let token;
    
    // Vérifier si le token est présent dans les headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // Extraire le token du header "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Vérifier si le token existe
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Accès non autorisé. Token manquant.' 
      });
    }
    
    // Vérifier le token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Ajouter les informations utilisateur à la requête
    req.user = decoded;
    
    // Si un modèle User est disponible, vérifier si l'utilisateur existe toujours
    if (req.app.locals.models && req.app.locals.models.User) {
      const User = req.app.locals.models.User;
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return res.status(401).json({ 
          success: false,
          message: 'L\'utilisateur associé à ce token n\'existe plus' 
        });
      }
      
      // Vérifier si l'utilisateur est actif
      if (user.isActive === false) {
        return res.status(401).json({ 
          success: false,
          message: 'Ce compte a été désactivé' 
        });
      }
      
      // Mettre à jour les informations utilisateur avec les données de la base de données
      req.user = {
        id: user._id,
        role: user.role,
        email: user.email
      };
    }
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token invalide' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token expiré' 
      });
    }
    
    return res.status(401).json({ 
      success: false,
      message: 'Erreur d\'authentification',
      error: error.message
    });
  }
};

/**
 * Middleware pour restreindre l'accès en fonction du rôle
 * @param {...String} roles - Rôles autorisés
 * @returns {Function} Middleware Express
 */
const checkRole = (...roles) => {
  return (req, res, next) => {
    // Vérifier si l'utilisateur est authentifié
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Utilisateur non authentifié' 
      });
    }

    // Vérifier si le rôle de l'utilisateur est dans la liste des rôles autorisés
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: 'Vous n\'avez pas les permissions nécessaires pour effectuer cette action' 
      });
    }
    
    next();
  };
};

// Alias pour maintenir la compatibilité avec le code existant
const protect = verifyToken;
const restrictTo = checkRole;

module.exports = {
  verifyToken,
  checkRole,
  protect,
  restrictTo
};
