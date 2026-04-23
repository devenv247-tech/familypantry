import client from './client'

export const suggestRecipes = async (members, mealType) => {
  const res = await client.post('/recipes/suggest', { members, mealType })
  return res.data
}