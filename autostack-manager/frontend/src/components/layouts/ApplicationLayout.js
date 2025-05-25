/**
 * Layout principal pour AutoStack Manager
 * Fournit la structure de base de l'application avec navigation et gestion des notifications
 */
import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Container, Navbar, Nav, NavDropdown, Badge, Offcanvas, ListGroup } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthenticationContext';
import { useNotifications } from '../contexts/NotificationsContext';
import { StatusBadge, LoadingSpinner } from './common/UIComponents';

/**
 * Composant de layout principal
 * @returns {JSX.Element} - Composant de layout
 */
const ApplicationLayout = () => {
  const { user, isAuthenticated, isAdmin, isDeveloper, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Gérer la déconnexion
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Gérer l'affichage des notifications
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  // Gérer le clic sur une notification
  const handleNotificationClick = (notification) => {
    // Marquer comme lue
    if (!notification.read) {
      markAsRead(notification._id);
    }

    // Naviguer vers la page appropriée en fonction du type de notification
    switch (notification.type) {
      case 'vulnerability':
        navigate(`/services/${notification.service}/vulnerabilities`);
        break;
      case 'update':
        navigate(`/services/${notification.service}/components`);
        break;
      case 'report':
        navigate(`/reports/${notification.reportId}`);
        break;
      default:
        // Par défaut, naviguer vers le dashboard
        navigate('/dashboard');
    }

    // Fermer le panneau de notifications
    setShowNotifications(false);
  };

  // Déterminer si un lien de navigation est actif
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand as={Link} to="/">
            AutoStack Manager
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="main-navbar-nav" />
          <Navbar.Collapse id="main-navbar-nav">
            {isAuthenticated ? (
              <>
                <Nav className="me-auto">
                  <Nav.Link as={Link} to="/dashboard" active={isActive('/dashboard')}>
                    Dashboard
                  </Nav.Link>
                  <Nav.Link as={Link} to="/services" active={isActive('/services')}>
                    Services
                  </Nav.Link>
                  <Nav.Link as={Link} to="/vulnerabilities" active={isActive('/vulnerabilities')}>
                    Vulnérabilités
                  </Nav.Link>
                  <Nav.Link as={Link} to="/reports" active={isActive('/reports')}>
                    Rapports
                  </Nav.Link>
                  {isAdmin && (
                    <NavDropdown title="Administration" id="admin-dropdown" active={isActive('/admin')}>
                      <NavDropdown.Item as={Link} to="/admin/users">
                        Utilisateurs
                      </NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/admin/settings">
                        Paramètres
                      </NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/admin/logs">
                        Journaux
                      </NavDropdown.Item>
                    </NavDropdown>
                  )}
                </Nav>
                <Nav>
                  <Nav.Link onClick={toggleNotifications} className="position-relative">
                    Notifications
                    {unreadCount > 0 && (
                      <Badge bg="danger" pill className="position-absolute top-0 start-100 translate-middle">
                        {unreadCount}
                      </Badge>
                    )}
                  </Nav.Link>
                  <NavDropdown title={user?.username || 'Utilisateur'} id="user-dropdown">
                    <NavDropdown.Item as={Link} to="/profile">
                      Profil
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/settings">
                      Paramètres
                    </NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item onClick={handleLogout}>
                      Déconnexion
                    </NavDropdown.Item>
                  </NavDropdown>
                </Nav>
              </>
            ) : (
              <Nav className="ms-auto">
                <Nav.Link as={Link} to="/login" active={isActive('/login')}>
                  Connexion
                </Nav.Link>
                <Nav.Link as={Link} to="/register" active={isActive('/register')}>
                  Inscription
                </Nav.Link>
              </Nav>
            )}
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container className="py-3">
        <Outlet />
      </Container>

      {/* Panneau de notifications */}
      <Offcanvas show={showNotifications} onHide={() => setShowNotifications(false)} placement="end">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>
            Notifications
            {unreadCount > 0 && (
              <Badge bg="danger" pill className="ms-2">
                {unreadCount}
              </Badge>
            )}
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {notifications.length === 0 ? (
            <p className="text-center text-muted">Aucune notification</p>
          ) : (
            <>
              <div className="d-flex justify-content-end mb-3">
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => markAllAsRead()}
                >
                  Tout marquer comme lu
                </button>
              </div>
              <ListGroup>
                {notifications.map((notification) => (
                  <ListGroup.Item
                    key={notification._id}
                    action
                    onClick={() => handleNotificationClick(notification)}
                    className={notification.read ? '' : 'fw-bold'}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div>{notification.title}</div>
                        <small className="text-muted">{notification.message}</small>
                      </div>
                      <div>
                        <StatusBadge status={notification.severity || 'info'} />
                      </div>
                    </div>
                    <small className="text-muted d-block mt-1">
                      {new Date(notification.createdAt).toLocaleString()}
                    </small>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </>
          )}
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default ApplicationLayout;
