import client from './client'

export const getRecalls = async () => {
  const res = await client.get('/recalls')
  return res.data
}

export const checkPantryMatches = async () => {
  const res = await client.get('/recalls/check-pantry')
  return res.data
}

export const getRecentRecalls = async () => {
  const res = await client.get('/recalls/recent')
  return res.data
}