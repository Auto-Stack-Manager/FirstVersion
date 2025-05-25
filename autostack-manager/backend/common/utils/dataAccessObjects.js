/**
 * Fonctions d'accès aux données (DAO) pour AutoStack Manager
 * Fournit une interface unifiée pour interagir avec les modèles MongoDB
 */

// Classe de base pour les opérations DAO
class BaseDAO {
  /**
   * Constructeur
   * @param {Object} model - Modèle Mongoose
   * @param {string} modelName - Nom du modèle pour les messages d'erreur
   */
  constructor(model, modelName) {
    this.model = model;
    this.modelName = modelName;
  }

  /**
   * Créer une nouvelle entité
   * @param {Object} data - Données de l'entité
   * @returns {Promise<Object>} - Entité créée
   */
  async create(data) {
    try {
      const entity = new this.model(data);
      return await entity.save();
    } catch (error) {
      throw new Error(`Erreur lors de la création du ${this.modelName}: ${error.message}`);
    }
  }

  /**
   * Récupérer toutes les entités
   * @param {Object} filter - Filtre de recherche (optionnel)
   * @param {string} populate - Champs à peupler (optionnel)
   * @returns {Promise<Array>} - Liste d'entités
   */
  async findAll(filter = {}, populate = '') {
    try {
      let query = this.model.find(filter);
      
      if (populate) {
        if (Array.isArray(populate)) {
          populate.forEach(field => {
            query = query.populate(field);
          });
        } else {
          query = query.populate(populate);
        }
      }
      
      return await query.exec();
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des ${this.modelName}s: ${error.message}`);
    }
  }

  /**
   * Récupérer une entité par ID
   * @param {string} id - ID de l'entité
   * @param {string} populate - Champs à peupler (optionnel)
   * @returns {Promise<Object>} - Entité trouvée
   */
  async findById(id, populate = '') {
    try {
      let query = this.model.findById(id);
      
      if (populate) {
        if (Array.isArray(populate)) {
          populate.forEach(field => {
            query = query.populate(field);
          });
        } else {
          query = query.populate(populate);
        }
      }
      
      return await query.exec();
    } catch (error) {
      throw new Error(`Erreur lors de la récupération du ${this.modelName}: ${error.message}`);
    }
  }

  /**
   * Récupérer une entité par un champ spécifique
   * @param {Object} filter - Filtre de recherche
   * @param {string} populate - Champs à peupler (optionnel)
   * @returns {Promise<Object>} - Entité trouvée
   */
  async findOne(filter, populate = '') {
    try {
      let query = this.model.findOne(filter);
      
      if (populate) {
        if (Array.isArray(populate)) {
          populate.forEach(field => {
            query = query.populate(field);
          });
        } else {
          query = query.populate(populate);
        }
      }
      
      return await query.exec();
    } catch (error) {
      throw new Error(`Erreur lors de la récupération du ${this.modelName}: ${error.message}`);
    }
  }

  /**
   * Mettre à jour une entité
   * @param {string} id - ID de l'entité
   * @param {Object} updateData - Données de mise à jour
   * @param {Object} options - Options de mise à jour (optionnel)
   * @returns {Promise<Object>} - Entité mise à jour
   */
  async update(id, updateData, options = { new: true }) {
    try {
      return await this.model.findByIdAndUpdate(id, updateData, options);
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour du ${this.modelName}: ${error.message}`);
    }
  }

  /**
   * Supprimer une entité
   * @param {string} id - ID de l'entité
   * @returns {Promise<Object>} - Entité supprimée
   */
  async delete(id) {
    try {
      return await this.model.findByIdAndDelete(id);
    } catch (error) {
      throw new Error(`Erreur lors de la suppression du ${this.modelName}: ${error.message}`);
    }
  }

  /**
   * Compter les entités
   * @param {Object} filter - Filtre de recherche (optionnel)
   * @returns {Promise<number>} - Nombre d'entités
   */
  async count(filter = {}) {
    try {
      return await this.model.countDocuments(filter);
    } catch (error) {
      throw new Error(`Erreur lors du comptage des ${this.modelName}s: ${error.message}`);
    }
  }
}

/**
 * DAO pour les composants
 */
class ComponentDAO extends BaseDAO {
  constructor(Component) {
    super(Component, 'composant');
  }

