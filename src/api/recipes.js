import client from './client'

export const suggestRecipes = async (members, mealType, cuisine) => {
  const res = await client.post('/recipes/suggest', { members, mealType, cuisine })
  return res.data
}

export const generateFamilyRecipe = async (mealType, cuisine) => {
  const res = await client.post('/recipes/family', { mealType, cuisine })
  return res.data
}

export const cookRecipe = async (recipe) => {
  const res = await client.post('/pantry/subtract', {
    ingredients: recipe.ingredients
  })
  return res.data
}