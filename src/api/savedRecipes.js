import api from './client'

export const getSavedRecipes = () =>
  api.get('/saved-recipes').then(r => r.data)

export const saveRecipe = (recipe) =>
  api.post('/saved-recipes', recipe).then(r => r.data)

export const deleteSavedRecipe = (id) =>
  api.delete(`/saved-recipes/${id}`).then(r => r.data)

export const checkSaved = (name) =>
  api.get(`/saved-recipes/check?name=${encodeURIComponent(name)}`).then(r => r.data)