  /**
   * Trouver des composants par type
   * @param {string} type - Type de composant
   * @returns {Promise<Array>} - Liste de composants
   */
  async findByType(type) {
    return this.findAll({ type });
  }

  /**
   * Trouver des composants avec des mises à jour disponibles
   * @returns {Promise<Array>} - Liste de composants
   */
  async findWithUpdates() {
    return this.findAll({ updateAvailable: true });
  }
}

/**
 * DAO pour les services
 */
class ServiceDAO extends BaseDAO {
  constructor(Service) {
    super(Service, 'service');
  }

  /**
   * Ajouter un composant à un service
   * @param {string} serviceId - ID du service
   * @param {string} componentId - ID du composant
   * @returns {Promise<Object>} - Service mis à jour
   */
  async addComponent(serviceId, componentId) {
    try {
      return await this.model.findByIdAndUpdate(
        serviceId,
        { $addToSet: { components: componentId } },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Erreur lors de l'ajout du composant au service: ${error.message}`);
    }
  }

  /**
   * Ajouter une vulnérabilité à un service
   * @param {string} serviceId - ID du service
   * @param {Object} vulnerabilityData - Données de vulnérabilité
   * @returns {Promise<Object>} - Service mis à jour
   */
  async addVulnerability(serviceId, vulnerabilityData) {
    try {
      return await this.model.findByIdAndUpdate(
        serviceId,
        { $push: { vulnerabilities: vulnerabilityData } },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Erreur lors de l'ajout de la vulnérabilité au service: ${error.message}`);
    }
  }

  /**
   * Trouver des services par statut
   * @param {string} status - Statut du service
   * @returns {Promise<Array>} - Liste de services
   */
  async findByStatus(status) {
    return this.findAll({ status }, 'components');
  }

  /**
   * Trouver des services vulnérables
   * @returns {Promise<Array>} - Liste de services
   */
  async findVulnerable() {
    return this.findAll({ status: 'vulnerable' }, ['components', 'vulnerabilities.component']);
  }
}

/**
 * DAO pour les rapports
 */
class ReportDAO extends BaseDAO {
  constructor(Report) {
    super(Report, 'rapport');
  }

  /**
   * Trouver des rapports par format
   * @param {string} format - Format du rapport
   * @returns {Promise<Array>} - Liste de rapports
   */
  async findByFormat(format) {
    return this.findAll({ format }, 'services');
  }

  /**
   * Trouver les rapports récents
   * @param {number} limit - Nombre de rapports à récupérer
   * @returns {Promise<Array>} - Liste de rapports
   */
  async findRecent(limit = 5) {
    try {
      return await this.model.find()
        .sort({ generatedAt: -1 })
        .limit(limit)
        .populate('services')
        .exec();
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des rapports récents: ${error.message}`);
    }
  }
}

/**
 * DAO pour les utilisateurs
 */
class UserDAO extends BaseDAO {
  constructor(User) {
    super(User, 'utilisateur');
  }

  /**
   * Trouver un utilisateur par nom d'utilisateur
   * @param {string} username - Nom d'utilisateur
   * @returns {Promise<Object>} - Utilisateur trouvé
   */
  async findByUsername(username) {
    return this.findOne({ username });
  }

  /**
   * Trouver un utilisateur par email
   * @param {string} email - Email
   * @returns {Promise<Object>} - Utilisateur trouvé
   */
  async findByEmail(email) {
    return this.findOne({ email });
  }

  /**
   * Trouver des utilisateurs par rôle
   * @param {string} role - Rôle
   * @returns {Promise<Array>} - Liste d'utilisateurs
   */
  async findByRole(role) {
    return this.findAll({ role });
  }

  /**
   * Mettre à jour le dernier login d'un utilisateur
   * @param {string} id - ID de l'utilisateur
   * @returns {Promise<Object>} - Utilisateur mis à jour
   */
  async updateLastLogin(id) {
    return this.update(id, { lastLogin: Date.now() });
  }
}

/**
 * DAO pour les notifications
 */
class NotificationDAO extends BaseDAO {
  constructor(Notification) {
    super(Notification, 'notification');
  }

  /**
   * Trouver des notifications par utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Array>} - Liste de notifications
   */
  async findByUser(userId) {
    return this.findAll({ recipients: userId }, ['service']);
  }

  /**
   * Trouver des notifications non lues par utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Array>} - Liste de notifications
   */
  async findUnreadByUser(userId) {
    return this.findAll({ recipients: userId, read: false }, ['service']);
  }

  /**
   * Marquer une notification comme lue
   * @param {string} id - ID de la notification
   * @returns {Promise<Object>} - Notification mise à jour
   */
  async markAsRead(id) {
    return this.update(id, { read: true });
  }

  /**
   * Marquer toutes les notifications d'un utilisateur comme lues
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} - Résultat de la mise à jour
   */
  async markAllAsRead(userId) {
    try {
      return await this.model.updateMany(
        { recipients: userId, read: false },
        { read: true }
      );
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour des notifications: ${error.message}`);
    }
  }
}

/**
 * DAO pour les vulnérabilités
 */
class VulnerabilityDAO extends BaseDAO {
  constructor(Vulnerability) {
    super(Vulnerability, 'vulnérabilité');
  }

