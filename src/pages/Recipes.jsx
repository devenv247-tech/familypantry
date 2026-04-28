import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMembers } from '../api/family'
import { suggestRecipes, generateFamilyRecipe, cookRecipe, getSubstitutions } from '../api/recipes'
import { addGroceryItem, updateGroceryItem, getGroceryItems } from '../api/grocery'
import { logCookedMeal, getCookingHistory } from '../api/mealPattern'
import { logNutrition } from '../api/healthProgress'
import { Toast } from '../components/ui/PageState'
import { useToast } from '../hooks/useToast'
import { useAuthStore } from '../store/authStore'

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

const CUISINES = [
  { label: 'Any cuisine', icon: '🌍' },
  { label: 'Punjabi', icon: '🫓' },
  { label: 'South Asian', icon: '🍛' },
  { label: 'Italian', icon: '🍝' },
  { label: 'Mexican', icon: '🌮' },
  { label: 'Chinese', icon: '🥢' },
  { label: 'Middle Eastern', icon: '🧆' },
  { label: 'Japanese', icon: '🍱' },
  { label: 'Canadian / Western', icon: '🍁' },
]

const STAR_RATINGS = [1, 2, 3, 4, 5]

export default function Recipes() {
  const navigate = useNavigate()
  const { family } = useAuthStore()
  const isPaidPlan = family?.plan === 'family' || family?.plan === 'premium'
  const { toast, showToast, hideToast } = useToast()
  const [members, setMembers] = useState([])
  const [selectedMembers, setSelectedMembers] = useState([])
  const [mealType, setMealType] = useState('Dinner')
  const [loading, setLoading] = useState(false)
  const [recipes, setRecipes] = useState([])
  const [generated, setGenerated] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [limitError, setLimitError] = useState('')
  const [usage, setUsage] = useState(null)
  const [familyRecipe, setFamilyRecipe] = useState(null)
  const [familyLoading, setFamilyLoading] = useState(false)
  const [cookedId, setCookedId] = useState(null)
  const [cuisine, setCuisine] = useState('Any cuisine')
  const [nutritionView, setNutritionView] = useState({})
  const [addingToGrocery, setAddingToGrocery] = useState({})
  const [addedToGrocery, setAddedToGrocery] = useState({})
  const [cookingHistory, setCookingHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [ratingModal, setRatingModal] = useState(null)
  const [pendingRating, setPendingRating] = useState(0)
  const [submittingRating, setSubmittingRating] = useState(false)
  const [substitutions, setSubstitutions] = useState({}) // key: `${recipeIdx}-${ingName}`
  const [substitutionLoading, setSubstitutionLoading] = useState({})
  const [activeSubstitution, setActiveSubstitution] = useState(null) // key of active substitution panel

  useEffect(() => {
    fetchMembers()
    fetchCookingHistory()
  }, [])

  const fetchMembers = async () => {
    try {
      const data = await getMembers()
      setMembers(data)
    } catch (err) {
      showToast('Failed to load family members', 'error')
    }
  }

  const fetchCookingHistory = async () => {
    setHistoryLoading(true)
    try {
      const data = await getCookingHistory()
      setCookingHistory(data)
    } catch (err) {
      console.error('Failed to load cooking history:', err)
    } finally {
      setHistoryLoading(false)
    }
  }

  const toggleMember = (m) => {
    setSelectedMembers(prev =>
      prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
    )
  }

  const handleGenerate = async () => {
    if (selectedMembers.length === 0) return
    setLoading(true)
    setGenerated(false)
    setLimitError('')
    setSubstitutions({})
    setActiveSubstitution(null)
    try {
      const data = await suggestRecipes(selectedMembers, mealType, cuisine)
      setRecipes(data.recipes)
      setUsage(data.usage)
      setGenerated(true)
    } catch (err) {
      if (err.response?.data?.limitReached) {
        setLimitError(err.response.data.message)
      } else {
        showToast('Failed to generate recipes. Please try again.', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleFamilyRecipe = async () => {
    setFamilyLoading(true)
    setFamilyRecipe(null)
    try {
      const data = await generateFamilyRecipe(mealType, cuisine)
      setFamilyRecipe(data.recipe)
    } catch (err) {
      if (err.response?.data?.limitReached) {
        setLimitError(err.response.data.message)
      } else {
        showToast('Failed to generate family recipe. Please try again.', 'error')
      }
    } finally {
      setFamilyLoading(false)
    }
  }

 const handleCook = async (recipe, idx) => {
    try {
      await cookRecipe(recipe)
      setCookedId(idx)
      showToast('Pantry updated! Ingredients subtracted.')
      setRatingModal({ recipe, idx })
      setPendingRating(0)
      setTimeout(() => setCookedId(null), 3000)

      // Log nutrition for health progress tracking
      if (recipe.nutritionPerServing && selectedMembers.length > 0) {
        try {
          await logNutrition(
            selectedMembers,
            recipe.name,
            mealType,
            recipe.nutritionPerServing
          )
        } catch (e) {
          console.log('Nutrition log skipped:', e.message)
        }
      }
    } catch (err) {
      showToast('Failed to update pantry', 'error')
    }
  }

  const handleSubmitRating = async () => {
    if (!ratingModal) return
    setSubmittingRating(true)
    try {
      await logCookedMeal(
        ratingModal.recipe.name,
        mealType,
        cuisine !== 'Any cuisine' ? cuisine : null,
        selectedMembers.join(', ') || 'Family',
        pendingRating || null
      )
      await fetchCookingHistory()
      showToast(pendingRating ? `Logged with ${pendingRating} ⭐ rating!` : 'Meal logged!')
    } catch (err) {
      console.error('Failed to log cooked meal:', err)
    } finally {
      setSubmittingRating(false)
      setRatingModal(null)
      setPendingRating(0)
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

  const handleFindSubstitutes = async (ing, recipeIdx, recipeName) => {
    const ingName = typeof ing === 'string' ? ing : ing.name
    const ingUnit = typeof ing === 'string' ? '' : ing.unit
    const key = `${recipeIdx}-${ingName}`

    // Toggle off if already showing
    if (activeSubstitution === key) {
      setActiveSubstitution(null)
      return
    }

    // Use cached result if available
    if (substitutions[key]) {
      setActiveSubstitution(key)
      return
    }

    setSubstitutionLoading(prev => ({ ...prev, [key]: true }))
    setActiveSubstitution(key)
    try {
      const result = await getSubstitutions(ingName, ingUnit, recipeName)
      setSubstitutions(prev => ({ ...prev, [key]: result }))
    } catch (err) {
      showToast('Failed to find substitutes', 'error')
      setActiveSubstitution(null)
    } finally {
      setSubstitutionLoading(prev => ({ ...prev, [key]: false }))
    }
  }

  const qualityColor = (quality) => {
    if (quality === 'perfect') return 'bg-green-50 text-success border-green-100'
    if (quality === 'good') return 'bg-blue-50 text-primary border-blue-100'
    return 'bg-gray-50 text-textMuted border-border'
  }

  const qualityLabel = (quality) => {
    if (quality === 'perfect') return '✓ Perfect match'
    if (quality === 'good') return '👍 Good substitute'
    return '~ Works'
  }

  return (
    <div className="page-container">

      {/* Rating modal */}
      {ratingModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-card shadow-xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-textPrimary text-lg mb-1">How was it? 🍽️</h3>
            <p className="text-sm text-textMuted mb-5">Rate <span className="font-medium text-textPrimary">{ratingModal.recipe.name}</span> so we can learn your family's preferences</p>
            <div className="flex justify-center gap-3 mb-6">
              {STAR_RATINGS.map(star => (
                <button
                  key={star}
                  onClick={() => setPendingRating(star)}
                  className={`text-3xl transition-all ${pendingRating >= star ? 'opacity-100 scale-110' : 'opacity-30'}`}
                >
                  ⭐
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setRatingModal(null); setPendingRating(0) }} className="btn-secondary flex-1">Skip</button>
              <button onClick={handleSubmitRating} disabled={submittingRating} className="btn-primary flex-1">
                {submittingRating ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-textPrimary">Recipe suggestions</h1>
        <p className="text-textMuted mt-1">AI-powered recipes based on your pantry and health goals</p>
      </div>

      {/* Health disclaimer */}
      <div className="bg-blue-50 border border-blue-100 rounded-card px-4 py-3 mb-6 flex items-start gap-3">
        <span className="text-lg">ℹ️</span>
        <p className="text-xs text-primary leading-relaxed">
          Recipe suggestions and nutritional information are generated by AI for general wellness purposes only and are not medical advice. Consult a healthcare professional for specific dietary needs.
        </p>
      </div>

      {/* Cooking history */}
      {cookingHistory.length > 0 && (
        <div className="card mb-6 border border-purple-100 bg-purple-50/20">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-textPrimary">📖 Recently cooked</h2>
            <button onClick={() => setShowHistory(!showHistory)} className="text-xs text-primary hover:underline font-medium">
              {showHistory ? 'Hide' : `Show all ${cookingHistory.length}`}
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {(showHistory ? cookingHistory : cookingHistory.slice(0, 3)).map((meal, i) => {
              const daysAgo = Math.floor((new Date() - new Date(meal.cookedAt)) / (1000 * 60 * 60 * 24))
              return (
                <div key={meal.id} className="flex items-center justify-between bg-white rounded-btn px-3 py-2 border border-purple-100">
                  <div>
                    <p className="text-sm font-medium text-textPrimary">{meal.recipeName}</p>
                    <p className="text-xs text-textMuted">{meal.mealType} · {daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {meal.rating && <span className="text-xs text-yellow-500 font-medium">{'⭐'.repeat(meal.rating)}</span>}
                    <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-pill">{meal.cuisine || 'Any'}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Generator card */}
      <div className="card mb-8 border-2 border-blue-100 bg-blue-50/30">
        <h2 className="font-semibold text-textPrimary mb-5">Who are you cooking for?</h2>

        {/* Member selector */}
        <div className="mb-5">
          <label className="label">Family members</label>
          {members.length === 0 ? (
            <p className="text-sm text-textMuted">
              No members yet —{' '}
              <button onClick={() => navigate('/app/settings')} className="text-primary hover:underline">add members in Settings</button>
            </p>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {members.map(m => (
                <button
                  key={m.id}
                  onClick={() => toggleMember(m.name)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-pill border text-sm font-medium transition-all ${
                    selectedMembers.includes(m.name)
                      ? 'bg-primary text-white border-primary'
                      : 'bg-surface text-textMuted border-border hover:border-primary hover:text-primary'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                    selectedMembers.includes(m.name) ? 'bg-white text-primary' : 'bg-gray-100 text-textMuted'
                  }`}>
                    {m.name[0]}
                  </div>
                  {m.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Meal type */}
        <div className="mb-6">
          <label className="label">Meal type</label>
          <div className="flex gap-2 flex-wrap">
            {MEAL_TYPES.map(t => (
              <button
                key={t}
                onClick={() => setMealType(t)}
                className={`px-4 py-2 rounded-pill border text-sm font-medium transition-all ${
                  mealType === t ? 'bg-primary text-white border-primary' : 'bg-surface text-textMuted border-border hover:border-primary hover:text-primary'
                }`}
              >
                {t === 'Breakfast' ? '🌅' : t === 'Lunch' ? '☀️' : t === 'Dinner' ? '🌙' : '🍎'} {t}
              </button>
            ))}
          </div>
        </div>

        {/* Cuisine selector */}
        <div className="mb-6">
          <label className="label">Cuisine preference</label>
          <div className="flex gap-2 flex-wrap">
            {CUISINES.map(c => (
              <button
                key={c.label}
                onClick={() => setCuisine(c.label)}
                className={`px-4 py-2 rounded-pill border text-sm font-medium transition-all ${
                  cuisine === c.label ? 'bg-primary text-white border-primary' : 'bg-surface text-textMuted border-border hover:border-primary hover:text-primary'
                }`}
              >
                {c.icon} {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Family recipe button */}
        <div className="mb-6 p-4 bg-purple-50 border border-purple-100 rounded-card">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-purple-700">Whole family recipe</p>
              <p className="text-xs text-purple-500 mt-0.5">One balanced recipe for everyone based on all health goals</p>
            </div>
            <button
              onClick={handleFamilyRecipe}
              disabled={familyLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded-btn text-sm font-medium hover:bg-purple-700 transition-all disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
            >
              {familyLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Generating...
                </>
              ) : '👨‍👩‍👧‍👦 Generate for whole family'}
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <button
            onClick={handleGenerate}
            disabled={selectedMembers.length === 0 || loading}
            className="btn-primary px-8 py-3 text-base disabled:opacity-50 flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Generating...
              </>
            ) : <>🤖 Generate recipes</>}
          </button>
          {selectedMembers.length === 0 && <p className="text-sm text-textMuted">Select at least one member</p>}
        </div>

        {/* Limit error */}
        {limitError && (
          <div className="mt-4 bg-orange-50 border border-orange-100 rounded-card p-4">
            <p className="text-sm font-semibold text-orange-600 mb-1">Weekly limit reached</p>
            <p className="text-sm text-orange-500">{limitError}</p>
            <button onClick={() => navigate('/app/settings')} className="btn-primary mt-3 text-sm">Upgrade to Family plan</button>
          </div>
        )}

        {/* Usage indicator */}
        {usage?.plan === 'free' && !limitError && (
          <div className="mt-4 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-pill overflow-hidden">
              <div className="h-full bg-primary rounded-pill transition-all" style={{ width: `${(usage.used / usage.limit) * 100}%` }} />
            </div>
            <span className="text-xs text-textMuted">{usage.used}/{usage.limit} recipes this week</span>
          </div>
        )}
      </div>

      {/* Family recipe result */}
      {familyRecipe && (
        <div className="card mb-8 border-2 border-purple-200 bg-purple-50/20">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0 pr-3">
              <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-pill font-medium border border-purple-200">Whole family recipe</span>
              <h2 className="text-xl font-bold text-textPrimary mt-2">{familyRecipe.name}</h2>
              <p className="text-sm text-textMuted mt-1">{familyRecipe.description}</p>
            </div>
            <div className="text-4xl flex-shrink-0">{familyRecipe.icon}</div>
          </div>

          {familyRecipe.balanceNote && (
            <div className="bg-purple-50 border border-purple-100 rounded-btn px-4 py-3 mb-4">
              <p className="text-xs font-semibold text-purple-700 mb-1">Why this works for everyone</p>
              <p className="text-sm text-purple-600">{familyRecipe.balanceNote}</p>
            </div>
          )}

          {familyRecipe.memberTips?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-textPrimary mb-2">Tips per member</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {familyRecipe.memberTips.map((t, i) => (
                  <div key={i} className="flex items-start gap-2 bg-gray-50 rounded-btn px-3 py-2">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{t.member[0]}</div>
                    <p className="text-xs text-textMuted">{t.member}: {t.tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-textMuted mb-4 border-t border-border pt-3 flex-wrap">
            <span>⏱ {familyRecipe.time}</span>
            <span>👥 Serves {familyRecipe.serves}</span>
            <span className={`px-2 py-0.5 rounded-pill font-medium ${familyRecipe.difficulty === 'Easy' ? 'bg-green-50 text-success' : 'bg-orange-50 text-orange-500'}`}>
              {familyRecipe.difficulty}
            </span>
          </div>

          {familyRecipe.allergenWarnings?.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-btn px-3 py-2 mb-4">
              <p className="text-xs font-semibold text-danger mb-1">⚠️ Allergen warnings</p>
              {familyRecipe.allergenWarnings.map((w, i) => (
                <p key={i} className="text-xs text-red-600">contains {w.allergen} ({w.ingredient})</p>
              ))}
            </div>
          )}

          {familyRecipe.missing?.length > 0 && (
            <div className="bg-orange-50 border border-orange-100 rounded-btn px-3 py-2 mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-orange-600">Need to buy:</p>
                <button
                  onClick={() => handleAddToGrocery(familyRecipe, 'family')}
                  disabled={addingToGrocery['family']}
                  className={`text-xs px-2.5 py-1 rounded-pill font-medium transition-all ${
                    addedToGrocery['family'] ? 'bg-success text-white' : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                  }`}
                >
                  {addingToGrocery['family'] ? 'Adding...' : addedToGrocery['family'] ? '✓ Added!' : '+ Add to grocery'}
                </button>
              </div>
              <div className="space-y-2">
                {familyRecipe.missing.map((m, i) => {
                  const ingName = typeof m === 'string' ? m : m.name
                  const key = `family-${ingName}`
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-orange-500">{typeof m === 'string' ? m : `${m.name} (${m.quantity} ${m.unit})`}</span>
                        <button
                          onClick={() => isPaidPlan ? handleFindSubstitutes(m, 'family', familyRecipe.name) : navigate('/app/settings')}
                              className="text-xs text-primary hover:underline font-medium ml-2 whitespace-nowrap"
                            >
                              {!isPaidPlan ? '🔒 Upgrade' : activeSubstitution === key ? 'Hide' : '🔄 Substitute'}
                        </button>
                      </div>
                      {activeSubstitution === key && (
                        <div className="mt-2 bg-white rounded-btn border border-blue-100 p-3">
                          {substitutionLoading[key] ? (
                            <p className="text-xs text-textMuted">Finding substitutes...</p>
                          ) : substitutions[key] ? (
                            <>
                              {substitutions[key].tip && (
                                <p className="text-xs text-textMuted mb-2 italic">{substitutions[key].tip}</p>
                              )}
                              <div className="space-y-2">
                                {substitutions[key].substitutions?.map((sub, si) => (
                                  <div key={si} className={`flex items-start justify-between rounded-btn px-2 py-1.5 border ${qualityColor(sub.quality)}`}>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1 flex-wrap">
                                        <span className="text-xs font-medium">{sub.name}</span>
                                        {sub.inPantry && <span className="text-xs bg-green-100 text-success px-1.5 py-0.5 rounded-pill">✓ In pantry</span>}
                                      </div>
                                      <p className="text-xs opacity-75 mt-0.5">{sub.ratio} · {sub.note}</p>
                                    </div>
                                    <span className="text-xs font-medium ml-2 whitespace-nowrap opacity-75">{qualityLabel(sub.quality)}</span>
                                  </div>
                                ))}
                              </div>
                            </>
                          ) : null}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {familyRecipe.steps?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-textPrimary mb-3">How to make it</p>
              <ol className="space-y-3">
                {familyRecipe.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                    <p className="text-sm text-textMuted leading-relaxed">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {familyRecipe.nutrition && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs font-semibold text-textPrimary mb-3">Nutrition per serving</p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Calories', value: familyRecipe.nutritionPerServing?.calories, unit: 'kcal', color: 'bg-orange-50 text-orange-600' },
                  { label: 'Protein', value: familyRecipe.nutritionPerServing?.protein, unit: 'g', color: 'bg-blue-50 text-primary' },
                  { label: 'Carbs', value: familyRecipe.nutritionPerServing?.carbs, unit: 'g', color: 'bg-yellow-50 text-yellow-600' },
                  { label: 'Fat', value: familyRecipe.nutritionPerServing?.fat, unit: 'g', color: 'bg-red-50 text-danger' },
                  { label: 'Fiber', value: familyRecipe.nutritionPerServing?.fiber, unit: 'g', color: 'bg-green-50 text-success' },
                  { label: 'Sugar', value: familyRecipe.nutritionPerServing?.sugar, unit: 'g', color: 'bg-pink-50 text-pink-600' },
                  { label: 'Sodium', value: familyRecipe.nutritionPerServing?.sodium, unit: 'mg', color: 'bg-purple-50 text-purple-600' },
                ].map((item, i) => (
                  <div key={i} className={`rounded-btn p-2 text-center ${item.color}`}>
                    <p className="text-sm font-bold">{item.value}</p>
                    <p className="text-xs opacity-75">{item.unit}</p>
                    <p className="text-xs font-medium mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => handleCook(familyRecipe, 'family')}
            className={`w-full py-3 rounded-btn text-sm font-medium transition-all mt-4 ${
              cookedId === 'family' ? 'bg-success text-white' : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {cookedId === 'family' ? '✓ Cooked! Pantry updated' : '🍳 I cooked this — update pantry'}
          </button>
        </div>
      )}

      {/* Results */}
      {generated && recipes.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="font-semibold text-textPrimary">{recipes.length} recipes suggested for {mealType.toLowerCase()}</h2>
            <span className="text-xs bg-green-50 text-success border border-green-100 px-3 py-1 rounded-pill font-medium">Based on your pantry</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {recipes.map((recipe, idx) => (
              <div key={idx} className="card hover:shadow-md transition-all">

                <div className="flex items-start justify-between mb-3">
                  <div className="text-4xl">{recipe.icon}</div>
                  <span className={`text-xs px-2.5 py-1 rounded-pill font-medium ${
                    recipe.difficulty === 'Easy' ? 'bg-green-50 text-success' : 'bg-orange-50 text-orange-500'
                  }`}>
                    {recipe.difficulty}
                  </span>
                </div>

                <h3 className="font-semibold text-textPrimary text-lg mb-1">{recipe.name}</h3>
                <p className="text-sm text-textMuted mb-3 leading-relaxed">{recipe.description}</p>

                <div className="flex gap-2 flex-wrap mb-3">
                  {recipe.tags?.map(tag => (
                    <span key={tag} className="text-xs bg-blue-50 text-primary px-2.5 py-1 rounded-pill border border-blue-100">{tag}</span>
                  ))}
                </div>

                <div className="flex items-center gap-4 text-xs text-textMuted mb-4 border-t border-border pt-3">
                  <span>⏱ {recipe.time}</span>
                  <span>👥 Serves {recipe.serves}</span>
                </div>

                {/* Allergen warnings */}
                {recipe.allergenWarnings?.length > 0 && (
                  <div className="bg-red-50 border border-red-100 rounded-btn px-3 py-2 mb-3">
                    <p className="text-xs font-semibold text-danger mb-1">⚠️ Allergen warnings</p>
                    {recipe.allergenWarnings.map((w, i) => (
                      <p key={i} className="text-xs text-red-600">contains {w.allergen} ({w.ingredient})</p>
                    ))}
                  </div>
                )}

                {/* Missing ingredients with substitution buttons */}
                {recipe.missing?.length > 0 && (
                  <div className="bg-orange-50 border border-orange-100 rounded-btn px-3 py-2 mb-4">
                    <div className="flex items-center justify-between mb-2">
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
                    <div className="space-y-2">
                      {recipe.missing.map((m, i) => {
                        const ingName = typeof m === 'string' ? m : m.name
                        const key = `${idx}-${ingName}`
                        return (
                          <div key={i}>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-orange-500">{typeof m === 'string' ? m : `${m.name} (${m.quantity} ${m.unit})`}</span>
                              <button
                                onClick={() => isPaidPlan ? handleFindSubstitutes(m, idx, recipe.name) : navigate('/app/settings')}
                              className="text-xs text-primary hover:underline font-medium ml-2 whitespace-nowrap"
                            >
                              {!isPaidPlan ? '🔒 Upgrade' : activeSubstitution === key ? 'Hide' : '🔄 Substitute'}
                              </button>
                            </div>
                            {activeSubstitution === key && (
                              <div className="mt-2 bg-white rounded-btn border border-blue-100 p-3">
                                {substitutionLoading[key] ? (
                                  <p className="text-xs text-textMuted">Finding substitutes...</p>
                                ) : substitutions[key] ? (
                                  <>
                                    {substitutions[key].tip && (
                                      <p className="text-xs text-textMuted mb-2 italic">{substitutions[key].tip}</p>
                                    )}
                                    <div className="space-y-2">
                                      {substitutions[key].substitutions?.map((sub, si) => (
                                        <div key={si} className={`flex items-start justify-between rounded-btn px-2 py-1.5 border ${qualityColor(sub.quality)}`}>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1 flex-wrap">
                                              <span className="text-xs font-medium">{sub.name}</span>
                                              {sub.inPantry && <span className="text-xs bg-green-100 text-success px-1.5 py-0.5 rounded-pill">✓ In pantry</span>}
                                            </div>
                                            <p className="text-xs opacity-75 mt-0.5">{sub.ratio} · {sub.note}</p>
                                          </div>
                                          <span className="text-xs font-medium ml-2 whitespace-nowrap opacity-75">{qualityLabel(sub.quality)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </>
                                ) : null}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {recipe.missing?.length === 0 && (
                  <div className="bg-green-50 border border-green-100 rounded-btn px-3 py-2 mb-4">
                    <p className="text-xs font-medium text-success">✓ All ingredients in stock!</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setExpandedId(expandedId === idx ? null : idx)}
                    className="btn-secondary flex-1 text-sm"
                  >
                    {expandedId === idx ? 'Hide' : 'View ingredients'}
                  </button>
                  <button
                    onClick={() => handleCook(recipe, idx)}
                    className={`flex-1 text-sm py-2 px-3 rounded-btn font-medium transition-all ${
                      cookedId === idx ? 'bg-success text-white' : 'bg-green-50 text-success border border-green-200 hover:bg-green-100'
                    }`}
                  >
                    {cookedId === idx ? '✓ Pantry updated!' : '🍳 I cooked this'}
                  </button>
                </div>

                {expandedId === idx && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs font-semibold text-textPrimary mb-2">Ingredients</p>
                    <ul className="space-y-1.5 mb-5">
                      {recipe.ingredients?.map(ing => (
                        <li key={typeof ing === 'string' ? ing : ing.name} className="flex items-center gap-2 text-sm text-textMuted">
                          <span className="w-4 h-4 rounded-full bg-green-100 text-success flex items-center justify-center text-xs flex-shrink-0">✓</span>
                          {typeof ing === 'string' ? ing : `${ing.name} — ${ing.quantity} ${ing.unit}`}
                        </li>
                      ))}
                      {recipe.missing?.map(ing => (
                        <li key={typeof ing === 'string' ? ing : ing.name} className="flex items-center gap-2 text-sm text-textMuted">
                          <span className="w-4 h-4 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center text-xs flex-shrink-0">+</span>
                          {typeof ing === 'string' ? ing : `${ing.name} — ${ing.quantity} ${ing.unit}`}
                          <span className="text-xs text-orange-400">(need to buy)</span>
                        </li>
                      ))}
                    </ul>

                    {recipe.steps?.length > 0 && (
                      <>
                        <p className="text-xs font-semibold text-textPrimary mb-3">How to make it</p>
                        <ol className="space-y-3">
                          {recipe.steps.map((step, i) => (
                            <li key={i} className="flex items-start gap-3">
                              <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                              <p className="text-sm text-textMuted leading-relaxed">{step}</p>
                            </li>
                          ))}
                        </ol>
                      </>
                    )}

                    {recipe.nutrition && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-xs font-semibold text-textPrimary mb-3">Nutrition info</p>
                        <div className="flex gap-2 mb-3">
                          <button
                            onClick={() => setNutritionView(prev => ({ ...prev, [idx]: 'serving' }))}
                            className={`text-xs px-3 py-1 rounded-pill border transition-all ${
                              (nutritionView[idx] || 'serving') === 'serving' ? 'bg-primary text-white border-primary' : 'text-textMuted border-border'
                            }`}
                          >
                            Per serving
                          </button>
                          <button
                            onClick={() => setNutritionView(prev => ({ ...prev, [idx]: 'total' }))}
                            className={`text-xs px-3 py-1 rounded-pill border transition-all ${
                              nutritionView[idx] === 'total' ? 'bg-primary text-white border-primary' : 'text-textMuted border-border'
                            }`}
                          >
                            Total recipe
                          </button>
                        </div>
                        {(() => {
                          const n = nutritionView[idx] === 'total' ? recipe.nutrition : recipe.nutritionPerServing
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
        </>
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

    </div>
  )
}