/**
 * Configuration de la connexion MongoDB pour AutoStack Manager
 * Module centralisé pour gérer les connexions à la base de données
 */
const mongoose = require('mongoose');
const { EventEmitter } = require('events');

// Création d'un émetteur d'événements pour la base de données
const dbEvents = new EventEmitter();

// Configuration par défaut
const DEFAULT_CONFIG = {
  uri: process.env.MONGO_URI || 'mongodb://localhost:27017/autostack-manager',
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: process.env.NODE_ENV !== 'production', // Désactiver en production pour des performances optimales
    serverSelectionTimeoutMS: 5000, // Timeout de sélection du serveur
    socketTimeoutMS: 45000, // Timeout de socket
    family: 4, // Utiliser IPv4, ignorer IPv6
    maxPoolSize: 10, // Taille maximale du pool de connexions
  }
};

// État de la connexion
let isConnected = false;
let connectionAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

/**
 * Fonction de connexion à la base de données
 * @param {string} uri - URI de connexion MongoDB (optionnel)
 * @param {Object} options - Options de connexion (optionnel)
 * @returns {Promise<boolean>} - Statut de la connexion
 */
const connectDB = async (uri = DEFAULT_CONFIG.uri, options = DEFAULT_CONFIG.options) => {
  try {
    if (isConnected) {
      console.log('Déjà connecté à MongoDB');
      return true;
    }

    // Fusionner les options par défaut avec les options fournies
    const connectionOptions = { ...DEFAULT_CONFIG.options, ...options };
    
    // Connexion à MongoDB
    await mongoose.connect(uri, connectionOptions);
    
    isConnected = true;
    connectionAttempts = 0;
    console.log('Connexion à MongoDB établie avec succès');
    
    // Émettre un événement de connexion
    dbEvents.emit('connected');
    
    // Configurer les écouteurs d'événements
    mongoose.connection.on('error', (err) => {
      console.error('Erreur MongoDB:', err);
      dbEvents.emit('error', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      console.log('Déconnecté de MongoDB');
      dbEvents.emit('disconnected');
      
      // Tentative de reconnexion automatique
      if (connectionAttempts < MAX_RECONNECT_ATTEMPTS) {
        connectionAttempts++;
        console.log(`Tentative de reconnexion ${connectionAttempts}/${MAX_RECONNECT_ATTEMPTS}...`);
        setTimeout(() => {
          connectDB(uri, connectionOptions).catch(err => {
            console.error('Échec de la tentative de reconnexion:', err);
          });
        }, 5000 * connectionAttempts); // Backoff exponentiel
      }
    });
    
    return true;
  } catch (error) {
    console.error('Erreur de connexion à MongoDB:', error.message);
    dbEvents.emit('error', error);
    
    if (process.env.NODE_ENV === 'production') {
      console.error('Erreur critique de connexion à la base de données en production');
      process.exit(1);
    }
    
    return false;
  }
};

/**
 * Fonction de déconnexion de la base de données
 * @returns {Promise<boolean>} - Statut de la déconnexion
 */
const disconnectDB = async () => {
  try {
    if (!isConnected) {
      console.log('Déjà déconnecté de MongoDB');
      return true;
    }
    
    await mongoose.disconnect();
    isConnected = false;
    console.log('Déconnexion de MongoDB réussie');
    dbEvents.emit('disconnected');
    return true;
  } catch (error) {
    console.error('Erreur lors de la déconnexion de MongoDB:', error.message);
    dbEvents.emit('error', error);
    return false;
  }
};

/**
 * Vérifier l'état de la connexion à la base de données
 * @returns {Object} - Informations sur l'état de la connexion
 */
const getConnectionStatus = () => {
  return {
    isConnected,
    connectionAttempts,
    readyState: mongoose.connection.readyState,
    // 0 = déconnecté, 1 = connecté, 2 = connexion en cours, 3 = déconnexion en cours
    status: ['déconnecté', 'connecté', 'connexion en cours', 'déconnexion en cours'][mongoose.connection.readyState] || 'inconnu',
    host: mongoose.connection.host,
    name: mongoose.connection.name
  };
};

/**
 * Initialiser la base de données avec des données par défaut
 * @param {Object} models - Modèles Mongoose
 * @returns {Promise<void>}
 */
const initializeDB = async (models) => {
  try {
    // Vérifier si la base de données est vide
    const userCount = await models.User.countDocuments();
    
    if (userCount === 0) {
      console.log('Initialisation de la base de données avec des données par défaut...');
      
      // Créer un utilisateur administrateur par défaut
      const adminUser = new models.User({
        username: 'admin',
        email: 'admin@autostack-manager.com',
        password: '$2a$10$yCzJEaKLuWJa2at4g5o4YuLlvUBc/yfYz6Goz4XWl5G7g.jPdkcrK', // 'admin123' hashé avec bcrypt
        role: 'admin'
      });
      
      await adminUser.save();
      
      // Créer une configuration par défaut
      const defaultConfig = new models.Config({
        key: 'system.initialized',
        value: true,
        description: 'Indique si le système a été initialisé avec des données par défaut'
      });
      
      await defaultConfig.save();
      
      console.log('Initialisation de la base de données terminée');
      dbEvents.emit('initialized');
    }
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
    dbEvents.emit('error', error);
  }
};

module.exports = {
  connectDB,
  disconnectDB,
  getConnectionStatus,
  initializeDB,
  dbEvents,
  mongoose
};
