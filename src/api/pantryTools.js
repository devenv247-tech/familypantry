import api from './client'

export const scanPantryPhoto = (imageBase64, mimeType) =>
  api.post('/pantry-tools/scan', { imageBase64, mimeType }).then(r => r.data)

export const getScanStatus = () =>
  api.get('/pantry-tools/scan-status').then(r => r.data)

export const getTemplates = () =>
  api.get('/pantry-tools/templates').then(r => r.data)

export const applyTemplate = (templateId) =>
  api.post('/pantry-tools/templates/apply', { templateId }).then(r => r.data)