import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || ''

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Inject token on every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('peblo_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('peblo_token')
      localStorage.removeItem('peblo_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// --- Auth ---
export const authApi = {
  signup: (data) => apiClient.post('/api/auth/signup', data).then((r) => r.data),
  login: (data) => apiClient.post('/api/auth/login', data).then((r) => r.data),
  me: () => apiClient.get('/api/auth/me').then((r) => r.data),
}

// --- Notes ---
export const notesApi = {
  list: (params) => apiClient.get('/api/notes', { params }).then((r) => r.data),
  get: (id) => apiClient.get(`/api/notes/${id}`).then((r) => r.data),
  create: (data) => apiClient.post('/api/notes', data).then((r) => r.data),
  update: (id, data) => apiClient.patch(`/api/notes/${id}`, data).then((r) => r.data),
  delete: (id) => apiClient.delete(`/api/notes/${id}`),
  toggleShare: (id) => apiClient.post(`/api/notes/${id}/share`).then((r) => r.data),
  getPublic: (token) => apiClient.get(`/api/notes/public/${token}`).then((r) => r.data),
}

// --- Tags ---
export const tagsApi = {
  list: () => apiClient.get('/api/tags').then((r) => r.data),
  create: (data) => apiClient.post('/api/tags', data).then((r) => r.data),
  delete: (id) => apiClient.delete(`/api/tags/${id}`),
}

// --- AI ---
export const aiApi = {
  generate: (data) => apiClient.post('/api/ai/generate', data).then((r) => r.data),
}

// --- Dashboard ---
export const dashboardApi = {
  stats: () => apiClient.get('/api/dashboard/stats').then((r) => r.data),
}
