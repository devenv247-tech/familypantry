import client from './client'

export const getReports = async () => {
  const res = await client.get('/reports')
  return res.data
}

export const getAISavingsTips = async () => {
  const res = await client.get('/reports/tips')
  return res.data
}