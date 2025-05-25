/**
 * Service de notification pour AutoStack Manager
 * Gère l'envoi et la gestion des notifications aux utilisateurs
 */
const { initializeService } = require('../common/utils/serviceInitializer');
const { asyncHandler } = require('../common/middleware/errorHandler');
const { verifyToken } = require('../common/middleware/auth');

// Configuration du service
const SERVICE_NAME = 'notifier-service';
const PORT = process.env.NOTIFIER_PORT || 3006;

/**
 * Initialiser le service de notification
 */
const initNotifier = async () => {
  // Initialiser le service avec les configurations communes
  const { app, daos, setupErrorHandlers, startServer } = await initializeService(SERVICE_NAME, {
    port: PORT
  });

  // Extraire les DAOs nécessaires
  const { notificationDAO, userDAO } = daos;

  // Middleware d'authentification pour toutes les routes
  app.use('/api', verifyToken);

  /**
   * Route pour créer une notification
   * @route POST /api/notifications
   */
  app.post('/api/notifications', asyncHandler(async (req, res) => {
    const { title, message, type, severity, service, recipients } = req.body;

    if (!title || !message || !type) {
      return res.status(400).json({
        success: false,
        message: 'Titre, message et type de notification requis'
      });
    }

    // Créer la notification
    const notification = await notificationDAO.create({
      title,
      message,
      type,
      severity: severity || 'info',
      service,
      recipients: recipients || [],
      createdAt: Date.now()
    });

    // Envoyer la notification (simulé)
    await sendNotification(notification);

    res.status(201).json({
      success: true,
      message: 'Notification créée avec succès',
      notification
    });
  }));

  /**
   * Route pour obtenir les notifications d'un utilisateur
   * @route GET /api/notifications
   */
  app.get('/api/notifications', asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const notifications = await notificationDAO.findByUser(userId);

    res.status(200).json({
      success: true,
      count: notifications.length,
      notifications
    });
  }));

  /**
   * Route pour obtenir les notifications non lues d'un utilisateur
   * @route GET /api/notifications/unread
   */
  app.get('/api/notifications/unread', asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const notifications = await notificationDAO.findUnreadByUser(userId);

    res.status(200).json({
      success: true,
      count: notifications.length,
      notifications
    });
  }));

  /**
   * Route pour marquer une notification comme lue
   * @route PUT /api/notifications/:notificationId/read
   */
  app.put('/api/notifications/:notificationId/read', asyncHandler(async (req, res) => {
    const { notificationId } = req.params;
    const notification = await notificationDAO.markAsRead(notificationId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification non trouvée'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification marquée comme lue',
      notification
    });
  }));

  /**
   * Route pour marquer toutes les notifications d'un utilisateur comme lues
   * @route PUT /api/notifications/read-all
   */
  app.put('/api/notifications/read-all', asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const result = await notificationDAO.markAllAsRead(userId);

    res.status(200).json({
      success: true,
      message: 'Toutes les notifications marquées comme lues',
      count: result.modifiedCount
    });
  }));

  /**
   * Route pour supprimer une notification
   * @route DELETE /api/notifications/:notificationId
   */
  app.delete('/api/notifications/:notificationId', asyncHandler(async (req, res) => {
    const { notificationId } = req.params;
    const notification = await notificationDAO.delete(notificationId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification non trouvée'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification supprimée avec succès'
    });
  }));

  /**
   * Route pour mettre à jour les préférences de notification d'un utilisateur
   * @route PUT /api/notifications/preferences
   */
  app.put('/api/notifications/preferences', asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { preferences } = req.body;

    if (!preferences) {
      return res.status(400).json({
        success: false,
        message: 'Préférences de notification requises'
      });
    }

    // Mettre à jour les préférences de l'utilisateur
    const user = await userDAO.update(userId, {
      'preferences.notifications': preferences
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Préférences de notification mises à jour',
      preferences: user.preferences.notifications
    });
  }));

  // Configurer les gestionnaires d'erreurs
  setupErrorHandlers();

  // Démarrer le serveur
  const server = await startServer();

  return { app, server };
};

/**
 * Envoyer une notification aux destinataires
 * @param {Object} notification - Notification à envoyer
 * @returns {Promise<void>}
 */
async function sendNotification(notification) {
  // Dans une implémentation réelle, cela enverrait des notifications par email, push, etc.
  console.log(`[${SERVICE_NAME}] Envoi de notification: ${notification.title}`);
  
  // Simuler un délai d'envoi
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return true;
}

// Démarrer le service si ce fichier est exécuté directement
if (require.main === module) {
  initNotifier().catch(err => {
    console.error('Erreur lors de l\'initialisation du service de notification:', err);
    process.exit(1);
  });
}

module.exports = { initNotifier };
