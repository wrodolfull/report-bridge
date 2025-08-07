import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { usersAPI } from '../services/api';
import toast from 'react-hot-toast';
import './Users.css';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({});

  useEffect(() => {
    loadUsers();
    loadStats();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await usersAPI.getAll();
      if (response.data.success) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await usersAPI.getStats();
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleSyncUser = async (userId) => {
    try {
      const response = await usersAPI.syncUser(userId);
      if (response.data.success) {
        toast.success('Sincronização iniciada com sucesso');
        loadUsers(); // Recarregar dados
      }
    } catch (error) {
      console.error('Erro ao sincronizar usuário:', error);
      toast.error('Erro ao sincronizar usuário');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle size={16} className="status-icon active" />;
      case 'inactive':
        return <XCircle size={16} className="status-icon inactive" />;
      case 'suspended':
        return <AlertCircle size={16} className="status-icon suspended" />;
      default:
        return <AlertCircle size={16} className="status-icon" />;
    }
  };

  const getGotoStatusIcon = (gotoStatus) => {
    if (gotoStatus.connected) {
      return <CheckCircle size={16} className="status-icon connected" />;
    } else if (gotoStatus.isExpired) {
      return <XCircle size={16} className="status-icon expired" />;
    } else {
      return <XCircle size={16} className="status-icon disconnected" />;
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="users-loading">
        <div className="spinner"></div>
        <p>Carregando usuários...</p>
      </div>
    );
  }

  return (
    <div className="users">
      <div className="users-header">
        <div>
          <h1>Sistema de Gestão</h1>
          <p>Painel administrativo - Gestão de usuários e conexões GoTo</p>
        </div>
        <div className="users-actions">
          <button className="btn btn-secondary" onClick={loadUsers}>
            <RefreshCw size={18} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-text">
              <h3>{stats.totalUsers || 0}</h3>
              <p>Total de Usuários</p>
            </div>
            <div className="stat-icon" style={{ backgroundColor: '#007bff20', color: '#007bff' }}>
              <Users size={24} />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-text">
              <h3>{stats.connectedUsers || 0}</h3>
              <p>Conectados ao GoTo</p>
            </div>
            <div className="stat-icon" style={{ backgroundColor: '#28a74520', color: '#28a745' }}>
              <CheckCircle size={24} />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-text">
              <h3>{stats.activeUsers || 0}</h3>
              <p>Usuários Ativos</p>
            </div>
            <div className="stat-icon" style={{ backgroundColor: '#ffc10720', color: '#ffc107' }}>
              <Users size={24} />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-text">
              <h3>{stats.connectionRate || 0}%</h3>
              <p>Taxa de Conexão</p>
            </div>
            <div className="stat-icon" style={{ backgroundColor: '#17a2b820', color: '#17a2b8' }}>
              <CheckCircle size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="users-filters">
        <div className="search-container">
          <Search size={20} />
          <input
            type="text"
            placeholder="Buscar usuários..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-container">
          <Filter size={20} />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Todos os Status</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
            <option value="suspended">Suspensos</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Email</th>
              <th>Status</th>
              <th>GoTo Status</th>
              <th>Último Login</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id}>
                <td>
                  <div className="user-info">
                    <div className="user-avatar">
                      {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <div className="user-name">{user.name || 'N/A'}</div>
                      <div className="user-role">Administrador</div>
                    </div>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>
                  <div className="status-cell">
                    {getStatusIcon(user.status)}
                    <span className={`status-text ${user.status}`}>
                      {user.status === 'active' ? 'Ativo' : 
                       user.status === 'inactive' ? 'Inativo' : 'Suspenso'}
                    </span>
                  </div>
                </td>
                <td>
                  <div className="status-cell">
                    {getGotoStatusIcon(user.gotoStatus)}
                    <span className={`status-text ${user.gotoStatus.connected ? 'connected' : 'disconnected'}`}>
                      {user.gotoStatus.connected ? 'Conectado' : 
                       user.gotoStatus.isExpired ? 'Expirado' : 'Desconectado'}
                    </span>
                  </div>
                </td>
                <td>
                  {user.last_login ? 
                    new Date(user.last_login).toLocaleDateString('pt-BR') : 
                    'Nunca'
                  }
                </td>
                <td>
                  <div className="actions">
                    <button 
                      className="btn-icon"
                      title="Ver detalhes"
                      onClick={() => {/* Implementar modal de detalhes */}}
                    >
                      <Eye size={16} />
                    </button>
                    <button 
                      className="btn-icon"
                      title="Sincronizar GoTo"
                      onClick={() => handleSyncUser(user.id)}
                      disabled={!user.gotoStatus.connected}
                    >
                      <RefreshCw size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;
