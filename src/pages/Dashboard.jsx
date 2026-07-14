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
import { useToast } from '../hooks/useToast'

const SEASONAL_DATA = {
  spring: { icon: '🌱', color: 'border-green-200 bg-green-50/30', badge: 'bg-green-100 text-green-700', items: ['Asparagus', 'Spinach', 'Peas', 'Rhubarb', 'Radishes', 'Arugula', 'Leeks', 'Lettuce'] },
  summer: { icon: '☀️', color: 'border-yellow-200 bg-yellow-50/30', badge: 'bg-yellow-100 text-yellow-700', items: ['Strawberries', 'Corn', 'Tomatoes', 'Zucchini', 'Peaches', 'Blueberries', 'Cucumbers', 'Bell peppers'] },
  fall: { icon: '🍂', color: 'border-orange-200 bg-orange-50/30', badge: 'bg-orange-100 text-orange-700', items: ['Squash', 'Apples', 'Pears', 'Beets', 'Brussels sprouts', 'Sweet potatoes', 'Cranberries', 'Cauliflower'] },
  winter: { icon: '❄️', color: 'border-blue-200 bg-blue-50/30', badge: 'bg-blue-100 text-blue-700', items: ['Citrus', 'Oranges', 'Cabbage', 'Carrots', 'Kale', 'Potatoes', 'Grapefruit', 'Lemons'] },
}

