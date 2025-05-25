# Architecture d'AutoStack Manager (Version Refactorisée)

Ce document présente l'architecture refactorisée d'AutoStack Manager, une application de gestion et de surveillance des stacks techniques.

## Structure du Projet

```
autostack-refactored/
├── backend/
│   ├── common/                  # Composants partagés entre les services
│   │   ├── middleware/          # Middlewares communs (auth, error, prometheus)
│   │   ├── models/              # Modèles de données MongoDB
│   │   └── utils/               # Utilitaires partagés (DB, DAO, initialisation)
│   └── services/                # Microservices
│       ├── auth/                # Service d'authentification
│       ├── gateway/             # API Gateway
│       ├── stack-scanner/       # Service de scan de stack
│       ├── version-checker/     # Service de vérification de versions
│       ├── vuln-scanner/        # Service de scan de vulnérabilités
│       ├── report-generator/    # Service de génération de rapports
│       └── notifier/            # Service de notification
├── frontend/
│   ├── src/
│   │   ├── components/          # Composants React
│   │   │   ├── common/          # Composants UI réutilisables
│   │   │   ├── layouts/         # Layouts de l'application
│   │   │   └── pages/           # Pages de l'application
│   │   ├── contexts/            # Contextes React pour l'état global
│   │   ├── routes/              # Configuration des routes
│   │   └── services/            # Services d'API pour les appels backend
│   └── public/                  # Ressources statiques
└── docs/                        # Documentation
```

## Architecture Backend

Le backend est organisé en microservices, chacun responsable d'une fonctionnalité spécifique. Les services partagent des composants communs pour éviter la duplication de code.

### Composants Communs

1. **Middlewares**
   - `authenticationMiddleware.js` - Authentification JWT et contrôle d'accès basé sur les rôles
   - `errorHandlingMiddleware.js` - Gestion centralisée des erreurs
   - `prometheusMetricsMiddleware.js` - Métriques pour le monitoring

2. **Modèles de Données**
   - Schémas MongoDB pour tous les objets métier
   - Validation des données intégrée

3. **Utilitaires**
   - `databaseConnection.js` - Connexion à MongoDB
   - `dataAccessObjects.js` - Accès aux données avec pattern DAO
   - `microserviceInitializer.js` - Initialisation standardisée des services

### Microservices

1. **Service d'Authentification**
   - Gestion des utilisateurs
   - Authentification JWT
   - Contrôle d'accès basé sur les rôles

2. **API Gateway**
   - Point d'entrée unique pour les clients
   - Routage des requêtes vers les services appropriés
   - Validation des tokens JWT

3. **Service de Scan de Stack**
   - Détection des composants techniques
   - Gestion des services et de leurs composants

4. **Service de Vérification de Versions**
   - Vérification des mises à jour disponibles
   - Notification des composants obsolètes

5. **Service de Scan de Vulnérabilités**
   - Détection des vulnérabilités
   - Évaluation de la sévérité

6. **Service de Génération de Rapports**
   - Création de rapports sur l'état des services
   - Génération de recommandations

7. **Service de Notification**
   - Gestion des notifications
   - Préférences de notification par utilisateur

## Architecture Frontend

Le frontend est construit avec React et utilise une architecture basée sur les composants et les contextes.

### Modules Principaux

1. **Services API**
   - Module centralisé pour tous les appels API
   - Gestion automatique des tokens JWT
   - Intercepteurs pour la gestion des erreurs

2. **Contextes**
   - `AuthContext` - Gestion de l'état d'authentification
   - `NotificationContext` - Gestion des notifications

3. **Composants UI Communs**
   - Composants réutilisables (cartes, boutons, badges, etc.)
   - Styles cohérents dans toute l'application

4. **Layouts**
   - Structure principale de l'application
   - Navigation et gestion des notifications

5. **Pages**
   - Composants spécifiques à chaque fonctionnalité
   - Utilisation des contextes et des services API

6. **Routes**
   - Configuration des routes de l'application
   - Protection des routes par authentification et rôles

## Flux de Données

1. **Authentification**
   - Le client s'authentifie via le service d'authentification
   - Un token JWT est généré et stocké côté client
   - Le token est inclus dans toutes les requêtes suivantes

2. **Scan de Services**
   - Le service de scan détecte les composants
   - Les composants sont enregistrés dans la base de données
   - Le service de vérification des versions est notifié

3. **Détection de Vulnérabilités**
   - Le service de scan de vulnérabilités analyse les composants
   - Les vulnérabilités sont enregistrées
   - Des notifications sont envoyées aux utilisateurs concernés

4. **Génération de Rapports**
   - Le service de génération de rapports collecte les données
   - Des recommandations sont générées
   - Le rapport est enregistré et disponible pour consultation

## Améliorations de la Refactorisation

1. **Élimination des Doublons**
   - Middlewares communs centralisés
   - Utilitaires partagés entre les services
   - Composants UI réutilisables

2. **Modularité Améliorée**
   - Services backend indépendants
   - Composants frontend découplés
   - Séparation claire des responsabilités

3. **Maintenabilité**
   - Structure de projet cohérente
   - Conventions de nommage standardisées
   - Documentation intégrée au code

4. **Extensibilité**
   - Facilité d'ajout de nouveaux services
   - Composants frontend réutilisables
   - Architecture évolutive

## Déploiement

L'application peut être déployée à l'aide de Docker et Docker Compose, avec des configurations pour le développement et la production.

```bash
# Démarrer l'application
docker-compose up -d

# Démarrer avec monitoring
docker-compose -f docker-compose-monitoring.yml up -d
```

## Conclusion

Cette architecture refactorisée offre une base solide pour le développement futur d'AutoStack Manager, avec une séparation claire des responsabilités, une élimination des doublons et une meilleure maintenabilité.
