import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { testMenuAPI } from '../services/api';
import './TestMenu.css';

const TestMenu = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [me, setMe] = useState(null);
  const [extensions, setExtensions] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ramalResp, meResp, extResp] = await Promise.all([
          testMenuAPI.getRamal(),
          testMenuAPI.getMe(),
          testMenuAPI.getExtensions(),
        ]);
        setData(ramalResp.data);
        setMe(meResp.data);
        setExtensions(extResp.data);
      } catch (err) {
        setError(err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Garantir página válida ao mudar filtros
  useEffect(() => {
    const filtered = getFilteredRows(extensions?.items || [], searchTerm);
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    if (page > totalPages) setPage(totalPages);
  }, [extensions, pageSize, searchTerm]);

  const getFilteredRows = (items, term) => {
    const t = term.trim().toLowerCase();
    if (!t) return items;
    return items.filter(ext => {
      const extensionNumber = (ext?.extensionNumber || ext?.number || ext?.extension || ext?.ext || '').toString();
      const name = (ext?.name || ext?.displayName || ext?.label || '') + '';
      const type = (ext?.type || ext?.extensionType || '') + '';
      const status = (ext?.status || '') + '';
      const userName = (ext?.user?.name || ext?.user?.displayName || ext?.assignedTo?.name || ext?.owner?.name || ext?.userName || ext?.userEmail || '') + '';
      const hay = [extensionNumber, name, type, status, userName].join(' ').toLowerCase();
      return hay.includes(t);
    });
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">Carregando dados do ramal...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-body">
          <div style={{ color: '#dc3545' }}>Erro ao carregar: {typeof error === 'string' ? error : JSON.stringify(error)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-body">
        <div className="testmenu-header">
          <div>
            <h2 className="testmenu-title">Extensões</h2>
            <p className="testmenu-subtitle">Relatório consolidado de extensões (GoTo Voice Admin)</p>
          </div>
          {extensions?.summary && (
            <div className="text-muted">
              Total: <strong>{extensions.summary.totalFetched}</strong>
            </div>
          )}
        </div>

        <div className="testmenu-filters">
          <div className="search-container">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Pesquisar extensões..."
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
                <th>Extensão</th>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Status</th>
                <th>Usuário</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const items = getFilteredRows(extensions?.items || [], searchTerm);
                const total = items.length;
                const start = (page - 1) * pageSize;
                const end = Math.min(start + pageSize, total);
                return items.slice(start, end);
              })().map((ext, idx) => {
                const extensionNumber = ext?.extensionNumber || ext?.number || ext?.extension || ext?.ext || '-';
                const name = ext?.name || ext?.displayName || ext?.label || '-';
                const type = ext?.type || ext?.extensionType || '-';
                const status = ext?.status || '-';
                const userName =
                  ext?.user?.name ||
                  ext?.user?.displayName ||
                  ext?.assignedTo?.name ||
                  ext?.owner?.name ||
                  ext?.userName ||
                  ext?.userEmail ||
                  '-';
                return (
                  <tr key={ext?.id || `${extensionNumber}-${idx}`}>
                    <td>{extensionNumber}</td>
                    <td>{name}</td>
                    <td>{type}</td>
                    <td>{status}</td>
                    <td>{userName}</td>
                  </tr>
                );
              })}
              {(() => {
                const items = getFilteredRows(extensions?.items || [], searchTerm);
                if (!items || items.length === 0) {
                  return (
                    <tr>
                      <td colSpan={5} className="text-muted" style={{ padding: '16px', textAlign: 'center' }}>Nenhuma extensão encontrada</td>
                    </tr>
                  );
                }
                return null;
              })()}
            </tbody>
          </table>
        </div>

        {(() => {
          const items = getFilteredRows(extensions?.items || [], searchTerm);
          const total = items.length;
          const totalPages = Math.max(1, Math.ceil(total / pageSize));
          const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
          const end = Math.min(page * pageSize, total);
          const pages = Array.from({ length: totalPages }, (_, i) => i + 1).slice(
            Math.max(0, page - 3),
            Math.max(0, page - 3) + 5
          );
          return (
            <div className="testmenu-pagination">
              <div className="dataTable-info">Mostrando {start} a {end} de {total} entradas</div>
              <div className="pagination-controls">
                <button className="btn btn-secondary" disabled={page === 1} onClick={() => setPage(1)}>«</button>
                <button className="btn btn-secondary" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>‹</button>
                {pages.map(p => (
                  <button key={p} className={`btn ${p === page ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPage(p)}>
                    {p}
                  </button>
                ))}
                <button className="btn btn-secondary" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>›</button>
                <button className="btn btn-secondary" disabled={page === totalPages} onClick={() => setPage(totalPages)}>»</button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default TestMenu;


