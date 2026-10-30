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
    const url = error.config?.url || ''
    const isLoginEndpoint = url.includes('/auth/login')
    const isPublicEndpoint = url.includes('/notes/public')

    if (error.response?.status === 401 && !isLoginEndpoint && !isPublicEndpoint) {
      localStorage.removeItem('peblo_token')
      localStorage.removeItem('peblo_user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
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
  askVault: (data) => apiClient.post('/api/ai/ask-vault', data).then((r) => r.data),
  vaultStatus: () => apiClient.get('/api/ai/vault-status').then((r) => r.data),
  stream: async ({ note_id, mode, custom_prompt }, onToken, onDone, onError) => {
    try {
      const token = localStorage.getItem('peblo_token')
      const response = await fetch('/api/ai/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ note_id, mode, custom_prompt }),
      })

      if (!response.ok) {
        throw new Error(`Streaming failed: HTTP ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() // keep unparsed remainder

        for (const line of lines) {
          const trimmed = line.trim()
          if (trimmed.startsWith('data: ')) {
            try {
              const payload = JSON.parse(trimmed.slice(6))
              if (payload.error) {
                onError?.(payload.error)
              } else if (payload.token) {
                onToken?.(payload.token)
              }
              if (payload.done) {
                onDone?.()
              }
            } catch {
              // ignore json decode glitch
            }
          }
        }
      }
      onDone?.()
    } catch (err) {
      onError?.(err.message || 'Stream connection severed')
    }
  },
}

// --- Dashboard ---
export const dashboardApi = {
  stats: () => apiClient.get('/api/dashboard/stats').then((r) => r.data),
}
