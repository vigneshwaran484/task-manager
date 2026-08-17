import { api } from './client'

// ── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
  register: (email, password) =>
    api.post('/auth/register', { email, password }),

  login: (email, password) => {
    // FastAPI's OAuth2PasswordRequestForm expects form data, but our custom
    // login endpoint takes query params — we use query params here
    const params = new URLSearchParams({ email, password })
    return api.post(`/auth/login?${params.toString()}`)
  },

  refresh: (refreshToken) =>
    api.post('/auth/refresh', { refresh_token: refreshToken }),

  me: () => api.get('/auth/me'),
}

// ── Tasks ─────────────────────────────────────────────────────────────────
export const tasksApi = {
  list: ()             => api.get('/tasks/'),
  get: (id)            => api.get(`/tasks/${id}`),
  create: (data)       => api.post('/tasks/', data),
  update: (id, data)   => api.patch(`/tasks/${id}`, data),
  remove: (id)         => api.delete(`/tasks/${id}`),
}
