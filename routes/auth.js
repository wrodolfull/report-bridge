const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { supabase, supabaseAdmin } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Função para renovar tokens GoTo automaticamente
async function refreshGotoToken(userId, refreshToken) {
  try {
    const authHeader = `${GOTO_CONFIG.clientId}:${GOTO_CONFIG.clientSecret}`;
    const authHeader64Encoded = Buffer.from(authHeader, 'utf-8').toString('base64');

    const response = await fetch(GOTO_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authHeader64Encoded}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const tokenData = await response.json();
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));

    // Atualizar tokens no banco
    const { error } = await supabase
      .from('goto_tokens')
      .update({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || refreshToken, // Alguns providers não retornam novo refresh token
        expires_in: tokenData.expires_in,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Database update failed: ${error.message}`);
    }

    return tokenData;
  } catch (error) {
    console.error('Erro ao renovar token GoTo:', error);
    throw error;
  }
}

// Função para obter token válido do usuário (com refresh automático)
async function getValidGotoToken(userId) {
  try {
    const { data: tokenData, error } = await supabase
      .from('goto_tokens')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !tokenData) {
      return null;
    }

    const now = new Date();
    const tokenExpiresAt = new Date(tokenData.expires_at);
    const willExpireSoon = (tokenExpiresAt.getTime() - now.getTime()) < (5 * 60 * 1000); // 5 minutos

    if (willExpireSoon) {
      console.log('Token GoTo expirando em breve, renovando automaticamente...');
      const newTokenData = await refreshGotoToken(userId, tokenData.refresh_token);
      return newTokenData.access_token;
    }

    return tokenData.access_token;
  } catch (error) {
    console.error('Erro ao obter token GoTo válido:', error);
    return null;
  }
}

// Função para obter o principal (userKey) do usuário
async function getGotoPrincipal(userId) {
  try {
    const { data: tokenData, error } = await supabase
      .from('goto_tokens')
      .select('principal')
      .eq('user_id', userId)
      .single();

    if (error || !tokenData?.principal) {
      return null;
    }

    return tokenData.principal;
  } catch (error) {
    console.error('Erro ao obter principal GoTo:', error);
    return null;
  }
}

// Configuração GoTo OAuth
const GOTO_CONFIG = {
  clientId: process.env.GOTO_CLIENT_ID,
  clientSecret: process.env.GOTO_CLIENT_SECRET,
  redirectUri: process.env.GOTO_REDIRECT_URI || 'http://localhost:3001/api/auth/goto/callback',
  authUrl: 'https://authentication.logmeininc.com/oauth/authorize',
  tokenUrl: 'https://authentication.logmeininc.com/oauth/token',
    scope: [
    'openid',
    'profile',
    'identify:scim.me',
    'identify:scim.org',
    'voice-admin.v1.write',
    'voicemail.v1.voicemails.write',
    'call-history.v1.notifications.manage',
    'call-control.v1.calls.control',
    'voice-admin.v1.read',
    'fax.v1.notifications.manage',
    'call-events.v1.events.read',
    'messaging.v1.read',
    'webrtc.v1.write',
    'voicemail.v1.voicemails.read',
    'contacts.v1.write',
    'presence.v1.notifications.manage',
    'messaging.v1.write',
    'recording.v1.notifications.manage',
    'calls.v2.initiate',
    'voicemail.v1.notifications.manage',
    'messaging.v1.send',
    'fax.v1.read',
    'messaging.v1.notifications.manage',
    'presence.v1.write',
    'webrtc.v1.read',
    'contacts.v1.read',
    'fax.v1.write',
    'recording.v1.read',
    'call-events.v1.notifications.manage',
    'presence.v1.read',
    'cr.v1.read',
    'users.v1.lines.read',
    'users.v1.read'
  ].join(' ')
};

// Login via GoTo/Email
router.post('/login', async (req, res) => {
  try {
    const { email, password, provider } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Autenticação via Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Erro no login:', error);
      
      // Tratar erro específico de email não confirmado
      if (error.message === 'Email not confirmed') {
        return res.status(401).json({ 
          error: 'Email não confirmado. Verifique sua caixa de entrada e confirme seu email antes de fazer login.' 
        });
      }
      
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Gerar token JWT personalizado
    const token = jwt.sign(
      { 
        userId: data.user.id, 
        email: data.user.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || data.user.email
      }
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Registro de usuário
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0]
        }
      }
    });

    if (error) {
      console.error('Erro no registro:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({
      success: true,
      message: 'Usuário criado com sucesso! Verifique seu email.',
      user: {
        id: data.user?.id,
        email: data.user?.email
      }
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Erro no logout:', error);
    }

    res.json({ success: true, message: 'Logout realizado com sucesso' });
  } catch (error) {
    console.error('Erro no logout:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Verificar token
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.email.split('@')[0] // Usar email como nome por enquanto
    }
  });
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token requerido' });
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token
    });

    if (error) {
      return res.status(401).json({ error: 'Refresh token inválido' });
    }

    res.json({
      success: true,
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token
    });

  } catch (error) {
    console.error('Erro no refresh:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GoTo Connection Status (mock removido; implementação real está mais abaixo)

// GoTo Connect (mock removido; implementação real do OAuth está mais abaixo)

// Rota duplicada removida - implementação principal está mais abaixo

// ===== GOTO OAUTH ROUTES =====

// Iniciar fluxo OAuth do GoTo
router.get('/goto/oauth', authenticateToken, async (req, res) => {
  try {
    if (!GOTO_CONFIG.clientId) {
      return res.status(400).json({ 
        error: 'Configuração OAuth do GoTo não encontrada' 
      });
    }

    // Gerar state e salvar no banco de dados
    const stateKey = Math.random().toString(36).substring(2, 15);
    const stateExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos
    
    console.log('🔗 /oauth - Tentando salvar state no banco:', {
      state_key: stateKey,
      user_id: req.user.id,
      provider: 'goto',
      expires_at: stateExpiresAt.toISOString()
    });

    // Salvar state na tabela oauth_states usando client administrativo (bypass RLS)
    const { data: insertedState, error: stateError } = await supabaseAdmin
      .from('oauth_states')
      .insert({
        state_key: stateKey,
        user_id: req.user.id,
        provider: 'goto',
        expires_at: stateExpiresAt.toISOString()
      })
      .select()
      .single();

    if (stateError) {
      console.error('❌ /oauth - ERRO ao salvar state (admin):', stateError);
      return res.status(500).json({
        success: false,
        error: 'Erro ao salvar state OAuth',
        details: stateError.message
      });
    }

    console.log('✅ /oauth - State salvo com sucesso:', insertedState);
    
    // Construir URL de autorização
    const authUrl = new URL(GOTO_CONFIG.authUrl);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', GOTO_CONFIG.clientId);
    authUrl.searchParams.set('redirect_uri', GOTO_CONFIG.redirectUri);
    authUrl.searchParams.set('state', stateKey);

    console.log('🔗 /oauth - URL gerada com state:', stateKey);

    res.json({
      success: true,
      authUrl: authUrl.toString(),
      message: 'URL de autorização GoTo gerada'
    });

  } catch (error) {
    console.error('💥 Erro ao gerar URL OAuth GoTo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Callback OAuth do GoTo
router.get('/goto/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      console.error('Erro no callback OAuth:', error);
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=oauth_failed`);
    }

    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=no_code`);
    }

    // Extrair user_id do state usando o banco de dados
    console.log('State recebido do GoTo:', state);
    
    if (!state) {
      console.error('State não fornecido pelo GoTo');
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=no_state`);
    }

    // Buscar o state no banco de dados
    const { data: stateData, error: stateError } = await supabaseAdmin
      .from('oauth_states')
      .select('user_id, expires_at')
      .eq('state_key', state)
      .eq('provider', 'goto')
      .single();

    if (stateError || !stateData) {
      console.error('State não encontrado no banco:', state, stateError);
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=invalid_state`);
    }

    // Verificar se o state não expirou
    const now = new Date();
    const stateExpiresAt = new Date(stateData.expires_at);
    if (now > stateExpiresAt) {
      console.error('State expirado:', state);
      // Limpar state expirado
      await supabaseAdmin.from('oauth_states').delete().eq('state_key', state);
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=state_expired`);
    }

    const userId = stateData.user_id;
    console.log('User ID encontrado para state:', userId);

    // Limpar o state usado para evitar reutilização
    await supabaseAdmin.from('oauth_states').delete().eq('state_key', state);

    // Trocar código por token de acesso
    const authHeader = `${GOTO_CONFIG.clientId}:${GOTO_CONFIG.clientSecret}`;
    const authHeader64Encoded = Buffer.from(authHeader, 'utf-8').toString('base64');

    const tokenResponse = await fetch(GOTO_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authHeader64Encoded}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: GOTO_CONFIG.redirectUri
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Erro ao trocar código por token:', errorData);
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();

    console.log('Tokens GoTo recebidos:', {
      access_token: tokenData.access_token ? '***presente***' : 'undefined',
      refresh_token: tokenData.refresh_token ? '***presente***' : 'undefined',
      expires_in: tokenData.expires_in,
      scope: tokenData.scope,
      principal: tokenData.principal
    });

    // Calcular data de expiração
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));

    // Salvar ou atualizar tokens no banco
    const { data: savedToken, error: dbError } = await supabase
      .from('goto_tokens')
      .upsert({
        user_id: userId,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_type: tokenData.token_type || 'Bearer',
        expires_in: tokenData.expires_in,
        expires_at: expiresAt.toISOString(),
        scope: tokenData.scope,
        principal: tokenData.principal,
        loa: tokenData.loa
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Erro ao salvar tokens GoTo no banco:', dbError);
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=token_save_failed`);
    }

    console.log('Tokens GoTo salvos no banco com sucesso para user:', userId);

    res.redirect(`${process.env.FRONTEND_URL}/dashboard?success=goto_connected`);

  } catch (error) {
    console.error('Erro no callback OAuth GoTo:', error);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=callback_failed`);
  }
});

