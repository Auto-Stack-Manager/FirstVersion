/**
 * Modèles MongoDB pour AutoStack Manager
 * Définit tous les schémas et modèles de données utilisés par l'application
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Schéma de base avec champs communs pour tous les modèles
 */
const BaseSchema = {
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
};

/**
 * Schéma pour les composants de stack technique
 */
const ComponentSchema = new Schema({
  ...BaseSchema,
  name: { 
    type: String, 
    required: [true, 'Le nom du composant est requis'],
    trim: true,
    index: true
  },
  version: { 
    type: String, 
    required: [true, 'La version du composant est requise'],
    trim: true 
  },
  type: { 
    type: String, 
    enum: {
      values: ['language', 'framework', 'library', 'database', 'container', 'other'],
      message: 'Le type doit être language, framework, library, database, container ou other'
    },
    required: [true, 'Le type de composant est requis'],
    index: true
  },
  latestVersion: { 
    type: String,
    trim: true 
  },
  updateAvailable: { 
    type: Boolean, 
    default: false 
  },
  lastChecked: { 
    type: Date, 
    default: Date.now 
  },
  description: { 
    type: String,
    trim: true 
  },
  website: { 
    type: String,
    trim: true 
  },
  license: { 
    type: String,
    trim: true 
  }
});

/**
 * Schéma pour les vulnérabilités
 */
const VulnerabilitySchema = new Schema({
  ...BaseSchema,
  cveId: { 
    type: String,
    trim: true,
    index: true,
    sparse: true
  },
  title: { 
    type: String, 
    required: [true, 'Le titre de la vulnérabilité est requis'],
    trim: true 
  },
  description: { 
    type: String, 
    required: [true, 'La description de la vulnérabilité est requise'],
    trim: true 
  },
  severity: { 
    type: String, 
    enum: {
      values: ['critical', 'high', 'medium', 'low', 'info'],
      message: 'La sévérité doit être critical, high, medium, low ou info'
    },
    required: [true, 'La sévérité de la vulnérabilité est requise'],
    index: true
  },
  affectedVersions: [String],
  fixedInVersion: { 
    type: String,
    trim: true 
  },
  references: [String],
  discoveredAt: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  status: {
    type: String,
    enum: {
      values: ['open', 'fixed', 'mitigated', 'false_positive', 'wont_fix'],
      message: 'Le statut doit être open, fixed, mitigated, false_positive ou wont_fix'
    },
    default: 'open',
    index: true
  },
  cvssScore: {
    type: Number,
    min: 0,
    max: 10
  },
  remediation: {
    type: String,
    trim: true
  }
});

/**
 * Schéma pour les services (microservices)
 */
const ServiceSchema = new Schema({
  ...BaseSchema,
  name: { 
    type: String, 
    required: [true, 'Le nom du service est requis'],
    trim: true,
    unique: true,
    index: true
  },
  description: { 
    type: String,
    trim: true 
  },
  repositoryUrl: { 
    type: String,
    trim: true 
  },
  components: [{
    type: Schema.Types.ObjectId,
    ref: 'Component'
  }],
  vulnerabilities: [{
    component: { 
      type: Schema.Types.ObjectId, 
      ref: 'Component' 
    },
    details: { 
      type: Schema.Types.ObjectId, 
      ref: 'Vulnerability' 
    }
  }],
  lastScan: { 
    type: Date,
    index: true
  },
  status: {
    type: String,
    enum: {
      values: ['secure', 'vulnerable', 'outdated', 'unknown'],
      message: 'Le statut doit être secure, vulnerable, outdated ou unknown'
    },
    default: 'unknown',
    index: true
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  tags: [String],
  environment: {
    type: String,
    enum: {
      values: ['development', 'testing', 'staging', 'production'],
      message: 'L\'environnement doit être development, testing, staging ou production'
    },
    default: 'development'
  }
});

/**
 * Schéma pour les rapports générés
 */
const ReportSchema = new Schema({
  ...BaseSchema,
  title: { 
    type: String, 
    required: [true, 'Le titre du rapport est requis'],
    trim: true 
  },
  generatedAt: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  services: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'Service' 
  }],
  summary: {
    totalServices: { type: Number, default: 0 },
    secureServices: { type: Number, default: 0 },
    vulnerableServices: { type: Number, default: 0 },
    outdatedServices: { type: Number, default: 0 },
    criticalVulnerabilities: { type: Number, default: 0 },
    highVulnerabilities: { type: Number, default: 0 },
    mediumVulnerabilities: { type: Number, default: 0 },
    lowVulnerabilities: { type: Number, default: 0 }
  },
  format: { 
    type: String, 
    enum: {
      values: ['pdf', 'html', 'json', 'csv'],
      message: 'Le format doit être pdf, html, json ou csv'
    },
    default: 'html' 
  },
  filePath: { 
    type: String,
    trim: true 
  },
  recommendations: [String],
  generatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  isScheduled: {
    type: Boolean,
    default: false
  },
  scheduleId: {
    type: String,
    trim: true
  }
});

/**
 * Schéma pour les utilisateurs
 */
