import api from './client'

export const logCookedMeal = (recipeName, mealType, cuisine, members, rating) =>
  api.post('/meal-pattern/log', { recipeName, mealType, cuisine, members, rating }).then(r => r.data)

export const getCookingHistory = (limit = 20) =>
  api.get(`/meal-pattern/history?limit=${limit}`).then(r => r.data)