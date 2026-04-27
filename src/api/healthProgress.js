import api from './client'

export const logNutrition = (memberNames, recipeName, mealType, nutritionPerServing) =>
  api.post('/health/log', { memberNames, recipeName, mealType, nutritionPerServing }).then(r => r.data)

export const getHealthProgress = () =>
  api.get('/health/progress').then(r => r.data)