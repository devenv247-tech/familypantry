import client from './client'

export const getMembers = async () => {
  const res = await client.get('/family/members')
  return res.data
}

export const addMember = async (data) => {
  const res = await client.post('/family/members', data)
  return res.data
}

export const updateMember = async (id, data) => {
  const res = await client.put(`/family/members/${id}`, data)
  return res.data
}

export const deleteMember = async (id) => {
  const res = await client.delete(`/family/members/${id}`)
  return res.data
}