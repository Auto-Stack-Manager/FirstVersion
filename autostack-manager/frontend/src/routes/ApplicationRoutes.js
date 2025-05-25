/**
 * Configuration des routes pour AutoStack Manager
 * Définit toutes les routes de l'application et leur protection
 */
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthenticationContext';
import { NotificationProvider } from '../contexts/NotificationsContext';
import ApplicationLayout from '../components/layouts/ApplicationLayout';
import ProtectedRoute from '../components/common/AuthProtectedRoute';
import Login from '../components/pages/Login';
import Register from '../components/pages/Register';
import Dashboard from '../components/pages/DashboardPage';
import ServiceList from '../components/pages/ServiceList';
import ServiceDetails from '../components/pages/ServiceDetails';
import VulnerabilityList from '../components/pages/VulnerabilityList';
import ReportList from '../components/pages/ReportList';
import ReportDetails from '../components/pages/ReportDetails';
import CreateReport from '../components/pages/CreateReport';
import Profile from '../components/pages/Profile';
import Settings from '../components/pages/Settings';
import NotFound from '../components/pages/NotFound';
import AdminUsers from '../components/pages/admin/AdminUsers';
import AdminSettings from '../components/pages/admin/AdminSettings';
import AdminLogs from '../components/pages/admin/AdminLogs';

/**
 * Composant de configuration des routes
 * @returns {JSX.Element} - Composant de routes
 */
const AppRoutes = () => {
  return (
    <AuthenticationProvider>
      <NotificationProvider>
        <Routes>
          {/* Routes publiques */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Routes protégées avec layout principal */}
          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            {/* Redirection de la racine vers le dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Dashboard */}
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Services */}
            <Route path="/services" element={<ServiceList />} />
            <Route path="/services/:serviceId" element={<ServiceDetails />} />
            
            {/* Vulnérabilités */}
            <Route path="/vulnerabilities" element={<VulnerabilityList />} />
            
            {/* Rapports */}
            <Route path="/reports" element={<ReportList />} />
            <Route path="/reports/:reportId" element={<ReportDetails />} />
            <Route path="/reports/new" element={<CreateReport />} />
            
            {/* Profil et paramètres */}
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            
            {/* Routes d'administration (accessibles uniquement aux administrateurs) */}
            <Route path="/admin/users" element={
              <ProtectedRoute requiredRole="admin"><AdminUsers /></ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
              <ProtectedRoute requiredRole="admin"><AdminSettings /></ProtectedRoute>
            } />
            <Route path="/admin/logs" element={
              <ProtectedRoute requiredRole="admin"><AdminLogs /></ProtectedRoute>
            } />
          </Route>
          
          {/* Route 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </NotificationProvider>
    </AuthenticationProvider>
  );
};

export default AppRoutes;
