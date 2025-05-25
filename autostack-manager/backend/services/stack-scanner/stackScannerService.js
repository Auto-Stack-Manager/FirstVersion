/**
 * Service de scan de stack pour AutoStack Manager
 * Détecte les composants techniques utilisés dans les services
 */
const { initializeService } = require('../common/utils/serviceInitializer');
const { asyncHandler } = require('../common/middleware/errorHandler');
const { verifyToken, checkRole } = require('../common/middleware/auth');

// Configuration du service
const SERVICE_NAME = 'stack-scanner-service';
const PORT = process.env.STACK_SCANNER_PORT || 3002;

/**
 * Initialiser le service de scan de stack
 */
const initStackScanner = async () => {
  // Initialiser le service avec les configurations communes
  const { app, daos, setupErrorHandlers, startServer } = await initializeService(SERVICE_NAME, {
    port: PORT
  });

  // Extraire les DAOs nécessaires
  const { serviceDAO, componentDAO } = daos;

  // Middleware d'authentification pour toutes les routes
  app.use('/api', verifyToken);

  /**
   * Route pour scanner un service
   * @route POST /api/scan
   */
  app.post('/api/scan', checkRole('admin', 'developer'), asyncHandler(async (req, res) => {
    const { serviceId, repositoryUrl } = req.body;

    if (!serviceId) {
      return res.status(400).json({
        success: false,
        message: 'ID du service requis'
      });
    }

    // Vérifier si le service existe
    const service = await serviceDAO.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service non trouvé'
      });
    }

    // Simuler la détection de composants (dans une implémentation réelle, cela analyserait le code source)
    const detectedComponents = [
      { name: 'Node.js', version: '16.14.0', type: 'language' },
      { name: 'Express', version: '4.17.3', type: 'framework' },
      { name: 'MongoDB', version: '5.0.6', type: 'database' }
    ];

    // Enregistrer les composants détectés
    const savedComponents = [];
    for (const comp of detectedComponents) {
      // Vérifier si le composant existe déjà
      let component = await componentDAO.findOne({
        name: comp.name,
        version: comp.version
      });

      // Créer le composant s'il n'existe pas
      if (!component) {
        component = await componentDAO.create({
          name: comp.name,
          version: comp.version,
          type: comp.type
        });
      }

      savedComponents.push(component);

      // Ajouter le composant au service s'il n'y est pas déjà
      await serviceDAO.addComponent(serviceId, component._id);
    }

    // Mettre à jour le service avec la date du dernier scan
    await serviceDAO.update(serviceId, {
      lastScan: Date.now(),
      status: 'secure' // Par défaut, considérer comme sécurisé jusqu'à ce que le VulnScanner trouve des vulnérabilités
    });

    res.status(200).json({
      success: true,
      message: 'Scan de stack terminé avec succès',
      components: savedComponents,
      serviceId
    });
  }));

  /**
   * Route pour obtenir les composants d'un service
   * @route GET /api/service/:serviceId/components
   */
  app.get('/api/service/:serviceId/components', asyncHandler(async (req, res) => {
    const { serviceId } = req.params;

    // Vérifier si le service existe
    const service = await serviceDAO.findById(serviceId, 'components');
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      components: service.components
    });
  }));

  /**
   * Route pour obtenir tous les composants
   * @route GET /api/components
   */
  app.get('/api/components', asyncHandler(async (req, res) => {
    const components = await componentDAO.findAll();

    res.status(200).json({
      success: true,
      count: components.length,
      components
    });
  }));

  /**
   * Route pour obtenir les composants par type
   * @route GET /api/components/type/:type
   */
  app.get('/api/components/type/:type', asyncHandler(async (req, res) => {
    const { type } = req.params;
    const components = await componentDAO.findByType(type);

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

// Démarrer le service si ce fichier est exécuté directement
if (require.main === module) {
  initStackScanner().catch(err => {
    console.error('Erreur lors de l\'initialisation du service de scan de stack:', err);
    process.exit(1);
  });
}

module.exports = { initStackScanner };
