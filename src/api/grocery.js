import client from './client'

export const getGroceryItems = async () => {
  const res = await client.get('/grocery')
  return res.data
}

export const addGroceryItem = async (data) => {
  const res = await client.post('/grocery', data)
  return res.data
}

export const updateGroceryItem = async (id, data) => {
  const res = await client.put(`/grocery/${id}`, data)
  return res.data
}

export const deleteGroceryItem = async (id) => {
  const res = await client.delete(`/grocery/${id}`)
  return res.data
}

export const clearCheckedItems = async () => {
  const res = await client.delete('/grocery/clear-checked')
  return res.data
}