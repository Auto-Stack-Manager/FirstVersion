/**
 * Page Dashboard pour AutoStack Manager
 * Affiche une vue d'ensemble de l'état du système
 */
import React, { useState, useEffect } from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { 
  serviceManagementService, 
  vulnerabilityService, 
  reportService 
} from '../../services/apiServices';
import { 
  InfoCard, 
  StatusBadge, 
  LoadingSpinner, 
  ActionButton, 
  EmptyState 
} from '../common/UIComponents';
import { useAuth } from '../../contexts/AuthenticationContext';

/**
 * Composant Dashboard
 * @returns {JSX.Element} - Composant Dashboard
 */
const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    services: { total: 0, secure: 0, vulnerable: 0, outdated: 0 },
    vulnerabilities: { total: 0, critical: 0, high: 0, medium: 0, low: 0 },
    components: { total: 0, withUpdates: 0 },
    reports: []
  });
  const { isDeveloper } = useAuth();

  // Charger les données du dashboard
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Récupérer les services
        const servicesResponse = await serviceManagementService.getAllServices();
        const services = servicesResponse.data.services || [];
        
        // Récupérer les vulnérabilités
        const vulnerabilitiesResponse = await vulnerabilityService.getAllVulnerabilities();
        const vulnerabilities = vulnerabilitiesResponse.data.vulnerabilities || [];
        
        // Récupérer les rapports récents
        const reportsResponse = await reportService.getRecentReports(5);
        const reports = reportsResponse.data.reports || [];
        
        // Calculer les statistiques
        const serviceStats = {
          total: services.length,
          secure: services.filter(s => s.status === 'secure').length,
          vulnerable: services.filter(s => s.status === 'vulnerable').length,
          outdated: services.filter(s => s.status === 'outdated').length
        };
        
        const vulnStats = {
          total: vulnerabilities.length,
          critical: vulnerabilities.filter(v => v.severity === 'critical').length,
          high: vulnerabilities.filter(v => v.severity === 'high').length,
          medium: vulnerabilities.filter(v => v.severity === 'medium').length,
          low: vulnerabilities.filter(v => v.severity === 'low').length
        };
        
        // Mettre à jour l'état
        setStats({
          services: serviceStats,
          vulnerabilities: vulnStats,
          components: {
            total: services.reduce((acc, s) => acc + (s.components?.length || 0), 0),
            withUpdates: 0 // À implémenter avec un appel API dédié
          },
          reports
        });
      } catch (err) {
        console.error('Erreur lors du chargement des données du dashboard:', err);
        setError('Impossible de charger les données du dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner centered text="Chargement du dashboard..." />;
  }

  if (error) {
    return (
      <div className="text-center">
        <p className="text-danger">{error}</p>
        <ActionButton 
          variant="primary" 
          onClick={() => window.location.reload()}
        >
          Réessayer
        </ActionButton>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4">Dashboard</h1>
      
      {/* Statistiques des services */}
      <Row className="mb-4">
        <Col md={3}>
          <InfoCard 
            title="Total des services" 
            className="text-center h-100"
            bodyClassName="d-flex flex-column align-items-center justify-content-center"
          >
            <h2 className="display-4">{stats.services.total}</h2>
            <p className="mb-0">
              <Link to="/services">Voir tous les services</Link>
            </p>
          </InfoCard>
        </Col>
        <Col md={3}>
          <InfoCard 
            title="Services sécurisés" 
            className="text-center h-100 border-success"
            headerClassName="bg-success text-white"
            bodyClassName="d-flex flex-column align-items-center justify-content-center"
          >
            <h2 className="display-4">{stats.services.secure}</h2>
            <StatusBadge status="secure" />
          </InfoCard>
        </Col>
        <Col md={3}>
          <InfoCard 
            title="Services vulnérables" 
            className="text-center h-100 border-danger"
            headerClassName="bg-danger text-white"
            bodyClassName="d-flex flex-column align-items-center justify-content-center"
          >
            <h2 className="display-4">{stats.services.vulnerable}</h2>
            <StatusBadge status="vulnerable" />
          </InfoCard>
        </Col>
        <Col md={3}>
          <InfoCard 
            title="Services obsolètes" 
            className="text-center h-100 border-warning"
            headerClassName="bg-warning"
            bodyClassName="d-flex flex-column align-items-center justify-content-center"
          >
            <h2 className="display-4">{stats.services.outdated}</h2>
            <StatusBadge status="outdated" />
          </InfoCard>
        </Col>
      </Row>
      
      {/* Statistiques des vulnérabilités */}
      <Row className="mb-4">
        <Col>
          <InfoCard title="Vulnérabilités par sévérité">
            <Row>
              <Col md={3} className="text-center">
                <h4>Critiques</h4>
                <h3 className="text-danger">{stats.vulnerabilities.critical}</h3>
              </Col>
              <Col md={3} className="text-center">
                <h4>Élevées</h4>
                <h3 className="text-danger">{stats.vulnerabilities.high}</h3>
              </Col>
              <Col md={3} className="text-center">
                <h4>Moyennes</h4>
                <h3 className="text-warning">{stats.vulnerabilities.medium}</h3>
              </Col>
              <Col md={3} className="text-center">
                <h4>Faibles</h4>
                <h3 className="text-info">{stats.vulnerabilities.low}</h3>
              </Col>
            </Row>
            <div className="text-center mt-3">
              <Link to="/vulnerabilities" className="btn btn-outline-primary">
                Voir toutes les vulnérabilités
              </Link>
            </div>
          </InfoCard>
        </Col>
      </Row>
      
      {/* Rapports récents */}
      <Row className="mb-4">
        <Col>
          <InfoCard 
            title="Rapports récents"
            footer={
              <div className="text-center">
                <Link to="/reports" className="btn btn-outline-primary">
                  Voir tous les rapports
                </Link>
                {isDeveloper && (
                  <Link to="/reports/new" className="btn btn-primary ms-2">
                    Générer un rapport
                  </Link>
                )}
              </div>
            }
          >
            {stats.reports.length === 0 ? (
              <EmptyState 
                text="Aucun rapport disponible" 
                action={
                  isDeveloper && (
                    <Link to="/reports/new" className="btn btn-primary">
                      Générer un rapport
                    </Link>
                  )
                }
              />
            ) : (
              <div className="list-group">
                {stats.reports.map(report => (
                  <Link 
                    key={report._id} 
                    to={`/reports/${report._id}`}
                    className="list-group-item list-group-item-action"
                  >
                    <div className="d-flex w-100 justify-content-between">
                      <h5 className="mb-1">{report.title}</h5>
                      <small>{new Date(report.generatedAt).toLocaleDateString()}</small>
                    </div>
                    <p className="mb-1">
                      Services: {report.services?.length || 0} | 
                      Format: {report.format?.toUpperCase() || 'HTML'}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </InfoCard>
        </Col>
      </Row>
      
      {/* Actions rapides */}
      {isDeveloper && (
        <Row>
          <Col>
            <InfoCard title="Actions rapides">
              <div className="d-flex flex-wrap gap-2 justify-content-center">
                <Link to="/services/new" className="btn btn-primary">
                  Ajouter un service
                </Link>
                <Link to="/services" className="btn btn-outline-primary">
                  Scanner les services
                </Link>
                <Link to="/reports/new" className="btn btn-outline-primary">
                  Générer un rapport
                </Link>
                <Link to="/vulnerabilities" className="btn btn-outline-danger">
                  Vérifier les vulnérabilités
                </Link>
              </div>
            </InfoCard>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default Dashboard;
