import api from './client'

export const recordPrice = (itemName, price, store) =>
  api.post('/price/record', { itemName, price, store }).then(r => r.data)

export const checkPriceAnomaly = (itemName, price, store) =>
  api.post('/price/check', { itemName, price, store }).then(r => r.data)

export const getPriceAlerts = () =>
  api.get('/price/alerts').then(r => r.data)