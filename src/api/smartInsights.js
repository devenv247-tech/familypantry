import api from './client'

export const getPantryCO2 = () =>
  api.get('/insights/co2').then(r => r.data)

export const getCostcoRecommendations = () =>
  api.get('/insights/costco').then(r => r.data)

export const getItemCO2 = (itemName) =>
  api.get(`/insights/co2/${encodeURIComponent(itemName)}`).then(r => r.data)