  /**
   * Trouver des vulnérabilités par sévérité
   * @param {string} severity - Sévérité
   * @returns {Promise<Array>} - Liste de vulnérabilités
   */
  async findBySeverity(severity) {
    return this.findAll({ severity });
  }

  /**
   * Trouver des vulnérabilités critiques
   * @returns {Promise<Array>} - Liste de vulnérabilités
   */
  async findCritical() {
    return this.findAll({ severity: 'critical' });
  }
}

/**
 * DAO pour les configurations
 */
class ConfigDAO extends BaseDAO {
  constructor(Config) {
    super(Config, 'configuration');
  }

  /**
   * Trouver une configuration par clé
   * @param {string} key - Clé de configuration
   * @returns {Promise<Object>} - Configuration trouvée
   */
  async findByKey(key) {
    return this.findOne({ key });
  }

  /**
   * Mettre à jour ou créer une configuration
   * @param {string} key - Clé de configuration
   * @param {*} value - Valeur de configuration
   * @param {string} description - Description (optionnel)
   * @returns {Promise<Object>} - Configuration mise à jour ou créée
   */
  async upsert(key, value, description = '') {
    try {
      return await this.model.findOneAndUpdate(
        { key },
        { key, value, description, updatedAt: Date.now() },
        { upsert: true, new: true }
      );
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour de la configuration: ${error.message}`);
    }
  }
}

/**
 * DAO pour les journaux d'audit
 */
class AuditLogDAO extends BaseDAO {
  constructor(AuditLog) {
    super(AuditLog, 'journal d\'audit');
  }

  /**
   * Trouver des journaux d'audit par utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Array>} - Liste de journaux d'audit
   */
  async findByUser(userId) {
    return this.findAll({ user: userId });
  }

  /**
   * Trouver des journaux d'audit par action
   * @param {string} action - Action
   * @returns {Promise<Array>} - Liste de journaux d'audit
   */
  async findByAction(action) {
    return this.findAll({ action });
  }

  /**
   * Trouver des journaux d'audit par entité
   * @param {string} entity - Type d'entité
   * @param {string} entityId - ID de l'entité (optionnel)
   * @returns {Promise<Array>} - Liste de journaux d'audit
   */
  async findByEntity(entity, entityId = null) {
    const filter = { entity };
    if (entityId) {
      filter.entityId = entityId;
    }
    return this.findAll(filter);
  }
}

/**
 * Créer les instances DAO avec les modèles fournis
 * @param {Object} models - Modèles Mongoose
 * @returns {Object} - Instances DAO
 */
const createDAOs = (models) => {
  return {
    componentDAO: new ComponentDAO(models.Component),
    serviceDAO: new ServiceDAO(models.Service),
    reportDAO: new ReportDAO(models.Report),
    userDAO: new UserDAO(models.User),
    notificationDAO: new NotificationDAO(models.Notification),
    vulnerabilityDAO: new VulnerabilityDAO(models.Vulnerability),
    configDAO: new ConfigDAO(models.Config),
    auditLogDAO: new AuditLogDAO(models.AuditLog)
  };
};

module.exports = {
  BaseDAO,
  ComponentDAO,
  ServiceDAO,
  ReportDAO,
  UserDAO,
  NotificationDAO,
  VulnerabilityDAO,
  ConfigDAO,
  AuditLogDAO,
  createDAOs
};
