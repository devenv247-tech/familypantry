import client from './client'

export const getMealPlan = async (weekStart) => {
  const res = await client.get('/mealplan', { params: { weekStart } })
  return res.data
}

export const saveMeal = async (data) => {
  const res = await client.post('/mealplan', data)
  return res.data
}

export const deleteMeal = async (id) => {
  const res = await client.delete(`/mealplan/${id}`)
  return res.data
}

export const generateGroceryFromPlan = async (weekStart) => {
  const res = await client.post('/mealplan/generate-grocery', { weekStart })
  return res.data
}
export const generateWeekPlan = async (weekStart, selectedMembers = [], selectedCuisines = []) =>
  client.post('/mealplan/generate-week', { weekStart, selectedMembers, selectedCuisines }).then(r => r.data)