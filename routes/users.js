const express = require('express');
const { supabase } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// ===== GESTÃO DE USUÁRIOS (SOMENTE ADMIN) =====

// Listar todos os usuários (Admin)
router.get('/admin/users', authenticateToken, async (req, res) => {
  try {
    // Verificar se é admin
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('auth_user_id', req.user.id)
      .single();

    if (userError || currentUser?.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado - Apenas administradores' });
    }

    const { data: users, error } = await supabase
      .from('users')
      .select(`
        *,
        user_tokens(provider, access_token, expires_at, updated_at)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar usuários:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    // Processar dados dos usuários
    const usersWithStatus = users?.map(user => {
      const gotoToken = user.user_tokens?.find(token => token.provider === 'goto');
      const isConnected = gotoToken && gotoToken.access_token;
      const expiresAt = gotoToken ? new Date(gotoToken.expires_at) : null;
      const isExpired = expiresAt && expiresAt < new Date();

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
        created_at: user.created_at,
        last_login: user.last_login,
        gotoStatus: {
          connected: isConnected && !isExpired,
          lastSync: gotoToken?.updated_at || null,
          expiresAt: expiresAt,
          isExpired: isExpired
        }
      };
    }) || [];

    res.json({
      success: true,
      users: usersWithStatus,
      total: usersWithStatus.length
    });

  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Estatísticas do dashboard administrativo
router.get('/admin/stats', authenticateToken, async (req, res) => {
  try {
    // Verificar se é admin
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('auth_user_id', req.user.id)
      .single();

    if (userError || currentUser?.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado - Apenas administradores' });
    }

    // Contar usuários
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Contar usuários conectados ao GoTo
    const { count: connectedUsers } = await supabase
      .from('user_tokens')
      .select('*', { count: 'exact', head: true })
      .eq('provider', 'goto')
      .not('access_token', 'is', null);

    // Usuários ativos (últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: activeUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('last_login', thirtyDaysAgo.toISOString());

    // Relatórios gerados
    const { count: totalReports } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true });

    // Usuários por status
    const { data: usersByStatus } = await supabase
      .from('users')
      .select('status')
      .in('status', ['active', 'inactive', 'suspended']);

    const statusCounts = usersByStatus?.reduce((acc, user) => {
      acc[user.status] = (acc[user.status] || 0) + 1;
      return acc;
    }, {}) || {};

    res.json({
      success: true,
      stats: {
        totalUsers: totalUsers || 0,
        connectedUsers: connectedUsers || 0,
        activeUsers: activeUsers || 0,
        totalReports: totalReports || 0,
        connectionRate: totalUsers ? Math.round((connectedUsers / totalUsers) * 100) : 0,
        statusCounts
      }
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter dados do usuário atual (Admin)
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    // Verificar se é admin
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('auth_user_id', req.user.id)
      .single();

    if (userError || currentUser?.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado - Apenas administradores' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', req.user.id)
      .single();

    if (error) {
      console.error('Erro ao buscar perfil:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    res.json({
      success: true,
      user: user || null
    });

  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar perfil do usuário (Admin)
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    // Verificar se é admin
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('auth_user_id', req.user.id)
      .single();

    if (userError || currentUser?.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado - Apenas administradores' });
    }

    const { name, email, preferences } = req.body;

    const { data, error } = await supabase
      .from('users')
      .update({
        name: name,
        email: email,
        preferences: preferences,
        updated_at: new Date().toISOString()
      })
      .eq('auth_user_id', req.user.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar perfil:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    res.json({
      success: true,
      user: data,
      message: 'Perfil atualizado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Forçar sincronização GoTo para um usuário (Admin)
router.post('/admin/users/:userId/sync-goto', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Verificar se é admin
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('auth_user_id', req.user.id)
      .single();

    if (userError || currentUser?.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado - Apenas administradores' });
    }

    // Verificar se usuário existe
    const { data: user, error: userCheckError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userCheckError || !user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar token GoTo do usuário
    const { data: userToken, error: tokenError } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'goto')
      .single();

    if (tokenError || !userToken) {
      return res.status(400).json({ error: 'Usuário não está conectado ao GoTo' });
    }

    // Atualizar timestamp de sincronização
    const { error: updateError } = await supabase
      .from('user_tokens')
      .update({
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('provider', 'goto');

    if (updateError) {
      console.error('Erro ao atualizar token:', updateError);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    res.json({
      success: true,
      message: 'Sincronização iniciada com sucesso',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Erro ao sincronizar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
