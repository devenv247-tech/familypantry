import { useState, useEffect } from 'react'
import Icon from '../components/ui/Icon'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import { getDashboardStats, getRecentActivity, getWasteSavings, getNudges, getTonightSuggestion } from '../api/dashboard'
import { getMealPlan, markMealCooked } from '../api/mealplan'
import { cookRecipe } from '../api/recipes'
import { logNutrition } from '../api/healthProgress'
import { getMembers } from '../api/family'
import { getExpiringSoon } from '../api/expiry'
import { getHealthProgress } from '../api/healthProgress'
import { useAppConfigStore } from '../store/appConfigStore'
import { LoadingSpinner, ErrorState, Toast } from '../components/ui/PageState'
import DishArt from '../components/ui/DishArt'
import { getRecipeCategory } from '../utils/recipeImagery'
import { filterStaples } from '../utils/assumedStaples'
import { useToast } from '../hooks/useToast'

const SEASONAL_DATA = {
  spring: { icon: 'spring', color: 'border-green-200 bg-green-50', badge: 'bg-green-100 text-green-700', items: ['Asparagus', 'Spinach', 'Peas', 'Rhubarb', 'Radishes', 'Arugula', 'Leeks', 'Lettuce'] },
  summer: { icon: 'sun', color: 'border-yellow-200 bg-yellow-50', badge: 'bg-yellow-100 text-yellow-700', items: ['Strawberries', 'Corn', 'Tomatoes', 'Zucchini', 'Peaches', 'Blueberries', 'Cucumbers', 'Bell peppers'] },
  fall:   { icon: 'leaf', color: 'border-orange-200 bg-orange-50', badge: 'bg-orange-100 text-orange-700', items: ['Squash', 'Apples', 'Pears', 'Beets', 'Brussels sprouts', 'Sweet potatoes', 'Cranberries', 'Cauliflower'] },
  winter: { icon: 'snowflake', color: 'border-indigo-100 bg-indigo-50', badge: 'bg-indigo-100 text-indigo-700', items: ['Citrus', 'Oranges', 'Cabbage', 'Carrots', 'Kale', 'Potatoes', 'Grapefruit', 'Lemons'] },
}

const GOAL_LABELS = { cut: 'Cut', lean_bulk: 'Lean Bulk', recomp: 'Recomp', maintain: 'Maintain' }

const getCurrentSeason = () => {
  const month = new Date().getMonth() + 1
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'fall'
  return 'winter'
}

const quickActions = [
  { label: 'Add pantry item', icon: 'add', to: '/app/pantry' },
  { label: 'Get recipe ideas', icon: 'recipes', to: '/app/recipes' },
  { label: 'View grocery list', icon: 'grocery', to: '/app/grocery' },
  { label: 'See reports', icon: 'reports', to: '/app/reports' },
]

