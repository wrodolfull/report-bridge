const express = require('express');
const { supabase } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Middleware para autenticação em todas as rotas de relatórios
router.use(authenticateToken);

// Listar relatórios
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar relatórios:', error);
      return res.status(500).json({ error: 'Erro ao buscar relatórios' });
    }

    res.json({
      success: true,
      reports: data || []
    });

  } catch (error) {
    console.error('Erro ao buscar relatórios:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar relatório
router.post('/', async (req, res) => {
  try {
    const { title, description, type, data } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Título é obrigatório' });
    }

    const { data: report, error } = await supabase
      .from('reports')
      .insert([{
        title,
        description,
        type: type || 'general',
        data: data || {},
        user_id: req.user.id,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar relatório:', error);
      return res.status(500).json({ error: 'Erro ao criar relatório' });
    }

    res.status(201).json({
      success: true,
      report
    });

  } catch (error) {
    console.error('Erro ao criar relatório:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar relatório específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Relatório não encontrado' });
    }

    res.json({
      success: true,
      report: data
    });

  } catch (error) {
    console.error('Erro ao buscar relatório:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar relatório
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, type, data } = req.body;

    const { data: report, error } = await supabase
      .from('reports')
      .update({
        title,
        description,
        type,
        data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error || !report) {
      return res.status(404).json({ error: 'Relatório não encontrado' });
    }

    res.json({
      success: true,
      report
    });

  } catch (error) {
    console.error('Erro ao atualizar relatório:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar relatório
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) {
      return res.status(404).json({ error: 'Relatório não encontrado' });
    }

    res.json({
      success: true,
      message: 'Relatório excluído com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar relatório:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;

