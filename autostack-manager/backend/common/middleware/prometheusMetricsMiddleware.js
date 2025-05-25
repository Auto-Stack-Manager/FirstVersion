/**
 * Module de collecte de métriques Prometheus pour AutoStack Manager
 * Fournit des middlewares pour suivre les requêtes HTTP et leur durée
 */
const client = require('prom-client');

// Création du registre Prometheus
const register = new client.Registry();

// Ajout des métriques par défaut (CPU, mémoire, etc.)
client.collectDefaultMetrics({ register });

// Compteur de requêtes HTTP
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Nombre total de requêtes HTTP',
  labelNames: ['method', 'path', 'status', 'service'],
  registers: [register]
});

// Histogramme des temps de réponse
const httpRequestDurationMs = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Durée des requêtes HTTP en millisecondes',
  labelNames: ['method', 'path', 'status', 'service'],
  buckets: [10, 50, 100, 200, 500, 1000, 2000, 5000, 10000],
  registers: [register]
});

// Jauge pour les connexions actives
const activeConnections = new client.Gauge({
  name: 'http_active_connections',
  help: 'Nombre de connexions HTTP actives',
  labelNames: ['service'],
  registers: [register]
});

// Jauge pour la mémoire utilisée par service
const serviceMemoryUsage = new client.Gauge({
  name: 'service_memory_usage_bytes',
  help: 'Utilisation mémoire par service en bytes',
  labelNames: ['service', 'type'],
  registers: [register]
});

/**
 * Middleware pour compter les requêtes HTTP
 * @param {string} serviceName - Nom du service (optionnel)
 * @returns {Function} Middleware Express
 */
const requestCountMiddleware = (serviceName = 'unknown') => (req, res, next) => {
  // Enregistrer l'heure de début
  req.startTime = Date.now();
  
  // Incrémenter le nombre de connexions actives
  activeConnections.inc({ service: serviceName });
  
  // Intercepter la fin de la réponse pour enregistrer les métriques
  const end = res.end;
  res.end = function() {
    // Appeler la méthode originale
    end.apply(res, arguments);
    
    // Décrémenter le nombre de connexions actives
    activeConnections.dec({ service: serviceName });
    
    // Incrémenter le compteur de requêtes
    httpRequestsTotal.inc({
      method: req.method,
      path: req.originalUrl || req.path,
      status: res.statusCode,
      service: serviceName
    });
  };
  
  next();
};

/**
 * Middleware pour mesurer le temps de réponse des requêtes HTTP
 * @param {string} serviceName - Nom du service (optionnel)
 * @returns {Function} Middleware Express
 */
const responseTimeMiddleware = (serviceName = 'unknown') => (req, res, next) => {
  // Vérifier que le temps de début a été enregistré
  if (!req.startTime) {
    req.startTime = Date.now();
  }
  
  // Intercepter la fin de la réponse pour enregistrer les métriques
  const end = res.end;
  res.end = function() {
    // Appeler la méthode originale
    end.apply(res, arguments);
    
    // Calculer la durée de la requête
    const duration = Date.now() - req.startTime;
    
    // Enregistrer la durée dans l'histogramme
    httpRequestDurationMs.observe({
      method: req.method,
      path: req.originalUrl || req.path,
      status: res.statusCode,
      service: serviceName
    }, duration);
  };
  
  next();
};

/**
 * Middleware pour exposer les métriques Prometheus
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const metricsMiddleware = async (req, res) => {
  try {
    // Collecter les métriques d'utilisation mémoire
    const memoryUsage = process.memoryUsage();
    const serviceName = req.app.locals.serviceName || 'unknown';
    
    // Mettre à jour les jauges de mémoire
    serviceMemoryUsage.set({ service: serviceName, type: 'rss' }, memoryUsage.rss);
    serviceMemoryUsage.set({ service: serviceName, type: 'heapTotal' }, memoryUsage.heapTotal);
    serviceMemoryUsage.set({ service: serviceName, type: 'heapUsed' }, memoryUsage.heapUsed);
    serviceMemoryUsage.set({ service: serviceName, type: 'external' }, memoryUsage.external);
    
    // Envoyer les métriques
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    console.error('Erreur lors de la génération des métriques:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération des métriques',
      error: err.message
    });
  }
};

/**
 * Configurer les middlewares Prometheus pour une application Express
 * @param {Object} app - Application Express
 * @param {string} serviceName - Nom du service
 */
const setupPrometheusMiddleware = (app, serviceName = 'unknown') => {
  if (!app) {
    throw new Error('Application Express requise');
  }
  
  // Stocker le nom du service dans l'application
  app.locals.serviceName = serviceName;
  
  // Appliquer les middlewares
  app.use(requestCountMiddleware(serviceName));
  app.use(responseTimeMiddleware(serviceName));
  
  // Exposer l'endpoint de métriques
  app.get('/metrics', metricsMiddleware);
  
  return app;
};

module.exports = {
  register,
  requestCountMiddleware,
  responseTimeMiddleware,
  metricsMiddleware,
  setupPrometheusMiddleware,
  metrics: {
    httpRequestsTotal,
    httpRequestDurationMs,
    activeConnections,
    serviceMemoryUsage
  }
};
