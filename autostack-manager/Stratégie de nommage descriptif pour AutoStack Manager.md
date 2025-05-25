# Stratégie de nommage descriptif pour AutoStack Manager

## Objectif
Renommer les fichiers avec des noms plus descriptifs et illustratifs pour rendre le code plus compréhensible pour un projet open source.

## Stratégie de nommage

### Backend

#### Services
- `server.js` → `[service-name]Service.js`
  - Exemple: `authService.js`, `gatewayService.js`

#### Middlewares
- `auth.js` → `authenticationMiddleware.js`
- `errorHandler.js` → `errorHandlingMiddleware.js`
- `prometheus.js` → `prometheusMetricsMiddleware.js`

#### Utilitaires
- `database.js` → `databaseConnection.js`
- `dao.js` → `dataAccessObjects.js`
- `serviceInitializer.js` → `microserviceInitializer.js`

### Frontend

#### Contextes
- `AuthContext.js` → `AuthenticationContext.js`
- `NotificationContext.js` → `NotificationsContext.js`

#### Composants
- `UIComponents.js` → `CommonUIComponents.js`
- `ProtectedRoute.js` → `AuthProtectedRoute.js`
- `MainLayout.js` → `ApplicationLayout.js`

#### Pages
- `Dashboard.js` → `DashboardPage.js`
- Autres pages: `[Name]Page.js`

#### Services
- `api.js` → `apiServices.js`

#### Routes
- `AppRoutes.js` → `ApplicationRoutes.js`

## Règles de nommage
1. Utiliser le camelCase pour les noms de fichiers
2. Ajouter un suffixe descriptif selon le type de fichier:
   - Services backend: `Service.js`
   - Middlewares: `Middleware.js`
   - Utilitaires: nom descriptif de la fonction
   - Contextes React: `Context.js`
   - Composants UI: `Component.js` ou nom descriptif
   - Pages: `Page.js`
   - Routes: `Routes.js`
3. Éviter les abréviations peu claires
4. Préférer les noms complets et descriptifs

## Mise à jour des imports
Tous les imports dans les fichiers doivent être mis à jour pour refléter les nouveaux noms de fichiers.
