import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
})

client.interceptors.request.use((config) => {
  const auth = JSON.parse(localStorage.getItem('nooka-auth') || '{}')
  const token = auth?.state?.token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  response => response,
  error => {
    const isAuthEndpoint = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register')
    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('nooka-auth')
      window.location.href = '/session-expired'
    }
    return Promise.reject(error)
  }
)

export default client