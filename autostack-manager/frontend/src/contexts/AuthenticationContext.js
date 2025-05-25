/**
 * Contexte d'authentification pour AutoStack Manager
 * Gère l'état d'authentification et fournit des méthodes pour se connecter, s'inscrire et se déconnecter
 */
import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/apiServices';

// Création du contexte d'authentification
const AuthenticationContext = createContext(null);

/**
 * Fournisseur du contexte d'authentification
 * @param {Object} props - Propriétés du composant
 * @returns {JSX.Element} - Composant fournisseur
 */
export const AuthenticationProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await authService.verifyToken();
        if (response.data.success) {
          setUser(response.data.user);
        } else {
          // Token invalide, supprimer les données d'authentification
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch (err) {
        console.error('Erreur lors de la vérification du token:', err);
        // En cas d'erreur, supprimer les données d'authentification
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  /**
   * Connexion utilisateur
   * @param {Object} credentials - Identifiants de connexion
   * @returns {Promise} - Résultat de la connexion
   */
  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.login(credentials);
      if (response.data.success) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        return { success: true, user };
      } else {
        setError(response.data.message || 'Erreur de connexion');
        return { success: false, message: response.data.message };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Erreur de connexion';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Inscription utilisateur
   * @param {Object} userData - Données utilisateur
   * @returns {Promise} - Résultat de l'inscription
   */
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.register(userData);
      if (response.data.success) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        return { success: true, user };
      } else {
        setError(response.data.message || 'Erreur d\'inscription');
        return { success: false, message: response.data.message };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Erreur d\'inscription';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Déconnexion utilisateur
   */
  const logout = () => {
    authService.logout();
    setUser(null);
  };

  /**
   * Mise à jour du profil utilisateur
   * @param {Object} profileData - Données du profil
   * @returns {Promise} - Résultat de la mise à jour
   */
  const updateProfile = async (profileData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.updateProfile(profileData);
      if (response.data.success) {
        const updatedUser = response.data.user;
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        return { success: true, user: updatedUser };
      } else {
        setError(response.data.message || 'Erreur de mise à jour du profil');
        return { success: false, message: response.data.message };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Erreur de mise à jour du profil';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Changement de mot de passe
   * @param {Object} passwordData - Données de mot de passe
   * @returns {Promise} - Résultat du changement
   */
  const changePassword = async (passwordData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.changePassword(passwordData);
      if (response.data.success) {
        return { success: true, message: response.data.message };
      } else {
        setError(response.data.message || 'Erreur de changement de mot de passe');
        return { success: false, message: response.data.message };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Erreur de changement de mot de passe';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Valeurs exposées par le contexte
  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isDeveloper: user?.role === 'developer' || user?.role === 'admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook pour utiliser le contexte d'authentification
 * @returns {Object} - Contexte d'authentification
 */
export const useAuthentication = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
};

export default AuthContext;
