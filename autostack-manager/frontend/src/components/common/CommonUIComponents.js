/**
 * Composants UI communs pour AutoStack Manager
 * Fournit des composants réutilisables pour l'interface utilisateur
 */
import React from 'react';
import { 
  Card, 
  Button, 
  Alert, 
  Spinner, 
  Badge, 
  Tooltip, 
  OverlayTrigger,
  Modal
} from 'react-bootstrap';

/**
 * Composant de carte pour afficher des informations
 * @param {Object} props - Propriétés du composant
 * @returns {JSX.Element} - Composant de carte
 */
export const InfoCard = ({ 
  title, 
  children, 
  footer, 
  className = '', 
  headerClassName = '', 
  bodyClassName = '',
  footerClassName = '',
  ...props 
}) => {
  return (
    <Card className={`shadow-sm ${className}`} {...props}>
      {title && <Card.Header className={headerClassName}>{title}</Card.Header>}
      <Card.Body className={bodyClassName}>{children}</Card.Body>
      {footer && <Card.Footer className={footerClassName}>{footer}</Card.Footer>}
    </Card>
  );
};

/**
 * Composant de bouton d'action
 * @param {Object} props - Propriétés du composant
 * @returns {JSX.Element} - Composant de bouton
 */
export const ActionButton = ({ 
  children, 
  loading = false, 
  disabled = false, 
  variant = 'primary', 
  size = null,
  icon = null,
  onClick,
  ...props 
}) => {
  return (
    <Button
      variant={variant}
      size={size}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <>
          <Spinner
            as="span"
            animation="border"
            size="sm"
            role="status"
            aria-hidden="true"
            className="me-2"
          />
          Chargement...
        </>
      ) : (
        <>
          {icon && <span className="me-2">{icon}</span>}
          {children}
        </>
      )}
    </Button>
  );
};

/**
 * Composant de message d'alerte
 * @param {Object} props - Propriétés du composant
 * @returns {JSX.Element} - Composant d'alerte
 */
export const AlertMessage = ({ 
  message, 
  variant = 'info', 
  dismissible = false,
  onClose = null,
  ...props 
}) => {
  if (!message) return null;
  
  return (
    <Alert 
      variant={variant} 
      dismissible={dismissible}
      onClose={onClose}
      {...props}
    >
      {message}
    </Alert>
  );
};

/**
 * Composant de badge de statut
 * @param {Object} props - Propriétés du composant
 * @returns {JSX.Element} - Composant de badge
 */
export const StatusBadge = ({ 
  status, 
  ...props 
}) => {
  let variant = 'secondary';
  let text = status;
  
  // Mapper le statut à une variante de badge
  switch (status?.toLowerCase()) {
    case 'secure':
      variant = 'success';
      text = 'Sécurisé';
      break;
    case 'vulnerable':
      variant = 'danger';
      text = 'Vulnérable';
      break;
    case 'outdated':
      variant = 'warning';
      text = 'Obsolète';
      break;
    case 'critical':
      variant = 'danger';
      text = 'Critique';
      break;
    case 'high':
      variant = 'danger';
      text = 'Élevé';
      break;
    case 'medium':
      variant = 'warning';
      text = 'Moyen';
      break;
    case 'low':
      variant = 'info';
      text = 'Faible';
      break;
    case 'info':
      variant = 'info';
      text = 'Info';
      break;
    case 'active':
      variant = 'success';
      text = 'Actif';
      break;
    case 'inactive':
      variant = 'secondary';
      text = 'Inactif';
      break;
    default:
      break;
  }
  
  return (
    <Badge bg={variant} {...props}>
      {text}
    </Badge>
  );
};

/**
 * Composant d'infobulle
 * @param {Object} props - Propriétés du composant
 * @returns {JSX.Element} - Composant d'infobulle
 */
export const InfoTooltip = ({ 
  children, 
  text, 
  placement = 'top',
  ...props 
}) => {
  return (
    <OverlayTrigger
      placement={placement}
      overlay={<Tooltip {...props}>{text}</Tooltip>}
    >
      {children}
    </OverlayTrigger>
  );
};

