import axios from 'axios'

const AUTH_STORAGE_KEY = 'eduragx-auth'

const getStoredToken = () => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)

    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw)
    const token = parsed?.state?.token

    if (typeof token !== 'string' || !token.trim()) {
      return null
    }

    return token
      .replace(/^Bearer\s+/i, '')
      .trim()
  } catch {
    return null
  }
}

const api = axios.create({
  baseURL: '/api',
  timeout: 180000,
})

api.interceptors.request.use(
  (config) => {
    const token = getStoredToken()

    if (token) {
      config.headers = config.headers || {}

      config.headers.Authorization = `Bearer ${token}`
    }

    if (
      config.url?.includes('/ai/') ||
      config.url?.includes('/blockchain/')
    ) {
      config.timeout = 600000
    }

    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,

  (error) => {
    const status = error.response?.status
    const requestUrl = error.config?.url || ''

    // Don't redirect when the user simply entered
    // an incorrect login password.
    if (
      status === 401 &&
      !requestUrl.includes('/auth/login')
    ) {
      localStorage.removeItem(AUTH_STORAGE_KEY)

      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default api