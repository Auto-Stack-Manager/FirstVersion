/**
 * Service de vérification de versions pour AutoStack Manager
 * Vérifie les dernières versions disponibles pour les composants
 */
const { initializeService } = require('../common/utils/serviceInitializer');
const { asyncHandler } = require('../common/middleware/errorHandler');
const { verifyToken } = require('../common/middleware/auth');

// Configuration du service
const SERVICE_NAME = 'version-checker-service';
const PORT = process.env.VERSION_CHECKER_PORT || 3003;

/**
 * Initialiser le service de vérification de versions
 */
const initVersionChecker = async () => {
  // Initialiser le service avec les configurations communes
  const { app, daos, setupErrorHandlers, startServer } = await initializeService(SERVICE_NAME, {
    port: PORT
  });

  // Extraire les DAOs nécessaires
  const { componentDAO, serviceDAO, notificationDAO } = daos;

  // Middleware d'authentification pour toutes les routes
  app.use('/api', verifyToken);

  /**
   * Route pour vérifier les mises à jour d'un composant
   * @route POST /api/check-updates
   */
  app.post('/api/check-updates', asyncHandler(async (req, res) => {
    const { componentId } = req.body;

    if (!componentId) {
      return res.status(400).json({
        success: false,
        message: 'ID du composant requis'
      });
    }

    // Vérifier si le composant existe
    const component = await componentDAO.findById(componentId);
    if (!component) {
      return res.status(404).json({
        success: false,
        message: 'Composant non trouvé'
      });
    }

    // Simuler la vérification de version (dans une implémentation réelle, cela interrogerait des registres de packages)
    const latestVersion = simulateVersionCheck(component.name, component.type);
    const updateAvailable = isNewerVersion(component.version, latestVersion);

    // Mettre à jour le composant avec les informations de version
    await componentDAO.update(componentId, {
      latestVersion,
      updateAvailable,
      lastChecked: Date.now()
    });

    // Si une mise à jour est disponible, créer une notification
    if (updateAvailable) {
      // Trouver tous les services utilisant ce composant
      const services = await serviceDAO.findAll({ components: componentId });
      
      // Pour chaque service, créer une notification
      for (const service of services) {
        await notificationDAO.create({
          title: 'Mise à jour disponible',
          message: `Une nouvelle version (${latestVersion}) est disponible pour ${component.name}. Version actuelle: ${component.version}`,
          type: 'update',
          severity: 'info',
          service: service._id,
          // Notifier tous les développeurs et administrateurs
          recipients: [] // Dans une implémentation réelle, on récupérerait les utilisateurs avec ces rôles
        });
        
        // Mettre à jour le statut du service si nécessaire
        if (service.status === 'secure') {
          await serviceDAO.update(service._id, { status: 'outdated' });
        }
      }
    }

    res.status(200).json({
      success: true,
      component: {
        id: component._id,
        name: component.name,
        currentVersion: component.version,
        latestVersion,
        updateAvailable,
        lastChecked: new Date()
      }
    });
  }));

  /**
   * Route pour vérifier les mises à jour de tous les composants
   * @route POST /api/check-all-updates
   */
  app.post('/api/check-all-updates', asyncHandler(async (req, res) => {
    // Récupérer tous les composants
    const components = await componentDAO.findAll();
    
    const results = {
      total: components.length,
      updated: 0,
      withUpdates: 0
    };

    // Vérifier les mises à jour pour chaque composant
    for (const component of components) {
      // Simuler la vérification de version
      const latestVersion = simulateVersionCheck(component.name, component.type);
      const updateAvailable = isNewerVersion(component.version, latestVersion);

      // Mettre à jour le composant avec les informations de version
      await componentDAO.update(component._id, {
        latestVersion,
        updateAvailable,
        lastChecked: Date.now()
      });

      results.updated++;
      if (updateAvailable) {
        results.withUpdates++;
      }
    }

    res.status(200).json({
      success: true,
      message: 'Vérification des mises à jour terminée',
      results
    });
  }));

  /**
   * Route pour obtenir les composants avec des mises à jour disponibles
   * @route GET /api/updates-available
   */
  app.get('/api/updates-available', asyncHandler(async (req, res) => {
    const components = await componentDAO.findWithUpdates();

    res.status(200).json({
      success: true,
      count: components.length,
      components
    });
  }));

  // Configurer les gestionnaires d'erreurs
  setupErrorHandlers();

  // Démarrer le serveur
  const server = await startServer();

  return { app, server };
};

/**
 * Simuler la vérification de version
 * @param {string} name - Nom du composant
 * @param {string} type - Type du composant
 * @returns {string} - Dernière version disponible
 */
function simulateVersionCheck(name, type) {
  // Dans une implémentation réelle, cela interrogerait des registres de packages
  const versions = {
    'Node.js': '18.15.0',
    'Express': '4.18.2',
    'MongoDB': '6.0.5',
    'React': '18.2.0',
    'Angular': '15.2.0',
    'Vue.js': '3.2.47',
    'PostgreSQL': '15.2',
    'MySQL': '8.0.32',
    'Redis': '7.0.10',
    'Docker': '23.0.1',
    'Kubernetes': '1.26.3'
  };

  return versions[name] || incrementVersion(name);
}

/**
 * Incrémenter la version pour simuler une mise à jour
 * @param {string} version - Version actuelle
 * @returns {string} - Version incrémentée
 */
function incrementVersion(version) {
  // Extraire les parties de la version (majeur, mineur, patch)
  const parts = version.split('.');
  if (parts.length < 3) {
    return version;
  }

  // Incrémenter le numéro de patch
  parts[2] = (parseInt(parts[2]) + 1).toString();
  return parts.join('.');
}

/**
 * Vérifier si une version est plus récente qu'une autre
 * @param {string} currentVersion - Version actuelle
 * @param {string} latestVersion - Dernière version
 * @returns {boolean} - True si la dernière version est plus récente
 */
function isNewerVersion(currentVersion, latestVersion) {
  const current = currentVersion.split('.').map(Number);
  const latest = latestVersion.split('.').map(Number);

  // Comparer les parties de la version
  for (let i = 0; i < Math.max(current.length, latest.length); i++) {
    const currentPart = current[i] || 0;
    const latestPart = latest[i] || 0;

    if (latestPart > currentPart) {
      return true;
    } else if (latestPart < currentPart) {
      return false;
    }
  }

  return false; // Versions identiques
}

// Démarrer le service si ce fichier est exécuté directement
if (require.main === module) {
  initVersionChecker().catch(err => {
    console.error('Erreur lors de l\'initialisation du service de vérification de versions:', err);
    process.exit(1);
  });
}

module.exports = { initVersionChecker };
