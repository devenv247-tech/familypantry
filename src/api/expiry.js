import api from './client'

export const predictExpiry = (itemName, category, itemId) =>
  api.post('/expiry/predict', { itemName, category, itemId }).then(r => r.data)

export const getExpiringSoon = () =>
  api.get('/expiry/expiring-soon').then(r => r.data)

export const logItemRemoval = (itemName, category, predictedExpiry, actualExpiry, removalReason) =>
  api.post('/expiry/log-removal', { itemName, category, predictedExpiry, actualExpiry, removalReason }).then(r => r.data)