/**
 * Configuration de base pour les services backend
 * Module partagé pour initialiser les services avec les middlewares et configurations communs
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { connectDB } = require('../common/utils/database');
const models = require('../common/models');
const { createDAOs } = require('../common/utils/dao');
const { errorHandler, notFoundHandler } = require('../common/middleware/errorHandler');
const { setupPrometheusMiddleware } = require('../common/middleware/prometheus');

/**
 * Initialiser un service Express avec les configurations et middlewares communs
 * @param {string} serviceName - Nom du service
 * @param {Object} options - Options de configuration
 * @returns {Object} - Application Express configurée et objets utilitaires
 */
const initializeService = async (serviceName, options = {}) => {
  // Options par défaut
  const defaultOptions = {
    enableCors: true,
    enableHelmet: true,
    enableMorgan: true,
    morganFormat: 'dev',
    enableCompression: true,
    enableMetrics: true,
    connectToDatabase: true,
    mongoUri: process.env.MONGO_URI,
    port: process.env.PORT || 3000,
    apiPrefix: '/api'
  };

  // Fusionner les options par défaut avec les options fournies
  const config = { ...defaultOptions, ...options };

  // Créer l'application Express
  const app = express();

  // Configurer les middlewares de base
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Activer CORS si nécessaire
  if (config.enableCors) {
    app.use(cors());
  }

  // Activer Helmet pour la sécurité si nécessaire
  if (config.enableHelmet) {
    app.use(helmet());
  }

  // Activer Morgan pour le logging si nécessaire
  if (config.enableMorgan) {
    app.use(morgan(config.morganFormat));
  }

  // Activer la compression si nécessaire
  if (config.enableCompression) {
    const compression = require('compression');
    app.use(compression());
  }

  // Activer les métriques Prometheus si nécessaire
  if (config.enableMetrics) {
    setupPrometheusMiddleware(app, serviceName);
  }

  // Stocker le nom du service dans l'application
  app.locals.serviceName = serviceName;

  // Se connecter à la base de données si nécessaire
  let db = null;
  if (config.connectToDatabase) {
    try {
      db = await connectDB(config.mongoUri);
      
      // Rendre les modèles disponibles dans l'application
      app.locals.models = models;
      
      // Créer les DAOs et les rendre disponibles dans l'application
      const daos = createDAOs(models);
      app.locals.daos = daos;
      
      console.log(`[${serviceName}] Connexion à la base de données établie`);
    } catch (error) {
      console.error(`[${serviceName}] Erreur de connexion à la base de données:`, error);
      throw error;
    }
  }

  // Middleware pour ajouter des en-têtes communs
  app.use((req, res, next) => {
    res.setHeader('X-Service-Name', serviceName);
    next();
  });

  // Middleware pour gérer les routes non trouvées (à ajouter après toutes les routes)
  const setupErrorHandlers = () => {
    app.use(notFoundHandler);
    app.use(errorHandler);
  };

  // Fonction pour démarrer le serveur
  const startServer = (port = config.port) => {
    return new Promise((resolve, reject) => {
      const server = app.listen(port, () => {
        console.log(`[${serviceName}] Service démarré sur le port ${port}`);
        resolve(server);
      });
      
      server.on('error', (error) => {
        console.error(`[${serviceName}] Erreur lors du démarrage du serveur:`, error);
        reject(error);
      });
    });
  };

  return {
    app,
    db,
    models,
    daos: app.locals.daos,
    config,
    setupErrorHandlers,
    startServer
  };
};

module.exports = {
  initializeService
};
