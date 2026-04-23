import client from './client'

export const register = async (data) => {
  const res = await client.post('/auth/register', data)
  return res.data
}

export const login = async (data) => {
  const res = await client.post('/auth/login', data)
  return res.data
}