const UserSchema = new Schema({
  ...BaseSchema,
  username: { 
    type: String, 
    required: [true, 'Le nom d\'utilisateur est requis'],
    unique: true,
    trim: true,
    minlength: [3, 'Le nom d\'utilisateur doit contenir au moins 3 caractères'],
    maxlength: [50, 'Le nom d\'utilisateur ne peut pas dépasser 50 caractères'],
    index: true
  },
  email: { 
    type: String, 
    required: [true, 'L\'email est requis'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Veuillez fournir un email valide'],
    index: true
  },
  password: { 
    type: String, 
    required: [true, 'Le mot de passe est requis'],
    minlength: [8, 'Le mot de passe doit contenir au moins 8 caractères'],
    select: false
  },
  role: { 
    type: String, 
    enum: {
      values: ['admin', 'developer', 'viewer'],
      message: 'Le rôle doit être admin, developer ou viewer'
    },
    default: 'viewer',
    index: true
  },
  lastLogin: { 
    type: Date 
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    select: false
  },
  preferences: {
    language: {
      type: String,
      default: 'fr'
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    }
  }
});

/**
 * Schéma pour les notifications
 */
const NotificationSchema = new Schema({
  ...BaseSchema,
  title: { 
    type: String, 
    required: [true, 'Le titre de la notification est requis'],
    trim: true 
  },
  message: { 
    type: String, 
    required: [true, 'Le message de la notification est requis'],
    trim: true 
  },
  type: { 
    type: String, 
    enum: {
      values: ['vulnerability', 'update', 'report', 'system', 'user'],
      message: 'Le type doit être vulnerability, update, report, system ou user'
    },
    required: [true, 'Le type de notification est requis'],
    index: true
  },
  severity: { 
    type: String, 
    enum: {
      values: ['critical', 'high', 'medium', 'low', 'info'],
      message: 'La sévérité doit être critical, high, medium, low ou info'
    },
    default: 'info',
    index: true
  },
  service: { 
    type: Schema.Types.ObjectId, 
    ref: 'Service' 
  },
  read: { 
    type: Boolean, 
    default: false,
    index: true
  },
  recipients: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    index: true
  }],
  link: {
    type: String,
    trim: true
  },
  expiresAt: {
    type: Date
  }
});

/**
 * Schéma pour les configurations
 */
const ConfigSchema = new Schema({
  ...BaseSchema,
  key: { 
    type: String, 
    required: [true, 'La clé de configuration est requise'],
    unique: true,
    trim: true,
    index: true
  },
  value: { 
    type: Schema.Types.Mixed, 
    required: [true, 'La valeur de configuration est requise']
  },
  description: { 
    type: String,
    trim: true 
  },
  category: {
    type: String,
    trim: true,
    index: true
  },
  isSecret: {
    type: Boolean,
    default: false
  }
});

/**
 * Schéma pour les journaux d'audit
 */
const AuditLogSchema = new Schema({
  ...BaseSchema,
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    index: true
  },
  action: { 
    type: String, 
    required: [true, 'L\'action est requise'],
    trim: true,
    index: true
  },
  entity: { 
    type: String, 
    enum: {
      values: ['service', 'report', 'user', 'notification', 'config', 'system', 'component', 'vulnerability'],
      message: 'L\'entité doit être service, report, user, notification, config, system, component ou vulnerability'
    },
    required: [true, 'L\'entité est requise'],
    index: true
  },
  entityId: { 
    type: Schema.Types.ObjectId,
    index: true
  },
  details: { 
    type: String,
    trim: true 
  },
  ipAddress: { 
    type: String,
    trim: true 
  },
  userAgent: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: {
      values: ['success', 'failure', 'warning'],
      message: 'Le statut doit être success, failure ou warning'
    },
    default: 'success',
    index: true
  }
});

// Middleware pour mettre à jour le champ updatedAt avant la sauvegarde
const updateTimestampMiddleware = function(next) {
  this.updatedAt = Date.now();
  next();
};

// Appliquer le middleware à tous les schémas
ComponentSchema.pre('save', updateTimestampMiddleware);
VulnerabilitySchema.pre('save', updateTimestampMiddleware);
ServiceSchema.pre('save', updateTimestampMiddleware);
ReportSchema.pre('save', updateTimestampMiddleware);
UserSchema.pre('save', updateTimestampMiddleware);
NotificationSchema.pre('save', updateTimestampMiddleware);
ConfigSchema.pre('save', updateTimestampMiddleware);

// Création des modèles
const Component = mongoose.model('Component', ComponentSchema);
const Vulnerability = mongoose.model('Vulnerability', VulnerabilitySchema);
const Service = mongoose.model('Service', ServiceSchema);
const Report = mongoose.model('Report', ReportSchema);
const User = mongoose.model('User', UserSchema);
const Notification = mongoose.model('Notification', NotificationSchema);
const Config = mongoose.model('Config', ConfigSchema);
const AuditLog = mongoose.model('AuditLog', AuditLogSchema);

module.exports = {
  Component,
  Vulnerability,
  Service,
  Report,
  User,
  Notification,
  Config,
  AuditLog
};
