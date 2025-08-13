const express = require('express');
const axios = require('axios');
const { authenticateToken } = require('../middleware/auth');
const { getValidGotoToken, getGotoPrincipal } = require('./auth');

const router = express.Router();

// Middleware para autenticação em todas as rotas
router.use(authenticateToken);

// Rota de teste simples para verificar se a rota está funcionando
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Rota gotoCallEvents funcionando',
    timestamp: new Date().toISOString()
  });
});

// Rota de teste para verificar se a autenticação está funcionando
router.get('/test', (req, res) => {
  console.log('Rota de teste acessada, usuário:', req.user);
  res.json({
    success: true,
    message: 'Autenticação funcionando',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Rota para verificar se o usuário tem token GoTo
router.get('/check-token', async (req, res) => {
  try {
    console.log('Verificando token GoTo para usuário:', req.user.id);
    
    const accessToken = await getValidGotoToken(req.user.id);
    
    if (accessToken) {
      res.json({
        success: true,
        hasToken: true,
        message: 'Token GoTo encontrado',
        userId: req.user.id
      });
    } else {
      res.json({
        success: true,
        hasToken: false,
        message: 'Token GoTo não encontrado',
        userId: req.user.id
      });
    }
  } catch (error) {
    console.error('Erro ao verificar token GoTo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao verificar token GoTo'
    });
  }
});

// Buscar relatórios de eventos de chamadas da Goto
router.get('/call-events-report', async (req, res) => {
  try {
    console.log('=== INICIANDO BUSCA DE RELATÓRIOS ===');
    console.log('Usuário:', req.user.id);
    console.log('Timestamp:', new Date().toISOString());
    
    // Obter token válido da Goto
    const accessToken = await getValidGotoToken(req.user.id);
    console.log('Token obtido:', accessToken ? 'Sim' : 'Não');
    
    if (!accessToken) {
      console.log('❌ Token GoTo não encontrado para usuário:', req.user.id);
      return res.status(404).json({ 
        success: false, 
        error: 'Token GoTo não encontrado ou inválido para este usuário. Conecte-se ao GoTo primeiro.' 
      });
    }
    
    // Validar formato do token
    if (typeof accessToken !== 'string' || accessToken.length < 10) {
      console.error('❌ Token GoTo inválido:', { 
        type: typeof accessToken, 
        length: accessToken?.length,
        preview: accessToken ? `${accessToken.substring(0, 10)}...` : 'undefined'
      });
      return res.status(500).json({
        success: false,
        error: 'Token GoTo em formato inválido'
      });
    }
    
    console.log('✅ Token validado com sucesso, tamanho:', accessToken.length);
    console.log('Token preview:', `${accessToken.substring(0, 20)}...`);

    // Obter o principal (userKey) do usuário
    const userKey = await getGotoPrincipal(req.user.id);
    console.log('🔑 UserKey (Principal) obtido:', userKey ? 'Sim' : 'Não');
    
    if (!userKey) {
      console.log('❌ UserKey não encontrado para usuário:', req.user.id);
      return res.status(404).json({ 
        success: false, 
        error: 'UserKey (Principal) não encontrado para este usuário. Conecte-se ao GoTo novamente.' 
      });
    }
    
    console.log('✅ UserKey validado:', userKey);

    // Configurar datas de início e fim do dia atual
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    
    // Formatar datas no formato ISO 8601
    const startDate = startOfDay.toISOString();
    const endDate = endOfDay.toISOString();
    
    // Validar que as datas estão no formato correto
    if (!startDate || !endDate) {
      console.error('❌ Erro ao gerar datas:', { startDate, endDate });
      return res.status(500).json({
        success: false,
        error: 'Erro ao configurar período de busca'
      });
    }
    
    console.log('📅 Período de busca configurado:');
    console.log('  - Data atual:', today.toLocaleString('pt-BR'));
    console.log('  - Início do dia:', startOfDay.toLocaleString('pt-BR'));
    console.log('  - Fim do dia:', endOfDay.toLocaleString('pt-BR'));
    console.log('  - startTime (ISO):', startDate);
    console.log('  - endTime (ISO):', endDate);
    
    // Preparar os parâmetros da requisição conforme documentação da API
    const requestParams = {
      userKey: userKey,
      startTime: startDate,
      endTime: endDate,
      pageSize: 10
    };
    
    console.log('📤 Parâmetros da requisição para API GoTo:');
    console.log('  - userKey:', requestParams.userKey);
    console.log('  - startTime:', requestParams.startTime);
    console.log('  - endTime:', requestParams.endTime);
    console.log('  - pageSize:', requestParams.pageSize);
    
    console.log('🌐 Fazendo requisição para API GoTo...');
    console.log('URL:', 'https://api.goto.com/call-events-report/v1/report-summaries');
    console.log('Método: GET');
    console.log('Headers:', {
      'Authorization': `Bearer ${accessToken.substring(0, 20)}...`,
      'Content-Type': 'application/json'
    });
    
    // Buscar relatórios de eventos de chamadas
    const response = await axios.get('https://api.goto.com/call-events-report/v1/report-summaries', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      params: requestParams
    });

    console.log('✅ Resposta recebida da API GoTo!');
    console.log('📊 Dados da resposta:');
    console.log('  - Status:', response.status);
    console.log('  - Status Text:', response.statusText);
    console.log('  - Headers:', response.headers);
    console.log('  - URL da requisição:', response.config?.url);
    console.log('  - Método da requisição:', response.config?.method);
    console.log('  - Parâmetros enviados:', response.config?.params);
    
    // Log detalhado da estrutura da resposta
    console.log('📋 Estrutura da resposta:');
    console.log('  - Tipo de dados:', typeof response.data);
    console.log('  - É array?', Array.isArray(response.data));
    console.log('  - É objeto?', typeof response.data === 'object' && response.data !== null);
    
    if (response.data && typeof response.data === 'object') {
      console.log('  - Chaves disponíveis:', Object.keys(response.data));
      console.log('  - Tamanho do objeto:', Object.keys(response.data).length);
      
      // Log detalhado de cada chave
      Object.keys(response.data).forEach(key => {
        const value = response.data[key];
        console.log(`    - ${key}:`, {
          tipo: typeof value,
          éArray: Array.isArray(value),
          tamanho: Array.isArray(value) ? value.length : 'N/A',
          valor: Array.isArray(value) ? `Array com ${value.length} itens` : value
        });
      });
    }
    
    if (Array.isArray(response.data)) {
      console.log('  - Dados é um array com', response.data.length, 'itens');
      if (response.data.length > 0) {
        console.log('  - Primeiro item:', response.data[0]);
        console.log('  - Último item:', response.data[response.data.length - 1]);
      }
    }

    // Verificar se a resposta tem a estrutura esperada
    let reportData = [];
    let totalCount = 0;
    
    if (response.data && Array.isArray(response.data)) {
      reportData = response.data;
      totalCount = response.data.length;
      console.log('✅ Dados extraídos do array direto');
    } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
      reportData = response.data.data;
      totalCount = response.data.data.length;
      console.log('✅ Dados extraídos de response.data.data');
    } else if (response.data && response.data.reports && Array.isArray(response.data.reports)) {
      reportData = response.data.reports;
      totalCount = response.data.reports.length;
      console.log('✅ Dados extraídos de response.data.reports');
    } else if (response.data && response.data.items && Array.isArray(response.data.items)) {
      reportData = response.data.items;
      totalCount = response.data.items.length;
      console.log('✅ Dados extraídos de response.data.items');
    } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
      reportData = response.data.results;
      totalCount = response.data.results.length;
      console.log('✅ Dados extraídos de response.data.results');
    } else {
      console.log('❌ Estrutura de resposta inesperada');
      console.log('  - Dados recebidos:', response.data);
      console.log('  - Tipo de dados:', typeof response.data);
      if (response.data && typeof response.data === 'object') {
        console.log('  - Chaves disponíveis:', Object.keys(response.data));
      }
      reportData = [];
      totalCount = 0;
    }
    
    console.log('📊 Dados processados:');
    console.log('  - Total de registros encontrados:', totalCount);
    console.log('  - Registros a serem retornados:', reportData.length);
    
    // Limitar a 10 registros se a API retornar mais
    if (reportData.length > 10) {
      const originalLength = reportData.length;
      reportData = reportData.slice(0, 10);
      console.log(`📏 Limitando resultados de ${originalLength} para 10 registros`);
    }

    // Log dos dados finais
    if (reportData.length > 0) {
      console.log('📋 Primeiros 3 registros:');
      reportData.slice(0, 3).forEach((item, index) => {
        console.log(`  ${index + 1}.`, item);
      });
      
      if (reportData.length > 3) {
        console.log(`  ... e mais ${reportData.length - 3} registros`);
      }
    }

    console.log('📤 Enviando resposta para o frontend...');
    
    const finalResponse = {
      success: true,
      data: reportData,
      count: reportData.length,
      totalCount: totalCount,
      timestamp: new Date().toISOString(),
      userKey: userKey,
      searchPeriod: {
        startDate: startDate,
        endDate: endDate,
        startDateFormatted: startOfDay.toLocaleString('pt-BR'),
        endDateFormatted: endOfDay.toLocaleString('pt-BR')
      },
      originalResponse: response.data,
      apiEndpoint: 'https://api.goto.com/call-events-report/v1/report-summaries'
    };
    
    console.log('📋 Resposta final para o frontend:');
    console.log('  - success:', finalResponse.success);
    console.log('  - count:', finalResponse.count);
    console.log('  - totalCount:', finalResponse.totalCount);
    console.log('  - timestamp:', finalResponse.timestamp);
    console.log('  - userKey:', finalResponse.userKey);
    console.log('  - searchPeriod:', finalResponse.searchPeriod);
    
    res.json(finalResponse);
    
    console.log('✅ Resposta enviada com sucesso!');
    console.log('=== FIM DA BUSCA DE RELATÓRIOS ===\n');

  } catch (error) {
    console.error('❌ ERRO ao buscar relatórios de eventos de chamadas da Goto');
    console.error('Timestamp do erro:', new Date().toISOString());
    console.error('Usuário:', req.user.id);
    console.error('Erro completo:', error);
    
    // Tratamento específico para diferentes tipos de erro
    if (error.response) {
      // Erro da API da Goto
      const { status, data, statusText } = error.response;
      console.error('🚨 Erro da API GoTo:');
      console.error('  - Status:', status);
      console.error('  - Status Text:', statusText);
      console.error('  - Dados do erro:', data);
      console.error('  - Headers da resposta:', error.response.headers);
      console.error('  - URL da requisição:', error.config?.url);
      console.error('  - Método da requisição:', error.config?.method);
      console.error('  - Parâmetros enviados:', error.config?.params);
      
      if (status === 400) {
        return res.status(400).json({ 
          success: false, 
          error: `Erro de validação da API GoTo: ${data?.message || data?.error || 'Parâmetros inválidos'}`,
          details: data
        });
      }
      
      if (status === 401) {
        return res.status(401).json({ 
          success: false, 
          error: 'Token GoTo expirado ou inválido. Reconecte-se ao GoTo.' 
        });
      }
      
      if (status === 403) {
        return res.status(403).json({ 
          success: false, 
          error: 'Sem permissão para acessar relatórios de eventos de chamadas' 
        });
      }
      
      if (status === 404) {
        return res.status(404).json({ 
          success: false, 
          error: 'Endpoint da API GoTo não encontrado ou não disponível' 
        });
      }
      
      if (status >= 500) {
        return res.status(503).json({ 
          success: false, 
          error: 'Serviço da API GoTo temporariamente indisponível. Tente novamente.' 
        });
      }
      
      return res.status(status).json({ 
        success: false, 
        error: `Erro da API GoTo (${status}): ${data?.message || data?.error || statusText || 'Erro desconhecido'}`,
        details: data
      });
    }
    
    if (error.request) {
      // Erro de rede
      console.error('🌐 Erro de rede ao conectar com Goto:');
      console.error('  - Mensagem:', error.message);
      console.error('  - Request config:', error.config);
      return res.status(503).json({ 
        success: false, 
        error: 'Erro de conexão com a API da Goto. Tente novamente.' 
      });
    }
    
    // Erro interno
    console.error('💥 Erro interno do servidor:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor ao buscar relatórios' 
    });
  }
});

module.exports = router;
