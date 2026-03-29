import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 35000, // 35s — local LLM can be slow on first run
});

// Attach JWT to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Global 401 handler — redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ===== AUTH =====
export const authApi = {
  signup: (data) => api.post('/auth/signup', data),
  login:  (data) => api.post('/auth/login', data),
  getMe:  ()     => api.get('/auth/me'),
};

// ===== GROUPS =====
export const groupApi = {
  create:    (data)     => api.post('/groups', data),
  getAll:    ()         => api.get('/groups'),
  getById:   (id)       => api.get(`/groups/${id}`),
  addMember: (id, data) => api.post(`/groups/${id}/members`, data),
  delete:    (id)       => api.delete(`/groups/${id}`),
};

// ===== EXPENSES =====
export const expenseApi = {
  create:     (data)       => api.post('/expenses', data),
  getByGroup: (groupId, p) => api.get(`/expenses/group/${groupId}`, { params: p }),
  getById:    (id)         => api.get(`/expenses/${id}`),
  settle:     (id, data)   => api.patch(`/expenses/${id}/settle`, data),
  delete:     (id)         => api.delete(`/expenses/${id}`),
};

// ===== DASHBOARD =====
export const dashboardApi = {
  get:      () => api.get('/dashboard'),
  insights: () => api.get('/dashboard/insights'),
};

// ===== AI — powered by Ollama (free, local) =====
export const aiApi = {
  parseExpense: (data) => api.post('/ai/parse-expense', data),
  getStatus:    ()     => api.get('/ai/status'),
};

export default api;