/**
 * Composant de chargement
 * @param {Object} props - Propriétés du composant
 * @returns {JSX.Element} - Composant de chargement
 */
export const LoadingSpinner = ({ 
  size = 'md', 
  text = 'Chargement...', 
  centered = false,
  fullPage = false,
  ...props 
}) => {
  const spinnerSize = size === 'sm' ? '' : (size === 'lg' ? 'spinner-border-lg' : '');
  
  const spinner = (
    <div className={`d-flex align-items-center ${centered ? 'justify-content-center' : ''}`} {...props}>
      <Spinner animation="border" role="status" className={spinnerSize}>
        <span className="visually-hidden">{text}</span>
      </Spinner>
      {text && <span className="ms-2">{text}</span>}
    </div>
  );
  
  if (fullPage) {
    return (
      <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-75" style={{ zIndex: 1050 }}>
        {spinner}
      </div>
    );
  }
  
  return spinner;
};

/**
 * Composant de boîte de dialogue de confirmation
 * @param {Object} props - Propriétés du composant
 * @returns {JSX.Element} - Composant de boîte de dialogue
 */
export const ConfirmDialog = ({ 
  show, 
  onHide, 
  onConfirm, 
  title = 'Confirmation', 
  message = 'Êtes-vous sûr de vouloir effectuer cette action ?',
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  confirmVariant = 'primary',
  size = 'sm',
  ...props 
}) => {
  return (
    <Modal show={show} onHide={onHide} size={size} centered {...props}>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{message}</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          {cancelText}
        </Button>
        <Button variant={confirmVariant} onClick={onConfirm}>
          {confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

/**
 * Composant d'affichage de données vides
 * @param {Object} props - Propriétés du composant
 * @returns {JSX.Element} - Composant d'affichage de données vides
 */
export const EmptyState = ({ 
  text = 'Aucune donnée disponible', 
  icon = null,
  action = null,
  ...props 
}) => {
  return (
    <div className="text-center py-5 my-3" {...props}>
      {icon && <div className="mb-3">{icon}</div>}
      <p className="text-muted">{text}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
};

/**
 * Composant de pagination
 * @param {Object} props - Propriétés du composant
 * @returns {JSX.Element} - Composant de pagination
 */
export const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  ...props 
}) => {
  if (totalPages <= 1) return null;
  
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    onPageChange(page);
  };
  
  // Générer les éléments de pagination
  const renderPaginationItems = () => {
    const items = [];
    
    // Bouton précédent
    items.push(
      <li key="prev" className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
        <button 
          className="page-link" 
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          &laquo;
        </button>
      </li>
    );
    
    // Pages
    for (let i = 1; i <= totalPages; i++) {
      // Afficher seulement les pages proches de la page actuelle
      if (
        i === 1 || 
        i === totalPages || 
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        items.push(
          <li key={i} className={`page-item ${currentPage === i ? 'active' : ''}`}>
            <button 
              className="page-link" 
              onClick={() => handlePageChange(i)}
            >
              {i}
            </button>
          </li>
        );
      } else if (
        (i === currentPage - 2 && currentPage > 3) || 
        (i === currentPage + 2 && currentPage < totalPages - 2)
      ) {
        // Ajouter des points de suspension
        items.push(
          <li key={`ellipsis-${i}`} className="page-item disabled">
            <span className="page-link">...</span>
          </li>
        );
      }
    }
    
    // Bouton suivant
    items.push(
      <li key="next" className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
        <button 
          className="page-link" 
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          &raquo;
        </button>
      </li>
    );
    
    return items;
  };
  
  return (
    <nav aria-label="Pagination" {...props}>
      <ul className="pagination">
        {renderPaginationItems()}
      </ul>
    </nav>
  );
};

export default {
  InfoCard,
  ActionButton,
  AlertMessage,
  StatusBadge,
  InfoTooltip,
  LoadingSpinner,
  ConfirmDialog,
  EmptyState,
  Pagination
};