const getCurrentSeason = () => {
  const month = new Date().getMonth() + 1
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'fall'
  return 'winter'
}
const quickActions = [
  { label: 'Add pantry item', icon: 'add', to: '/app/pantry' },
  { label: 'Get recipe ideas', icon: 'ai', to: '/app/recipes' },
  { label: 'View grocery list', icon: 'grocery', to: '/app/grocery' },
  { label: 'See reports', icon: 'chart', to: '/app/reports' },
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
  const [tonightMeal, setTonightMeal] = useState(null) // null = loading, false = empty
  const [aiSuggestion, setAiSuggestion] = useState(null) // null = loading, false = empty
  const [aiExpanded, setAiExpanded] = useState(false)
  const [cookAlong, setCookAlong] = useState(false)
  const [cookStep, setCookStep] = useState(0)
  const [cooking, setCooking] = useState(false)
  const [cookDone, setCookDone] = useState(false)
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
    } catch (err) {
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
      // Decrement pantry
      if (tonightMeal.recipeData?.ingredients?.length) {
        await cookRecipe({ ingredients: tonightMeal.recipeData.ingredients })
      }
      // Log nutrition
      if (tonightMeal.recipeData?.nutrition && members.length > 0) {
        try {
          await logNutrition(
            members.map(m => m.name),
            tonightMeal.recipeName,
            'Dinner',
            tonightMeal.recipeData.nutritionPerServing || tonightMeal.recipeData.nutrition
          )
        } catch (e) { /* silent */ }
      }
      // Mark cooked
      await markMealCooked(tonightMeal.id)
      setTonightMeal(prev => prev ? { ...prev, cooked: true } : prev)
      setCookDone(true)
    } catch (err) {
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
          <div className="h-8 bg-gray-100 rounded w-64 mb-2 animate-pulse" />
          <div className="h-4 bg-gray-100 rounded w-48 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card animate-pulse">
              <div className="h-8 bg-gray-100 rounded mb-2" />
              <div className="h-4 bg-gray-100 rounded w-2/3" />
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

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-bold text-textPrimary">
          {greeting}, {user?.name || 'there'}
        </h1>
        <p className="text-textMuted mt-1">
          Here's what's happening with <span className="font-medium text-textPrimary">{family?.name || 'your family'}</span> today.
        </p>
      </div>

      {/* Recall alert */}
      <div className="bg-red-50 border border-red-100 rounded-card px-5 py-4 mb-8 flex items-start gap-3">
        <span className="text-xl">🚨</span>
        <div>
          <p className="text-sm font-semibold text-danger">Health Canada Recall Alert</p>
          <p className="text-sm text-red-600 mt-0.5">
            Check the Recall alerts page for items that may match your pantry.
          </p>
          <button onClick={() => navigate('/app/recalls')} className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-danger underline py-1">View recalls →</button>
        </div>
      </div>

      {/* Tonight slot — planned meal, AI suggestion, or skeleton while resolving */}
      <div className="card mb-6 border border-indigo-100 bg-indigo-50/20">
        {tonightMeal === null ? (
          <div className="flex items-center gap-3 animate-pulse">
            <div className="w-10 h-10 bg-gray-100 rounded-xl" />
            <div className="flex-1">
              <div className="h-4 bg-gray-100 rounded w-32 mb-1" />
              <div className="h-3 bg-gray-100 rounded w-48" />
            </div>
          </div>
        ) : tonightMeal !== false ? (
          tonightMeal.cooked ? (
            <div className="flex items-center gap-3">
              <Icon name="check" size={22} className="text-success" />
              <div>
                <p className="text-sm font-semibold text-success">Dinner's done!</p>
                <p className="text-xs text-textMuted">{tonightMeal.recipeData?.icon} {tonightMeal.recipeName} — nice cook!</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {tonightMeal.recipeData?.icon
                  ? <span className="text-2xl flex-shrink-0">{tonightMeal.recipeData.icon}</span>
                  : <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0"><Icon name="mealplan" size={18} className="text-primary" /></div>
                }
                <div className="min-w-0">
                  <p className="text-xs text-textMuted font-medium">Tonight's dinner</p>
                  <p className="text-sm font-semibold text-textPrimary truncate">{tonightMeal.recipeName}</p>
                  <div className="flex gap-2 mt-0.5">
                    {tonightMeal.recipeData?.time && <span className="text-xs text-textMuted flex items-center gap-1"><Icon name="recipes" size={11} /> {tonightMeal.recipeData.time}</span>}
                    {tonightMeal.recipeData?.calories && <span className="text-xs text-textMuted flex items-center gap-1"><Icon name="health" size={11} /> {tonightMeal.recipeData.calories} kcal</span>}
                  </div>
                </div>
              </div>
              <button onClick={handleCookAlong} className="btn-primary text-sm flex-shrink-0 flex items-center gap-2">
                Start cooking
              </button>
            </div>
          )
        ) : aiSuggestion === null ? (
          <div className="animate-pulse">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-4 h-4 bg-gray-100 rounded" />
              <div className="h-3 bg-gray-100 rounded w-32" />
            </div>
            <div className="h-5 bg-gray-100 rounded w-3/4 mb-3" />
            <div className="flex gap-2 mb-4">
              <div className="h-6 bg-gray-100 rounded-pill w-20" />
              <div className="h-6 bg-gray-100 rounded-pill w-16" />
              <div className="h-6 bg-gray-100 rounded-pill w-24" />
            </div>
            <div className="h-9 bg-gray-100 rounded-btn w-36" />
          </div>
        ) : aiSuggestion === false ? (
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon name="sparkle" size={18} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-textPrimary">What's for dinner tonight?</p>
              <p className="text-xs text-textMuted mt-0.5 mb-3">
                Add at least 3 pantry items and Nooka will suggest tonight's dinner.
              </p>
              <button onClick={() => navigate('/app/pantry')} className="btn-primary text-sm w-full sm:w-auto">
                Add pantry items
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Icon name="sparkle" size={15} className="text-primary" />
              <p className="text-xs font-semibold text-primary uppercase tracking-wide">Tonight's suggestion</p>
            </div>
            <div className="flex items-start gap-3 mb-3">
              <span className="text-2xl leading-none flex-shrink-0">{aiSuggestion.recipe.icon}</span>
              <p className="text-base font-bold text-textPrimary line-clamp-2 leading-snug">
                {aiSuggestion.recipe.name}
              </p>
            </div>
            {(aiSuggestion.recipe.time || aiSuggestion.recipe.difficulty) && (
              <div className="flex items-center gap-3 mb-3 text-xs text-textMuted">
                {aiSuggestion.recipe.time && (
                  <span className="flex items-center gap-1">
                    <Icon name="recipes" size={11} /> {aiSuggestion.recipe.time}
                  </span>
                )}
                {aiSuggestion.recipe.difficulty && <span>{aiSuggestion.recipe.difficulty}</span>}
              </div>
            )}
            {!aiExpanded && aiSuggestion.recipe.ingredients?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {aiSuggestion.recipe.ingredients.slice(0, 4).map((ing, i) => (
                  <span key={i} className="text-xs bg-white border border-indigo-100 text-textPrimary px-2.5 py-1 rounded-pill">
                    {ing.name}
                  </span>
                ))}
                {aiSuggestion.recipe.ingredients.length > 4 && (
                  <span className="text-xs text-textMuted px-1 py-1">
                    +{aiSuggestion.recipe.ingredients.length - 4} more
                  </span>
                )}
              </div>
            )}
            {aiExpanded && (
              <div className="mb-4 space-y-4">
                {aiSuggestion.recipe.ingredients?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-textMuted uppercase tracking-wide mb-2">Ingredients</p>
                    <ul className="space-y-1.5">
                      {aiSuggestion.recipe.ingredients.map((ing, i) => (
                        <li key={i} className="flex items-baseline gap-2 text-sm text-textPrimary">
                          <span className="w-1 h-1 rounded-full bg-primary flex-shrink-0 mt-2" />
                          {[ing.quantity, ing.unit, ing.name].filter(Boolean).join(' ')}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {aiSuggestion.recipe.steps?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-textMuted uppercase tracking-wide mb-2">Steps</p>
                    <ol className="space-y-2">
                      {aiSuggestion.recipe.steps.map((step, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-textPrimary">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
              <button
                onClick={() => setAiExpanded(prev => !prev)}
                className="btn-primary text-sm w-full sm:w-auto"
              >
                {aiExpanded ? 'Hide recipe ↑' : 'See recipe →'}
              </button>
              <button
                onClick={() => navigate('/app/recipes')}
                className="text-sm text-primary font-medium hover:underline py-1 text-center sm:text-left"
              >
                Generate more ideas →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Pantry items', value: stats?.pantryCount || 0, icon: 'pantry', color: 'bg-blue-50 text-primary' },
          { label: 'Family members', value: stats?.memberCount || 0, icon: 'health', color: 'bg-green-50 text-success' },
          { label: 'Grocery items', value: stats?.groceryCount || 0, icon: 'grocery', color: 'bg-orange-50 text-orange-500' },
          { label: 'Total spend', value: `$${stats?.totalSpend || '0.00'}`, icon: 'reports', color: 'bg-purple-50 text-purple-500' },
        ].map((s, i) => (
          <div key={i} className="card flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.color}`}>
              <Icon name={s.icon} size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-textPrimary">{s.value}</p>
              <p className="text-xs text-textMuted">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pantry setup progress */}
      {(stats?.pantryCount ?? 0) < 15 && (
        <div className="card mb-6 border border-green-200 bg-green-50/30">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-textPrimary">🛒 Set up your pantry</p>
            <button onClick={() => navigate('/app/pantry')} className="text-xs text-primary hover:underline font-medium py-1">
              Add items →
            </button>
          </div>
          <p className="text-xs text-textMuted mb-3">
            {(stats?.pantryCount ?? 0) < 5
              ? 'Recipes are ready now — add more items for even better matches'
              : (stats?.pantryCount ?? 0) < 10
              ? 'Add a few more items for even smarter suggestions'
              : 'Almost there — 15 items unlocks your weekly digest email'}
          </p>
          <div className="relative h-2 bg-gray-100 rounded-pill overflow-hidden mb-2">
            <div
              className="h-full bg-green-500 rounded-pill transition-all duration-500"
              style={{ width: `${Math.min(((stats?.pantryCount ?? 0) / 15) * 100, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-textMuted mb-3">
            <span className={(stats?.pantryCount ?? 0) >= 5 ? 'text-green-600 font-medium' : ''}>
              {(stats?.pantryCount ?? 0) >= 5 ? '✓' : '○'}{' '}
              <span className="hidden sm:inline">5 — Good suggestions</span>
              <span className="sm:hidden">5</span>
            </span>
            <span className={(stats?.pantryCount ?? 0) >= 10 ? 'text-green-600 font-medium' : ''}>
              {(stats?.pantryCount ?? 0) >= 10 ? '✓' : '○'}{' '}
              <span className="hidden sm:inline">10 — Great suggestions</span>
              <span className="sm:hidden">10</span>
            </span>
            <span className={(stats?.pantryCount ?? 0) >= 15 ? 'text-green-600 font-medium' : ''}>
              {(stats?.pantryCount ?? 0) >= 15 ? '✓' : '○'}{' '}
              <span className="hidden sm:inline">15 — Weekly digest unlocks</span>
              <span className="sm:hidden">15</span>
            </span>
          </div>
          <button
            onClick={() => navigate('/app/recipes')}
            className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline py-1"
          >
            Try a recipe →
          </button>
        </div>
      )}

      {/* Plan usage for free plan */}
      {stats?.plan === 'free' && (
        <div className="card mb-6 border border-blue-100 bg-blue-50/30">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-textPrimary">Free plan — recipe usage this week</p>
            <button onClick={() => navigate('/app/settings?tab=plan')} className="text-xs text-primary hover:underline font-medium">
              Upgrade
            </button>
          </div>
          <div className="h-2 bg-gray-100 rounded-pill overflow-hidden">
            <div
              className="h-full bg-primary rounded-pill transition-all"
              style={{ width: `${Math.min((stats.recipeCount / 5) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-textMuted mt-1">{stats.recipeCount}/5 recipes used this week</p>
        </div>
      )}

      {/* Expiring soon widget */}
      {isFeatureEnabled('smart_expiry', plan) && expiringSoon.length > 0 && (
        <div className="card mb-6 border border-yellow-200 bg-yellow-50/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-textPrimary">⏰ Expiring Soon <span className="text-sm font-normal text-textMuted">({expiringSoon.length} item{expiringSoon.length > 1 ? 's' : ''})</span></h2>
            <button onClick={() => navigate('/app/pantry')} className="text-xs text-primary hover:underline font-medium">
              View pantry
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {expiringSoon.slice(0, 6).map(item => (
              <div key={item.id} className="flex items-center justify-between bg-white rounded-btn px-3 py-2 border border-yellow-100">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-textPrimary">{item.name}</p>
                    <p className="text-xs text-textMuted">{item.quantity} {item.unit}</p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-pill whitespace-nowrap ${item.urgency === 'expired' ? 'bg-red-100 text-red-700' :
                  item.urgency === 'critical' ? 'bg-orange-100 text-orange-700' :
                    item.urgency === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                  }`}>
                  {item.isExpired ? 'Expired' : item.daysLeft === 0 ? 'Today' : `${item.daysLeft}d left`}
                </span>
              </div>
            ))}
          </div>
          {expiringSoon.length > 6 && (
            <button onClick={() => navigate('/app/pantry')} className="text-xs text-primary hover:underline font-medium mt-3 block">
              +{expiringSoon.length - 6} more items expiring soon
            </button>
          )}
        </div>
      )}

      {/* Cook what's expiring hero prompt */}
      {isFeatureEnabled('smart_expiry', plan) && expiringSoon.length > 0 && (
        <div className="card mb-6 border border-orange-200 bg-gradient-to-r from-orange-50/40 to-yellow-50/40">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Icon name="ai" size={18} className="text-orange-500" />
                <h2 className="font-semibold text-textPrimary">Use what's expiring</h2>
                <span className="text-xs bg-orange-100 text-orange-700 font-medium px-2 py-0.5 rounded-pill">
                  {expiringSoon.filter(i => !i.isExpired).length} item{expiringSoon.filter(i => !i.isExpired).length !== 1 ? 's' : ''} soon
                </span>
              </div>
              <p className="text-sm text-textMuted mb-3">
                AI will prioritise recipes that use these before they go to waste.
              </p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {expiringSoon.filter(i => !i.isExpired).slice(0, 6).map((item, i) => (
                  <span key={i} className="text-xs bg-white border border-orange-200 text-orange-700 font-medium px-2.5 py-1 rounded-pill">
                    {item.icon || '🥘'} {item.name}
                    <span className="text-orange-400 ml-1">
                      {item.daysLeft === 0 ? '· today' : `· ${item.daysLeft}d`}
                    </span>
                  </span>
                ))}
                {expiringSoon.filter(i => !i.isExpired).length > 6 && (
                  <span className="text-xs text-textMuted px-2 py-1">
                    +{expiringSoon.filter(i => !i.isExpired).length - 6} more
                  </span>
                )}
              </div>
              <button
                onClick={() => navigate('/app/recipes?expiring=true')}
                className="btn-primary text-sm px-5 py-2"
              >
                <Icon name="ai" size={16} /> Find recipes for expiring items
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Waste savings widget */}
      {wasteSavings && wasteSavings.mealsCooked > 0 && (
        <div className="card mb-6 border border-green-200 bg-gradient-to-r from-green-50/40 to-emerald-50/40">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">💚</span>
              <h2 className="font-semibold text-textPrimary">Your impact this month</h2>
            </div>
            <span className="text-xs bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-pill">
              {wasteSavings.mealsCooked} meal{wasteSavings.mealsCooked !== 1 ? 's' : ''} cooked
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-btn border border-green-100 px-3 py-3 text-center">
              <p className="text-xl font-bold text-green-600">${wasteSavings.moneySaved}</p>
              <p className="text-xs text-textMuted mt-0.5">estimated saved</p>
            </div>
            <div className="bg-white rounded-btn border border-green-100 px-3 py-3 text-center">
              <p className="text-xl font-bold text-emerald-600">{wasteSavings.co2Saved}kg</p>
              <p className="text-xs text-textMuted mt-0.5">CO₂ avoided</p>
            </div>
            <div className="bg-white rounded-btn border border-green-100 px-3 py-3 text-center">
              <p className="text-xl font-bold text-teal-600">{wasteSavings.foodRescued}</p>
              <p className="text-xs text-textMuted mt-0.5">items rescued</p>
            </div>
          </div>
          {wasteSavings.foodRescued > 0 && (
            <p className="text-xs text-green-700 mt-3 text-center">
              🎉 You rescued {wasteSavings.wasteAvoided}kg of food from going to waste this month!
            </p>
          )}
        </div>
      )}

      {/* Cook-along modal */}
      {cookAlong && tonightMeal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-end sm:items-center justify-center sm:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-t-2xl sm:rounded-card w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-white">
              <div>
                <p className="text-xs text-textMuted font-medium">Tonight's dinner</p>
                <h3 className="font-bold text-textPrimary">
                  {tonightMeal.recipeData?.icon} {tonightMeal.recipeName}
                </h3>
              </div>
              <button onClick={() => setCookAlong(false)} className="text-textMuted hover:text-textPrimary text-xl">✕</button>
            </div>

            <div className="p-6">
              {cookDone ? (
                /* Done state */
                <div className="text-center py-6">
                  <div className="text-6xl mb-4">🍳</div>
                  <h3 className="text-xl font-bold text-textPrimary mb-2">Nice cook!</h3>
                  <p className="text-sm text-textMuted mb-6">Pantry updated and nutrition logged for everyone.</p>
                  <button onClick={() => setCookAlong(false)} className="btn-primary w-full">Done</button>
                </div>
              ) : tonightMeal.recipeData?.steps?.length > 0 ? (
                /* Step by step */
                <>
                  {/* Progress */}
                  <div className="flex items-center gap-2 mb-6">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-pill overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-pill transition-all duration-300"
                        style={{ width: `${((cookStep + 1) / tonightMeal.recipeData.steps.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-textMuted whitespace-nowrap">
                      {cookStep + 1} / {tonightMeal.recipeData.steps.length}
                    </span>
                  </div>

                  {/* Step */}
                  <div className="bg-blue-50 border border-blue-100 rounded-card px-5 py-6 mb-6 min-h-[120px] flex items-center">
                    <div className="flex items-start gap-4">
                      <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {cookStep + 1}
                      </span>
                      <p className="text-base text-textPrimary leading-relaxed">
                        {tonightMeal.recipeData.steps[cookStep]}
                      </p>
                    </div>
                  </div>

                  {/* Quick info */}
                  <div className="flex flex-wrap gap-2 mb-6 text-xs text-textMuted">
                    {tonightMeal.recipeData?.time && <span className="flex items-center gap-1"><Icon name="recipes" size={11} /> {tonightMeal.recipeData.time}</span>}
                    {tonightMeal.recipeData?.calories && <span className="flex items-center gap-1"><Icon name="health" size={11} /> {tonightMeal.recipeData.calories} kcal</span>}
                    {tonightMeal.recipeData?.serves && <span className="flex items-center gap-1"><Icon name="family" size={11} /> Serves {tonightMeal.recipeData.serves}</span>}
                  </div>

                  {/* Navigation */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setCookStep(prev => Math.max(0, prev - 1))}
                      disabled={cookStep === 0}
                      className="btn-secondary flex-1 disabled:opacity-30"
                    >
                      ← Back
                    </button>
                    {cookStep < tonightMeal.recipeData.steps.length - 1 ? (
                      <button
                        onClick={() => setCookStep(prev => prev + 1)}
                        className="btn-primary flex-1 text-base"
                      >
                        Next step →
                      </button>
                    ) : (
                      <button
                        onClick={handleFinishCooking}
                        disabled={cooking}
                        className="btn-primary flex-1 text-base bg-green-600 hover:bg-green-700"
                      >
                        {cooking ? 'Saving...' : '🍳 Done cooking!'}
                      </button>
                    )}
                  </div>
                </>
              ) : (
                /* No steps — just finish */
                <div className="text-center py-4">
                  <p className="text-sm text-textMuted mb-6">No step-by-step available for this recipe.</p>
                  <button
                    onClick={handleFinishCooking}
                    disabled={cooking}
                    className="btn-primary w-full"
                  >
                    {cooking ? 'Saving...' : '🍳 Mark as cooked'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Nooka notices — household pattern nudges */}
      {isFeatureEnabled('meal_patterns', plan) && nudges.filter(n => !dismissedNudges.includes(n.message)).length > 0 && (
        <div className="card mb-6 border border-purple-100 bg-purple-50/20">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="ai" size={18} className="text-purple-500" />
            <h2 className="font-semibold text-textPrimary">Nooka notices</h2>
            <span className="text-xs text-textMuted ml-auto">Based on your habits</span>
          </div>
          <div className="space-y-2">
            {nudges.filter(n => !dismissedNudges.includes(n.message)).map((nudge, i) => (
              <div key={i} className="flex items-start justify-between bg-white rounded-btn border border-purple-100 px-4 py-3 gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="text-lg flex-shrink-0">{nudge.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-textPrimary">{nudge.message}</p>
                    {nudge.action && (
                      <button
                        onClick={() => navigate(nudge.action.url)}
                        className="text-xs text-primary font-medium hover:underline mt-1"
                      >
                        {nudge.action.label} →
                      </button>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setDismissedNudges(prev => [...prev, nudge.message])}
                  className="text-textMuted hover:text-textPrimary text-sm flex-shrink-0"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions + activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Quick actions */}
        <div className="card">
          <h2 className="font-semibold text-textPrimary mb-4">Quick actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((a, i) => (
              <button
                key={i}
                onClick={() => navigate(a.to)}
                className="flex items-center gap-3 p-3 rounded-btn border border-border hover:bg-gray-50 hover:border-primary transition-all text-left"
              >
                <Icon name={a.icon} size={20} />
                <span className="text-sm font-medium text-textPrimary">{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="card">
          <h2 className="font-semibold text-textPrimary mb-4">Recent activity</h2>
          {activity.length === 0 ? (
            <p className="text-sm text-textMuted">No activity yet — start by adding pantry items!</p>
          ) : (
            <div className="space-y-4">
              {activity.map((a, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-50 rounded-full flex items-center justify-center text-lg border border-border flex-shrink-0">
                    {a.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-textPrimary font-medium truncate">{a.text}</p>
                    <p className="text-xs text-textMuted">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Health goal progress widget */}
      {isFeatureEnabled('health_progress', plan) && healthProgress?.hasData && (
        <div className="card mt-6 border border-green-100 bg-green-50/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-textPrimary">💪 Health goal progress</h2>
            <span className="text-xs text-textMuted">Last 7 days</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {healthProgress.members.filter(m => m.hasData).map((member, i) => (
              <div key={i} className="bg-white rounded-btn border border-green-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {member.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-textPrimary">{member.name}</p>
                      <p className="text-xs text-textMuted capitalize">{member.goal}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${member.overallScore >= 75 ? 'text-success' :
                      member.overallScore >= 50 ? 'text-orange-500' : 'text-danger'
                      }`}>{member.overallScore}%</p>
                    <p className="text-xs text-textMuted">{member.mealsLogged} meals</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {member.metrics.map((metric, j) => (
                    <div key={j} className="flex items-center justify-between text-xs">
                      <span className="text-textMuted">{metric.icon} {metric.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-textPrimary">{metric.value}{metric.unit}</span>
                        {metric.targetText && (
                          <span className="text-textMuted">/ {metric.targetText}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {healthProgress.members.some(m => !m.hasData) && (
            <p className="text-xs text-textMuted mt-3">
              Cook more meals and click "I cooked this" to track all members' progress.
            </p>
          )}
        </div>
      )}
      {/* Seasonal picks widget */}
      {isFeatureEnabled('seasonal_recommendations', family?.plan) && (() => {
        const season = getCurrentSeason()
        const s = SEASONAL_DATA[season]
        const month = new Date().toLocaleString('en-CA', { month: 'long' })
        return (
          <div className={`card mt-6 border ${s.color}`}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-textPrimary">{s.icon} Seasonal picks — {month}</h2>
              <span className={`text-xs px-2.5 py-1 rounded-pill font-medium ${s.badge}`}>
                {season.charAt(0).toUpperCase() + season.slice(1)}
              </span>
            </div>
            <p className="text-xs text-textMuted mb-3">These items are freshest and cheapest right now in Canada</p>
            <div className="flex flex-wrap gap-2">
              {s.items.map((item, i) => (
                <span key={i} className={`text-xs px-2.5 py-1 rounded-pill border font-medium ${s.badge}`}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        )
      })()}
      {/* Members strip */}
      <div className="card mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-textPrimary">Family members</h2>
          <button onClick={() => navigate('/app/settings')} className="text-sm text-primary hover:underline font-medium">
            Manage members
          </button>
        </div>
        <div className="flex gap-3 flex-wrap">
          {members.length === 0 ? (
            <p className="text-sm text-textMuted">No members yet</p>
          ) : (
            members.map((member, i) => (
              <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-pill px-4 py-2 border border-border">
                <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {member.name?.[0]?.toUpperCase()}
                </div>
                <span className="text-sm font-medium text-textPrimary">{member.name}</span>
              </div>
            ))
          )}
          <button
            onClick={() => navigate('/app/settings')}
            className="flex items-center gap-2 px-4 py-2 rounded-pill border border-dashed border-border text-sm text-textMuted hover:border-primary hover:text-primary transition-all"
          >
            + Add member
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

    </div>
  )
}