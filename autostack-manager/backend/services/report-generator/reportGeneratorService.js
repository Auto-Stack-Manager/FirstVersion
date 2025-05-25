/**
 * Service de génération de rapports pour AutoStack Manager
 * Génère des rapports sur l'état des services et leurs vulnérabilités
 */
const { initializeService } = require('../common/utils/serviceInitializer');
const { asyncHandler } = require('../common/middleware/errorHandler');
const { verifyToken } = require('../common/middleware/auth');

// Configuration du service
const SERVICE_NAME = 'report-generator-service';
const PORT = process.env.REPORT_GENERATOR_PORT || 3005;

/**
 * Initialiser le service de génération de rapports
 */
const initReportGenerator = async () => {
  // Initialiser le service avec les configurations communes
  const { app, daos, setupErrorHandlers, startServer } = await initializeService(SERVICE_NAME, {
    port: PORT
  });

  // Extraire les DAOs nécessaires
  const { reportDAO, serviceDAO, vulnerabilityDAO } = daos;

  // Middleware d'authentification pour toutes les routes
  app.use('/api', verifyToken);

  /**
   * Route pour générer un rapport
   * @route POST /api/generate
   */
  app.post('/api/generate', asyncHandler(async (req, res) => {
    const { title, serviceIds, format = 'html' } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Titre du rapport requis'
      });
    }

    if (!serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'IDs des services requis'
      });
    }

    // Récupérer les services
    const services = await Promise.all(
      serviceIds.map(id => serviceDAO.findById(id, ['components', 'vulnerabilities.component', 'vulnerabilities.details']))
    );

    // Filtrer les services non trouvés
    const validServices = services.filter(service => service !== null);
    if (validServices.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Aucun service valide trouvé'
      });
    }

    // Calculer les statistiques pour le rapport
    const summary = {
      totalServices: validServices.length,
      secureServices: 0,
      vulnerableServices: 0,
      outdatedServices: 0,
      criticalVulnerabilities: 0,
      highVulnerabilities: 0,
      mediumVulnerabilities: 0,
      lowVulnerabilities: 0
    };

    // Compter les services par statut
    validServices.forEach(service => {
      if (service.status === 'secure') summary.secureServices++;
      if (service.status === 'vulnerable') summary.vulnerableServices++;
      if (service.status === 'outdated') summary.outdatedServices++;

      // Compter les vulnérabilités par sévérité
      if (service.vulnerabilities && service.vulnerabilities.length > 0) {
        service.vulnerabilities.forEach(vuln => {
          if (vuln.details) {
            const severity = vuln.details.severity;
            if (severity === 'critical') summary.criticalVulnerabilities++;
            if (severity === 'high') summary.highVulnerabilities++;
            if (severity === 'medium') summary.mediumVulnerabilities++;
            if (severity === 'low') summary.lowVulnerabilities++;
          }
        });
      }
    });

    // Générer des recommandations basées sur les résultats
    const recommendations = generateRecommendations(summary, validServices);

    // Créer le rapport
    const report = await reportDAO.create({
      title,
      services: serviceIds,
      summary,
      format,
      recommendations,
      generatedBy: req.user.id,
      filePath: `/reports/${Date.now()}_report.${format}`
    });

    res.status(201).json({
      success: true,
      message: 'Rapport généré avec succès',
      report
    });
  }));

  /**
   * Route pour obtenir tous les rapports
   * @route GET /api/reports
   */
  app.get('/api/reports', asyncHandler(async (req, res) => {
    const reports = await reportDAO.findAll({}, 'services');

    res.status(200).json({
      success: true,
      count: reports.length,
      reports
    });
  }));

  /**
   * Route pour obtenir un rapport par ID
   * @route GET /api/reports/:reportId
   */
  app.get('/api/reports/:reportId', asyncHandler(async (req, res) => {
    const { reportId } = req.params;
    const report = await reportDAO.findById(reportId, ['services', 'generatedBy']);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Rapport non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      report
    });
  }));

  /**
   * Route pour obtenir les rapports récents
   * @route GET /api/reports/recent/:limit
   */
  app.get('/api/reports/recent/:limit', asyncHandler(async (req, res) => {
    const limit = parseInt(req.params.limit) || 5;
    const reports = await reportDAO.findRecent(limit);

    res.status(200).json({
      success: true,
      count: reports.length,
      reports
    });
  }));

  /**
   * Route pour supprimer un rapport
   * @route DELETE /api/reports/:reportId
   */
  app.delete('/api/reports/:reportId', asyncHandler(async (req, res) => {
    const { reportId } = req.params;
    const report = await reportDAO.delete(reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Rapport non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Rapport supprimé avec succès'
    });
  }));

  // Configurer les gestionnaires d'erreurs
  setupErrorHandlers();

  // Démarrer le serveur
  const server = await startServer();

  return { app, server };
};

/**
 * Générer des recommandations basées sur les résultats du scan
 * @param {Object} summary - Résumé des résultats
 * @param {Array} services - Services analysés
 * @returns {Array} - Liste de recommandations
 */
function generateRecommendations(summary, services) {
  const recommendations = [];

  // Recommandations basées sur les vulnérabilités critiques
  if (summary.criticalVulnerabilities > 0) {
    recommendations.push(
      'Corriger immédiatement les vulnérabilités critiques en mettant à jour les composants concernés.'
    );
  }

  // Recommandations basées sur les vulnérabilités élevées
  if (summary.highVulnerabilities > 0) {
    recommendations.push(
      'Planifier la correction des vulnérabilités à risque élevé dans les plus brefs délais.'
    );
  }

  // Recommandations pour les services vulnérables
  if (summary.vulnerableServices > 0) {
    recommendations.push(
      `Prioriser la mise à jour des ${summary.vulnerableServices} services vulnérables identifiés.`
    );
  }

  // Recommandations pour les services obsolètes
  if (summary.outdatedServices > 0) {
    recommendations.push(
      `Mettre à jour les ${summary.outdatedServices} services obsolètes pour bénéficier des dernières fonctionnalités et corrections de sécurité.`
    );
  }

  // Recommandation générale pour la surveillance continue
  recommendations.push(
    'Mettre en place une surveillance continue des vulnérabilités et des mises à jour disponibles.'
  );

  // Recommandation pour les tests de sécurité
  if (summary.vulnerableServices > 0 || summary.criticalVulnerabilities > 0 || summary.highVulnerabilities > 0) {
    recommendations.push(
      'Effectuer des tests de sécurité approfondis après la correction des vulnérabilités.'
    );
  }

  return recommendations;
}

// Démarrer le service si ce fichier est exécuté directement
if (require.main === module) {
  initReportGenerator().catch(err => {
    console.error('Erreur lors de l\'initialisation du service de génération de rapports:', err);
    process.exit(1);
  });
}

module.exports = { initReportGenerator };
