import React, { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { testMenuAPI } from '../services/api';
import './TestMenu.css';

const CallQueues = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accountKey, setAccountKey] = useState('');
  const [queues, setQueues] = useState([]);
  const [usersByQueue, setUsersByQueue] = useState({});
  const [detailsByQueue, setDetailsByQueue] = useState({});
  const [liveByQueue, setLiveByQueue] = useState({});

  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await testMenuAPI.getCallQueues(accountKey || undefined);
        if (resp.data?.items) {
          setQueues(resp.data.items);
        } else {
          setQueues(resp.data || []);
        }
      } catch (err) {
        setError(err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [accountKey]);

  useEffect(() => {
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (page > totalPages) setPage(totalPages);
  }, [queues, pageSize, searchTerm]);

  const filtered = useMemo(() => {
    const t = searchTerm.trim().toLowerCase();
    if (!t) return queues;
    return queues.filter((q) => {
      const id = (q?.id || q?.callQueueId || '').toString();
      const name = (q?.name || q?.displayName || '').toString();
      const ext = (q?.extension || q?.extensionNumber || '').toString();
      const status = (q?.status || '').toString();
      const desc = (q?.description || '').toString();
      return [id, name, ext, status, desc].join(' ').toLowerCase().includes(t);
    });
  }, [queues, searchTerm]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const pageItems = filtered.slice(start - 1, end);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).slice(
    Math.max(0, page - 3),
    Math.max(0, page - 3) + 5
  );

  const loadUsers = async (queueId) => {
    try {
      const resp = await testMenuAPI.getCallQueueUsers(queueId, accountKey || undefined);
      const items = resp.data?.items || resp.data || [];
      setUsersByQueue((prev) => ({ ...prev, [queueId]: items }));
    } catch (err) {
      setUsersByQueue((prev) => ({ ...prev, [queueId]: { error: err.response?.data || err.message } }));
    }
  };

  const loadDetails = async (queueId) => {
    try {
      const resp = await testMenuAPI.getCallQueueDetail(queueId, accountKey || undefined);
      setDetailsByQueue((prev) => ({ ...prev, [queueId]: resp.data }));
    } catch (err) {
      setDetailsByQueue((prev) => ({ ...prev, [queueId]: { error: err.response?.data || err.message } }));
    }
  };

  const loadLive = async (queueId) => {
    try {
      const resp = await testMenuAPI.getCallQueueLive(queueId, accountKey || undefined);
      setLiveByQueue((prev) => ({ ...prev, [queueId]: resp.data }));
    } catch (err) {
      setLiveByQueue((prev) => ({ ...prev, [queueId]: { error: err.response?.data || err.message } }));
    }
  };

  return (
    <div className="card">
      <div className="card-body">
        <div className="testmenu-header">
          <div>
            <h2 className="testmenu-title">Call Queues</h2>
            <p className="testmenu-subtitle">Visão geral e detalhes por fila</p>
          </div>
          <div className="d-flex gap-2">
            <input
              type="text"
              placeholder="AccountKey (opcional)"
              value={accountKey}
              onChange={(e) => setAccountKey(e.target.value)}
              className="search-input"
              style={{ width: 280 }}
            />
          </div>
        </div>

        <div className="testmenu-filters">
          <div className="search-container">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Pesquisar filas..."
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
                <th>Nome</th>
                <th>Extensão</th>
                <th>Status</th>
                <th>Usuários</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((q) => {
                const id = q?.id || q?.callQueueId || '-';
                const name = q?.name || q?.displayName || '-';
                const ext = q?.extension || q?.extensionNumber || '-';
                const status = q?.status || '-';
                const users = usersByQueue[id];
                return (
                  <tr key={id}>
                    <td>{id}</td>
                    <td>{name}</td>
                    <td>{ext}</td>
                    <td>{status}</td>
                    <td>
                      {Array.isArray(users)
                        ? `${users.length} usuário(s)`
                        : users?.error
                          ? 'Erro ao carregar'
                          : '-'}
                    </td>
                    <td className="d-flex gap-2">
                      <button className="btn btn-secondary" onClick={() => loadUsers(id)}>Usuários</button>
                      <button className="btn btn-secondary" onClick={() => loadDetails(id)}>Detalhes</button>
                      <button className="btn btn-secondary" onClick={() => loadLive(id)}>Ao vivo</button>
                    </td>
                  </tr>
                );
              })}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-muted" style={{ padding: '16px', textAlign: 'center' }}>Nenhuma fila encontrada</td>
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
              <button key={p} className={`btn ${p === page ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPage(p)}>
                {p}
              </button>
            ))}
            <button className="btn btn-secondary" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>›</button>
            <button className="btn btn-secondary" disabled={page === totalPages} onClick={() => setPage(totalPages)}>»</button>
          </div>
        </div>

        {/* Painel de detalhes (usuários por fila) */}
        {pageItems.map((q) => {
          const id = q?.id || q?.callQueueId || '-';
          const users = usersByQueue[id];
          if (!Array.isArray(users)) return null;
          return (
            <div key={`users-${id}`} className="card mt-4">
              <div className="card-body">
                <div className="testmenu-header">
                  <div>
                    <h3 className="testmenu-title" style={{ fontSize: 18 }}>Usuários da fila {id}</h3>
                    <p className="testmenu-subtitle">Total: {users.length}</p>
                  </div>
                </div>
                <div className="table-responsive">
                  <table className="rb-table">
                    <thead>
                      <tr>
                        <th>User Key</th>
                        <th>Nome</th>
                        <th>Extensão</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u, idx) => (
                        <tr key={u?.userKey || u?.id || idx}>
                          <td>{u?.userKey || u?.id || '-'}</td>
                          <td>{u?.name || u?.displayName || '-'}</td>
                          <td>{u?.extension || u?.extensionNumber || '-'}</td>
                          <td>{u?.status || '-'}</td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-muted" style={{ padding: '16px', textAlign: 'center' }}>Nenhum usuário vinculado</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })}

        {/* Painel de detalhes e status ao vivo */}
        {pageItems.map((q) => {
          const id = q?.id || q?.callQueueId || '-';
          const detail = detailsByQueue[id];
          const live = liveByQueue[id];
          if (!detail && !live) return null;
          return (
            <div key={`details-${id}`} className="card mt-4">
              <div className="card-body">
                <div className="testmenu-header">
                  <div>
                    <h3 className="testmenu-title" style={{ fontSize: 18 }}>Detalhes e Ao Vivo - Fila {id}</h3>
                  </div>
                </div>
                <div className="d-flex gap-4" style={{ flexWrap: 'wrap' }}>
                  {detail && (
                    <div className="card" style={{ flex: '1 1 320px' }}>
                      <div className="card-body">
                        <h4 className="testmenu-title" style={{ fontSize: 16, marginBottom: 8 }}>Detalhes</h4>
                        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>{JSON.stringify(detail, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                  {live && (
                    <div className="card" style={{ flex: '1 1 320px' }}>
                      <div className="card-body">
                        <h4 className="testmenu-title" style={{ fontSize: 16, marginBottom: 8 }}>Ao Vivo</h4>
                        {live?.summary && (
                          <div className="mb-4 text-muted">Itens: {live.summary.itemsCount || 0}</div>
                        )}
                        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>{JSON.stringify(live, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CallQueues;


