import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMealPlan, saveMeal, deleteMeal, generateGroceryFromPlan, generateWeekPlan } from '../api/mealplan'
import { LoadingSpinner, ErrorState, Toast } from '../components/ui/PageState'
import { useToast } from '../hooks/useToast'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

const MEAL_ICONS = {
  Breakfast: '🌅',
  Lunch: '☀️',
  Dinner: '🌙',
  Snack: '🍎',
}

const getWeekStart = (offset = 0) => {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) + offset * 7
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().split('T')[0]
}

const formatWeekLabel = (weekStart) => {
  const start = new Date(weekStart)
  const end = new Date(weekStart)
  end.setDate(end.getDate() + 6)
  return `${start.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })} — ${end.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}`
}

export default function MealPlan() {
  const navigate = useNavigate()
  const { toast, showToast, hideToast } = useToast()
  const [weekOffset, setWeekOffset] = useState(0)
  const [weekStart, setWeekStart] = useState(getWeekStart(0))
  const [meals, setMeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatingWeek, setGeneratingWeek] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [selectedMeal, setSelectedMeal] = useState(null)
  const [recipeName, setRecipeName] = useState('')
  const [saving, setSaving] = useState(false)
  const [members, setMembers] = useState([])
  const [selectedMembers, setSelectedMembers] = useState([])
  const [showMemberModal, setShowMemberModal] = useState(false)

  useEffect(() => {
    const week = getWeekStart(weekOffset)
    setWeekStart(week)
    fetchMealPlan(week)
  }, [weekOffset])

  useEffect(() => {
    import('../api/family').then(m => m.getMembers()).then(data => {
      setMembers(data)
    }).catch(console.error)
  }, [])

  const fetchMealPlan = async (week) => {
    try {
      setError('')
      setLoading(true)
      const data = await getMealPlan(week)
      setMeals(data.meals || [])
    } catch (err) {
      setError('Failed to load meal plan')
    } finally {
      setLoading(false)
    }
  }

  const getMealForSlot = (day, mealType) => {
    return meals.find(m => m.day === day && m.mealType === mealType)
  }

  const handleSlotClick = (day, mealType) => {
    setSelectedSlot({ day, mealType })
    setRecipeName('')
    setShowAddModal(true)
  }

  const handleMealClick = (meal, e) => {
    e.stopPropagation()
    setSelectedMeal(meal)
    setShowDetailModal(true)
  }

  const handleSaveMeal = async () => {
    if (!recipeName.trim()) return
    setSaving(true)
    try {
      const meal = await saveMeal({
        weekStart,
        day: selectedSlot.day,
        mealType: selectedSlot.mealType,
        recipeName: recipeName.trim(),
        recipeData: {},
      })
      setMeals(prev => {
        const filtered = prev.filter(m => !(m.day === selectedSlot.day && m.mealType === selectedSlot.mealType))
        return [...filtered, meal]
      })
      setShowAddModal(false)
      setRecipeName('')
      showToast('Meal added to plan!')
    } catch (err) {
      showToast('Failed to save meal', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteMeal = async (id, e) => {
    if (e) e.stopPropagation()
    try {
      await deleteMeal(id)
      setMeals(prev => prev.filter(m => m.id !== id))
      setShowDetailModal(false)
      showToast('Meal removed')
    } catch (err) {
      showToast('Failed to remove meal', 'error')
    }
  }

  const handleGenerateGrocery = async () => {
    setGenerating(true)
    try {
      const res = await generateGroceryFromPlan(weekStart)
      showToast(res.message || 'Grocery list updated!')
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to generate grocery list', 'error')
    } finally {
      setGenerating(false)
    }
  }

const handleGenerateWeek = async () => {
    setShowMemberModal(true)
  }

  const handleConfirmGenerate = async () => {
    setShowMemberModal(false)
    setGeneratingWeek(true)
    try {
      const res = await generateWeekPlan(weekStart, selectedMembers)
      setMeals(res.meals || [])
      showToast(`Generated ${res.count} meals for the week!`)
    } catch (err) {
      showToast('Failed to generate week plan', 'error')
    } finally {
      setGeneratingWeek(false)
    }
  }

  const toggleMember = (name) => {
    setSelectedMembers(prev =>
      prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]
    )
  }

  const plannedCount = meals.length
  const totalSlots = DAYS.length * MEAL_TYPES.length

  return (
    <div className="page-container">

      {/* Meal detail modal */}
      {showDetailModal && selectedMeal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-card w-full max-w-md shadow-dropdown max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-surface">
              <h3 className="font-semibold text-textPrimary flex items-center gap-2">
                <span>{selectedMeal.recipeData?.icon || MEAL_ICONS[selectedMeal.mealType]}</span>
                <span>{selectedMeal.mealType} — {selectedMeal.day}</span>
              </h3>
              <button onClick={() => setShowDetailModal(false)} className="text-textMuted hover:text-textPrimary text-xl">✕</button>
            </div>
            <div className="p-6">
              <h2 className="text-lg font-bold text-textPrimary mb-1">{selectedMeal.recipeName}</h2>

              {selectedMeal.recipeData?.description && (
                <p className="text-sm text-textMuted mb-4">{selectedMeal.recipeData.description}</p>
              )}

              <div className="flex items-center gap-4 text-xs text-textMuted mb-4 flex-wrap">
                {selectedMeal.recipeData?.time && <span>⏱ {selectedMeal.recipeData.time}</span>}
                {selectedMeal.recipeData?.calories && <span>🔥 {selectedMeal.recipeData.calories} kcal</span>}
              </div>

              {/* Ingredients */}
              {selectedMeal.recipeData?.ingredients?.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-textPrimary mb-2">Ingredients in pantry</p>
                  <div className="space-y-1">
                    {selectedMeal.recipeData.ingredients.map((ing, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-textMuted">
                        <span className="w-4 h-4 rounded-full bg-green-100 text-success flex items-center justify-center flex-shrink-0">✓</span>
                        {typeof ing === 'string' ? ing : `${ing.name} — ${ing.quantity} ${ing.unit}`}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing ingredients */}
              {selectedMeal.recipeData?.missing?.length > 0 && (
                <div className="mb-4 bg-orange-50 border border-orange-100 rounded-btn px-3 py-3">
                  <p className="text-xs font-semibold text-orange-600 mb-2">Need to buy</p>
                  <div className="space-y-1">
                    {selectedMeal.recipeData.missing.map((ing, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-textMuted">
                        <span className="w-4 h-4 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center flex-shrink-0">+</span>
                        {typeof ing === 'string' ? ing : `${ing.name} — ${ing.quantity} ${ing.unit}`}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <button
                  onClick={(e) => handleDeleteMeal(selectedMeal.id, e)}
                  className="flex-1 py-2 rounded-btn text-sm font-medium border border-red-100 text-danger hover:bg-red-50 transition-all"
                >
                  Remove meal
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 btn-primary text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Member selector modal for week generation */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-card w-full max-w-md shadow-dropdown">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-semibold text-textPrimary">✨ Auto-plan this week</h3>
              <button onClick={() => setShowMemberModal(false)} className="text-textMuted hover:text-textPrimary text-xl">✕</button>
            </div>
            <div className="p-6">
              <p className="text-sm text-textMuted mb-4">
                Who should this meal plan be for? Leave all unselected to plan for the whole family.
              </p>

              {members.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
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

              <div className="bg-yellow-50 border border-yellow-100 rounded-btn px-4 py-3 mb-6">
                <p className="text-xs text-yellow-700">
                  ⚠️ This will replace all existing meals for this week with AI suggestions.
                </p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowMemberModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button
                  onClick={handleConfirmGenerate}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  ✨ Generate {selectedMembers.length > 0 ? `for ${selectedMembers.length} member${selectedMembers.length > 1 ? 's' : ''}` : 'for whole family'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Add meal modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-card w-full max-w-md shadow-dropdown">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-semibold text-textPrimary">
                {MEAL_ICONS[selectedSlot?.mealType]} {selectedSlot?.mealType} — {selectedSlot?.day}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-textMuted hover:text-textPrimary text-xl">✕</button>
            </div>
            <div className="p-6">
              <label className="label">Recipe name</label>
              <input
                className="input mb-4"
                placeholder="e.g. Butter Chicken, Oatmeal, Salad..."
                value={recipeName}
                onChange={e => setRecipeName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveMeal()}
                autoFocus
              />
              <div className="flex gap-3">
                <button onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button
                  onClick={handleSaveMeal}
                  disabled={!recipeName.trim() || saving}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Add to plan'}
                </button>
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-textMuted mb-2">Or generate a recipe with AI</p>
                <button
                  onClick={() => { setShowAddModal(false); navigate('/app/recipes') }}
                  className="w-full text-sm text-primary border border-blue-100 bg-blue-50 rounded-btn py-2 hover:bg-blue-100 transition-all"
                >
                  🤖 Go to recipe suggestions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-textPrimary">Meal planner</h1>
          <p className="text-textMuted mt-1 text-sm">{formatWeekLabel(weekStart)}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleGenerateGrocery}
            disabled={generating || plannedCount === 0}
            className="btn-secondary text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {generating ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Adding...
              </>
            ) : '🛒 Add to grocery'}
          </button>
          <button
            onClick={handleGenerateWeek}
            disabled={generatingWeek}
            className="btn-secondary text-sm flex items-center gap-2 disabled:opacity-50 border-purple-200 text-purple-600 hover:bg-purple-50"
          >
            {generatingWeek ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Generating week...
              </>
            ) : '✨ Auto-plan week'}
          </button>
          <button
            onClick={() => navigate('/app/recipes')}
            className="btn-primary text-sm"
          >
            🤖 Get recipes
          </button>
        </div>
      </div>

      {/* Week navigation */}
      <div className="flex items-center justify-between mb-6 bg-surface rounded-card border border-border px-4 py-3">
        <button
          onClick={() => setWeekOffset(prev => prev - 1)}
          className="flex items-center gap-1 text-sm text-textMuted hover:text-textPrimary transition-colors px-2 py-1 rounded-btn hover:bg-gray-50"
        >
          ← Prev week
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-textPrimary">{formatWeekLabel(weekStart)}</p>
          {weekOffset === 0 && (
            <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-pill mt-1 inline-block">
              This week
            </span>
          )}
        </div>
        <button
          onClick={() => setWeekOffset(prev => prev + 1)}
          className="flex items-center gap-1 text-sm text-textMuted hover:text-textPrimary transition-colors px-2 py-1 rounded-btn hover:bg-gray-50"
        >
          Next week →
        </button>
      </div>

      {/* Progress */}
      <div className="card mb-6 py-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-textPrimary">Week planning progress</p>
          <p className="text-sm text-textMuted">{plannedCount}/{totalSlots} meals planned</p>
        </div>
        <div className="h-2 bg-gray-100 rounded-pill overflow-hidden">
          <div
            className="h-full bg-primary rounded-pill transition-all duration-500"
            style={{ width: `${(plannedCount / totalSlots) * 100}%` }}
          />
        </div>
      </div>

      {/* Calendar */}
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorState message={error} onRetry={() => fetchMealPlan(weekStart)} />
      ) : (
        <>
          {/* Desktop calendar */}
          <div className="hidden md:block">
            <div className="grid grid-cols-8 gap-2 mb-2">
              <div className="text-xs font-semibold text-textMuted uppercase tracking-wide py-2" />
              {DAYS.map(day => (
                <div key={day} className="text-xs font-semibold text-textMuted uppercase tracking-wide py-2 text-center">
                  {day.slice(0, 3)}
                </div>
              ))}
            </div>

            {MEAL_TYPES.map(mealType => (
              <div key={mealType} className="grid grid-cols-8 gap-2 mb-2">
                <div className="flex items-center gap-1.5 py-2">
                  <span className="text-base">{MEAL_ICONS[mealType]}</span>
                  <span className="text-xs font-medium text-textMuted">{mealType}</span>
                </div>
                {DAYS.map(day => {
                  const meal = getMealForSlot(day, mealType)
                  return (
                    <div
                      key={day}
                      className={`rounded-btn border min-h-[70px] p-2 cursor-pointer transition-all group relative ${
                        meal
                          ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                          : 'bg-surface border-border border-dashed hover:border-primary hover:bg-gray-50'
                      }`}
                      onClick={() => meal ? handleMealClick(meal, { stopPropagation: () => {} }) : handleSlotClick(day, mealType)}
                    >
                      {meal ? (
                        <div className="h-full">
                          <p className="text-xs font-medium text-primary leading-tight">
                            {meal.recipeData?.icon && <span className="mr-1">{meal.recipeData.icon}</span>}
                            {meal.recipeName}
                          </p>
                          {meal.recipeData?.calories && (
                            <p className="text-xs text-textMuted mt-1">🔥 {meal.recipeData.calories} kcal</p>
                          )}
                          {meal.recipeData?.time && (
                            <p className="text-xs text-textMuted">⏱ {meal.recipeData.time}</p>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteMeal(meal.id, e) }}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white text-danger opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-xs border border-red-100"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <span className="text-xs text-textMuted opacity-0 group-hover:opacity-100 transition-all">+ Add</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Mobile calendar */}
          <div className="md:hidden space-y-4">
            {DAYS.map(day => (
              <div key={day} className="card p-4">
                <h3 className="font-semibold text-textPrimary mb-3">{day}</h3>
                <div className="space-y-2">
                  {MEAL_TYPES.map(mealType => {
                    const meal = getMealForSlot(day, mealType)
                    return (
                      <div key={mealType} className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 w-24 flex-shrink-0">
                          <span className="text-sm">{MEAL_ICONS[mealType]}</span>
                          <span className="text-xs text-textMuted">{mealType}</span>
                        </div>
                        {meal ? (
                          <div
                            className="flex-1 flex items-center justify-between bg-blue-50 rounded-btn px-3 py-2 border border-blue-100 cursor-pointer hover:bg-blue-100 transition-all"
                            onClick={() => handleMealClick(meal, { stopPropagation: () => {} })}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-primary truncate">
                                {meal.recipeData?.icon && <span className="mr-1">{meal.recipeData.icon}</span>}
                                {meal.recipeName}
                              </p>
                              {meal.recipeData?.calories && (
                                <p className="text-xs text-textMuted">🔥 {meal.recipeData.calories} kcal</p>
                              )}
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteMeal(meal.id, e) }}
                              className="text-danger text-xs ml-2 hover:bg-red-50 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleSlotClick(day, mealType)}
                            className="flex-1 text-xs text-textMuted border border-dashed border-border rounded-btn px-3 py-2 hover:border-primary hover:text-primary transition-all text-left"
                          >
                            + Add meal
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
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