/**
 * Configuration des services API pour le frontend
 * Module centralisé pour gérer les appels API vers les différents microservices
 */
import axios from 'axios';

// Configuration de base
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Création d'une instance axios avec la configuration de base
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 secondes
});

// Intercepteur pour ajouter le token d'authentification à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs de réponse
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Gérer les erreurs d'authentification (401)
    if (error.response && error.response.status === 401) {
      // Rediriger vers la page de connexion si le token est expiré ou invalide
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // Gérer les erreurs de serveur (500)
    if (error.response && error.response.status >= 500) {
      console.error('Erreur serveur:', error.response.data);
      // Ici, on pourrait implémenter une notification à l'utilisateur
    }
    
    return Promise.reject(error);
  }
);

/**
 * Services d'authentification
 */
export const authService = {
  /**
   * Connexion utilisateur
   * @param {Object} credentials - Identifiants de connexion
   * @returns {Promise} - Réponse de l'API
   */
  login: (credentials) => api.post('/auth/login', credentials),
  
  /**
   * Inscription utilisateur
   * @param {Object} userData - Données utilisateur
   * @returns {Promise} - Réponse de l'API
   */
  register: (userData) => api.post('/auth/register', userData),
  
  /**
   * Vérification du token
   * @returns {Promise} - Réponse de l'API
   */
  verifyToken: () => api.get('/auth/verify'),
  
  /**
   * Récupération du profil utilisateur
   * @returns {Promise} - Réponse de l'API
   */
  getProfile: () => api.get('/auth/profile'),
  
  /**
   * Mise à jour du profil utilisateur
   * @param {Object} profileData - Données du profil
   * @returns {Promise} - Réponse de l'API
   */
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  
  /**
   * Changement de mot de passe
   * @param {Object} passwordData - Données de mot de passe
   * @returns {Promise} - Réponse de l'API
   */
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
  
  /**
   * Déconnexion utilisateur
   */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

/**
 * Services de gestion des services (microservices)
 */
export const serviceManagementService = {
  /**
   * Récupération de tous les services
   * @returns {Promise} - Réponse de l'API
   */
  getAllServices: () => api.get('/stack-scanner/service'),
  
  /**
   * Récupération d'un service par ID
   * @param {string} serviceId - ID du service
   * @returns {Promise} - Réponse de l'API
   */
  getServiceById: (serviceId) => api.get(`/stack-scanner/service/${serviceId}`),
  
  /**
   * Création d'un nouveau service
   * @param {Object} serviceData - Données du service
   * @returns {Promise} - Réponse de l'API
   */
  createService: (serviceData) => api.post('/stack-scanner/service', serviceData),
  
  /**
   * Mise à jour d'un service
   * @param {string} serviceId - ID du service
   * @param {Object} serviceData - Données du service
   * @returns {Promise} - Réponse de l'API
   */
  updateService: (serviceId, serviceData) => api.put(`/stack-scanner/service/${serviceId}`, serviceData),
  
  /**
   * Suppression d'un service
   * @param {string} serviceId - ID du service
   * @returns {Promise} - Réponse de l'API
   */
  deleteService: (serviceId) => api.delete(`/stack-scanner/service/${serviceId}`),
  
  /**
   * Scan d'un service pour détecter les composants
   * @param {string} serviceId - ID du service
   * @param {string} repositoryUrl - URL du dépôt (optionnel)
   * @returns {Promise} - Réponse de l'API
   */
  scanService: (serviceId, repositoryUrl) => api.post('/stack-scanner/scan', { serviceId, repositoryUrl }),
  
  /**
   * Récupération des composants d'un service
   * @param {string} serviceId - ID du service
   * @returns {Promise} - Réponse de l'API
   */
  getServiceComponents: (serviceId) => api.get(`/stack-scanner/service/${serviceId}/components`)
};

/**
 * Services de gestion des versions
 */
export const versionService = {
  /**
   * Vérification des mises à jour d'un composant
   * @param {string} componentId - ID du composant
   * @returns {Promise} - Réponse de l'API
   */
  checkUpdates: (componentId) => api.post('/version-checker/check-updates', { componentId }),
  
  /**
   * Vérification des mises à jour de tous les composants
   * @returns {Promise} - Réponse de l'API
   */
  checkAllUpdates: () => api.post('/version-checker/check-all-updates'),
  
  /**
   * Récupération des composants avec des mises à jour disponibles
   * @returns {Promise} - Réponse de l'API
   */
  getUpdatesAvailable: () => api.get('/version-checker/updates-available')
};

/**
 * Services de gestion des vulnérabilités
 */
export const vulnerabilityService = {
  /**
   * Scan des vulnérabilités d'un service
   * @param {string} serviceId - ID du service
   * @returns {Promise} - Réponse de l'API
   */
  scanVulnerabilities: (serviceId) => api.post('/vuln-scanner/scan', { serviceId }),
  
  /**
   * Récupération des vulnérabilités d'un service
   * @param {string} serviceId - ID du service
   * @returns {Promise} - Réponse de l'API
   */
  getServiceVulnerabilities: (serviceId) => api.get(`/vuln-scanner/service/${serviceId}/vulnerabilities`),
  
  /**
   * Récupération de toutes les vulnérabilités
   * @returns {Promise} - Réponse de l'API
   */
  getAllVulnerabilities: () => api.get('/vuln-scanner/vulnerabilities'),
  
  /**
   * Récupération des vulnérabilités par sévérité
   * @param {string} severity - Sévérité (critical, high, medium, low, info)
   * @returns {Promise} - Réponse de l'API
   */
  getVulnerabilitiesBySeverity: (severity) => api.get(`/vuln-scanner/vulnerabilities/severity/${severity}`)
};

/**
 * Services de gestion des rapports
 */
export const reportService = {
  /**
   * Génération d'un rapport
   * @param {Object} reportData - Données du rapport
   * @returns {Promise} - Réponse de l'API
   */
  generateReport: (reportData) => api.post('/reports/generate', reportData),
  
  /**
   * Récupération de tous les rapports
   * @returns {Promise} - Réponse de l'API
   */
  getAllReports: () => api.get('/reports/reports'),
  
  /**
   * Récupération d'un rapport par ID
   * @param {string} reportId - ID du rapport
   * @returns {Promise} - Réponse de l'API
   */
  getReportById: (reportId) => api.get(`/reports/reports/${reportId}`),
  
  /**
   * Récupération des rapports récents
   * @param {number} limit - Nombre de rapports à récupérer
   * @returns {Promise} - Réponse de l'API
   */
  getRecentReports: (limit = 5) => api.get(`/reports/reports/recent/${limit}`),
  
  /**
   * Suppression d'un rapport
   * @param {string} reportId - ID du rapport
   * @returns {Promise} - Réponse de l'API
   */
  deleteReport: (reportId) => api.delete(`/reports/reports/${reportId}`)
};

/**
 * Services de gestion des notifications
 */
export const notificationService = {
  /**
   * Création d'une notification
   * @param {Object} notificationData - Données de la notification
   * @returns {Promise} - Réponse de l'API
   */
  createNotification: (notificationData) => api.post('/notifications/notifications', notificationData),
  
  /**
   * Récupération des notifications de l'utilisateur
   * @returns {Promise} - Réponse de l'API
   */
  getUserNotifications: () => api.get('/notifications/notifications'),
  
  /**
   * Récupération des notifications non lues de l'utilisateur
   * @returns {Promise} - Réponse de l'API
   */
  getUnreadNotifications: () => api.get('/notifications/notifications/unread'),
  
  /**
   * Marquer une notification comme lue
   * @param {string} notificationId - ID de la notification
   * @returns {Promise} - Réponse de l'API
   */
  markAsRead: (notificationId) => api.put(`/notifications/notifications/${notificationId}/read`),
  
  /**
   * Marquer toutes les notifications comme lues
   * @returns {Promise} - Réponse de l'API
   */
  markAllAsRead: () => api.put('/notifications/notifications/read-all'),
  
  /**
   * Suppression d'une notification
   * @param {string} notificationId - ID de la notification
   * @returns {Promise} - Réponse de l'API
   */
  deleteNotification: (notificationId) => api.delete(`/notifications/notifications/${notificationId}`),
  
  /**
   * Mise à jour des préférences de notification
   * @param {Object} preferences - Préférences de notification
   * @returns {Promise} - Réponse de l'API
   */
  updateNotificationPreferences: (preferences) => api.put('/notifications/notifications/preferences', { preferences })
};

/**
 * Service de statut du système
 */
export const systemService = {
  /**
   * Récupération du statut du système
   * @returns {Promise} - Réponse de l'API
   */
  getStatus: () => api.get('/status')
};

// Exporter tous les services
export default {
  authService,
  serviceManagementService,
  versionService,
  vulnerabilityService,
  reportService,
  notificationService,
  systemService
};
