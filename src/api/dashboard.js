import client from './client'

export const getDashboardStats = async () => {
  const res = await client.get('/dashboard/stats')
  return res.data
}

export const getRecentActivity = async () => {
  const res = await client.get('/dashboard/activity')
  return res.data
}

export const getWasteSavings = async () => {
  const res = await client.get('/dashboard/waste-savings')
  return res.data
}

export const getNudges = async () => {
  const res = await client.get('/dashboard/nudges')
  return res.data
}