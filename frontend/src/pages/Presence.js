import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { testMenuAPI } from '../services/api';
import './TestMenu.css';

const Presence = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [presenceMe, setPresenceMe] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    const load = async () => {
      try {
        const [meResp, subsResp] = await Promise.all([
          testMenuAPI.getPresenceMe(),
          testMenuAPI.getPresenceSubscriptions(),
        ]);
        setPresenceMe(meResp.data);
        const subsArr = subsResp.data?.data || subsResp.data?.items || subsResp.data?.subscriptions || [];
        setSubscriptions(Array.isArray(subsArr) ? subsArr : []);
      } catch (err) {
        setError(err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const total = filtered().length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (page > totalPages) setPage(totalPages);
  }, [subscriptions, pageSize, searchTerm]);

  const filtered = () => {
    const t = searchTerm.trim().toLowerCase();
    if (!t) return subscriptions;
    return subscriptions.filter((s) => {
      const id = (s?.id || s?.subscriptionId || '').toString();
      const type = (s?.type || s?.subscriptionType || '').toString();
      const status = (s?.status || '').toString();
      const owner = (s?.owner || s?.createdBy || s?.user || '').toString();
      return [id, type, status, owner].join(' ').toLowerCase().includes(t);
    });
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">Carregando presença...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-body" style={{ color: '#dc3545' }}>
          {typeof error === 'string' ? error : JSON.stringify(error)}
        </div>
      </div>
    );
  }

  const items = filtered();
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const pageItems = items.slice(start - 1, end);

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).slice(
    Math.max(0, page - 3),
    Math.max(0, page - 3) + 5
  );

  return (
    <div className="card">
      <div className="card-body">
        <div className="testmenu-header">
          <div>
            <h2 className="testmenu-title">Presence</h2>
            <p className="testmenu-subtitle">Dados de user-presence e subscriptions</p>
          </div>
          <div className="text-muted">
            {presenceMe?.data?.presence?.activity && (
              <>
                Status: <strong>{presenceMe.data.presence.activity}</strong>
              </>
            )}
          </div>
        </div>

        <div className="testmenu-filters">
          <div className="search-container">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Pesquisar subscriptions..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="search-input"
            />
          </div>
          <select
            className="filter-select"
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
          >
            {[10, 25, 50, 100].map(size => (
              <option key={size} value={size}>{size} por página</option>
            ))}
          </select>
        </div>

        <div className="table-responsive">
          <table className="rb-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tipo</th>
                <th>Status</th>
                <th>Dono</th>
                <th>Criado em</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((s, idx) => (
                <tr key={s?.id || s?.subscriptionId || idx}>
                  <td>{s?.id || s?.subscriptionId || '-'}</td>
                  <td>{s?.type || s?.subscriptionType || '-'}</td>
                  <td>{s?.status || '-'}</td>
                  <td>{s?.owner || s?.createdBy || s?.user || '-'}</td>
                  <td>{s?.createdAt ? new Date(s.createdAt).toLocaleString('pt-BR') : '-'}</td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-muted" style={{ padding: '16px', textAlign: 'center' }}>Nenhuma subscription encontrada</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="testmenu-pagination">
          <div className="dataTable-info">Mostrando {start} a {end} de {total} entradas</div>
          <div className="pagination-controls">
            <button className="btn btn-secondary" disabled={page === 1} onClick={() => setPage(1)}>«</button>
            <button className="btn btn-secondary" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>‹</button>
            {pages.map(p => (
              <button
                key={p}
                className={`btn ${p === page ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
            <button className="btn btn-secondary" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>›</button>
            <button className="btn btn-secondary" disabled={page === totalPages} onClick={() => setPage(totalPages)}>»</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Presence;