// Verificar status da conexão GoTo
router.get('/goto/status', authenticateToken, async (req, res) => {
  try {
    const isConfigured = !!(GOTO_CONFIG.clientId && GOTO_CONFIG.clientSecret);
    
    if (!isConfigured) {
      return res.json({
        success: true,
        connected: false,
        configured: false,
        lastCheck: new Date().toISOString(),
        message: 'GoTo não configurado'
      });
    }

    // Verificar se o usuário tem tokens salvos
    const { data: tokenData, error } = await supabase
      .from('goto_tokens')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (error || !tokenData) {
      return res.json({
        success: true,
        connected: false,
        configured: true,
        lastCheck: new Date().toISOString(),
        message: 'GoTo configurado mas não conectado'
      });
    }

    // Verificar se o token não expirou
    const now = new Date();
    const tokenExpiresAt = new Date(tokenData.expires_at);
    const isExpired = now >= tokenExpiresAt;

    res.json({
      success: true,
      connected: !isExpired,
      configured: true,
      lastCheck: new Date().toISOString(),
      tokenInfo: {
        principal: tokenData.principal,
        expiresAt: tokenData.expires_at,
        isExpired,
        scope: tokenData.scope
      },
      message: isExpired ? 'Token GoTo expirado' : 'GoTo conectado'
    });

  } catch (error) {
    console.error('Erro ao verificar status GoTo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Conectar com GoTo (inicia fluxo OAuth)
router.post('/goto/connect', authenticateToken, async (req, res) => {
  try {
    if (!GOTO_CONFIG.clientId || !GOTO_CONFIG.clientSecret) {
      return res.status(400).json({
        success: false,
        message: 'GoTo OAuth não configurado. Configure as variáveis de ambiente.',
        connected: false
      });
    }

    // Gerar state simples e salvar no banco de dados
    const stateKey = Math.random().toString(36).substring(2, 15);
    const stateExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos
    
    // Salvar state na tabela oauth_states
    console.log('Tentando salvar state no banco:', {
      state_key: stateKey,
      user_id: req.user.id,
      provider: 'goto',
      expires_at: stateExpiresAt.toISOString()
    });

    const { data: insertedState, error: stateError } = await supabaseAdmin
      .from('oauth_states')
      .insert({
        state_key: stateKey,
        user_id: req.user.id,
        provider: 'goto',
        expires_at: stateExpiresAt.toISOString()
      })
      .select()
      .single();

    if (stateError) {
      console.error('❌ ERRO ao salvar state OAuth:', stateError);
      return res.status(500).json({
        success: false,
        error: 'Erro ao gerar URL de autorização',
        details: stateError.message
      });
    }

    console.log('✅ State salvo com sucesso no banco:', insertedState);
    
    const authUrl = new URL(GOTO_CONFIG.authUrl);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', GOTO_CONFIG.clientId);
    authUrl.searchParams.set('redirect_uri', GOTO_CONFIG.redirectUri);
    authUrl.searchParams.set('state', stateKey);

    console.log('State gerado para OAuth:', stateKey, 'User ID:', req.user.id);

    res.json({
      success: true,
      authUrl: authUrl.toString(),
      message: 'URL de autorização GoTo gerada',
      connected: false
    });

  } catch (error) {
    console.error('Erro ao conectar com GoTo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Desconectar do GoTo
router.post('/goto/disconnect', authenticateToken, async (req, res) => {
  try {
    // Primeiro, buscar o token atual para tentar revogar
    const { data: tokenData, error: fetchError } = await supabase
      .from('goto_tokens')
      .select('access_token, refresh_token')
      .eq('user_id', req.user.id)
      .single();

    let revokeSuccess = false;
    
    // Tentar revogar o token na GoTo (se existir)
    if (tokenData && tokenData.access_token) {
      try {
        const revokeResponse = await axios.post(
          'https://authentication.logmeininc.com/oauth/revoke',
          new URLSearchParams({
            token: tokenData.access_token,
            client_id: GOTO_CONFIG.clientId,
            client_secret: GOTO_CONFIG.clientSecret
          }),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          }
        );
        
        revokeSuccess = true;
        console.log('Token GoTo revogado com sucesso na API');
      } catch (revokeError) {
        console.warn('Aviso: Não foi possível revogar o token na GoTo API:', revokeError.response?.data || revokeError.message);
        // Continuar mesmo se a revogação falhar - ainda vamos remover do banco
      }
    }

    // Remover tokens do banco de dados (sempre fazer isso)
    const { error: deleteError } = await supabase
      .from('goto_tokens')
      .delete()
      .eq('user_id', req.user.id);

    if (deleteError) {
      console.error('Erro ao remover tokens GoTo do banco:', deleteError);
      return res.status(500).json({ 
        success: false, 
        error: 'Erro ao desconectar do GoTo' 
      });
    }

    // Também limpar estados OAuth antigos para este usuário
    await supabase
      .from('oauth_states')
      .delete()
      .eq('user_id', req.user.id)
      .eq('provider', 'goto');

    console.log(`✅ Desconectado do GoTo para user ${req.user.id}. Token revogado: ${revokeSuccess}`);
    
    res.json({
      success: true,
      message: revokeSuccess 
        ? 'Desconectado do GoTo e tokens revogados com sucesso!' 
        : 'Desconectado do GoTo localmente (token pode ainda estar ativo)',
      connected: false,
      tokenRevoked: revokeSuccess
    });
  } catch (error) {
    console.error('Erro ao desconectar do GoTo:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    });
  }
});

// Rota para obter token GoTo válido (com refresh automático)
router.get('/goto/token', authenticateToken, async (req, res) => {
  try {
    const token = await getValidGotoToken(req.user.id);
    
    if (!token) {
      return res.status(404).json({
        success: false,
        error: 'Token GoTo não encontrado ou inválido'
      });
    }

    res.json({
      success: true,
      message: 'Token GoTo válido obtido',
      // Não retornar o token completo por segurança, apenas confirmar que existe
      hasValidToken: true
    });

  } catch (error) {
    console.error('Erro ao obter token GoTo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Debug route (can be removed in production)
router.get('/debug/oauth-states', async (req, res) => {
  try {
    const { data: tokens, error } = await supabase
      .from('goto_tokens')
      .select('user_id, principal, expires_at, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    res.json({
      success: true,
      message: 'Debug - Verificação rápida',
      tokens_count: tokens?.length || 0,
      recent_tokens: tokens || [],
      error: error?.message || null
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== ROTA DE LIMPEZA TEMPORÁRIA =====
router.post('/debug/clear-goto', async (req, res) => {
  try {
    // Limpar todos os tokens GoTo
    const { error: tokensError } = await supabase
      .from('goto_tokens')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    // Limpar todos os states OAuth
    const { error: statesError } = await supabase
      .from('oauth_states')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    res.json({
      success: true,
      message: 'Limpeza completa realizada',
      timestamp: new Date().toISOString(),
      results: {
        tokens_cleared: !tokensError,
        tokens_error: tokensError?.message || null,
        states_cleared: !statesError,
        states_error: statesError?.message || null
      },
      next_step: 'Agora você pode testar a conexão GoTo novamente'
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ===== ROTA DE TESTE DE INSERÇÃO =====
router.get('/debug/test-insert', authenticateToken, async (req, res) => {
  try {
    const testState = 'test_' + Math.random().toString(36).substring(2, 15);
    const testExpires = new Date(Date.now() + 10 * 60 * 1000);
    
    console.log('🧪 Teste de inserção:', {
      state_key: testState,
      user_id: req.user.id,
      expires_at: testExpires.toISOString()
    });

    const { data, error } = await supabase
      .from('oauth_states')
      .insert({
        state_key: testState,
        user_id: req.user.id,
        provider: 'goto',
        expires_at: testExpires.toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erro no teste:', error);
      return res.json({
        success: false,
        error: error.message,
        user_id: req.user.id,
        hint: 'Verifique se a tabela oauth_states existe e se o usuário tem permissões'
      });
    }

    console.log('✅ Teste bem-sucedido:', data);
    
    res.json({
      success: true,
      message: 'Inserção de teste bem-sucedida',
      data: data,
      user_id: req.user.id
    });

  } catch (error) {
    console.error('💥 Erro na rota de teste:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ===== ROTA PÚBLICA PARA RESETAR GOTO =====
router.get('/goto/reset-public', async (req, res) => {
  try {
    // Limpar todos os tokens e states (TEMPORÁRIO - só para debug)
    await supabase.from('goto_tokens').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('oauth_states').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    res.send(`
      <html>
        <head><title>GoTo Reset</title></head>
        <body style="font-family: Arial; padding: 40px; text-align: center;">
          <h1>🔄 GoTo Reset Concluído</h1>
          <p>Todas as conexões GoTo foram removidas.</p>
          <p><strong>Próximos passos:</strong></p>
          <ol style="text-align: left; display: inline-block;">
            <li>Feche esta aba</li>
            <li>Limpe o cache do navegador (Ctrl+F5)</li>
            <li>Acesse seu sistema novamente</li>
            <li>Teste a conexão GoTo</li>
          </ol>
          <br><br>
          <button onclick="window.close()">Fechar</button>
        </body>
      </html>
    `);

  } catch (error) {
    res.status(500).send(`Erro: ${error.message}`);
  }
});

// Exportar também as funções helper
module.exports = router;
module.exports.getValidGotoToken = getValidGotoToken;
module.exports.refreshGotoToken = refreshGotoToken;
module.exports.getGotoPrincipal = getGotoPrincipal;

