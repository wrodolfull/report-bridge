import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Download, 
  Edit2, 
  Trash2, 
  Eye,
  Calendar,
  FileText
} from 'lucide-react';
import { reportsAPI } from '../services/api';
import toast from 'react-hot-toast';
import './Reports.css';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'general'
  });

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const response = await reportsAPI.getAll();
      if (response.data.success) {
        setReports(response.data.reports);
      }
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      toast.error('Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReport = async (e) => {
    e.preventDefault();
    
    try {
      const response = await reportsAPI.create(formData);
      if (response.data.success) {
        toast.success('Relatório criado com sucesso!');
        setShowCreateModal(false);
        setFormData({ title: '', description: '', type: 'general' });
        loadReports();
      }
    } catch (error) {
      console.error('Erro ao criar relatório:', error);
      toast.error('Erro ao criar relatório');
    }
  };

  const handleUpdateReport = async (e) => {
    e.preventDefault();
    
    try {
      const response = await reportsAPI.update(editingReport.id, formData);
      if (response.data.success) {
        toast.success('Relatório atualizado com sucesso!');
        setEditingReport(null);
        setFormData({ title: '', description: '', type: 'general' });
        loadReports();
      }
    } catch (error) {
      console.error('Erro ao atualizar relatório:', error);
      toast.error('Erro ao atualizar relatório');
    }
  };

  const handleDeleteReport = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este relatório?')) {
      return;
    }

    try {
      const response = await reportsAPI.delete(id);
      if (response.data.success) {
        toast.success('Relatório excluído com sucesso!');
        loadReports();
      }
    } catch (error) {
      console.error('Erro ao excluir relatório:', error);
      toast.error('Erro ao excluir relatório');
    }
  };

  const openEditModal = (report) => {
    setEditingReport(report);
    setFormData({
      title: report.title,
      description: report.description || '',
      type: report.type
    });
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingReport(null);
    setFormData({ title: '', description: '', type: 'general' });
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || report.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const reportTypes = [
    { value: 'all', label: 'Todos' },
    { value: 'general', label: 'Geral' },
    { value: 'sales', label: 'Vendas' },
    { value: 'financial', label: 'Financeiro' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'operations', label: 'Operações' }
  ];

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="reports-page">
      <div className="reports-header">
        <div>
          <h1>Relatórios</h1>
          <p>Gerencie e visualize seus relatórios</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={18} />
          Novo Relatório
        </button>
      </div>

      <div className="reports-filters">
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Pesquisar relatórios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="filter-select"
        >
          {reportTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        
        <button className="btn btn-secondary">
          <Download size={18} />
          Exportar
        </button>
      </div>

      <div className="reports-content">
        {filteredReports.length > 0 ? (
          <div className="reports-grid">
            {filteredReports.map((report) => (
              <div key={report.id} className="report-card">
                <div className="report-header">
                  <div className="report-type-badge">
                    {reportTypes.find(t => t.value === report.type)?.label || 'Geral'}
                  </div>
                  <div className="report-date">
                    <Calendar size={14} />
                    {new Date(report.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                
                <div className="report-body">
                  <h3>{report.title}</h3>
                  <p>{report.description || 'Sem descrição disponível'}</p>
                </div>
                
                <div className="report-actions">
                  <button 
                    className="action-btn view"
                    title="Visualizar"
                  >
                    <Eye size={16} />
                  </button>
                  <button 
                    className="action-btn edit"
                    onClick={() => openEditModal(report)}
                    title="Editar"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    className="action-btn delete"
                    onClick={() => handleDeleteReport(report.id)}
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <FileText size={48} />
            <h3>Nenhum relatório encontrado</h3>
            <p>
              {searchTerm || filterType !== 'all' 
                ? 'Tente ajustar os filtros de busca'
                : 'Comece criando seu primeiro relatório'
              }
            </p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={18} />
              Criar Relatório
            </button>
          </div>
        )}
      </div>

      {/* Modal de Criar/Editar Relatório */}
      {(showCreateModal || editingReport) && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingReport ? 'Editar Relatório' : 'Novo Relatório'}</h2>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            
            <form onSubmit={editingReport ? handleUpdateReport : handleCreateReport}>
              <div className="form-group">
                <label htmlFor="title" className="form-label">Título *</label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="form-input"
                  placeholder="Digite o título do relatório"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="type" className="form-label">Tipo</label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="form-input"
                >
                  {reportTypes.slice(1).map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="description" className="form-label">Descrição</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="form-input"
                  rows="4"
                  placeholder="Digite uma descrição opcional"
                />
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingReport ? 'Atualizar' : 'Criar'} Relatório
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;

