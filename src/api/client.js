import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
})

client.interceptors.request.use((config) => {
  const auth = JSON.parse(localStorage.getItem('familypantry-auth') || '{}')
  const token = auth?.state?.token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('familypantry-auth')
      window.location.href = '/session-expired'
    }
    return Promise.reject(error)
  }
)

export default client