export default function Dashboard() {
  const { user, family } = useAuthStore()
  const { isFeatureEnabled } = useAppConfigStore()
  const plan = family?.plan?.toLowerCase() || 'free'
  const navigate = useNavigate()
  const { toast, showToast, hideToast } = useToast()
  const [stats, setStats] = useState(null)
  const [activity, setActivity] = useState([])
  const [members, setMembers] = useState([])
  const [expiringSoon, setExpiringSoon] = useState([])
  const [healthProgress, setHealthProgress] = useState(null)
  const [wasteSavings, setWasteSavings] = useState(null)
  const [nudges, setNudges] = useState([])
  const [dismissedNudges, setDismissedNudges] = useState([])
  const [tonightMeal, setTonightMeal] = useState(null)
  const [aiSuggestion, setAiSuggestion] = useState(null)
  const [aiExpanded, setAiExpanded] = useState(false)
  const [cookAlong, setCookAlong] = useState(false)
  const [cookStep, setCookStep] = useState(0)
  const [cooking, setCooking] = useState(false)
  const [cookDone, setCookDone] = useState(false)
  const [pantryLabel, setPantryLabel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  useEffect(() => {
    fetchData()
    fetchTonightMeal()
  }, [])

  useEffect(() => {
    if (tonightMeal === false) fetchAiSuggestion()
  }, [tonightMeal])

  const fetchTonightMeal = async () => {
    try {
      const today = new Date()
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const todayName = days[today.getDay()]
      const weekStart = new Date(today)
      const dayOfWeek = today.getDay()
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
      weekStart.setDate(diff)
      weekStart.setHours(0, 0, 0, 0)
      const weekStartStr = weekStart.toISOString().split('T')[0]
      const data = await getMealPlan(weekStartStr)
      const dinner = data.meals?.find(m => m.day === todayName && m.mealType === 'Dinner')
      setTonightMeal(dinner || false)
    } catch {
      setTonightMeal(false)
    }
  }

  const fetchAiSuggestion = async () => {
    try {
      const data = await getTonightSuggestion()
      setAiSuggestion(data.empty ? false : data)
    } catch {
      setAiSuggestion(false)
    }
  }

  const handleCookAlong = () => {
    setCookStep(0)
    setCookDone(false)
    setCookAlong(true)
  }

  const handleFinishCooking = async () => {
    if (!tonightMeal) return
    setCooking(true)
    try {
      if (tonightMeal.recipeData?.ingredients?.length) {
        const cookResult = await cookRecipe({ ingredients: filterStaples(tonightMeal.recipeData.ingredients) })
        const _r = cookResult?.results || []
        const _ok = _r.filter(r => !r.reason).length
        const _skip = _r.filter(r => r.reason).length
        setPantryLabel(_ok > 0 ? _skip > 0 ? `${_ok} items (${_skip} skipped)` : `${_ok} items` : null)
      }
      if (tonightMeal.recipeData?.nutrition && members.length > 0) {
        try {
          const _plannedFor = tonightMeal.recipeData?.plannedFor
          const membersToLog = (Array.isArray(_plannedFor) && _plannedFor.length > 0)
            ? members.filter(m => _plannedFor.includes(m.name) && !m.isBaby).map(m => m.name)
            : members.filter(m => !m.isBaby).map(m => m.name)
          await logNutrition(membersToLog, tonightMeal.recipeName, 'Dinner', tonightMeal.recipeData.nutritionPerServing || tonightMeal.recipeData.nutrition)
        } catch { /* silent */ }
      }
      await markMealCooked(tonightMeal.id)
      setTonightMeal(prev => prev ? { ...prev, cooked: true } : prev)
      setCookDone(true)
    } catch {
      showToast('Something went wrong', 'error')
    } finally {
      setCooking(false)
    }
  }

  const fetchData = async () => {
    try {
      setError('')
      const [statsData, activityData, membersData, expiryData, healthData, wasteSavingsData, nudgesData] = await Promise.all([
        getDashboardStats(),
        getRecentActivity(),
        getMembers(),
        getExpiringSoon(),
        getHealthProgress(),
        getWasteSavings(),
        getNudges(),
      ])
      setStats(statsData)
      setActivity(activityData)
      setMembers(membersData)
      setExpiringSoon(expiryData)
      setHealthProgress(healthData)
      setWasteSavings(wasteSavingsData)
      setNudges(nudgesData?.nudges || [])
    } catch (err) {
      console.error(err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="mb-8">
          <div className="h-8 bg-stone-100 rounded-2xl w-64 mb-2 animate-pulse" />
          <div className="h-4 bg-stone-100 rounded-2xl w-48 animate-pulse" />
        </div>
        <div className="h-48 bg-stone-100 rounded-3xl mb-6 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="card animate-pulse">
              <div className="h-8 bg-stone-100 rounded-xl mb-2" />
              <div className="h-4 bg-stone-100 rounded-xl w-2/3" />
            </div>
          ))}
        </div>
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-container">
        <ErrorState message={error} onRetry={fetchData} />
      </div>
    )
  }

  return (
    <div className="page-container">

      {/* Greeting */}
      <div className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-stone-900 tracking-tight">
          {greeting}, {user?.name || 'there'} <Icon name="leaf" size={18} className="inline align-middle ml-1 text-fresh-600" />
        </h1>
        <p className="text-stone-600 mt-1">
          What's cooking at <span className="font-semibold text-stone-700">{family?.name || 'your place'}</span> today?
        </p>
      </div>

      {/* Hero row: recipe suggestion (left) + recall alert (right) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-stretch mb-6">

        {/* LEFT: Tonight's dinner / AI suggestion */}
        {tonightMeal === null ? (
          <div className="rounded-3xl bg-stone-100 animate-pulse min-h-[160px]" />
        ) : tonightMeal !== false ? (
          tonightMeal.cooked ? (
            <div className="rounded-3xl bg-green-50 border border-green-200 px-6 py-5 h-full flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <Icon name="check" size={24} className="text-green-700" />
              </div>
              <div className="min-w-0">
                <p className="font-display text-lg font-semibold text-green-800">Dinner's done!</p>
                <p className="text-sm text-green-700 flex items-center gap-1 mt-0.5">
                  <Icon name="check" size={12} className="text-green-600 flex-shrink-0" />{tonightMeal.recipeName} — nice cook!
                </p>
              </div>
            </div>
          ) : (
            <div className="hero-card h-full overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center gap-0">
                <div className="flex-1 px-6 pt-6 pb-5 sm:pb-6 min-w-0">
                  <p className="text-xs font-semibold text-orange-200 uppercase tracking-widest mb-2">Tonight's dinner</p>
                  <h2 className="font-display text-3xl 2xl:text-4xl font-semibold text-[#FFF7ED] leading-tight mb-3 line-clamp-2">
                    {tonightMeal.recipeName}
                  </h2>
                  <div className="flex flex-wrap gap-3 mb-4">
                    {tonightMeal.recipeData?.time && (
                      <span className="flex items-center gap-1.5 text-sm text-orange-200">
                        <Icon name="clock" size={13} /> {tonightMeal.recipeData.time}
                      </span>
                    )}
                    {tonightMeal.recipeData?.calories && (
                      <span className="flex items-center gap-1.5 text-sm text-orange-200">
                        <Icon name="flame" size={13} /> {tonightMeal.recipeData.calories} kcal
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleCookAlong}
                    className="bg-[#C2410C] hover:bg-food-700 text-white px-6 py-3 rounded-full font-semibold text-sm active:scale-95 transition-all duration-150 w-full sm:w-auto"
                  >
                    Start cooking
                  </button>
                </div>
                <div className="hidden sm:flex flex-shrink-0 justify-center items-end px-4 pb-2 sm:px-6 sm:py-4">
                  <DishArt
                    category={getRecipeCategory(tonightMeal.recipeName)}
                    size="lg"
                    className="xl:w-[120px] xl:h-auto 2xl:w-[200px]"
                  />
                </div>
              </div>
            </div>
          )
        ) : aiSuggestion === null ? (
          <div className="rounded-3xl bg-stone-100 animate-pulse min-h-[160px]" />
        ) : aiSuggestion === false ? (
          <div className="bg-indigo-50 border border-indigo-200 rounded-3xl px-6 py-5 h-full flex items-start gap-4">
            <span className="text-2xl">🫧</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-indigo-900">What's for dinner tonight?</p>
              <p className="text-sm text-indigo-700 mt-0.5 mb-4">Add at least 3 pantry items and Nooka will suggest tonight's dinner.</p>
              <button onClick={() => navigate('/app/pantry')} className="btn-primary text-sm">
                Add pantry items
              </button>
            </div>
          </div>
        ) : (
          /* AI suggestion card */
          <div className="hero-card h-full">
            <div className="flex flex-col sm:flex-row sm:items-center gap-0">
              <div className="flex-1 px-6 pt-6 pb-5 sm:pb-6 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">🫧</span>
                  <span className="text-xs font-semibold text-orange-200 uppercase tracking-widest">Suggested for tonight</span>
                </div>
                <h2 className="font-display text-3xl 2xl:text-4xl font-semibold text-[#FFF7ED] leading-tight mb-3 line-clamp-2">
                  {aiSuggestion.recipe.name}
                </h2>
                {(aiSuggestion.recipe.time || aiSuggestion.recipe.difficulty) && (
                  <div className="flex items-center gap-3 mb-3 text-sm text-orange-200">
                    {aiSuggestion.recipe.time && <span className="flex items-center gap-1.5"><Icon name="clock" size={13} /> {aiSuggestion.recipe.time}</span>}
                    {aiSuggestion.recipe.difficulty && <span>{aiSuggestion.recipe.difficulty}</span>}
                  </div>
                )}
                {!aiExpanded && aiSuggestion.recipe.ingredients?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {aiSuggestion.recipe.ingredients.slice(0, 4).map((ing, i) => (
                      <span key={i} className="text-xs bg-white/10 text-orange-100 px-2.5 py-1 rounded-full border border-white/20">
                        {ing.name}
                      </span>
                    ))}
                    {aiSuggestion.recipe.ingredients.length > 4 && (
                      <span className="text-xs text-orange-300 px-1 py-1">+{aiSuggestion.recipe.ingredients.length - 4} more</span>
                    )}
                  </div>
                )}
                {aiExpanded && (
                  <div className="mb-4 space-y-4">
                    {aiSuggestion.recipe.ingredients?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-orange-300 uppercase tracking-wide mb-2">Ingredients</p>
                        <ul className="space-y-1.5">
                          {aiSuggestion.recipe.ingredients.map((ing, i) => (
                            <li key={i} className="flex items-baseline gap-2 text-sm text-[#FFF7ED]">
                              <span className="w-1 h-1 rounded-full bg-orange-300 flex-shrink-0 mt-2" />
                              {[ing.quantity, ing.unit, ing.name].filter(Boolean).join(' ')}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {aiSuggestion.recipe.steps?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-orange-300 uppercase tracking-wide mb-2">Steps</p>
                        <ol className="space-y-2">
                          {aiSuggestion.recipe.steps.map((step, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-[#FFF7ED]">
                              <span className="w-5 h-5 rounded-full bg-white/15 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                )}
                {(() => {
                  const goalMember = members.find(m => m.userId === user?.id) || members.find(m => m.fitnessGoal)
                  const goalLabel = GOAL_LABELS[goalMember?.fitnessGoal]
                  if (!goalLabel || !isFeatureEnabled('fitness_coach', plan)) return null
                  return (
                    <p className="flex items-center gap-1 text-xs text-orange-200 mb-3">
                      <Icon name="bubble" size={12} className="flex-shrink-0" />
                      Fits {goalMember.name}'s {goalLabel} plan
                    </p>
                  )
                })()}
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={() => setAiExpanded(prev => !prev)}
                    className="bg-[#C2410C] hover:bg-food-700 text-white px-6 py-3 rounded-full font-semibold text-sm active:scale-95 transition-all duration-150"
                  >
                    {aiExpanded ? 'Hide recipe ↑' : 'See recipe →'}
                  </button>
                  <button onClick={() => navigate('/app/recipes')} className="text-sm text-orange-200 font-medium hover:text-white transition-colors py-1">
                    Generate more ideas →
                  </button>
                </div>
              </div>
              <div className="hidden sm:flex flex-shrink-0 justify-center items-end px-4 pb-2 sm:px-6 sm:py-4">
                <DishArt
                  category={getRecipeCategory(aiSuggestion.recipe.name)}
                  size="lg"
                  className="xl:w-[120px] xl:h-auto 2xl:w-[200px]"
                />
              </div>
            </div>
          </div>
        )}

        {/* RIGHT: Health Canada Recall Alert */}
        <div className="bg-red-50 border border-red-200 rounded-3xl p-6 h-full flex flex-col">
          <div className="flex items-center gap-2.5 mb-3">
            <Icon name="recalls" size={20} className="text-red-600 flex-shrink-0" />
            <p className="text-sm font-semibold text-red-700">Health Canada Recall Alert</p>
          </div>
          <p className="text-sm text-red-600 leading-relaxed">Check the Recall alerts page for items that may match your pantry.</p>
          <button
            onClick={() => navigate('/app/recalls')}
            className="mt-auto pt-3 self-start inline-flex items-center gap-1 text-sm font-semibold text-red-700 hover:text-red-900 underline"
          >
            View recalls →
          </button>
        </div>

      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Pantry items', value: stats?.pantryCount || 0, icon: 'pantry', bg: 'bg-orange-50', iconColor: 'text-food-600' },
          { label: 'Family members', value: stats?.memberCount || 0, icon: 'family', bg: 'bg-green-50', iconColor: 'text-fresh-600' },
          { label: 'Grocery items', value: stats?.groceryCount || 0, icon: 'grocery', bg: 'bg-indigo-50', iconColor: 'text-indigo-600' },
          { label: 'Total spend', value: `$${stats?.totalSpend || '0.00'}`, icon: 'dollar', bg: 'bg-stone-100', iconColor: 'text-stone-600' },
        ].map((s, i) => (
          <div key={i} className="card flex items-center gap-3 card-hover cursor-default">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${s.bg}`}>
              <Icon name={s.icon} size={20} className={s.iconColor} />
            </div>
            <div className="min-w-0">
              <p className="font-display text-xl font-semibold text-stone-900">{s.value}</p>
              <p className="text-xs text-stone-600 truncate">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pantry setup progress */}
      {(stats?.pantryCount ?? 0) < 15 && (
        <div className="card mb-6 border border-green-200 bg-green-50">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-stone-900 flex items-center gap-1.5">
              <Icon name="grocery" size={14} className="text-stone-600" /> Set up your pantry
            </p>
            <button onClick={() => navigate('/app/pantry')} className="text-xs text-indigo-700 hover:underline font-semibold py-1">Add items →</button>
          </div>
          <p className="text-xs text-stone-600 mb-3">
            {(stats?.pantryCount ?? 0) < 5
              ? 'Recipes are ready now — add more items for even better matches'
              : (stats?.pantryCount ?? 0) < 10
              ? 'Add a few more items for even smarter suggestions'
              : 'Almost there — 15 items unlocks your weekly digest email'}
          </p>
          <div className="relative h-2 bg-green-100 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(((stats?.pantryCount ?? 0) / 15) * 100, 100)}%` }} />
          </div>
          <div className="flex justify-between text-xs text-stone-600 mb-3">
            <span className={(stats?.pantryCount ?? 0) >= 5 ? 'text-green-700 font-semibold' : ''}>
              {(stats?.pantryCount ?? 0) >= 5 ? '✓' : '○'} <span className="hidden sm:inline">5 — Good suggestions</span><span className="sm:hidden">5</span>
            </span>
            <span className={(stats?.pantryCount ?? 0) >= 10 ? 'text-green-700 font-semibold' : ''}>
              {(stats?.pantryCount ?? 0) >= 10 ? '✓' : '○'} <span className="hidden sm:inline">10 — Great suggestions</span><span className="sm:hidden">10</span>
            </span>
            <span className={(stats?.pantryCount ?? 0) >= 15 ? 'text-green-700 font-semibold' : ''}>
              {(stats?.pantryCount ?? 0) >= 15 ? '✓' : '○'} <span className="hidden sm:inline">15 — Weekly digest</span><span className="sm:hidden">15</span>
            </span>
          </div>
          <button onClick={() => navigate('/app/recipes')} className="text-xs text-indigo-700 font-semibold hover:underline">Try a recipe →</button>
        </div>
      )}

      {/* Free plan usage */}
      {stats?.plan === 'free' && (
        <div className="card mb-6 border border-indigo-100 bg-indigo-50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-stone-900">Free plan — recipe usage this week</p>
            <button onClick={() => navigate('/app/settings?tab=plan')} className="text-xs text-indigo-700 hover:underline font-semibold">Upgrade</button>
          </div>
          <div className="h-2 bg-indigo-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${Math.min((stats.recipeCount / 5) * 100, 100)}%` }} />
          </div>
          <p className="text-xs text-stone-600 mt-1.5">{stats.recipeCount}/5 recipes used this week</p>
        </div>
      )}

      {/* Expiring soon */}
      {isFeatureEnabled('smart_expiry', plan) && expiringSoon.length > 0 && (
        <div className="card mb-6 border border-amber-200 bg-amber-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-stone-900 flex items-center gap-2">
              <Icon name="warning" size={16} className="text-amber-600" />
              Use it up before it turns
              <span className="text-sm font-normal text-stone-600">({expiringSoon.length})</span>
            </h2>
            <button onClick={() => navigate('/app/pantry')} className="text-xs text-indigo-700 hover:underline font-semibold">View pantry</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            {expiringSoon.slice(0, 6).map(item => (
              <div key={item.id} className="flex items-center justify-between bg-white rounded-2xl px-3 py-2.5 border border-amber-100">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-stone-900">{item.name}</p>
                    <p className="text-xs text-stone-600">{item.quantity} {item.unit}</p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
                  item.urgency === 'expired' ? 'bg-amber-100 text-amber-800' :
                  item.urgency === 'critical' ? 'bg-orange-100 text-orange-800' :
                  item.urgency === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-indigo-100 text-indigo-700'
                }`}>
                  {item.isExpired ? 'Expired' : item.daysLeft === 0 ? 'Today' : `${item.daysLeft}d left`}
                </span>
              </div>
            ))}
          </div>
          {expiringSoon.length > 6 && (
            <button onClick={() => navigate('/app/pantry')} className="text-xs text-indigo-700 hover:underline font-semibold">
              +{expiringSoon.length - 6} more expiring soon
            </button>
          )}
          {/* 🫧 AI action */}
          <div className="mt-4 pt-4 border-t border-amber-200 flex items-center gap-3">
            <span className="text-lg">🫧</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-stone-900">Plan meals with these</p>
              <p className="text-xs text-stone-600">AI will prioritise recipes that use expiring items.</p>
            </div>
            <button onClick={() => navigate('/app/recipes?expiring=true')} className="btn-primary text-xs px-4 py-2.5 flex-shrink-0">
              Find recipes
            </button>
          </div>
        </div>
      )}

      {/* Waste savings + streak */}
      {wasteSavings && (
        <div className="card mb-6 border border-green-200 bg-green-50">
          <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-3">
              <Icon name="leaf" size={14} className="text-green-600 flex-shrink-0" />
              <span className="text-sm font-semibold text-stone-900">
                {wasteSavings.mealsCookedThisWeek > 0
                  ? `${wasteSavings.mealsCookedThisWeek} meal${wasteSavings.mealsCookedThisWeek !== 1 ? 's' : ''} cooked this week`
                  : 'No meals cooked yet this week'}
              </span>
            </div>
            {wasteSavings.mealsCookedThisWeek > 0 ? (
              <div className="flex items-end gap-1.5">
                {['M','T','W','T','F','S','S'].map((label, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className={`w-2.5 h-2.5 rounded-full ${wasteSavings.cookedDays?.includes(i) ? 'bg-green-500' : 'bg-stone-200'}`} />
                    <span className="text-[9px] leading-none text-stone-500">{label}</span>
                  </div>
                ))}
              </div>
            ) : (
              <button onClick={() => navigate('/app/recipes')} className="text-xs text-indigo-700 font-semibold hover:underline">
                Cook your first meal this week →
              </button>
            )}
          </div>

          {wasteSavings.mealsCooked > 0 && (
            <>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-stone-900 flex items-center gap-2">
                  <Icon name="health" size={16} className="text-green-600" /> Your impact this month
                </h2>
                <span className="text-xs bg-green-100 text-green-700 font-semibold px-2.5 py-1 rounded-full">
                  {wasteSavings.mealsCooked} meal{wasteSavings.mealsCooked !== 1 ? 's' : ''} cooked
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: `$${wasteSavings.moneySaved}`, label: 'estimated saved', color: 'text-green-700' },
                  { value: `${wasteSavings.co2Saved}kg`, label: 'CO₂ avoided', color: 'text-green-700' },
                  { value: wasteSavings.foodRescued, label: 'items rescued', color: 'text-green-700' },
                ].map((s, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-green-100 px-3 py-3 text-center">
                    <p className={`font-display text-xl font-semibold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-stone-600 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
              {wasteSavings.foodRescued > 0 && (
                <p className="text-xs text-green-700 mt-3 text-center flex items-center justify-center gap-1">
                  <Icon name="sparkle" size={13} className="text-green-600 flex-shrink-0" />
                  You rescued {wasteSavings.wasteAvoided}kg of food from going to waste this month!
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* Nooka notices */}
      {isFeatureEnabled('meal_patterns', plan) && nudges.filter(n => !dismissedNudges.includes(n.message)).length > 0 && (
        <div className="card mb-6 border border-indigo-100 bg-indigo-50">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🫧</span>
            <h2 className="font-semibold text-stone-900">Nooka notices</h2>
            <span className="text-xs text-stone-600 ml-auto">Based on your habits</span>
          </div>
          <div className="space-y-2">
            {nudges.filter(n => !dismissedNudges.includes(n.message)).map((nudge, i) => (
              <div key={i} className="flex items-start justify-between bg-white rounded-2xl border border-indigo-100 px-4 py-3 gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="text-lg flex-shrink-0">{nudge.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-stone-800">{nudge.message}</p>
                    {nudge.action && (
                      <button onClick={() => navigate(nudge.action.url)} className="text-xs text-indigo-700 font-semibold hover:underline mt-1">
                        {nudge.action.label} →
                      </button>
                    )}
                  </div>
                </div>
                <button onClick={() => setDismissedNudges(prev => [...prev, nudge.message])} className="text-stone-400 hover:text-stone-700 flex-shrink-0 p-1" aria-label="Dismiss">
                  <Icon name="close" size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions + Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="card">
          <h2 className="font-semibold text-stone-900 mb-4">Quick actions</h2>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((a, i) => (
              <button
                key={i}
                onClick={() => navigate(a.to)}
                className="flex items-center gap-2.5 p-3 rounded-2xl border border-[#E7D5C3] hover:bg-orange-50 hover:border-orange-200 transition-all text-left min-h-[44px]"
              >
                <Icon name={a.icon} size={18} className="text-stone-600 flex-shrink-0" />
                <span className="text-sm font-medium text-stone-800">{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold text-stone-900 mb-4">Recent activity</h2>
          {activity.length === 0 ? (
            <p className="text-sm text-stone-600">No activity yet — start by adding pantry items!</p>
          ) : (
            <div className="space-y-3">
              {activity.map((a, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-stone-50 rounded-full flex items-center justify-center text-lg border border-[#E7D5C3] flex-shrink-0">
                    {a.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-stone-800 font-medium truncate">{a.text}</p>
                    <p className="text-xs text-stone-600">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Health goal progress */}
      {isFeatureEnabled('health_progress', plan) && healthProgress?.hasData && (
        <div className="card mb-6 border border-green-100 bg-green-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-stone-900 flex items-center gap-2">
              <Icon name="health" size={16} className="text-fresh-600" /> Health goal progress
            </h2>
            <span className="text-xs text-stone-600">Last 7 days</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {healthProgress.members.filter(m => m.hasData).map((member, i) => (
              <div key={i} className="bg-white rounded-2xl border border-green-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {member.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-stone-900">{member.name}</p>
                      <p className="text-xs text-stone-600 capitalize">{member.goal}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-display text-lg font-semibold ${member.overallScore >= 75 ? 'text-green-600' : member.overallScore >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                      {member.overallScore}%
                    </p>
                    <p className="text-xs text-stone-600">{member.mealsLogged} meals</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {member.metrics.map((metric, j) => (
                    <div key={j} className="flex items-center justify-between text-xs">
                      <span className="text-stone-600">{metric.icon} {metric.label}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-stone-800">{metric.value}{metric.unit}</span>
                        {metric.targetText && <span className="text-stone-500">/ {metric.targetText}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {healthProgress.members.some(m => !m.hasData) && (
            <p className="text-xs text-stone-600 mt-3">Cook more meals and click "I cooked this" to track all members' progress.</p>
          )}
        </div>
      )}

      {/* Seasonal picks */}
      {isFeatureEnabled('seasonal_recommendations', family?.plan) && (() => {
        const season = getCurrentSeason()
        const s = SEASONAL_DATA[season]
        const month = new Date().toLocaleString('en-CA', { month: 'long' })
        return (
          <div className={`card mb-6 border ${s.color}`}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-stone-900 flex items-center gap-2">
                <Icon name={s.icon} size={16} /> Seasonal picks — {month}
              </h2>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${s.badge}`}>
                {season.charAt(0).toUpperCase() + season.slice(1)}
              </span>
            </div>
            <p className="text-xs text-stone-600 mb-3">Freshest and most affordable right now in Canada</p>
            <div className="flex flex-wrap gap-2">
              {s.items.map((item, i) => (
                <span key={i} className={`text-xs px-2.5 py-1 rounded-full border font-medium ${s.badge}`}>{item}</span>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Family members */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-stone-900">Family members</h2>
          <button onClick={() => navigate('/app/settings')} className="text-sm text-indigo-700 hover:underline font-semibold">Manage</button>
        </div>
        <div className="flex gap-2 flex-wrap">
          {members.length === 0 ? (
            <p className="text-sm text-stone-600">No members yet</p>
          ) : (
            members.map((member, i) => (
              <div key={i} className="flex items-center gap-2 bg-stone-50 rounded-full px-4 py-2 border border-[#E7D5C3]">
                <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {member.name?.[0]?.toUpperCase()}
                </div>
                <span className="text-sm font-medium text-stone-800">{member.name}</span>
              </div>
            ))
          )}
          <button
            onClick={() => navigate('/app/settings')}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-dashed border-[#E7D5C3] text-sm text-stone-600 hover:border-indigo-300 hover:text-indigo-700 transition-all"
          >
            + Add member
          </button>
        </div>
      </div>

      {/* Cook-along modal */}
      {cookAlong && tonightMeal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-end sm:items-center sm:justify-center sm:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-lift max-h-[90dvh] overflow-y-auto modal-sheet">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E7D5C3] sticky top-0 bg-white rounded-t-3xl modal-header">
              <div>
                <p className="text-xs text-stone-600 font-medium">Tonight's dinner</p>
                <h3 className="font-display font-semibold text-stone-900">
                  {tonightMeal.recipeData?.icon} {tonightMeal.recipeName}
                </h3>
              </div>
              <button onClick={() => setCookAlong(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-600 transition-colors" aria-label="Close">
                <Icon name="close" size={16} />
              </button>
            </div>
            <div className="p-6 modal-body">
              {cookDone ? (
                <div className="text-center py-6">
                  <div className="mb-4 flex justify-center text-food-600"><Icon name="utensils" size={56} /></div>
                  <h3 className="font-display text-2xl font-semibold text-stone-900 mb-2">Nice cook!</h3>
                  <p className="text-sm text-stone-600 mb-6">
                    {pantryLabel ? `Pantry updated — ${pantryLabel}. ` : ''}Nutrition logged for everyone.
                  </p>
                  <button onClick={() => setCookAlong(false)} className="btn-primary w-full">Done</button>
                </div>
              ) : tonightMeal.recipeData?.steps?.length > 0 ? (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                        style={{ width: `${((cookStep + 1) / tonightMeal.recipeData.steps.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-stone-600 whitespace-nowrap">{cookStep + 1} / {tonightMeal.recipeData.steps.length}</span>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-6 mb-6 min-h-[120px] flex items-center">
                    <div className="flex items-start gap-4">
                      <span className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {cookStep + 1}
                      </span>
                      <p className="text-base text-stone-800 leading-relaxed">{tonightMeal.recipeData.steps[cookStep]}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-6 text-xs text-stone-600">
                    {tonightMeal.recipeData?.time && <span className="flex items-center gap-1"><Icon name="clock" size={11} /> {tonightMeal.recipeData.time}</span>}
                    {tonightMeal.recipeData?.calories && <span className="flex items-center gap-1"><Icon name="flame" size={11} className="text-food-600" /> {tonightMeal.recipeData.calories} kcal</span>}
                    {tonightMeal.recipeData?.serves && <span className="flex items-center gap-1"><Icon name="family" size={11} /> Serves {tonightMeal.recipeData.serves}</span>}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setCookStep(prev => Math.max(0, prev - 1))} disabled={cookStep === 0} className="btn-secondary flex-1 disabled:opacity-30">← Back</button>
                    {cookStep < tonightMeal.recipeData.steps.length - 1 ? (
                      <button onClick={() => setCookStep(prev => prev + 1)} className="btn-primary flex-1">Next step →</button>
                    ) : (
                      <button onClick={handleFinishCooking} disabled={cooking} className="btn-primary flex-1 bg-green-600 hover:bg-green-700">
                        {cooking ? 'Saving…' : <><Icon name="utensils" size={15} className="inline-block mr-1" />Done cooking!</>}
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-stone-600 mb-6">No step-by-step available for this recipe.</p>
                  <button onClick={handleFinishCooking} disabled={cooking} className="btn-primary w-full">
                    {cooking ? 'Saving…' : <><Icon name="utensils" size={15} className="inline-block mr-1" />Mark as cooked</>}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  )
}
