import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import CookingLoader from '../components/ui/CookingLoader'
import Icon from '../components/ui/Icon'
import DishArt from '../components/ui/DishArt'
import { getRecipeCategory } from '../utils/recipeImagery'
import { getMealPlan, saveMeal, deleteMeal, generateGroceryFromPlan, generateWeekPlan, markMealCooked } from '../api/mealplan'
import { cookRecipe } from '../api/recipes'
import { logNutrition } from '../api/healthProgress'
import { LoadingSpinner, ErrorState, Toast } from '../components/ui/PageState'
import { useToast } from '../hooks/useToast'
import { useAuthStore } from '../store/authStore'
import { useAppConfigStore } from '../store/appConfigStore'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

const CUISINES = [
  { label: 'Punjabi', icon: '🫓' },
  { label: 'South Asian', icon: '🍛' },
  { label: 'Italian', icon: '🍝' },
  { label: 'Mexican', icon: '🌮' },
  { label: 'Chinese', icon: '🥢' },
  { label: 'Middle Eastern', icon: '🧆' },
  { label: 'Japanese', icon: '🍱' },
  { label: 'Canadian / Western', icon: '🍁' },
]
const MEAL_ICONS = { Breakfast: 'sunrise', Lunch: 'sun', Dinner: 'moon', Snack: 'leaf' }

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

const getTodayName = () => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[new Date().getDay()]
}

