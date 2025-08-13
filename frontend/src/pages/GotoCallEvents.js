import React, { useState, useEffect } from 'react';
import { Phone, Calendar, Clock, User, FileText, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import './GotoCallEvents.css';

const GotoCallEvents = () => {
  const { user, isAuthenticated } = useAuth();
  const [callEvents, setCallEvents] = useState([]);
  const [userKey, setUserKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchCallEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Verificar se o usuário está autenticado
      if (!user || !isAuthenticated) {
        setError('Usuário não autenticado');
        setLoading(false);
        return;
      }
      
      console.log('Fazendo requisição para API com usuário:', user.id);
      
      // Primeiro, testar a autenticação
      try {
        const testResponse = await api.get('/goto-call-events/test');
        console.log('Teste de autenticação:', testResponse.data);
      } catch (testErr) {
        console.error('Erro no teste de autenticação:', testErr);
        setError('Erro de autenticação: ' + (testErr.response?.data?.error || testErr.message));
        setLoading(false);
        return;
      }
      
      // Verificar se o usuário tem token GoTo
      try {
        const tokenResponse = await api.get('/goto-call-events/check-token');
        console.log('Verificação de token:', tokenResponse.data);
        
        if (!tokenResponse.data.hasToken) {
          setError('Usuário não possui token GoTo válido. Conecte-se ao GoTo primeiro.');
          setLoading(false);
          return;
        }
      } catch (tokenErr) {
        console.error('Erro ao verificar token GoTo:', tokenErr);
        setError('Erro ao verificar token GoTo: ' + (tokenErr.response?.data?.error || tokenErr.message));
        setLoading(false);
        return;
      }
      
      // Agora buscar os relatórios
      const response = await api.get('/goto-call-events/call-events-report');
      
      if (response.data.success) {
        setCallEvents(response.data.data || []);
        setUserKey(response.data.userKey || null);
        setLastUpdate(new Date());
      } else {
        setError(response.data.error || 'Erro ao buscar relatórios');
      }
    } catch (err) {
      console.error('Erro ao buscar relatórios:', err);
      
      if (err.response?.status === 401) {
        setError('Token de acesso expirado. Faça login novamente.');
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Erro de conexão com o servidor');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCallEvents();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Data inválida';
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'success';
      case 'failed':
      case 'error':
        return 'error';
      case 'pending':
      case 'waiting':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'success':
        return '✓';
      case 'failed':
      case 'error':
        return '✗';
      case 'pending':
      case 'waiting':
        return '⏳';
      default:
        return '?';
    }
  };

  if (loading && callEvents.length === 0) {
    return (
      <div className="goto-call-events-page">
        <div className="page-header">
          <h1>Relatórios de Eventos de Chamadas - GoTo</h1>
          <p>Carregando relatórios...</p>
        </div>
        <div className="loading-container">
          <RefreshCw className="loading-spinner" />
          <p>Buscando dados da API GoTo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="goto-call-events-page">
      <div className="page-header">
        <div className="header-content">
          <div className="header-title">
            <Phone className="header-icon" />
            <h1>Relatórios de Eventos de Chamadas - GoTo</h1>
          </div>
          <p className="header-description">
            Visualize os últimos 10 relatórios de eventos de chamadas da plataforma GoTo
          </p>
        </div>
        
        <div className="header-actions">
          <button 
            className="refresh-btn"
            onClick={fetchCallEvents}
            disabled={loading}
          >
            <RefreshCw className={loading ? 'spinning' : ''} />
            {loading ? 'Atualizando...' : 'Atualizar'}
          </button>
          
          {lastUpdate && (
            <div className="last-update">
              <Clock size={16} />
              <span>Última atualização: {formatDate(lastUpdate)}</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle />
          <span>{error}</span>
          <button onClick={fetchCallEvents} className="retry-btn">
            Tentar novamente
          </button>
        </div>
      )}

      <div className="content-section">
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-icon">
              <FileText />
            </div>
            <div className="stat-content">
              <h3>Total de Relatórios</h3>
              <p className="stat-number">{callEvents.length}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <Calendar />
            </div>
            <div className="stat-content">
              <h3>Última Atualização</h3>
              <p className="stat-text">
                {lastUpdate ? formatDate(lastUpdate) : 'N/A'}
              </p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <User />
            </div>
            <div className="stat-content">
              <h3>UserKey (Principal)</h3>
              <p className="stat-text">
                {userKey || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="table-container">
          <div className="table-header">
            <h2>Relatórios de Eventos de Chamadas</h2>
            <span className="record-count">
              {callEvents.length} registro{callEvents.length !== 1 ? 's' : ''}
            </span>
          </div>

          {callEvents.length === 0 ? (
            <div className="empty-state">
              <FileText className="empty-icon" />
              <h3>Nenhum relatório encontrado</h3>
              <p>Não há relatórios de eventos de chamadas disponíveis no momento.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="call-events-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nome</th>
                    <th>Status</th>
                    <th>Data de Criação</th>
                    <th>Última Atualização</th>
                    <th>Descrição</th>
                  </tr>
                </thead>
                <tbody>
                  {callEvents.map((event, index) => (
                    <tr key={event.id || index} className="table-row">
                      <td className="event-id">
                        {event.id || `#${index + 1}`}
                      </td>
                      <td className="event-name">
                        <div className="name-content">
                          <span className="name-text">
                            {event.name || event.title || 'Sem nome'}
                          </span>
                        </div>
                      </td>
                      <td className="event-status">
                        <span className={`status-badge status-${getStatusColor(event.status)}`}>
                          {getStatusIcon(event.status)} {event.status || 'N/A'}
                        </span>
                      </td>
                      <td className="event-created">
                        {formatDate(event.createdAt || event.created_at || event.created)}
                      </td>
                      <td className="event-updated">
                        {formatDate(event.updatedAt || event.updated_at || event.updated)}
                      </td>
                      <td className="event-description">
                        <span className="description-text">
                          {event.description || event.desc || 'Sem descrição'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GotoCallEvents;
