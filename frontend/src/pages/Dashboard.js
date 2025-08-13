import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  FileText, 
  Users, 
  TrendingUp,
  Calendar,
  Download,
  Plus,
  Activity
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { reportsAPI } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReports: 0,
    pendingReports: 0,
    completedReports: 0,
    monthlyGrowth: 12
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await reportsAPI.getAll();
      if (response.data.success) {
        const reportsData = response.data.reports;
        setReports(reportsData.slice(0, 5)); // Últimos 5 relatórios
        
        // Calcular estatísticas
        setStats({
          totalReports: reportsData.length,
          pendingReports: reportsData.filter(r => r.status === 'pending').length,
          completedReports: reportsData.filter(r => r.status === 'completed').length,
          monthlyGrowth: 12 // Simulado
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: 'Total de Relatórios',
      value: stats.totalReports,
      icon: FileText,
      color: '#007bff',
      change: '+12%'
    },
    {
      title: 'Relatórios Pendentes',
      value: stats.pendingReports,
      icon: Activity,
      color: '#ffc107',
      change: '-5%'
    },
    {
      title: 'Relatórios Concluídos',
      value: stats.completedReports,
      icon: BarChart3,
      color: '#28a745',
      change: '+18%'
    },
    {
      title: 'Crescimento Mensal',
      value: `${stats.monthlyGrowth}%`,
      icon: TrendingUp,
      color: '#17a2b8',
      change: '+3%'
    }
  ];

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Bem-vindo de volta, {user?.name || user?.email}!</p>
        </div>
        <div className="dashboard-actions">
          <button className="btn btn-secondary">
            <Download size={18} />
            Exportar
          </button>
          <button className="btn btn-primary">
            <Plus size={18} />
            Novo Relatório
          </button>
        </div>
      </div>

      <div className="stats-grid">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="stat-card">
              <div className="stat-content">
                <div className="stat-text">
                  <h3>{stat.value}</h3>
                  <p>{stat.title}</p>
                </div>
                <div 
                  className="stat-icon"
                  style={{ backgroundColor: `${stat.color}20`, color: stat.color }}
                >
                  <Icon size={24} />
                </div>
              </div>
              <div className="stat-footer">
                <span 
                  className={`stat-change ${stat.change.startsWith('+') ? 'positive' : 'negative'}`}
                >
                  {stat.change}
                </span>
                <span className="stat-period">vs mês anterior</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="dashboard-content">
        <div className="recent-reports">
          <div className="section-header">
            <h2>Relatórios Recentes</h2>
            <button className="btn btn-secondary btn-sm">Ver todos</button>
          </div>
          
          <div className="reports-list">
            {reports.length > 0 ? (
              reports.map((report) => (
                <div key={report.id} className="report-item">
                  <div className="report-info">
                    <h4>{report.title}</h4>
                    <p>{report.description || 'Sem descrição'}</p>
                    <div className="report-meta">
                      <span className="report-type">{report.type}</span>
                      <span className="report-date">
                        <Calendar size={14} />
                        {new Date(report.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  <div className="report-actions">
                    <button className="btn btn-sm btn-primary">Visualizar</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <FileText size={48} />
                <h3>Nenhum relatório encontrado</h3>
                <p>Comece criando seu primeiro relatório</p>
                <button className="btn btn-primary">
                  <Plus size={18} />
                  Criar Relatório
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="activity-feed">
          <div className="section-header">
            <h2>Atividade Recente</h2>
          </div>
          
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon">
                <FileText size={16} />
              </div>
              <div className="activity-content">
                <p><strong>Relatório criado:</strong> Vendas Q1 2024</p>
                <span className="activity-time">há 2 horas</span>
              </div>
            </div>
            
            <div className="activity-item">
              <div className="activity-icon">
                <Users size={16} />
              </div>
              <div className="activity-content">
                <p><strong>Usuário adicionado:</strong> João Silva</p>
                <span className="activity-time">há 4 horas</span>
              </div>
            </div>
            
            <div className="activity-item">
              <div className="activity-icon">
                <BarChart3 size={16} />
              </div>
              <div className="activity-content">
                <p><strong>Dashboard atualizado:</strong> Métricas de performance</p>
                <span className="activity-time">há 1 dia</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