export default function MealPlan() {
  const navigate = useNavigate()
  const { toast, showToast, hideToast } = useToast()
  const { family } = useAuthStore()
  const { isFeatureEnabled } = useAppConfigStore()
  const plan = family?.plan?.toLowerCase() || 'free'
  const canAutoplan = isFeatureEnabled('ai_meal_planner', plan) && plan === 'premium'
  const canGroceryFromPlan = isFeatureEnabled('grocery_from_plan', plan) && plan === 'premium'
  const todayName = getTodayName()

  const [weekOffset, setWeekOffset] = useState(0)
  const [activeMobileDay, setActiveMobileDay] = useState(DAYS[0])
  const [weekStart, setWeekStart] = useState(getWeekStart(0))
  const [meals, setMeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatingWeek, setGeneratingWeek] = useState(false)
  const [weekGenDone, setWeekGenDone] = useState(false)
  const [weekGenError, setWeekGenError] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [selectedMeal, setSelectedMeal] = useState(null)
  const [recipeName, setRecipeName] = useState('')
  const [saving, setSaving] = useState(false)
  const [members, setMembers] = useState([])
  const [selectedMembers, setSelectedMembers] = useState([])
  const [cooking, setCooking] = useState(false)
  const [cookedModal, setCookedModal] = useState(null)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [selectedCuisines, setSelectedCuisines] = useState([])

  useEffect(() => {
    const week = getWeekStart(weekOffset)
    setWeekStart(week)
    fetchMealPlan(week)
  }, [weekOffset])

  useEffect(() => {
    import('../api/family').then(m => m.getMembers()).then(data => setMembers(data)).catch(console.error)
  }, [])

  const fetchMealPlan = async (week) => {
    try {
      setError('')
      setLoading(true)
      const data = await getMealPlan(week)
      setMeals(data.meals || [])
    } catch {
      setError('Failed to load meal plan')
    } finally {
      setLoading(false)
    }
  }

  const getMealForSlot = (day, mealType) => meals.find(m => m.day === day && m.mealType === mealType)

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
      const meal = await saveMeal({ weekStart, day: selectedSlot.day, mealType: selectedSlot.mealType, recipeName: recipeName.trim(), recipeData: {} })
      setMeals(prev => {
        const filtered = prev.filter(m => !(m.day === selectedSlot.day && m.mealType === selectedSlot.mealType))
        return [...filtered, meal]
      })
      setShowAddModal(false)
      setRecipeName('')
      showToast('Meal added to plan!')
    } catch {
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
    } catch {
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

  const handleGenerateWeek = () => setShowMemberModal(true)

  const handleConfirmGenerate = async () => {
    setShowMemberModal(false)
    setGeneratingWeek(true)
    setWeekGenDone(false)
    setWeekGenError(false)
    try {
      const res = await generateWeekPlan(weekStart, selectedMembers, selectedCuisines)
      setMeals(res.meals || [])
      showToast(`Generated ${res.count} meals for the week!`)
      setWeekGenDone(true)
      await new Promise(r => setTimeout(r, 800))
    } catch (err) {
      console.error('Week plan error:', err)
      setWeekGenError(true)
      await new Promise(r => setTimeout(r, 400))
      showToast(err.response?.data?.error || 'Failed to generate week plan. Please try again.', 'error')
    } finally {
      setGeneratingWeek(false)
      setWeekGenDone(false)
      setWeekGenError(false)
    }
  }

  const handleCookFromPlan = async (meal) => {
    if (!meal.recipeData?.ingredients) { showToast('No recipe data available for this meal', 'error'); return }
    setCooking(true)
    try {
      const cookResult = await cookRecipe({ ingredients: meal.recipeData.ingredients })
      const _r = cookResult?.results || []
      const _ok = _r.filter(r => !r.reason).length
      const _skip = _r.filter(r => r.reason).length
      const pantryLabel = _ok > 0 ? (_skip > 0 ? `${_ok} items (${_skip} skipped)` : `${_ok} items`) : null
      const _plannedFor = meal.recipeData?.plannedFor
      const membersToLog = (Array.isArray(_plannedFor) && _plannedFor.length > 0)
        ? members.filter(m => _plannedFor.includes(m.name) && !m.isBaby).map(m => m.name)
        : members.filter(m => !m.isBaby).map(m => m.name)
      let nutritionLogged = false
      const nutritionData = meal.recipeData.nutritionPerServing || meal.recipeData.nutrition
      if (nutritionData && membersToLog.length > 0) {
        try { await logNutrition(membersToLog, meal.recipeName, meal.mealType, nutritionData); nutritionLogged = true }
        catch (e) { console.log('Nutrition log skipped:', e.message) }
      }
      await markMealCooked(meal.id)
      setMeals(prev => prev.map(m => m.id === meal.id ? { ...m, cooked: true, cookedAt: new Date() } : m))
      setShowDetailModal(false)
      setCookedModal({ recipe: meal, membersLogged: nutritionLogged ? membersToLog : [], mealPlanMarked: true, pantryLabel })
    } catch {
      showToast('Failed to cook meal', 'error')
    } finally {
      setCooking(false)
    }
  }

  const toggleMember = (name) => setSelectedMembers(prev => prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name])
  const toggleCuisine = (label) => setSelectedCuisines(prev => prev.includes(label) ? prev.filter(x => x !== label) : [...prev, label])

  const plannedCount = meals.length
  const totalSlots = DAYS.length * MEAL_TYPES.length

  const modalBase = 'fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center sm:justify-center sm:p-4 backdrop-blur-sm'
  const modalBox = 'bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-lift max-h-[90dvh] overflow-y-auto modal-sheet'
  const modalHeader = 'flex items-center justify-between px-6 py-4 border-b border-[#E7D5C3] sticky top-0 bg-white rounded-t-3xl modal-header'
  const closeBtn = 'w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-600 transition-colors'

  return (
    <div className="page-container">

      {/* Meal detail modal */}
      {showDetailModal && selectedMeal && (
        <div className={modalBase}>
          <div className={modalBox}>
            <div className={modalHeader}>
              <h3 className="font-semibold text-stone-900 flex items-center gap-2">
                {selectedMeal.recipeData?.icon ? <span>{selectedMeal.recipeData.icon}</span> : <Icon name={MEAL_ICONS[selectedMeal.mealType]} size={16} />}
                <span>{selectedMeal.mealType} — {selectedMeal.day}</span>
              </h3>
              <button onClick={() => setShowDetailModal(false)} className={closeBtn} aria-label="Close"><Icon name="close" size={16} /></button>
            </div>
            <div className="p-6 modal-body">
              <h2 className="font-display text-xl font-semibold text-stone-900 mb-1">{selectedMeal.recipeName}</h2>
              {selectedMeal.recipeData?.description && <p className="text-sm text-stone-600 mb-4">{selectedMeal.recipeData.description}</p>}
              <div className="flex items-center gap-4 text-xs text-stone-600 mb-4 flex-wrap">
                {selectedMeal.recipeData?.time && <span className="flex items-center gap-1"><Icon name="clock" size={12} />{selectedMeal.recipeData.time}</span>}
                {selectedMeal.recipeData?.calories && <span className="flex items-center gap-1"><Icon name="flame" size={12} className="text-food-600" />{selectedMeal.recipeData.calories} kcal</span>}
              </div>

              {selectedMeal.recipeData?.nutrition && (
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[
                    { label: 'Calories', value: selectedMeal.recipeData.nutrition.calories, unit: 'kcal', bg: 'bg-orange-50', color: 'text-food-600' },
                    { label: 'Protein', value: selectedMeal.recipeData.nutrition.protein, unit: 'g', bg: 'bg-indigo-50', color: 'text-indigo-700' },
                    { label: 'Carbs', value: selectedMeal.recipeData.nutrition.carbs, unit: 'g', bg: 'bg-yellow-50', color: 'text-yellow-700' },
                    { label: 'Fat', value: selectedMeal.recipeData.nutrition.fat, unit: 'g', bg: 'bg-red-50', color: 'text-red-600' },
                  ].map((item, i) => (
                    <div key={i} className={`rounded-2xl p-2 text-center ${item.bg}`}>
                      <p className={`text-sm font-bold ${item.color}`}>{item.value}</p>
                      <p className="text-xs text-stone-500">{item.unit}</p>
                      <p className={`text-xs font-semibold mt-0.5 ${item.color}`}>{item.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {selectedMeal.recipeData?.ingredients?.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-stone-700 mb-2">Ingredients in pantry</p>
                  <div className="space-y-1">
                    {selectedMeal.recipeData.ingredients.map((ing, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-stone-600">
                        <span className="w-4 h-4 rounded-full bg-green-100 text-green-700 flex items-center justify-center flex-shrink-0"><Icon name="check" size={10} /></span>
                        {typeof ing === 'string' ? ing : `${ing.name} — ${ing.quantity} ${ing.unit}`}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedMeal.recipeData?.missing?.length > 0 && (
                <div className="mb-4 bg-amber-50 border border-amber-200 rounded-2xl px-3 py-3">
                  <p className="text-xs font-semibold text-amber-800 mb-2">Need to buy</p>
                  <div className="space-y-1">
                    {selectedMeal.recipeData.missing.map((ing, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-stone-600">
                        <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">+</span>
                        {typeof ing === 'string' ? ing : `${ing.name} — ${ing.quantity} ${ing.unit}`}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedMeal.recipeData?.steps?.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-stone-700 mb-2">How to make it</p>
                  <ol className="space-y-2">
                    {selectedMeal.recipeData.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i+1}</span>
                        <p className="text-sm text-stone-600 leading-relaxed">{step}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {selectedMeal.cooked && (
                <div className="mb-4 bg-green-50 border border-green-200 rounded-2xl px-4 py-3 flex items-center gap-2">
                  <Icon name="check" size={18} className="text-green-600 flex-shrink-0" />
                  <p className="text-sm font-semibold text-green-800">
                    Cooked {selectedMeal.cookedAt ? new Date(selectedMeal.cookedAt).toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' }) : 'already'}
                  </p>
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <button onClick={(e) => handleDeleteMeal(selectedMeal.id, e)} className="py-2.5 px-4 rounded-full text-sm font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition-all">Remove</button>
                {!selectedMeal.cooked && (
                  <button onClick={() => handleCookFromPlan(selectedMeal)} disabled={cooking} className="flex-1 btn-primary text-sm flex items-center justify-center gap-2">
                    {cooking ? (
                      <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Cooking…</>
                    ) : <><Icon name="utensils" size={15} className="inline-block mr-1" />I cooked this</>}
                  </button>
                )}
                <button onClick={() => setShowDetailModal(false)} className={`${selectedMeal.cooked ? 'flex-1' : ''} btn-secondary text-sm`}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <CookingLoader mode="weekplan" visible={generatingWeek} done={weekGenDone} error={weekGenError} />

      {/* Member selector modal */}
      {showMemberModal && (
        <div className={modalBase}>
          <div className={modalBox}>
            <div className={modalHeader}>
              <h3 className="font-semibold text-stone-900 flex items-center gap-2"><span>🫧</span> Auto-plan this week</h3>
              <button onClick={() => setShowMemberModal(false)} className={closeBtn} aria-label="Close"><Icon name="close" size={16} /></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-stone-600 mb-4">Who should this meal plan be for? Leave all unselected to plan for the whole family.</p>
              {members.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {members.map(m => (
                    <button key={m.id} onClick={() => toggleMember(m.name)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all ${selectedMembers.includes(m.name) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-stone-600 border-[#E7D5C3] hover:border-indigo-300 hover:text-indigo-700'}`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${selectedMembers.includes(m.name) ? 'bg-white text-indigo-600' : 'bg-stone-100 text-stone-600'}`}>{m.name[0]}</div>
                      {m.name}
                    </button>
                  ))}
                </div>
              )}
              <div className="mb-6">
                <p className="text-sm font-semibold text-stone-800 mb-1">Cuisine preferences</p>
                <p className="text-xs text-stone-600 mb-3">Leave unselected to mix all cuisines</p>
                <div className="flex flex-wrap gap-2">
                  {CUISINES.map(c => (
                    <button key={c.label} onClick={() => toggleCuisine(c.label)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${selectedCuisines.includes(c.label) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-stone-600 border-[#E7D5C3] hover:border-indigo-300 hover:text-indigo-700'}`}>
                      {c.icon} {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-6">
                <p className="text-xs text-amber-800 flex items-center gap-1.5">
                  <Icon name="warning" size={14} className="text-amber-600 flex-shrink-0" />
                  This will replace all existing meals for this week with AI suggestions.
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowMemberModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleConfirmGenerate} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <span>🫧</span> Generate {selectedMembers.length > 0 ? `for ${selectedMembers.length} member${selectedMembers.length > 1 ? 's' : ''}` : 'for whole family'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add meal modal */}
      {showAddModal && (
        <div className={modalBase}>
          <div className={modalBox}>
            <div className={modalHeader}>
              <h3 className="font-semibold text-stone-900 flex items-center gap-2">
                <Icon name={MEAL_ICONS[selectedSlot?.mealType] || 'utensils'} size={15} />
                {selectedSlot?.mealType} — {selectedSlot?.day}
              </h3>
              <button onClick={() => setShowAddModal(false)} className={closeBtn} aria-label="Close"><Icon name="close" size={16} /></button>
            </div>
            <div className="p-6">
              <label className="label">Recipe name</label>
              <input className="input mb-4" placeholder="e.g. Butter Chicken, Oatmeal, Salad…" value={recipeName} onChange={e => setRecipeName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveMeal()} autoFocus />
              <div className="flex gap-3">
                <button onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleSaveMeal} disabled={!recipeName.trim() || saving} className="btn-primary flex-1 disabled:opacity-50">
                  {saving ? 'Saving…' : 'Add to plan'}
                </button>
              </div>
              <div className="mt-4 pt-4 border-t border-[#E7D5C3]">
                <p className="text-xs text-stone-600 mb-2">Or generate a recipe with AI</p>
                <button onClick={() => { setShowAddModal(false); navigate('/app/recipes') }} className="w-full text-sm text-indigo-700 border border-indigo-200 bg-indigo-50 rounded-2xl py-2.5 hover:bg-indigo-100 transition-all flex items-center justify-center gap-2">
                  <span>🫧</span> Go to recipe suggestions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="flex flex-col justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-stone-900 tracking-tight">Meal planner</h1>
          <p className="text-stone-600 mt-1 text-sm">{formatWeekLabel(weekStart)}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {isFeatureEnabled('grocery_from_plan', plan) && (
            <button
              onClick={canGroceryFromPlan ? handleGenerateGrocery : () => navigate('/app/settings?tab=plan')}
              disabled={generating || plannedCount === 0}
              className="btn-secondary text-sm flex items-center gap-2 disabled:opacity-50"
            >
              {generating
                ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Adding…</>
                : canGroceryFromPlan ? <><Icon name="grocery" size={15} /> Add to grocery</> : <><Icon name="star" size={15} /> Upgrade to Premium</>}
            </button>
          )}
          {isFeatureEnabled('ai_meal_planner', plan) && (
            <button
              onClick={canAutoplan ? handleGenerateWeek : () => navigate('/app/settings?tab=plan')}
              disabled={generatingWeek}
              className="btn-secondary text-sm flex items-center gap-2 disabled:opacity-50 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            >
              {generatingWeek
                ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Generating…</>
                : canAutoplan ? <><span>🫧</span> Auto-plan week <Icon name="crown" size={15} /></> : <><Icon name="star" size={15} /> Upgrade to Premium</>}
            </button>
          )}
          <button onClick={() => navigate('/app/recipes')} className="btn-primary text-sm flex items-center gap-2">
            <Icon name="recipes" size={16} /> Get recipes
          </button>
        </div>
      </div>

      {/* Week navigation */}
      <div className="flex items-center justify-between mb-5 bg-white rounded-3xl border border-[#E7D5C3] px-5 py-3.5">
        <button onClick={() => setWeekOffset(prev => prev - 1)} className="flex items-center gap-1 text-sm text-stone-600 hover:text-stone-900 transition-colors px-2 py-1.5 rounded-full hover:bg-stone-100">
          ← Prev
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-stone-900">{formatWeekLabel(weekStart)}</p>
          {weekOffset === 0 && <span className="text-xs bg-indigo-600 text-white px-2.5 py-0.5 rounded-full mt-1 inline-block">This week</span>}
        </div>
        <button onClick={() => setWeekOffset(prev => prev + 1)} className="flex items-center gap-1 text-sm text-stone-600 hover:text-stone-900 transition-colors px-2 py-1.5 rounded-full hover:bg-stone-100">
          Next →
        </button>
      </div>

      {/* Progress */}
      <div className="card mb-5 py-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-stone-800">Week planning progress</p>
          <p className="text-sm text-stone-600">{plannedCount}/{totalSlots} meals planned</p>
        </div>
        <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
          <div className="h-full bg-food-600 rounded-full transition-all duration-500" style={{ width: `${(plannedCount / totalSlots) * 100}%` }} />
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
          <div className="hidden md:block overflow-x-auto">
            <div className="grid grid-cols-8 gap-1.5 mb-1.5 min-w-[700px]">
              <div />
              {DAYS.map(day => {
                const isToday = weekOffset === 0 && day === todayName
                return (
                  <div key={day} className={`text-xs font-semibold uppercase tracking-wide py-2 text-center rounded-xl ${isToday ? 'bg-indigo-600 text-white' : 'text-stone-500'}`}>
                    {day.slice(0, 3)}
                  </div>
                )
              })}
            </div>

            {MEAL_TYPES.map(mealType => (
              <div key={mealType} className="grid grid-cols-8 gap-1.5 mb-1.5 min-w-[700px]">
                <div className="flex items-center gap-1.5 py-2">
                  <Icon name={MEAL_ICONS[mealType]} size={14} className="text-food-600 flex-shrink-0" />
                  <span className="text-xs font-semibold text-stone-600">{mealType}</span>
                </div>
                {DAYS.map(day => {
                  const meal = getMealForSlot(day, mealType)
                  const isToday = weekOffset === 0 && day === todayName
                  return (
                    <div
                      key={day}
                      className={`rounded-2xl border min-h-[72px] p-2 cursor-pointer transition-all group relative ${
                        meal
                          ? isToday
                            ? 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100'
                            : 'bg-white border-[#E7D5C3] hover:bg-orange-50 hover:border-orange-200'
                          : 'bg-white border-dashed border-[#E7D5C3] hover:border-indigo-300 hover:bg-indigo-50'
                      }`}
                      onClick={() => meal ? handleMealClick(meal, { stopPropagation: () => {} }) : handleSlotClick(day, mealType)}
                    >
                      {meal ? (
                        <div className="h-full flex flex-col gap-0.5">
                          <DishArt category={getRecipeCategory(meal.recipeName)} size="xs" />
                          <p className="text-xs font-semibold text-stone-900 leading-tight line-clamp-2">{meal.recipeName}</p>
                          {meal.cooked && <span className="text-xs text-green-700 font-semibold flex items-center gap-0.5"><Icon name="check" size={9} />Done</span>}
                          {meal.recipeData?.calories && <p className="text-xs text-stone-600 flex items-center gap-0.5"><Icon name="flame" size={10} className="text-food-600" />{meal.recipeData.calories}</p>}
                          {Array.isArray(meal.recipeData?.plannedFor) && meal.recipeData.plannedFor.length > 0 && (
                            <p className="text-xs text-stone-500 truncate">{meal.recipeData.plannedFor.join(', ')}</p>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteMeal(meal.id, e) }}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white text-red-500 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center border border-red-100"
                            aria-label="Remove meal"
                          >
                            <Icon name="close" size={9} />
                          </button>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <span className="text-xs">🫧</span>
                          <span className="text-xs text-indigo-600 font-medium">Suggest</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Mobile calendar */}
          <div className="md:hidden">
            <div className="relative mb-4">
              <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
                {DAYS.map(day => {
                  const isToday = weekOffset === 0 && day === todayName
                  return (
                    <button
                      key={day}
                      onClick={() => setActiveMobileDay(day)}
                      className={`flex-shrink-0 px-3.5 py-2 rounded-full text-xs font-semibold transition-all ${
                        activeMobileDay === day
                          ? isToday ? 'bg-indigo-600 text-white' : 'bg-stone-900 text-white'
                          : isToday ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-white border border-[#E7D5C3] text-stone-600'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  )
                })}
              </div>
              <div className="pointer-events-none absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-[#FFF8F1] to-transparent" />
            </div>

            <div className="space-y-3">
              {DAYS.filter(day => day === activeMobileDay).map(day => (
                <div key={day} className="card p-4">
                  <h3 className="font-display font-semibold text-stone-900 mb-3">{day}</h3>
                  <div className="space-y-2">
                    {MEAL_TYPES.map(mealType => {
                      const meal = getMealForSlot(day, mealType)
                      return (
                        <div key={mealType} className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 w-24 flex-shrink-0">
                            <Icon name={MEAL_ICONS[mealType]} size={14} className="text-food-600" />
                            <span className="text-xs text-stone-600 font-medium">{mealType}</span>
                          </div>
                          {meal ? (
                            <div
                              className="flex-1 min-w-0 flex items-center justify-between bg-orange-50 rounded-2xl px-3 py-2 border border-orange-100 cursor-pointer transition-all hover:bg-orange-100"
                              onClick={() => handleMealClick(meal, { stopPropagation: () => {} })}
                            >
                              <DishArt category={getRecipeCategory(meal.recipeName)} size="xs" className="flex-shrink-0 mr-2" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-stone-900 truncate">{meal.recipeName}</p>
                                {meal.cooked && <span className="text-xs text-green-700 font-semibold flex items-center gap-0.5"><Icon name="check" size={9} />Done</span>}
                                {meal.recipeData?.calories && <p className="text-xs text-stone-600 flex items-center gap-0.5"><Icon name="flame" size={10} className="text-food-600" />{meal.recipeData.calories} kcal</p>}
                                {Array.isArray(meal.recipeData?.plannedFor) && meal.recipeData.plannedFor.length > 0 && (
                                  <p className="text-xs text-stone-500 truncate">{meal.recipeData.plannedFor.join(', ')}</p>
                                )}
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteMeal(meal.id, e) }}
                                className="text-red-400 ml-2 hover:bg-red-50 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
                                aria-label="Remove meal"
                              >
                                <Icon name="close" size={12} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleSlotClick(day, mealType)}
                              className="flex-1 flex items-center justify-center gap-1.5 text-xs text-indigo-600 border border-dashed border-indigo-200 rounded-2xl px-3 py-2 hover:bg-indigo-50 transition-all min-h-[36px]"
                            >
                              <span className="text-sm">🫧</span> Suggest
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* "I cooked this" confirmation */}
      {cookedModal && (
        <div className={`${modalBase} backdrop-blur-sm`}>
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-lift w-full sm:max-w-sm p-6 modal-sheet">
            <div className="flex justify-center mb-3"><Icon name="check" size={48} className="text-green-600" /></div>
            <h3 className="font-display text-xl font-semibold text-stone-900 text-center mb-1">Nice cook!</h3>
            <p className="text-sm text-stone-600 text-center mb-5">Here's what Nooka updated for you</p>
            <div className="space-y-2.5 mb-6">
              {[
                { icon: 'pantry', ok: !!cookedModal.pantryLabel, label: cookedModal.pantryLabel ? 'Pantry updated' : 'Pantry unchanged', sub: cookedModal.pantryLabel ?? 'No items matched' },
                { icon: 'health', ok: cookedModal.membersLogged.length > 0, label: 'Nutrition logged', sub: cookedModal.membersLogged.length > 0 ? `For ${cookedModal.membersLogged.join(', ')}` : 'No nutrition data available' },
                { icon: 'mealplan', ok: true, label: 'Meal plan', sub: 'Slot marked as done' },
              ].map((row, i) => (
                <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${row.ok ? 'bg-green-50 border-green-200' : 'bg-stone-50 border-[#E7D5C3]'}`}>
                  <Icon name={row.icon} size={20} className={`${row.ok ? 'text-green-600' : 'text-stone-500'} flex-shrink-0`} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-stone-900">{row.label}</p>
                    <p className="text-xs text-stone-600">{row.sub}</p>
                  </div>
                  {row.ok ? <Icon name="check" size={18} className="text-green-600 flex-shrink-0" /> : <span className="text-stone-300 text-lg">—</span>}
                </div>
              ))}
            </div>
            <button onClick={() => setCookedModal(null)} className="btn-primary w-full">Done</button>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  )
}
