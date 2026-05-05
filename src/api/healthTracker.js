import api from './client'

export const getHealthData = (params) =>
  api.get('/health-tracker', { params }).then(r => r.data)

export const logWeight = (data) =>
  api.post('/health-tracker/weight', data).then(r => r.data)

export const logMeal = (data) =>
  api.post('/health-tracker/meal', data).then(r => r.data)

export const updateMemberGoal = (data) =>
  api.put('/health-tracker/goal', data).then(r => r.data)

export const deleteNutritionLog = (id) =>
  api.delete(`/health-tracker/log/${id}`).then(r => r.data)

export const lookupNutrition = (mealName, servings) =>
  api.post('/health-tracker/lookup', { mealName, servings }).then(r => r.data)

export const searchNutritionCache = async (query) => {
  const res = await api.get(`/health/nutrition/search?q=${encodeURIComponent(query)}`)
  return res.data
}