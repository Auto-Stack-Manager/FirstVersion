/**
 * Contexte de notification pour AutoStack Manager
 * Gère l'état des notifications et fournit des méthodes pour les récupérer et les gérer
 */
import React, { createContext, useState, useEffect, useContext } from 'react';
import { notificationService } from '../services/apiServices';
import { useAuth } from './AuthContext';

// Création du contexte de notification
const NotificationContext = createContext(null);

/**
 * Fournisseur du contexte de notification
 * @param {Object} props - Propriétés du composant
 * @returns {JSX.Element} - Composant fournisseur
 */
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

  // Charger les notifications au chargement et lorsque l'état d'authentification change
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      // Rafraîchir les notifications toutes les minutes
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated]);

  /**
   * Récupérer les notifications de l'utilisateur
   */
  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const response = await notificationService.getUserNotifications();
      if (response.data.success) {
        setNotifications(response.data.notifications);
        
        // Compter les notifications non lues
        const unread = response.data.notifications.filter(notif => !notif.read).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des notifications:', err);
      setError('Impossible de charger les notifications');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Récupérer uniquement les notifications non lues
   */
  const fetchUnreadNotifications = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const response = await notificationService.getUnreadNotifications();
      if (response.data.success) {
        // Mettre à jour uniquement les notifications non lues
        const unreadNotifs = response.data.notifications;
        setUnreadCount(unreadNotifs.length);
        
        // Fusionner avec les notifications existantes
        setNotifications(prevNotifs => {
          const notifMap = new Map(prevNotifs.map(n => [n._id, n]));
          unreadNotifs.forEach(n => notifMap.set(n._id, n));
          return Array.from(notifMap.values()).sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
          );
        });
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des notifications non lues:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Marquer une notification comme lue
   * @param {string} notificationId - ID de la notification
   */
  const markAsRead = async (notificationId) => {
    try {
      const response = await notificationService.markAsRead(notificationId);
      if (response.data.success) {
        // Mettre à jour l'état local
        setNotifications(prevNotifs => 
          prevNotifs.map(n => 
            n._id === notificationId ? { ...n, read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Erreur lors du marquage de la notification comme lue:', err);
    }
  };

  /**
   * Marquer toutes les notifications comme lues
   */
  const markAllAsRead = async () => {
    try {
      const response = await notificationService.markAllAsRead();
      if (response.data.success) {
        // Mettre à jour l'état local
        setNotifications(prevNotifs => 
          prevNotifs.map(n => ({ ...n, read: true }))
        );
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Erreur lors du marquage de toutes les notifications comme lues:', err);
    }
  };

  /**
   * Supprimer une notification
   * @param {string} notificationId - ID de la notification
   */
  const deleteNotification = async (notificationId) => {
    try {
      const response = await notificationService.deleteNotification(notificationId);
      if (response.data.success) {
        // Mettre à jour l'état local
        const notif = notifications.find(n => n._id === notificationId);
        setNotifications(prevNotifs => 
          prevNotifs.filter(n => n._id !== notificationId)
        );
        
        // Mettre à jour le compteur si la notification était non lue
        if (notif && !notif.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (err) {
      console.error('Erreur lors de la suppression de la notification:', err);
    }
  };

  /**
   * Mettre à jour les préférences de notification
   * @param {Object} preferences - Préférences de notification
   */
  const updatePreferences = async (preferences) => {
    try {
      const response = await notificationService.updateNotificationPreferences(preferences);
      return response.data.success;
    } catch (err) {
      console.error('Erreur lors de la mise à jour des préférences de notification:', err);
      return false;
    }
  };

  // Valeurs exposées par le contexte
  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchUnreadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updatePreferences
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

/**
 * Hook pour utiliser le contexte de notification
 * @returns {Object} - Contexte de notification
 */
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications doit être utilisé à l\'intérieur d\'un NotificationProvider');
  }
  return context;
};

export default NotificationContext;
