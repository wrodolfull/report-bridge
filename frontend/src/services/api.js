import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Configuração do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
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
  
  logout: () => 
    api.post('/auth/logout'),
  
  verify: () => 
    api.get('/auth/verify'),
  
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

// API de GoTo
export const gotoAPI = {
  getStatus: () =>
    api.get('/auth/goto/status'),

  connect: () =>
    api.post('/auth/goto/connect'),

  disconnect: () =>
    api.post('/auth/goto/disconnect'),

  // Nova rota OAuth
  getOAuthUrl: () =>
    api.get('/auth/goto/oauth'),
};

// API de Test Menu
export const testMenuAPI = {
  getRamal: () => api.get('/testmenu/ramal'),
  getMe: () => api.get('/testmenu/me'),
  getExtensions: () => api.get('/testmenu/extensions'),
  getPresenceMe: () => api.get('/testmenu/presence/me'),
  getPresenceSubscriptions: () => api.get('/testmenu/presence/subscriptions'),
  getCallQueues: (accountKey) => api.get('/testmenu/call-queues', { params: accountKey ? { accountKey } : {} }),
  getCallQueueUsers: (callQueueId, accountKey) => api.get(`/testmenu/call-queues/${callQueueId}/users`, { params: accountKey ? { accountKey } : {} }),
  getCallQueueUserDetail: (callQueueId, userKey, accountKey) => api.get(`/testmenu/call-queues/${callQueueId}/users/${userKey}`, { params: accountKey ? { accountKey } : {} }),
  getCallQueueDetail: (callQueueId, accountKey) => api.get(`/testmenu/call-queues/${callQueueId}/detail`, { params: accountKey ? { accountKey } : {} }),
  getCallQueueLive: (callQueueId, accountKey) => api.get(`/testmenu/call-queues/${callQueueId}/live`, { params: accountKey ? { accountKey } : {} }),
};

export default api;

