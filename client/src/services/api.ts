import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('laksh_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 — try refresh, else logout
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      const refreshToken = localStorage.getItem('laksh_refresh');
      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/auth/refresh', { refreshToken });
          localStorage.setItem('laksh_token', data.accessToken);
          localStorage.setItem('laksh_refresh', data.refreshToken);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original);
        } catch {
          localStorage.removeItem('laksh_token');
          localStorage.removeItem('laksh_refresh');
          window.location.href = '/login';
        }
      } else {
        localStorage.removeItem('laksh_token');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────

export const authApi = {
  signup: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/signup', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  onboard: (data: { board?: string; grade?: number; examDate?: string }) =>
    api.put('/auth/onboard', data),
};

// ─── Goals ────────────────────────────────────────

export const goalApi = {
  get: () => api.get('/goals'),
  set: (data: { targetPercentage: number; examDate: string }) =>
    api.post('/goals', data),
};

// ─── Diagnostic ───────────────────────────────────

export const diagnosticApi = {
  start: (subjectCode: string) => api.post('/diagnostic/start', { subjectCode }),
  answer: (data: { sessionId: string; questionId: string; answer: string; timeTakenMs?: number }) =>
    api.post('/diagnostic/answer', data),
  mastery: () => api.get('/diagnostic/mastery'),
  sessions: () => api.get('/diagnostic/sessions'),
};

// ─── Plan ─────────────────────────────────────────

export const planApi = {
  get: () => api.get('/plan'),
  generate: () => api.post('/plan/generate'),
  today: () => api.get('/plan/today'),
  complete: (itemId: string) => api.put(`/plan/complete/${itemId}`),
  adherence: () => api.get('/plan/adherence'),
};

// ─── Dashboard ────────────────────────────────────

export const dashboardApi = {
  get: () => api.get('/dashboard'),
};

export default api;
