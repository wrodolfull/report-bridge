import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuração da URL base da API
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3001/api' 
  : 'https://your-production-api-url.com/api';

// Criação da instância do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos
});

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Erro ao obter token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas e erros
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      await AsyncStorage.removeItem('token');
      // Aqui você pode navegar para a tela de login se necessário
      // NavigationService.navigate('Login');
    }
    
    if (error.code === 'ECONNABORTED') {
      error.message = 'Tempo limite da requisição excedido';
    } else if (error.message === 'Network Error') {
      error.message = 'Erro de conexão. Verifique sua internet';
    }
    
    return Promise.reject(error);
  }
);

// API de autenticação
export const authAPI = {
  login: (email, password) => 
    api.post('/auth/login', { email, password }),
  
  register: (email, password, name) => 
    api.post('/auth/register', { email, password, name }),
  
  logout: (token) => 
    api.post('/auth/logout', {}, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  
  verify: (token) => 
    api.get('/auth/verify', {
      headers: { Authorization: `Bearer ${token}` }
    }),
  
  refresh: (refreshToken) => 
    api.post('/auth/refresh', { refresh_token: refreshToken }),
};

// API de relatórios
export const reportsAPI = {
  getAll: () => 
    api.get('/reports'),
  
  getById: (id) => 
    api.get(`/reports/${id}`),
  
  create: (reportData) => 
    api.post('/reports', reportData),
  
  update: (id, reportData) => 
    api.put(`/reports/${id}`, reportData),
  
  delete: (id) => 
    api.delete(`/reports/${id}`),
};

// Função para verificar conectividade
export const checkAPIConnection = async () => {
  try {
    const response = await api.get('/health', { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    console.error('API não está disponível:', error);
    return false;
  }
};

export default api;

