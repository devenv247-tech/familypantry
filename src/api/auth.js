import client from './client'

export const register = async (data) => {
  const res = await client.post('/auth/register', data)
  return res.data
}

export const login = async (data) => {
  const res = await client.post('/auth/login', data)
  return res.data
}

export const logoutApi = async () => {
  try {
    await client.post('/auth/logout')
  } catch (err) {
    // Logout always succeeds on frontend
  }
}

export const deleteAccount = async () => {
  const res = await client.delete('/auth/account')
  return res.data
}

export const updateAccount = async (data) => {
  const res = await client.put('/auth/account', data)
  return res.data
}
export const forgotPassword = async (email) =>
  client.post('/auth/forgot-password', { email }).then(r => r.data)

export const resetPassword = async (token, password) =>
  client.post('/auth/reset-password', { token, password }).then(r => r.data)

export const acceptInvite = async (token, password) =>
  client.post('/auth/accept-invite', { token, password }).then(r => r.data)

export const exportMyData = async () => {
  const res = await client.get('/auth/export', { responseType: 'blob' })
  const url = window.URL.createObjectURL(new Blob([res.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `nooka-data-export-${new Date().toISOString().split('T')[0]}.json`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}