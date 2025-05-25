/**
 * Service d'authentification pour AutoStack Manager
 * Gère l'authentification des utilisateurs et la génération de tokens JWT
 */
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { initializeService } = require('../common/utils/serviceInitializer');
const { verifyToken } = require('../common/middleware/auth');
const { asyncHandler } = require('../common/middleware/errorHandler');

// Configuration du service
const SERVICE_NAME = 'auth-service';
const JWT_SECRET = process.env.JWT_SECRET || 'autostack_secret_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const PORT = process.env.AUTH_SERVICE_PORT || 3001;

/**
 * Initialiser le service d'authentification
 */
const initAuth = async () => {
  // Initialiser le service avec les configurations communes
  const { app, daos, setupErrorHandlers, startServer } = await initializeService(SERVICE_NAME, {
    port: PORT
  });

  // Extraire les DAOs nécessaires
  const { userDAO } = daos;

  /**
   * Route d'inscription
   * @route POST /api/auth/register
   */
  app.post('/api/auth/register', asyncHandler(async (req, res) => {
    const { username, email, password, role = 'viewer' } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await userDAO.findOne({ 
      $or: [{ username }, { email }] 
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Cet utilisateur ou cet email existe déjà'
      });
    }

    // Hasher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Créer l'utilisateur
    const user = await userDAO.create({
      username,
      email,
      password: hashedPassword,
      role
    });

    // Générer le token JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  }));

  /**
   * Route de connexion
   * @route POST /api/auth/login
   */
  app.post('/api/auth/login', asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await userDAO.findOne({ username }, '+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    // Vérifier si le compte est actif
    if (user.isActive === false) {
      return res.status(401).json({
        success: false,
        message: 'Ce compte a été désactivé'
      });
    }

    // Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    // Mettre à jour la date de dernière connexion
    await userDAO.update(user._id, { lastLogin: Date.now() });

    // Générer le token JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  }));

  /**
   * Route pour vérifier le token
   * @route GET /api/auth/verify
   */
  app.get('/api/auth/verify', verifyToken, asyncHandler(async (req, res) => {
    // Le middleware verifyToken a déjà vérifié le token
    // et ajouté les informations utilisateur à req.user
    
    // Récupérer les informations utilisateur complètes
    const user = await userDAO.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token valide',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  }));

  /**
   * Route pour récupérer le profil utilisateur
   * @route GET /api/auth/profile
   */
  app.get('/api/auth/profile', verifyToken, asyncHandler(async (req, res) => {
    const user = await userDAO.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        preferences: user.preferences
      }
    });
  }));

  /**
   * Route pour mettre à jour le profil utilisateur
   * @route PUT /api/auth/profile
   */
  app.put('/api/auth/profile', verifyToken, asyncHandler(async (req, res) => {
    const { username, email, preferences } = req.body;
    const updateData = {};

    // Vérifier si les champs sont fournis
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (preferences) updateData.preferences = preferences;

    // Mettre à jour l'utilisateur
    const user = await userDAO.update(req.user.id, updateData);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profil mis à jour avec succès',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        preferences: user.preferences
      }
    });
  }));

  /**
   * Route pour changer le mot de passe
   * @route PUT /api/auth/change-password
   */
  app.put('/api/auth/change-password', verifyToken, asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    // Récupérer l'utilisateur avec le mot de passe
    const user = await userDAO.findOne({ _id: req.user.id }, '+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier le mot de passe actuel
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }

    // Hasher le nouveau mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Mettre à jour le mot de passe
    await userDAO.update(user._id, { password: hashedPassword });

    res.status(200).json({
      success: true,
      message: 'Mot de passe changé avec succès'
    });
  }));

  // Configurer les gestionnaires d'erreurs
  setupErrorHandlers();

  // Démarrer le serveur
  const server = await startServer();

  return { app, server };
};

// Démarrer le service si ce fichier est exécuté directement
if (require.main === module) {
  initAuth().catch(err => {
    console.error('Erreur lors de l\'initialisation du service d\'authentification:', err);
    process.exit(1);
  });
}

module.exports = { initAuth };
