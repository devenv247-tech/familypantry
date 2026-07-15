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

export const inviteMember = async (id, email) =>
  client.post(`/family/members/${id}/invite`, { email }).then(r => r.data)

export const updateRestockThreshold = async (percent) =>
  client.put('/family/restock-threshold', { restockThresholdPercent: percent }).then(r => r.data)

export const updateDigestPreference = async (enabled) => {
  const res = await client.put('/digest-preference', { enabled })
  return res.data
}

export const getNotificationPrefs = async () => {
  const res = await client.get('/family/notification-prefs')
  return res.data
}

export const updateNotificationPrefs = async (prefs) => {
  const res = await client.patch('/family/notification-prefs', prefs)
  return res.data
}