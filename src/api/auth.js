import client from './client'

export const register = async (data) => {
  const res = await client.post('/auth/register', data)
  return res.data
}

export const login = async (data) => {
  const res = await client.post('/auth/login', data)
  return res.data
}

export const deleteAccount = async () => {
  const res = await client.delete('/auth/account')
  return res.data
}

export const updateAccount = async (data) => {
  const res = await client.put('/auth/account', data)
  return res.data
}