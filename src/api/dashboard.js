import client from './client'

export const getDashboardStats = async () => {
  const res = await client.get('/dashboard/stats')
  return res.data
}

export const getRecentActivity = async () => {
  const res = await client.get('/dashboard/activity')
  return res.data
}