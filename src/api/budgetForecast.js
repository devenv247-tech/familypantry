import api from './client'

export const getBudgetForecast = () =>
  api.get('/budget/forecast').then(r => r.data)