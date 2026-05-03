import api from './client'

export const getAdminStats = () =>
  api.get('/admin/stats').then(r => r.data)

export const getAdminFamilies = (params) =>
  api.get('/admin/families', { params }).then(r => r.data)

export const updateFamilyPlan = (id, plan) =>
  api.put(`/admin/families/${id}/plan`, { plan }).then(r => r.data)

export const deleteFamily = (id) =>
  api.delete(`/admin/families/${id}`).then(r => r.data)

export const getFeatureFlags = () =>
  api.get('/admin/flags').then(r => r.data)

export const updateFeatureFlag = (id, data) =>
  api.put(`/admin/flags/${id}`, data).then(r => r.data)

export const getUsageStats = () =>
  api.get('/admin/usage').then(r => r.data)
export const getAnnouncements = () =>
  api.get('/admin/announcements').then(r => r.data)

export const createAnnouncement = (data) =>
  api.post('/admin/announcements', data).then(r => r.data)

export const deleteAnnouncement = (id) =>
  api.delete(`/admin/announcements/${id}`).then(r => r.data)

export const getApiStatus = () =>
  api.get('/admin/api-status').then(r => r.data)

export const getCacheStats = () =>
  api.get('/health-tracker/cache/stats').then(r => r.data)

export const deleteCacheItem = (id) =>
  api.delete(`/health-tracker/cache/${id}`).then(r => r.data)

export const clearExpiredCache = () =>
  api.delete('/health-tracker/cache/expired').then(r => r.data)

export const clearAllCache = () =>
  api.delete('/health-tracker/cache/all').then(r => r.data)