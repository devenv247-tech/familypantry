import client from './client'

export const getBabyProfile = (memberId) =>
  client.get(`/baby/${memberId}/profile`).then(r => r.data)

export const getAllergenIntroductions = (memberId) =>
  client.get(`/baby/${memberId}/allergens`).then(r => r.data)

export const logAllergenIntroduction = (memberId, data) =>
  client.post(`/baby/${memberId}/allergens`, data).then(r => r.data)

export const removeAllergenIntroduction = (memberId, allergen) =>
  client.delete(`/baby/${memberId}/allergens/${encodeURIComponent(allergen)}`).then(r => r.data)

export const getFeedingLog = (memberId) =>
  client.get(`/baby/${memberId}/feeding-log`).then(r => r.data)

export const addFeedingLog = (memberId, data) =>
  client.post(`/baby/${memberId}/feeding-log`, data).then(r => r.data)

export const deleteFeedingLog = (memberId, logId) =>
  client.delete(`/baby/${memberId}/feeding-log/${logId}`).then(r => r.data)

export const generateBabyRecipe = (memberId, data) =>
  client.post(`/baby/${memberId}/recipe`, data).then(r => r.data)

export const logGrowth = (memberId, data) =>
  client.post(`/baby/${memberId}/growth`, data).then(r => r.data)

export const getGrowthHistory = (memberId) =>
  client.get(`/baby/${memberId}/growth`).then(r => r.data)

export const downloadPediatricianReport = async (memberId) => {
  const res = await client.get(`/baby/${memberId}/report`, { responseType: 'blob' })
  const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `nooka-feeding-report.pdf`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}