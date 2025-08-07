const express = require('express');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Configuração GoTo OAuth
const GOTO_CONFIG = {
  clientId: process.env.GOTO_CLIENT_ID,
  clientSecret: process.env.GOTO_CLIENT_SECRET,
  redirectUri: process.env.GOTO_REDIRECT_URI || 'http://localhost:3001/api/auth/goto/callback',
  authUrl: 'https://authentication.logmeininc.com/oauth/authorize',
  tokenUrl: 'https://authentication.logmeininc.com/oauth/token',
  scope: 'read write'
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

// GoTo Connection Status
router.get('/goto/status', authenticateToken, async (req, res) => {
  try {
    // Aqui você pode implementar a lógica para verificar o status da conexão GoTo
    // Por enquanto, retornamos um status mock
    res.json({
      success: true,
      connected: false, // ou true se conectado
      lastCheck: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao verificar status GoTo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GoTo Connect
router.post('/goto/connect', authenticateToken, async (req, res) => {
  try {
    // Aqui você implementaria a lógica de conexão com GoTo
    // Por enquanto, simulamos uma conexão bem-sucedida
    const success = Math.random() > 0.3; // 70% de chance de sucesso
    
    if (success) {
      res.json({
        success: true,
        message: 'Conectado com GoTo com sucesso!',
        connected: true
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Falha na conexão com GoTo',
        connected: false
      });
    }
  } catch (error) {
    console.error('Erro ao conectar com GoTo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GoTo Disconnect
router.post('/goto/disconnect', authenticateToken, async (req, res) => {
  try {
    // Aqui você implementaria a lógica de desconexão com GoTo
    res.json({
      success: true,
      message: 'Desconectado do GoTo',
      connected: false
    });
  } catch (error) {
    console.error('Erro ao desconectar do GoTo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ===== GOTO OAUTH ROUTES =====

// Iniciar fluxo OAuth do GoTo
router.get('/goto/oauth', authenticateToken, async (req, res) => {
  try {
    if (!GOTO_CONFIG.clientId) {
      return res.status(400).json({ 
        error: 'Configuração OAuth do GoTo não encontrada' 
      });
    }

    // Gerar state para segurança
    const state = Math.random().toString(36).substring(2, 15);
    
    // Armazenar state na sessão ou cache (implementar conforme necessário)
    // req.session.gotoState = state;
    
    // Construir URL de autorização
    const authUrl = new URL(GOTO_CONFIG.authUrl);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', GOTO_CONFIG.clientId);
    authUrl.searchParams.set('redirect_uri', GOTO_CONFIG.redirectUri);
    authUrl.searchParams.set('scope', GOTO_CONFIG.scope);
    authUrl.searchParams.set('state', state);

    res.json({
      success: true,
      authUrl: authUrl.toString(),
      message: 'URL de autorização GoTo gerada'
    });

  } catch (error) {
    console.error('Erro ao gerar URL OAuth GoTo:', error);
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

    // Verificar state (implementar verificação de segurança)
    // if (state !== req.session.gotoState) {
    //   return res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=invalid_state`);
    // }

    // Trocar código por token de acesso
    const tokenResponse = await fetch(GOTO_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: GOTO_CONFIG.clientId,
        client_secret: GOTO_CONFIG.clientSecret,
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

    // Armazenar tokens (implementar conforme necessário)
    // req.session.gotoTokens = {
    //   access_token: tokenData.access_token,
    //   refresh_token: tokenData.refresh_token,
    //   expires_in: tokenData.expires_in
    // };

    console.log('Tokens GoTo obtidos com sucesso:', {
      access_token: tokenData.access_token ? '***' : 'undefined',
      refresh_token: tokenData.refresh_token ? '***' : 'undefined',
      expires_in: tokenData.expires_in
    });

    res.redirect(`${process.env.FRONTEND_URL}/dashboard?success=goto_connected`);

  } catch (error) {
    console.error('Erro no callback OAuth GoTo:', error);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=callback_failed`);
  }
});

// Verificar status da conexão GoTo
router.get('/goto/status', authenticateToken, async (req, res) => {
  try {
    // Aqui você implementaria a verificação real do status
    // Por enquanto, retornamos um status mock baseado em configuração
    
    const isConfigured = !!(GOTO_CONFIG.clientId && GOTO_CONFIG.clientSecret);
    
    res.json({
      success: true,
      connected: isConfigured,
      configured: isConfigured,
      lastCheck: new Date().toISOString(),
      message: isConfigured ? 'GoTo configurado' : 'GoTo não configurado'
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

    // Gerar URL de autorização
    const state = Math.random().toString(36).substring(2, 15);
    const authUrl = new URL(GOTO_CONFIG.authUrl);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', GOTO_CONFIG.clientId);
    authUrl.searchParams.set('redirect_uri', GOTO_CONFIG.redirectUri);
    authUrl.searchParams.set('scope', GOTO_CONFIG.scope);
    authUrl.searchParams.set('state', state);

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
    // Aqui você implementaria a lógica de revogação de tokens
    // Por enquanto, simulamos a desconexão
    
    res.json({
      success: true,
      message: 'Desconectado do GoTo com sucesso',
      connected: false
    });
  } catch (error) {
    console.error('Erro ao desconectar do GoTo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;

