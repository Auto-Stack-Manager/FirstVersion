/**
 * Composant de route protégée pour AutoStack Manager
 * Vérifie l'authentification et les rôles avant d'afficher les composants enfants
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthenticationContext';
import { LoadingSpinner } from './UIComponents';

/**
 * Composant de route protégée
 * @param {Object} props - Propriétés du composant
 * @param {React.ReactNode} props.children - Composants enfants à afficher si l'utilisateur est authentifié
 * @param {string} props.requiredRole - Rôle requis pour accéder à la route (optionnel)
 * @returns {JSX.Element} - Composant de route protégée
 */
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user, loading, isAdmin } = useAuth();
  const location = useLocation();

  // Afficher un indicateur de chargement pendant la vérification de l'authentification
  if (loading) {
    return <LoadingSpinner centered text="Vérification de l'authentification..." />;
  }

  // Rediriger vers la page de connexion si l'utilisateur n'est pas authentifié
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Vérifier les rôles si nécessaire
  if (requiredRole) {
    // Si le rôle requis est "admin" et que l'utilisateur n'est pas admin
    if (requiredRole === 'admin' && !isAdmin) {
      return <Navigate to="/dashboard" replace />;
    }
    
    // Si le rôle requis est "developer" et que l'utilisateur n'est ni développeur ni admin
    if (requiredRole === 'developer' && user.role !== 'developer' && !isAdmin) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Afficher les composants enfants si l'utilisateur est authentifié et a les rôles requis
  return children;
};

export default ProtectedRoute;
