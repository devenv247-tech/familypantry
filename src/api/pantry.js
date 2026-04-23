import client from './client'

export const getPantryItems = async () => {
  const res = await client.get('/pantry')
  return res.data
}

export const addPantryItem = async (data) => {
  const res = await client.post('/pantry', data)
  return res.data
}

export const deletePantryItem = async (id) => {
  const res = await client.delete(`/pantry/${id}`)
  return res.data
}

export const updatePantryItem = async (id, data) => {
  const res = await client.put(`/pantry/${id}`, data)
  return res.data
}