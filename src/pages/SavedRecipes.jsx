import { useState, useEffect } from 'react'
import { getSavedRecipes, deleteSavedRecipe } from '../api/savedRecipes'
import { addGroceryItem, updateGroceryItem, getGroceryItems } from '../api/grocery'
import { LoadingSpinner, ErrorState, EmptyState, Toast } from '../components/ui/PageState'
import { useToast } from '../hooks/useToast'

export default function SavedRecipes() {
  const { toast, showToast, hideToast } = useToast()
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [nutritionView, setNutritionView] = useState({})
  const [addingToGrocery, setAddingToGrocery] = useState({})
  const [addedToGrocery, setAddedToGrocery] = useState({})
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchRecipes()
  }, [])

  const fetchRecipes = async () => {
    try {
      setError('')
      const data = await getSavedRecipes()
      setRecipes(data)
    } catch (err) {
      setError('Failed to load saved recipes')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteSavedRecipe(id)
      setRecipes(prev => prev.filter(r => r.id !== id))
      showToast('Recipe removed from cookbook')
    } catch (err) {
      showToast('Failed to remove recipe', 'error')
    }
  }

  const handleAddToGrocery = async (recipe, idx) => {
    if (!recipe.missing || recipe.missing.length === 0) return
    setAddingToGrocery(prev => ({ ...prev, [idx]: true }))
    try {
      const currentList = await getGroceryItems()
      await Promise.all(
        recipe.missing.map(async (item) => {
          const name = typeof item === 'string' ? item : item.name
          const qty = typeof item === 'string' ? '' : `${item.quantity} ${item.unit}`
          const quantity = typeof item === 'string' ? 0 : (parseFloat(item.quantity) || 0)
          const unit = typeof item === 'string' ? '' : item.unit
          const existing = currentList.find(g =>
            g.name.toLowerCase().trim() === name.toLowerCase().trim()
          )
          if (existing) {
            const existingQty = parseFloat(existing.qty) || 0
            const newQty = existingQty + quantity
            await updateGroceryItem(existing.id, { qty: `${newQty} ${unit}`.trim() })
          } else {
            await addGroceryItem({ name, qty, category: 'Recipe ingredient', store: '', price: '' })
          }
        })
      )
      setAddedToGrocery(prev => ({ ...prev, [idx]: true }))
      showToast('Added to grocery list!')
      setTimeout(() => setAddedToGrocery(prev => ({ ...prev, [idx]: false })), 3000)
    } catch (err) {
      showToast('Failed to add to grocery list', 'error')
    } finally {
      setAddingToGrocery(prev => ({ ...prev, [idx]: false }))
    }
  }

  const filtered = recipes.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page-container">

      {/* Header */}
      <div className="page-header-row">
        <div>
          <h1 className="text-xl font-bold text-textPrimary">Cookbook</h1>
          <p className="text-textMuted mt-1">{recipes.length} saved recipe{recipes.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Search */}
      {recipes.length > 0 && (
        <div className="mb-6">
          <input
            className="input"
            placeholder="Search your cookbook..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )}

      {/* Recipes */}
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchRecipes} />
      ) : filtered.length === 0 && recipes.length === 0 ? (
        <EmptyState
          icon="📖"
          title="Your cookbook is empty"
          subtitle="Save recipes from the Recipe suggestions page by clicking the bookmark button"
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No recipes found"
          subtitle="Try a different search term"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((recipe, idx) => (
            <div key={recipe.id} className="card hover:shadow-md transition-all">

              <div className="flex items-start justify-between mb-3">
                <div className="text-4xl">{recipe.icon || '🍽️'}</div>
                <div className="flex items-center gap-2">
                  {recipe.difficulty && (
                    <span className={`text-xs px-2.5 py-1 rounded-pill font-medium ${
                      recipe.difficulty === 'Easy' ? 'bg-green-50 text-success' : 'bg-orange-50 text-orange-500'
                    }`}>
                      {recipe.difficulty}
                    </span>
                  )}
                  <button
                    onClick={() => handleDelete(recipe.id)}
                    className="w-7 h-7 rounded-full bg-gray-100 text-textMuted hover:bg-red-50 hover:text-danger transition-all flex items-center justify-center text-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <h3 className="font-semibold text-textPrimary text-lg mb-1">{recipe.name}</h3>
              {recipe.description && (
                <p className="text-sm text-textMuted mb-3 leading-relaxed">{recipe.description}</p>
              )}

              {recipe.tags && recipe.tags.length > 0 && (
                <div className="flex gap-2 flex-wrap mb-3">
                  {recipe.tags.map(tag => (
                    <span key={tag} className="text-xs bg-blue-50 text-primary px-2.5 py-1 rounded-pill border border-blue-100">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-textMuted mb-4 border-t border-border pt-3 flex-wrap">
                {recipe.time && <span>⏱ {recipe.time}</span>}
                {recipe.serves && <span>👥 Serves {recipe.serves}</span>}
                <span className="text-textMuted">
                  🔖 Saved {new Date(recipe.createdAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
                </span>
              </div>

              {/* Allergen warnings */}
              {recipe.allergenWarnings?.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-btn px-3 py-2 mb-3">
                  <p className="text-xs font-semibold text-danger mb-1">⚠️ Allergen warnings</p>
                  {recipe.allergenWarnings.map((w, i) => (
                    <p key={i} className="text-xs text-red-600">
                      contains {w.allergen} ({w.ingredient})
                    </p>
                  ))}
                </div>
              )}

              {/* Missing ingredients */}
              {recipe.missing?.length > 0 && (
                <div className="bg-orange-50 border border-orange-100 rounded-btn px-3 py-2 mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium text-orange-600">Need to buy:</p>
                    <button
                      onClick={() => handleAddToGrocery(recipe, idx)}
                      disabled={addingToGrocery[idx]}
                      className={`text-xs px-2.5 py-1 rounded-pill font-medium transition-all ${
                        addedToGrocery[idx] ? 'bg-success text-white' : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                      }`}
                    >
                      {addingToGrocery[idx] ? 'Adding...' : addedToGrocery[idx] ? '✓ Added!' : '+ Add to grocery'}
                    </button>
                  </div>
                  <p className="text-xs text-orange-500">
                    {recipe.missing.map(m => typeof m === 'string' ? m : `${m.name} (${m.quantity} ${m.unit})`).join(', ')}
                  </p>
                </div>
              )}

              {recipe.missing?.length === 0 && (
                <div className="bg-green-50 border border-green-100 rounded-btn px-3 py-2 mb-4">
                  <p className="text-xs font-medium text-success">✓ All ingredients in stock!</p>
                </div>
              )}

              {/* Expand button */}
              <button
                onClick={() => setExpandedId(expandedId === recipe.id ? null : recipe.id)}
                className="btn-secondary w-full text-sm"
              >
                {expandedId === recipe.id ? 'Hide details' : 'View recipe'}
              </button>

              {/* Expanded details */}
              {expandedId === recipe.id && (
                <div className="mt-4 pt-4 border-t border-border">

                  {/* Ingredients */}
                  {recipe.ingredients?.length > 0 && (
                    <>
                      <p className="text-xs font-semibold text-textPrimary mb-2">Ingredients</p>
                      <ul className="space-y-1.5 mb-5">
                        {recipe.ingredients.map((ing, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-textMuted">
                            <span className="w-4 h-4 rounded-full bg-green-100 text-success flex items-center justify-center text-xs flex-shrink-0">✓</span>
                            {typeof ing === 'string' ? ing : `${ing.name} — ${ing.quantity} ${ing.unit}`}
                          </li>
                        ))}
                        {recipe.missing?.map((ing, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-textMuted">
                            <span className="w-4 h-4 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center text-xs flex-shrink-0">+</span>
                            {typeof ing === 'string' ? ing : `${ing.name} — ${ing.quantity} ${ing.unit}`}
                            <span className="text-xs text-orange-400">(need to buy)</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  {/* Steps */}
                  {recipe.steps?.length > 0 && (
                    <>
                      <p className="text-xs font-semibold text-textPrimary mb-3">How to make it</p>
                      <ol className="space-y-3 mb-4">
                        {recipe.steps.map((step, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <p className="text-sm text-textMuted leading-relaxed">{step}</p>
                          </li>
                        ))}
                      </ol>
                    </>
                  )}

                  {/* Nutrition */}
                  {recipe.nutritionPerServing && (
                    <div className="mt-2">
                      <div className="flex gap-2 mb-3">
                        <button
                          onClick={() => setNutritionView(prev => ({ ...prev, [recipe.id]: 'serving' }))}
                          className={`text-xs px-3 py-1 rounded-pill border transition-all ${
                            (nutritionView[recipe.id] || 'serving') === 'serving'
                              ? 'bg-primary text-white border-primary'
                              : 'text-textMuted border-border'
                          }`}
                        >
                          Per serving
                        </button>
                        <button
                          onClick={() => setNutritionView(prev => ({ ...prev, [recipe.id]: 'total' }))}
                          className={`text-xs px-3 py-1 rounded-pill border transition-all ${
                            nutritionView[recipe.id] === 'total'
                              ? 'bg-primary text-white border-primary'
                              : 'text-textMuted border-border'
                          }`}
                        >
                          Total recipe
                        </button>
                      </div>
                      {(() => {
                        const n = nutritionView[recipe.id] === 'total' ? recipe.nutrition : recipe.nutritionPerServing
                        return (
                          <div className="grid grid-cols-4 gap-2">
                            {[
                              { label: 'Calories', value: n?.calories, unit: 'kcal', color: 'bg-orange-50 text-orange-600' },
                              { label: 'Protein', value: n?.protein, unit: 'g', color: 'bg-blue-50 text-primary' },
                              { label: 'Carbs', value: n?.carbs, unit: 'g', color: 'bg-yellow-50 text-yellow-600' },
                              { label: 'Fat', value: n?.fat, unit: 'g', color: 'bg-red-50 text-danger' },
                              { label: 'Fiber', value: n?.fiber, unit: 'g', color: 'bg-green-50 text-success' },
                              { label: 'Sugar', value: n?.sugar, unit: 'g', color: 'bg-pink-50 text-pink-600' },
                              { label: 'Sodium', value: n?.sodium, unit: 'mg', color: 'bg-purple-50 text-purple-600' },
                            ].map((item, i) => (
                              <div key={i} className={`rounded-btn p-2 text-center ${item.color}`}>
                                <p className="text-sm font-bold">{item.value}</p>
                                <p className="text-xs opacity-75">{item.unit}</p>
                                <p className="text-xs font-medium mt-0.5">{item.label}</p>
                              </div>
                            ))}
                          </div>
                        )
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  )
}