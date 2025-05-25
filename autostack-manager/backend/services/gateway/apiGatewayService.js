/**
 * Service Gateway pour AutoStack Manager
 * Point d'entrée centralisé pour tous les microservices
 */
const { createProxyMiddleware } = require('http-proxy-middleware');
const { initializeService } = require('../common/utils/serviceInitializer');
const { verifyToken } = require('../common/middleware/auth');
const { asyncHandler } = require('../common/middleware/errorHandler');

// Configuration du service
const SERVICE_NAME = 'gateway-service';
const PORT = process.env.GATEWAY_PORT || 3000;

// Configuration des services
const SERVICES = {
  AUTH: {
    url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    public: true // Routes accessibles sans authentification
  },
  STACK_SCANNER: {
    url: process.env.STACK_SCANNER_URL || 'http://localhost:3002',
    public: false
  },
  VERSION_CHECKER: {
    url: process.env.VERSION_CHECKER_URL || 'http://localhost:3003',
    public: false
  },
  VULN_SCANNER: {
    url: process.env.VULN_SCANNER_URL || 'http://localhost:3004',
    public: false
  },
  REPORT_GENERATOR: {
    url: process.env.REPORT_GENERATOR_URL || 'http://localhost:3005',
    public: false
  },
  NOTIFIER: {
    url: process.env.NOTIFIER_URL || 'http://localhost:3006',
    public: false
  }
};

/**
 * Initialiser le service Gateway
 */
const initGateway = async () => {
  // Initialiser le service avec les configurations communes
  const { app, setupErrorHandlers, startServer } = await initializeService(SERVICE_NAME, {
    port: PORT,
    connectToDatabase: false // Gateway n'a pas besoin de se connecter à la base de données
  });

  // Middleware pour vérifier l'authentification pour les routes protégées
  const authMiddleware = (req, res, next) => {
    // Vérifier si la route est publique
    const path = req.path;
    
    // Les routes d'authentification sont toujours publiques
    if (path.startsWith('/api/auth')) {
      return next();
    }
    
    // Vérifier le token pour les routes protégées
    verifyToken(req, res, next);
  };

  // Appliquer le middleware d'authentification
  app.use('/api', authMiddleware);

  // Configurer les proxies pour chaque service
  // Service d'authentification
  app.use('/api/auth', createProxyMiddleware({
    target: SERVICES.AUTH.url,
    pathRewrite: {
      '^/api/auth': '/api/auth'
    },
    changeOrigin: true,
    logLevel: 'warn'
  }));

  // Service de scan de stack
  app.use('/api/stack-scanner', createProxyMiddleware({
    target: SERVICES.STACK_SCANNER.url,
    pathRewrite: {
      '^/api/stack-scanner': '/api'
    },
    changeOrigin: true,
    logLevel: 'warn'
  }));

  // Service de vérification de versions
  app.use('/api/version-checker', createProxyMiddleware({
    target: SERVICES.VERSION_CHECKER.url,
    pathRewrite: {
      '^/api/version-checker': '/api'
    },
    changeOrigin: true,
    logLevel: 'warn'
  }));

  // Service de scan de vulnérabilités
  app.use('/api/vuln-scanner', createProxyMiddleware({
    target: SERVICES.VULN_SCANNER.url,
    pathRewrite: {
      '^/api/vuln-scanner': '/api'
    },
    changeOrigin: true,
    logLevel: 'warn'
  }));

  // Service de génération de rapports
  app.use('/api/reports', createProxyMiddleware({
    target: SERVICES.REPORT_GENERATOR.url,
    pathRewrite: {
      '^/api/reports': '/api'
    },
    changeOrigin: true,
    logLevel: 'warn'
  }));

  // Service de notification
  app.use('/api/notifications', createProxyMiddleware({
    target: SERVICES.NOTIFIER.url,
    pathRewrite: {
      '^/api/notifications': '/api'
    },
    changeOrigin: true,
    logLevel: 'warn'
  }));

  // Route pour vérifier l'état du gateway
  app.get('/api/status', asyncHandler(async (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Gateway opérationnel',
      services: Object.keys(SERVICES).map(key => ({
        name: key,
        url: SERVICES[key].url,
        public: SERVICES[key].public
      }))
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
  initGateway().catch(err => {
    console.error('Erreur lors de l\'initialisation du service Gateway:', err);
    process.exit(1);
  });
}

module.exports = { initGateway };
