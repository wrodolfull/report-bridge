const express = require('express');
const axios = require('axios');
const { supabase } = require('../config/supabase');

const { authenticateToken } = require('../middleware/auth');
// Reutiliza o helper que garante token válido (com refresh automático)
const authRouter = require('./auth');

const router = express.Router();

// GET /api/testmenu/ramal
// Retorna dados de linhas/ramais do usuário autenticado na GoTo
router.get('/ramal', authenticateToken, async (req, res) => {
  try {
    if (!authRouter.getValidGotoToken) {
      return res.status(500).json({
        success: false,
        error: 'Helper getValidGotoToken não disponível',
      });
    }

    const accessToken = await authRouter.getValidGotoToken(req.user.id);

    if (!accessToken) {
      return res.status(404).json({
        success: false,
        error: 'Token GoTo não encontrado ou inválido para este usuário',
      });
    }

    // Buscar principal salvo para este usuário
    const { data: tokenRow, error: principalError } = await supabase
      .from('goto_tokens')
      .select('principal')
      .eq('user_id', req.user.id)
      .single();

    if (principalError || !tokenRow?.principal) {
      return res.status(400).json({
        success: false,
        error: 'Principal não encontrado para este usuário. Conecte-se ao GoTo novamente.',
        details: principalError?.message || null,
      });
    }

    // Endpoint para listar linhas/ramais do usuário específico
    // Requer escopo users.v1.lines.read
    const url = `https://api.goto.com/users/v1/users/${encodeURIComponent(tokenRow.principal)}/lines`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    return res.json({
      success: true,
      provider: 'goto',
      resource: 'users.me.lines',
      data: response.data,
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data || error.message;
    console.error('Erro ao consultar linhas GoTo:', message);
    return res.status(status).json({
      success: false,
      error: 'Erro ao buscar dados do ramal na GoTo',
      details: typeof message === 'string' ? message : (message?.error || message),
    });
  }
});

// GET /api/testmenu/call-queues/:id/detail
router.get('/call-queues/:id/detail', authenticateToken, async (req, res) => {
  try {
    if (!authRouter.getValidGotoToken) {
      return res.status(500).json({ success: false, error: 'Helper getValidGotoToken não disponível' });
    }
    const accessToken = await authRouter.getValidGotoToken(req.user.id);
    if (!accessToken) {
      return res.status(404).json({ success: false, error: 'Token GoTo não encontrado ou inválido' });
    }
    const accountKey = req.query.accountKey;
    const headers = { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' };

    const attempts = [];
    const tries = [
      accountKey ? { name: 'accounts', url: `https://api.goto.com/voice-admin/v1/accounts/${encodeURIComponent(accountKey)}/call-queues/${encodeURIComponent(req.params.id)}` } : null,
      { name: 'root', url: `https://api.goto.com/voice-admin/v1/call-queues/${encodeURIComponent(req.params.id)}` },
    ].filter(Boolean);

    for (const t of tries) {
      try {
        const r = await axios.get(t.url, { headers });
        return res.json({ success: true, endpointUsed: t.name, data: r.data });
      } catch (e) {
        attempts.push({ endpoint: t.name, status: e.response?.status, data: e.response?.data });
      }
    }

    return res.status(404).json({ success: false, error: 'Detalhe da call-queue não encontrado', attempts, accountKey: accountKey || null });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data || error.message;
    console.error('Erro ao consultar call-queue detail:', message);
    return res.status(status).json({ success: false, error: 'Erro ao buscar detalhe da call-queue', details: message });
  }
});

// GET /api/testmenu/call-queues/:id/live
router.get('/call-queues/:id/live', authenticateToken, async (req, res) => {
  try {
    if (!authRouter.getValidGotoToken) {
      return res.status(500).json({ success: false, error: 'Helper getValidGotoToken não disponível' });
    }
    const accessToken = await authRouter.getValidGotoToken(req.user.id);
    if (!accessToken) {
      return res.status(404).json({ success: false, error: 'Token GoTo não encontrado ou inválido' });
    }
    const accountKey = req.query.accountKey;
    const headers = { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' };

    const attempts = [];
    // Tentar endpoints comuns de status/metrics
    const candidates = [
      accountKey ? { name: 'accounts-calls', url: `https://api.goto.com/voice-admin/v1/accounts/${encodeURIComponent(accountKey)}/call-queues/${encodeURIComponent(req.params.id)}/calls` } : null,
      accountKey ? { name: 'accounts-status', url: `https://api.goto.com/voice-admin/v1/accounts/${encodeURIComponent(accountKey)}/call-queues/${encodeURIComponent(req.params.id)}/status` } : null,
      accountKey ? { name: 'accounts-metrics', url: `https://api.goto.com/voice-admin/v1/accounts/${encodeURIComponent(accountKey)}/call-queues/${encodeURIComponent(req.params.id)}/metrics` } : null,
      { name: 'root-calls', url: `https://api.goto.com/voice-admin/v1/call-queues/${encodeURIComponent(req.params.id)}/calls` },
      { name: 'root-status', url: `https://api.goto.com/voice-admin/v1/call-queues/${encodeURIComponent(req.params.id)}/status` },
      { name: 'root-metrics', url: `https://api.goto.com/voice-admin/v1/call-queues/${encodeURIComponent(req.params.id)}/metrics` },
      // Fallback tentativa com call-events (pode não suportar filtro)
      accountKey ? { name: 'call-events', url: `https://api.goto.com/call-events/v1/events?accountKey=${encodeURIComponent(accountKey)}&limit=100` } : null,
    ].filter(Boolean);

    for (const c of candidates) {
      try {
        const r = await axios.get(c.url, { headers });
        // Tentar sintetizar métricas básicas se possível
        const body = r.data || {};
        let summary = null;
        if (Array.isArray(body.items)) {
          summary = { itemsCount: body.items.length };
        } else if (Array.isArray(body.data)) {
          summary = { itemsCount: body.data.length };
        }
        return res.json({ success: true, endpointUsed: c.name, raw: body, summary });
      } catch (e) {
        attempts.push({ endpoint: c.name, status: e.response?.status, data: e.response?.data });
      }
    }

    return res.json({
      success: true,
      note: 'Nenhum endpoint de métricas em tempo real disponível para este tenant/conta. Considere usar notificações de call-events.',
      attempts,
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data || error.message;
    console.error('Erro ao consultar call-queue live:', message);
    return res.status(status).json({ success: false, error: 'Erro ao buscar status ao vivo da call-queue', details: message });
  }
});
// ===== CALL QUEUES =====
// GET /api/testmenu/call-queues
router.get('/call-queues', authenticateToken, async (req, res) => {
  try {
    if (!authRouter.getValidGotoToken) {
      return res.status(500).json({ success: false, error: 'Helper getValidGotoToken não disponível' });
    }

    const accessToken = await authRouter.getValidGotoToken(req.user.id);
    if (!accessToken) {
      return res.status(404).json({ success: false, error: 'Token GoTo não encontrado ou inválido' });
    }

    // accountKey via query ou resolved
    const resolveAccountKey = async () => {
      try {
        const meResp = await axios.get('https://api.getgo.com/admin/rest/v1/me', {
          headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
        });
        const me = meResp.data || {};
        const direct = me.accountKey || me.accountId || me.account_id;
        if (direct) return String(direct);
      } catch (_) {}
      try {
        const accountsResp = await axios.get('https://api.goto.com/voice-admin/v1/accounts', {
          headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
          params: { limit: 50, offset: 0 },
        });
        const body = accountsResp.data || {};
        const accounts = body.items || body.data || body.accounts || [];
        if (Array.isArray(accounts) && accounts.length > 0) {
          const key = accounts[0]?.accountKey || accounts[0]?.key || accounts[0]?.id || accounts[0]?.accountId;
          if (key) return String(key);
        }
      } catch (_) {}
      return null;
    };

    const accountKey = req.query.accountKey || (await resolveAccountKey());
    if (!accountKey) {
      return res.status(400).json({ success: false, error: 'Não foi possível resolver accountKey' });
    }

    const headers = { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' };

    const tryEndpoints = async () => {
      const attempts = [];
      const candidates = [
        { name: 'accounts', url: `https://api.goto.com/voice-admin/v1/accounts/${encodeURIComponent(accountKey)}/call-queues`, useParams: false },
        { name: 'query', url: 'https://api.goto.com/voice-admin/v1/call-queues', useParams: true },
        { name: 'organizations', url: `https://api.goto.com/voice-admin/v1/organizations/${encodeURIComponent(accountKey)}/call-queues`, useParams: false },
      ];

      for (const c of candidates) {
        try {
          const all = [];
          const limit = 200;
          let offset = 0;
          let iterations = 0;
          const maxIterations = 100;
          while (iterations < maxIterations) {
            iterations += 1;
            const r = await axios.get(c.url, { headers, params: c.useParams ? { accountKey, limit, offset } : { limit, offset } });
            const body = r.data || {};
            const pageItems = body.items || body.data || body.callQueues || body.results || [];
            if (!Array.isArray(pageItems) || pageItems.length === 0) break;
            all.push(...pageItems);
            if (pageItems.length < limit) break;
            offset += pageItems.length;
          }
          return { ok: true, endpointUsed: c.name, url: c.url, items: all, pagesFetched: iterations };
        } catch (e) {
          attempts.push({ endpoint: c.name, status: e.response?.status, data: e.response?.data });
        }
      }
      return { ok: false, attempts };
    };

    const result = await tryEndpoints();
    if (!result.ok) {
      return res.status(404).json({
        success: false,
        error: 'Não foi possível localizar o recurso de call-queues neste ambiente/conta',
        attempts: result.attempts,
        accountKey,
      });
    }

    return res.json({
      success: true,
      provider: 'goto',
      resource: 'voice-admin.v1.call-queues',
      endpointUsed: result.endpointUsed,
      accountKey,
      items: result.items,
      summary: { totalFetched: result.items.length, pagesFetched: result.pagesFetched },
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data || error.message;
    console.error('Erro ao consultar call-queues:', message);
    return res.status(status).json({ success: false, error: 'Erro ao buscar call-queues', details: message });
  }
});

// GET /api/testmenu/call-queues/:id/users
router.get('/call-queues/:id/users', authenticateToken, async (req, res) => {
  try {
    if (!authRouter.getValidGotoToken) {
      return res.status(500).json({ success: false, error: 'Helper getValidGotoToken não disponível' });
    }
    const accessToken = await authRouter.getValidGotoToken(req.user.id);
    if (!accessToken) {
      return res.status(404).json({ success: false, error: 'Token GoTo não encontrado ou inválido' });
    }
    const accountKey = req.query.accountKey;
    const headers = { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' };
    const url = accountKey
      ? `https://api.goto.com/voice-admin/v1/accounts/${encodeURIComponent(accountKey)}/call-queues/${encodeURIComponent(req.params.id)}/users`
      : `https://api.goto.com/voice-admin/v1/call-queues/${encodeURIComponent(req.params.id)}/users`;
    const r = await axios.get(url, { headers });
    const items = r.data?.items || r.data?.data || r.data || [];
    return res.json({ success: true, items });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data || error.message;
    console.error('Erro ao consultar call-queue users:', message);
    return res.status(status).json({ success: false, error: 'Erro ao buscar usuários da call-queue', details: message });
  }
});

// GET /api/testmenu/call-queues/:id/users/:userKey
router.get('/call-queues/:id/users/:userKey', authenticateToken, async (req, res) => {
  try {
    if (!authRouter.getValidGotoToken) {
      return res.status(500).json({ success: false, error: 'Helper getValidGotoToken não disponível' });
    }
    const accessToken = await authRouter.getValidGotoToken(req.user.id);
    if (!accessToken) {
      return res.status(404).json({ success: false, error: 'Token GoTo não encontrado ou inválido' });
    }
    const accountKey = req.query.accountKey;
    const headers = { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' };
    const url = accountKey
      ? `https://api.goto.com/voice-admin/v1/accounts/${encodeURIComponent(accountKey)}/call-queues/${encodeURIComponent(req.params.id)}/users/${encodeURIComponent(req.params.userKey)}`
      : `https://api.goto.com/voice-admin/v1/call-queues/${encodeURIComponent(req.params.id)}/users/${encodeURIComponent(req.params.userKey)}`;
    const r = await axios.get(url, { headers });
    return res.json({ success: true, data: r.data });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data || error.message;
    console.error('Erro ao consultar call-queue user detail:', message);
    return res.status(status).json({ success: false, error: 'Erro ao buscar usuário específico da call-queue', details: message });
  }
});
module.exports = router;

// GET /api/testmenu/me
// Retorna os dados do usuário (perfil) a partir do endpoint admin da GoTo
router.get('/me', authenticateToken, async (req, res) => {
  try {
    if (!authRouter.getValidGotoToken) {
      return res.status(500).json({
        success: false,
        error: 'Helper getValidGotoToken não disponível',
      });
    }

    const accessToken = await authRouter.getValidGotoToken(req.user.id);

    if (!accessToken) {
      return res.status(404).json({
        success: false,
        error: 'Token GoTo não encontrado ou inválido para este usuário',
      });
    }

    const url = 'https://api.getgo.com/admin/rest/v1/me';
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    return res.json({
      success: true,
      provider: 'goto',
      resource: 'admin.rest.v1.me',
      data: response.data,
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data || error.message;
    console.error('Erro ao consultar admin/rest/v1/me GoTo:', message);
    return res.status(status).json({
      success: false,
      error: 'Erro ao buscar dados do usuário na GoTo',
      details: typeof message === 'string' ? message : (message?.error || message),
    });
  }
});

// GET /api/testmenu/presence/me
// Retorna o status de presença do usuário atual (principal)
router.get('/presence/me', authenticateToken, async (req, res) => {
  try {
    if (!authRouter.getValidGotoToken) {
      return res.status(500).json({ success: false, error: 'Helper getValidGotoToken não disponível' });
    }

    const accessToken = await authRouter.getValidGotoToken(req.user.id);
    if (!accessToken) {
      return res.status(404).json({ success: false, error: 'Token GoTo não encontrado ou inválido' });
    }

    // Descobrir principal do usuário
    const { data: tokenRow, error: principalError } = await supabase
      .from('goto_tokens')
      .select('principal')
      .eq('user_id', req.user.id)
      .single();

    if (principalError || !tokenRow?.principal) {
      return res.status(400).json({
        success: false,
        error: 'Principal não encontrado para este usuário. Conecte-se ao GoTo novamente.',
        details: principalError?.message || null,
      });
    }

    // Tentativa de chamada do endpoint de presença do usuário
    const url = 'https://api.goto.com/presence/v1/user-presence';
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
      params: {
        principal: tokenRow.principal,
      },
    });

    return res.json({
      success: true,
      provider: 'goto',
      resource: 'presence.v1.user-presence',
      data: response.data,
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data || error.message;
    console.error('Erro ao consultar presence user-presence:', message);
    return res.status(status).json({
      success: false,
      error: 'Erro ao buscar presença do usuário na GoTo',
      details: typeof message === 'string' ? message : (message?.error || message),
    });
  }
});

// GET /api/testmenu/presence/subscriptions
// Lista subscriptions de presence (pode requerer accountKey)
router.get('/presence/subscriptions', authenticateToken, async (req, res) => {
  try {
    if (!authRouter.getValidGotoToken) {
      return res.status(500).json({ success: false, error: 'Helper getValidGotoToken não disponível' });
    }

    const accessToken = await authRouter.getValidGotoToken(req.user.id);
    if (!accessToken) {
      return res.status(404).json({ success: false, error: 'Token GoTo não encontrado ou inválido' });
    }

    // Resolver accountKey (reutiliza lógica de accounts)
    const resolveAccountKey = async () => {
      try {
        const meResp = await axios.get('https://api.getgo.com/admin/rest/v1/me', {
          headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
        });
        const me = meResp.data || {};
        const directAccountKey = me.accountKey || me.accountId || me.account_id;
        if (directAccountKey) return String(directAccountKey);
        const accountsFromMe = me.accounts || me.organizations || me.orgs || [];
        if (Array.isArray(accountsFromMe) && accountsFromMe.length > 0) {
          const first = accountsFromMe[0];
          const key = first?.accountKey || first?.accountId || first?.key || first?.id;
          if (key) return String(key);
        }
      } catch (_) {}
      try {
        const accountsResp = await axios.get('https://api.goto.com/voice-admin/v1/accounts', {
          headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
          params: { limit: 50, offset: 0 },
        });
        const body = accountsResp.data || {};
        const accounts = body.items || body.data || body.accounts || [];
        if (Array.isArray(accounts) && accounts.length > 0) {
          const key = accounts[0]?.accountKey || accounts[0]?.key || accounts[0]?.id || accounts[0]?.accountId;
          if (key) return String(key);
        }
      } catch (_) {}
      return null;
    };

    const accountKey = await resolveAccountKey();
    // Alguns endpoints de subscriptions exigem accountKey no caminho
    const tryEndpoints = async () => {
      const headers = { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' };
      const errors = [];
      // 1) accounts path
      if (accountKey) {
        try {
          const url = `https://api.goto.com/presence/v1/accounts/${encodeURIComponent(accountKey)}/subscriptions`;
          const r = await axios.get(url, { headers });
          return { url, data: r.data };
        } catch (e) {
          errors.push({ endpoint: 'accounts', status: e.response?.status, data: e.response?.data });
        }
        // 2) organizations path (alguns ambientes usam organizations)
        try {
          const url = `https://api.goto.com/presence/v1/organizations/${encodeURIComponent(accountKey)}/subscriptions`;
          const r = await axios.get(url, { headers });
          return { url, data: r.data };
        } catch (e) {
          errors.push({ endpoint: 'organizations', status: e.response?.status, data: e.response?.data });
        }
      }
      // 3) raiz (pode retornar 405 dependendo do ambiente)
      try {
        const url = 'https://api.goto.com/presence/v1/subscriptions';
        const r = await axios.get(url, { headers });
        return { url, data: r.data };
      } catch (e) {
        errors.push({ endpoint: 'root', status: e.response?.status, data: e.response?.data });
      }
      return { error: true, errors };
    };

    const result = await tryEndpoints();
    if (result.error) {
      // Alguns ambientes não suportam listagem via GET; retornar resultado vazio com nota
      return res.json({
        success: true,
        provider: 'goto',
        resource: 'presence.v1.subscriptions',
        items: [],
        note: 'Listagem de subscriptions não suportada neste ambiente. Use criação/consulta direta de subscription.',
        attempts: result.errors,
        accountKey: accountKey || null,
      });
    }

    return res.json({
      success: true,
      provider: 'goto',
      resource: 'presence.v1.subscriptions',
      endpointUsed: result.url,
      data: result.data,
      accountKey: accountKey || null,
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data || error.message;
    console.error('Erro ao consultar presence subscriptions:', message);
    return res.status(status).json({
      success: false,
      error: 'Erro ao buscar subscriptions de presença na GoTo',
      details: typeof message === 'string' ? message : (message?.error || message),
    });
  }
});
// GET /api/testmenu/extensions
// Busca todas as extensões (com paginação) da GoTo Voice Admin e retorna um relatório consolidado
router.get('/extensions', authenticateToken, async (req, res) => {
  try {
    if (!authRouter.getValidGotoToken) {
      return res.status(500).json({
        success: false,
        error: 'Helper getValidGotoToken não disponível',
      });
    }

    const accessToken = await authRouter.getValidGotoToken(req.user.id);
    if (!accessToken) {
      return res.status(404).json({
        success: false,
        error: 'Token GoTo não encontrado ou inválido para este usuário',
      });
    }

    // Endpoint correto inclui accountKey no caminho
    const buildExtensionsUrl = (accountKey) => `https://api.goto.com/voice-admin/v1/accounts/${encodeURIComponent(accountKey)}/extensions`;

    // Resolve accountKey requerido pela API voice-admin
    const resolveAccountKey = async () => {
      try {
        // 1) Tentar via admin profile
        const meResp = await axios.get('https://api.getgo.com/admin/rest/v1/me', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
        });
        const me = meResp.data || {};
        const directAccountKey = me.accountKey || me.accountId || me.account_id;
        if (directAccountKey) return String(directAccountKey);

        // Alguns perfis retornam lista de contas
        const accountsFromMe = me.accounts || me.organizations || me.orgs || [];
        if (Array.isArray(accountsFromMe) && accountsFromMe.length > 0) {
          const first = accountsFromMe[0];
          const key = first?.accountKey || first?.accountId || first?.key || first?.id;
          if (key) return String(key);
        }
      } catch (_) {
        // Ignorar e tentar fallback
      }

      // 2) Fallback: listar contas via voice-admin
      try {
        const accountsResp = await axios.get('https://api.goto.com/voice-admin/v1/accounts', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
          params: { limit: 50, offset: 0 },
        });
        const body = accountsResp.data || {};
        const accounts = body.items || body.data || body.accounts || [];
        if (Array.isArray(accounts) && accounts.length > 0) {
          const key = accounts[0]?.accountKey || accounts[0]?.key || accounts[0]?.id || accounts[0]?.accountId;
          if (key) return String(key);
        }
      } catch (_) {
        // Deixar erro ser tratado abaixo
      }

      return null;
    };

    // Permitir override via query para debug: /extensions?accountKey=...
    const accountKey = req.query.accountKey || (await resolveAccountKey());
    if (!accountKey) {
      return res.status(400).json({
        success: false,
        error: 'Não foi possível resolver accountKey para a API Voice Admin',
      });
    }

    // Tentar múltiplas variações de endpoint
    const tryEndpoints = async () => {
      const headers = { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' };
      const attempts = [];
      const candidates = [
        { name: 'query', url: 'https://api.goto.com/voice-admin/v1/extensions', useParams: true },
        { name: 'accounts', url: buildExtensionsUrl(accountKey), useParams: false },
      ];

      for (const c of candidates) {
        try {
          const all = [];
          const limit = 200;
          let offset = 0;
          let iterations = 0;
          const maxIterations = 100;

          while (iterations < maxIterations) {
            iterations += 1;
            const response = await axios.get(c.url, {
              headers,
              params: c.useParams ? { accountKey, limit, offset } : { limit, offset },
            });
            const body = response.data || {};
            const pageItems = body.items || body.data || body.extensions || body.results || [];
            if (!Array.isArray(pageItems) || pageItems.length === 0) break;
            all.push(...pageItems);
            if (pageItems.length < limit) break;
            offset += pageItems.length;
          }

          return { ok: true, endpointUsed: c.name, url: c.url, items: all, iterations };
        } catch (e) {
          attempts.push({ endpoint: c.name, status: e.response?.status, data: e.response?.data });
        }
      }

      return { ok: false, attempts };
    };

    const result = await tryEndpoints();
    if (!result.ok) {
      return res.status(404).json({
        success: false,
        error: 'Não foi possível localizar o recurso de extensões neste ambiente/conta',
        attempts: result.attempts,
        accountKey,
      });
    }

    const summary = {
      totalFetched: result.items.length,
      pagesFetched: result.iterations,
    };

    return res.json({
      success: true,
      provider: 'goto',
      resource: 'voice-admin.v1.extensions',
      endpointUsed: result.endpointUsed,
      summary,
      items: result.items,
      accountKey,
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data || error.message;
    console.error('Erro ao consultar extensions (voice-admin):', message);
    return res.status(status).json({
      success: false,
      error: 'Erro ao buscar extensões na GoTo Voice Admin',
      details: typeof message === 'string' ? message : (message?.error || message),
    });
  }
});


