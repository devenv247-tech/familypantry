import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import { getExpiringSoon } from '../api/expiry'
import { getMembers } from '../api/family'
import CookingLoader from '../components/ui/CookingLoader'
import { suggestRecipes, generateFamilyRecipe, cookRecipe, getSubstitutions, estimateRecipeCosts, suggestDrinks } from '../api/recipes'
import { addGroceryItem, updateGroceryItem, getGroceryItems } from '../api/grocery'
import { logCookedMeal, getCookingHistory } from '../api/mealPattern'
import { getMealPlan, saveMeal, deleteMeal, generateGroceryFromPlan, generateWeekPlan, markMealCooked } from '../api/mealplan'
import { logNutrition } from '../api/healthProgress'
import { saveRecipe, checkSaved } from '../api/savedRecipes'
import { Toast } from '../components/ui/PageState'
import { useToast } from '../hooks/useToast'
import { useAuthStore } from '../store/authStore'
import { useAppConfigStore } from '../store/appConfigStore'

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

const DRINK_CONDITIONS = [
  { label: 'Feeling bloated', icon: '😮‍💨' },
  { label: 'Acidity / heartburn', icon: '🔥' },
  { label: 'Cold or flu', icon: '🤧' },
  { label: 'Low energy', icon: '😴' },
  { label: 'Summer heat', icon: '☀️' },
  { label: 'Winter warmth', icon: '❄️' },
  { label: 'Better sleep', icon: '🌙' },
  { label: 'Boost immunity', icon: '💪' },
  { label: 'Nausea', icon: '🤢' },
  { label: 'Just relaxing', icon: '🧘' },
]

const CUISINE_CATEGORIES = [
  {
    label: 'Cuisine / Culture',
    options: [
      { label: 'Any cuisine', icon: '🌍' },
      { label: 'Punjabi', icon: '🫓' },
      { label: 'South Indian', icon: '🥘' },
      { label: 'Bengali', icon: '🐟' },
      { label: 'Gujarati', icon: '🫘' },
      { label: 'Italian', icon: '🍝' },
      { label: 'Mexican', icon: '🌮' },
      { label: 'Chinese', icon: '🥢' },
      { label: 'Middle Eastern', icon: '🧆' },
      { label: 'Japanese', icon: '🍱' },
      { label: 'Canadian / Western', icon: '🍁' },
      { label: 'Thai', icon: '🥜' },
      { label: 'Mediterranean', icon: '🫒' },
    ],
  },
  {
    label: 'Dish type',
    options: [
      { label: 'Burger', icon: '🍔' },
      { label: 'Wrap / Burrito', icon: '🌯' },
      { label: 'Salad', icon: '🥗' },
      { label: 'Pasta', icon: '🍝' },
      { label: 'Soup / Stew', icon: '🍲' },
      { label: 'Stir Fry', icon: '🥘' },
      { label: 'Sandwich', icon: '🥪' },
      { label: 'Rice Bowl', icon: '🍚' },
      { label: 'Pizza', icon: '🍕' },
      { label: 'Grilled / BBQ', icon: '🔥' },
    ],
  },
]

const STAR_RATINGS = [1, 2, 3, 4, 5]

export default function Recipes() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const isExpiringMode = searchParams.get('expiring') === 'true'
  const { family } = useAuthStore()
  const { isFeatureEnabled } = useAppConfigStore()
  const plan = family?.plan?.toLowerCase() || 'free'
  const isPaidPlan = plan === 'family' || plan === 'premium'
  const canUseSubstitutions = isFeatureEnabled('smart_substitutions', plan) && isPaidPlan
  const canSaveRecipes = isFeatureEnabled('recipe_saving', plan)
  const canUseMealPatterns = isFeatureEnabled('meal_patterns', plan)
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
  const [substitutions, setSubstitutions] = useState({})
  const [substitutionLoading, setSubstitutionLoading] = useState({})
  const [activeSubstitution, setActiveSubstitution] = useState(null)
  const [savedRecipes, setSavedRecipes] = useState({})
  const [savingRecipe, setSavingRecipe] = useState({})
  const [mode, setMode] = useState('food') // 'food' | 'drinks'
  const [drinkCondition, setDrinkCondition] = useState(null)
  const [drinks, setDrinks] = useState([])
  const [drinksLoading, setDrinksLoading] = useState(false)
  const [drinksGenerated, setDrinksGenerated] = useState(false)
  const [drinkUsage, setDrinkUsage] = useState(null)
  const [expandedDrinkId, setExpandedDrinkId] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')
  const [budgetMode, setBudgetMode] = useState(false)
  const [recipeCosts, setRecipeCosts] = useState({})
  const [cookedModal, setCookedModal] = useState(null)
  const [expiringItems, setExpiringItems] = useState([])
  const [expiringBannerDismissed, setExpiringBannerDismissed] = useState(false)
  const [showAIDisclosure, setShowAIDisclosure] = useState(false)
  const [pendingAIAction, setPendingAIAction] = useState(null)
  const aiDisclosureKey = `nooka_ai_disclosure_${family?.id}`
  const hasAcknowledgedAI = () => localStorage.getItem(aiDisclosureKey) === 'true'
  const acknowledgeAI = () => localStorage.setItem(aiDisclosureKey, 'true')

  useEffect(() => {
    fetchMembers()
    fetchCookingHistory()
    if (isExpiringMode) fetchExpiringItems()

    const preloaded = location.state?.preloadedRecipes
    if (preloaded) {
      const { recipes: preloadRecipes, usage: preloadUsage, mealType: preloadMealType, members: preloadMembers } = preloaded
      setRecipes(preloadRecipes)
      setUsage(preloadUsage)
      setGenerated(true)
      setActiveFilter('all')
      if (preloadMealType) setMealType(preloadMealType)
      // Only hydrate member selection for real names — skip the 'Family' fallback
      if (preloadMembers?.length && preloadMembers[0] !== 'Family') {
        setSelectedMembers(preloadMembers)
      }
      window.history.replaceState({}, document.title)
    }
  }, [])

  const fetchExpiringItems = async () => {
    try {
      const data = await getExpiringSoon()
      const nonExpired = data.filter(i => !i.isExpired).map(i => i.name)
      setExpiringItems(nonExpired)
    } catch (err) {
      console.error('Failed to load expiring items', err)
    }
  }

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
    if (!hasAcknowledgedAI()) {
      setPendingAIAction('generate')
      setShowAIDisclosure(true)
      return
    }
    setLoading(true)
    setGenerated(false)
    setLimitError('')
    setSubstitutions({})
    setActiveSubstitution(null)
    try {
      const data = await suggestRecipes(selectedMembers, mealType, cuisine, isExpiringMode ? expiringItems : [])
      setRecipes(data.recipes)
      setUsage(data.usage)
      setGenerated(true)
      setActiveFilter('all')
      setRecipeCosts({})
      if (isPaidPlan) {
        estimateRecipeCosts(data.recipes)
          .then(({ costs }) => {
            const costMap = {}
            costs.forEach(c => { if (c.cost) costMap[c.name] = c.cost })
            setRecipeCosts(costMap)
          })
          .catch(() => { })
      }
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
    if (!hasAcknowledgedAI()) {
      setPendingAIAction('family')
      setShowAIDisclosure(true)
      return
    }
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
      setTimeout(() => setCookedId(null), 3000)

      const membersToLog = idx === 'family'
        ? members.map(m => m.name)
        : selectedMembers

      let nutritionLogged = false
      if (recipe.nutritionPerServing && membersToLog.length > 0) {
        try {
          await logNutrition(membersToLog, recipe.name, mealType, recipe.nutritionPerServing)
          nutritionLogged = true
        } catch (e) {
          console.log('Nutrition log skipped:', e.message)
        }
      }

      let mealPlanMarked = false
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

        const planData = await getMealPlan(weekStartStr)
        const matchingSlot = planData.meals?.find(m =>
          m.day === todayName &&
          m.mealType === mealType &&
          m.recipeName.toLowerCase() === recipe.name.toLowerCase() &&
          !m.cooked
        )
        if (matchingSlot) {
          await markMealCooked(matchingSlot.id)
          mealPlanMarked = true
        }
      } catch (e) {
        console.log('Meal plan mark skipped:', e.message)
      }

      setCookedModal({
        recipe,
        membersLogged: nutritionLogged ? membersToLog : [],
        mealPlanMarked,
        pantryUpdated: true,
      })

      setRatingModal({ recipe, idx })
      setPendingRating(0)

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

    if (activeSubstitution === key) {
      setActiveSubstitution(null)
      return
    }

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

  const handleSaveRecipe = async (recipe, idx) => {
    setSavingRecipe(prev => ({ ...prev, [idx]: true }))
    try {
      await saveRecipe({
        name: recipe.name,
        description: recipe.description,
        icon: recipe.icon,
        time: recipe.time,
        difficulty: recipe.difficulty,
        serves: recipe.serves,
        tags: recipe.tags,
        ingredients: recipe.ingredients,
        missing: recipe.missing,
        steps: recipe.steps,
        nutrition: recipe.nutrition,
        nutritionPerServing: recipe.nutritionPerServing,
        allergenWarnings: recipe.allergenWarnings,
      })
      setSavedRecipes(prev => ({ ...prev, [idx]: true }))
      showToast('Recipe saved to cookbook! 📖')
    } catch (err) {
      if (err.response?.data?.alreadySaved) {
        showToast('Recipe already in cookbook!', 'error')
      } else {
        showToast('Failed to save recipe', 'error')
      }
    } finally {
      setSavingRecipe(prev => ({ ...prev, [idx]: false }))
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

      {/* Full screen loading overlays */}
      <CookingLoader mode="recipes" visible={loading} />
      <CookingLoader mode="family" visible={familyLoading} />

      {/* AI data disclosure modal — shown once per user before first recipe generation */}
      {showAIDisclosure && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-card shadow-xl p-6 overflow-y-auto" style={{ maxHeight: 'calc(100dvh - 120px)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon name="ai" size={20} className="text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-textPrimary">Before we generate your recipes</h3>
                <p className="text-xs text-textMuted mt-0.5">One-time notice — we won't ask again</p>
              </div>
            </div>
            <p className="text-sm text-textMuted mb-3 leading-relaxed">
              To generate personalized recipes, Nooka sends the following to Anthropic's AI (servers located in the US):
            </p>
            <ul className="space-y-1.5 mb-4">
              {[
                'Dietary preferences and restrictions',
                'Health goals and allergens',
                'Age ranges of family members',
                'Items currently in your pantry',
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-textMuted">
                  <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <div className="bg-gray-50 rounded-btn px-3 py-2.5 mb-4">
              <p className="text-xs text-textMuted leading-relaxed">
                Your <span className="font-semibold text-textPrimary">name, email, and account details are never shared</span> with any AI service. Only anonymous health and pantry data is used.
              </p>
            </div>
            <p className="text-xs text-textMuted mb-5">
              By continuing you consent to this data being processed by Anthropic in accordance with their privacy policy and our{' '}
              <a href="/privacy" target="_blank" className="text-primary hover:underline">Privacy Policy</a>.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowAIDisclosure(false); setPendingAIAction(null) }}
                className="btn-secondary flex-1 text-sm">
                Cancel
              </button>
              <button
                onClick={() => {
                  acknowledgeAI()
                  setShowAIDisclosure(false)
                  if (pendingAIAction === 'generate') handleGenerate()
                  if (pendingAIAction === 'family') handleFamilyRecipe()
                  setPendingAIAction(null)
                }}
                className="btn-primary flex-1 text-sm">
                I understand, continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rating modal */}
      {ratingModal && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-end sm:items-center sm:p-4">
          <div className="bg-white w-full max-w-sm rounded-t-2xl sm:rounded-card shadow-xl p-6 modal-sheet">
            <h3 className="font-semibold text-textPrimary text-lg mb-1">How was it? 🍽️</h3>
            <p className="text-sm text-textMuted mb-5">Rate <span className="font-medium text-textPrimary">{ratingModal.recipe.name}</span> so we can learn your family's preferences</p>
            <div className="flex justify-center gap-3 mb-6">
              {STAR_RATINGS.map(star => (
                <button
                  key={star}
                  onClick={() => setPendingRating(star)}
                  className={`transition-all ${pendingRating >= star ? 'opacity-100 scale-110' : 'opacity-30'}`}
                >
                  <Icon name="star" size={32} className={pendingRating >= star ? 'text-yellow-400' : 'text-gray-300'} strokeWidth={1.5} />
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

      {/* Expiring items banner */}
      {isExpiringMode && !expiringBannerDismissed && expiringItems.length > 0 && (
        <div className="mb-5 bg-orange-50 border border-orange-200 rounded-card px-5 py-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="text-xl">⏰</span>
            <div>
              <p className="text-sm font-semibold text-orange-800">Prioritising expiring items</p>
              <p className="text-sm text-orange-700 mt-0.5">
                AI will focus on using: <span className="font-medium">{expiringItems.slice(0, 4).join(', ')}{expiringItems.length > 4 ? ` +${expiringItems.length - 4} more` : ''}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setExpiringBannerDismissed(true)}
            className="text-orange-400 hover:text-orange-600 text-lg leading-none flex-shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-textPrimary">Recipes & Drinks</h1>
        <p className="text-textMuted mt-1">AI-powered suggestions based on your pantry and health goals</p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-6 bg-surface border border-border rounded-card p-1">
        <button
          onClick={() => setMode('food')}
          className={`flex-1 py-2 rounded-btn text-sm font-medium transition-all ${mode === 'food' ? 'bg-primary text-white shadow-sm' : 'text-textMuted hover:text-textPrimary'
            }`}
        >
          🍽️ Food
        </button>
        <button
          onClick={() => setMode('drinks')}
          className={`flex-1 py-2 rounded-btn text-sm font-medium transition-all ${mode === 'drinks' ? 'bg-primary text-white shadow-sm' : 'text-textMuted hover:text-textPrimary'
            }`}
        >
          🥤 Drinks & Remedies
        </button>
      </div>

      {/* ── DRINKS MODE ───────────────────────────────────────────────── */}
      {mode === 'drinks' && (
        <div>
          {/* Disclaimer */}
          <div className="bg-blue-50 border border-blue-100 rounded-card px-4 py-3 mb-6 flex items-start gap-3">
            <span className="text-lg">ℹ️</span>
            <p className="text-xs text-primary leading-relaxed">
              Drink suggestions are home wellness ideas inspired by traditional remedies from around the world. They are not medical advice. Consult a healthcare professional for serious symptoms.
            </p>
          </div>

          {/* Condition selector */}
          <div className="card mb-6 border-2 border-blue-100 bg-blue-50/30">
            <h2 className="font-semibold text-textPrimary mb-1">How are you feeling?</h2>
            <p className="text-xs text-textMuted mb-4">Pick a condition and we'll suggest drinks from different cultural traditions based on what's in your pantry</p>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {DRINK_CONDITIONS.map(c => (
                <button
                  key={c.label}
                  onClick={() => setDrinkCondition(c.label)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-btn border text-sm font-medium transition-all text-left ${drinkCondition === c.label
                    ? 'bg-primary text-white border-primary'
                    : 'bg-surface text-textMuted border-border hover:border-primary hover:text-primary'
                    }`}
                >
                  <span className="text-base">{c.icon}</span>
                  <span className="leading-tight">{c.label}</span>
                </button>
              ))}
            </div>

            {/* Plan gate */}
            {plan === 'free' && (
              <div className="bg-amber-50 border border-amber-200 rounded-btn px-4 py-3 mb-4 text-center">
                <p className="text-sm font-medium text-amber-700 mb-1">Family plan feature</p>
                <p className="text-xs text-amber-600">Upgrade to Family ($9.99/mo) to unlock drinks & remedies</p>
              </div>
            )}

            {drinkUsage && drinkUsage.plan === 'family' && (
              <p className="text-xs text-textMuted mb-3 text-center">
                {drinkUsage.used} of {drinkUsage.limit} drinks used this week
              </p>
            )}

            <button
              onClick={async () => {
                if (!drinkCondition || plan === 'free') return
                setDrinksLoading(true)
                setDrinksGenerated(false)
                try {
                  const data = await suggestDrinks(drinkCondition)
                  setDrinks(data.drinks)
                  setDrinkUsage(data.usage)
                  setDrinksGenerated(true)
                  setExpandedDrinkId(null)
                } catch (err) {
                  if (err.response?.data?.limitReached) {
                    showToast(err.response.data.message, 'error')
                  } else {
                    showToast('Failed to generate drinks. Please try again.', 'error')
                  }
                } finally {
                  setDrinksLoading(false)
                }
              }}
              disabled={!drinkCondition || drinksLoading || plan === 'free'}
              className="btn-primary w-full py-3 text-base disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {drinksLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Finding drinks...
                </>
              ) : <><Icon name="ai" size={16} /> Suggest drinks</>}
            </button>
          </div>

          {/* Drink results */}
          {drinksGenerated && drinks.length > 0 && (
            <div className="space-y-4 mb-8">
              <h2 className="font-semibold text-textPrimary">
                Drinks for "{drinkCondition}"
              </h2>
              {drinks.map((drink, idx) => (
                <div key={idx} className="card border border-border">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="text-2xl flex-shrink-0">{drink.icon}</span>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-textPrimary text-sm leading-tight">{drink.name}</h3>
                        <p className="text-xs text-textMuted mt-0.5">{drink.culture}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-pill font-medium ${drink.temp === 'hot' ? 'bg-orange-50 text-orange-600' :
                        drink.temp === 'cold' ? 'bg-blue-50 text-primary' :
                          'bg-gray-50 text-textMuted'
                        }`}>
                        {drink.temp === 'hot' ? '♨️ Hot' : drink.temp === 'cold' ? '🧊 Cold' : '🌡️ Either'}
                      </span>
                      <span className="text-xs text-textMuted">⏱ {drink.prepTime}</span>
                    </div>
                  </div>

                  {/* Why it helps */}
                  <div className="bg-green-50 border border-green-100 rounded-btn px-3 py-2 mb-3">
                    <p className="text-xs text-green-700 leading-relaxed">
                      <span className="font-semibold">Why it helps: </span>{drink.why}
                    </p>
                  </div>

                  {/* Pantry badge */}
                  {drink.fullyFromPantry && (
                    <div className="flex items-center gap-1.5 mb-3">
                      <span className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-pill font-medium">✓ All in your pantry</span>
                    </div>
                  )}

                  <button
                    onClick={() => setExpandedDrinkId(expandedDrinkId === idx ? null : idx)}
                    className="btn-secondary w-full text-sm"
                  >
                    {expandedDrinkId === idx ? 'Hide recipe' : 'How to make it'}
                  </button>

                  {expandedDrinkId === idx && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs font-semibold text-textPrimary mb-2">Ingredients</p>
                      <ul className="space-y-1.5 mb-4">
                        {drink.ingredients?.map((ing, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-textMuted">
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${ing.inPantry ? 'bg-green-100 text-success' : 'bg-orange-100 text-orange-500'
                              }`}>
                              {ing.inPantry ? '✓' : '+'}
                            </span>
                            {ing.name} — {ing.quantity} {ing.unit}
                            {!ing.inPantry && <span className="text-xs text-orange-400">(buy)</span>}
                          </li>
                        ))}
                      </ul>

                      <p className="text-xs font-semibold text-textPrimary mb-2">Steps</p>
                      <ol className="space-y-2 mb-4">
                        {drink.steps?.map((step, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                            <p className="text-sm text-textMuted leading-relaxed">{step}</p>
                          </li>
                        ))}
                      </ol>

                      {drink.tip && (
                        <div className="bg-amber-50 border border-amber-100 rounded-btn px-3 py-2">
                          <p className="text-xs text-amber-700">💡 {drink.tip}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── FOOD MODE ─────────────────────────────────────────────────── */}
      {mode === 'food' && (
        <div>

          {/* Health disclaimer */}
          <div className="bg-blue-50 border border-blue-100 rounded-card px-4 py-3 mb-6 flex items-start gap-3">
            <span className="text-lg">ℹ️</span>
            <p className="text-xs text-primary leading-relaxed">
              Recipe suggestions and nutritional information are generated by AI for general wellness purposes only and are not medical advice. Consult a healthcare professional for specific dietary needs.
            </p>
          </div>

          {/* Cooking history */}
          {canUseMealPatterns && cookingHistory.length > 0 && (
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
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 px-4 sm:mx-0 sm:px-0">
                  {members.map(m => (
                    <button
                      key={m.id}
                      onClick={() => toggleMember(m.name)}
                      className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-pill border text-sm font-medium transition-all ${selectedMembers.includes(m.name)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-surface text-textMuted border-border hover:border-primary hover:text-primary'
                        }`}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${selectedMembers.includes(m.name) ? 'bg-white text-primary' : 'bg-gray-100 text-textMuted'
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
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 sm:mx-0 sm:px-0">
                {MEAL_TYPES.map(t => (
                  <button
                    key={t}
                    onClick={() => setMealType(t)}
                    className={`flex-shrink-0 px-4 py-2 rounded-pill border text-sm font-medium transition-all ${mealType === t ? 'bg-primary text-white border-primary' : 'bg-surface text-textMuted border-border hover:border-primary hover:text-primary'
                      }`}
                  >
                    {t === 'Breakfast' ? '🌅' : t === 'Lunch' ? '☀️' : t === 'Dinner' ? '🌙' : '🍎'} {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Cuisine selector */}
            <div className="mb-6">
              <label className="label">What are you in the mood for?</label>
              {CUISINE_CATEGORIES.map(cat => (
                <div key={cat.label} className="mb-3">
                  <p className="text-xs text-textMuted mb-2">{cat.label}</p>
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 sm:mx-0 sm:px-0">
                    {cat.options.map(c => (
                      <button
                        key={c.label}
                        onClick={() => setCuisine(c.label)}
                        className={`flex-shrink-0 px-4 py-2 rounded-pill border text-sm font-medium transition-all ${cuisine === c.label ? 'bg-primary text-white border-primary' : 'bg-surface text-textMuted border-border hover:border-primary hover:text-primary'
                          }`}
                      >
                        {c.icon} {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
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
                  className="px-4 py-2 bg-purple-600 text-white rounded-btn text-sm font-medium hover:bg-purple-700 transition-all disabled:opacity-50 flex items-center gap-2 flex-shrink-0"
                >
                  {familyLoading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
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
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Generating...
                  </>
                ) : <><Icon name="ai" size={16} /> Generate recipes</>}
              </button>
              {selectedMembers.length === 0 && <p className="text-sm text-textMuted">Select at least one member</p>}
            </div>

            {/* Limit error */}
            {limitError && (
              <div className="mt-4 bg-orange-50 border border-orange-100 rounded-card p-4">
                <p className="text-sm font-semibold text-orange-600 mb-1">Weekly limit reached</p>
                <p className="text-sm text-orange-500">{limitError}</p>
                <button onClick={() => navigate('/app/settings?tab=plan')} className="btn-primary mt-3 text-sm">Upgrade to Family plan</button>
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
                      className={`text-xs px-2.5 py-1 rounded-pill font-medium transition-all ${addedToGrocery['family'] ? 'bg-success text-white' : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
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
                              onClick={() => isPaidPlan ? handleFindSubstitutes(m, 'family', familyRecipe.name) : navigate('/app/settings?tab=plan')}
                              className="text-xs text-primary hover:underline font-medium ml-2 flex-shrink-0"
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
                                        <span className="text-xs font-medium ml-2 flex-shrink-0 opacity-75">{qualityLabel(sub.quality)}</span>
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

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => handleCook(familyRecipe, 'family')}
                  className={`flex-1 py-3 rounded-btn text-sm font-medium transition-all ${cookedId === 'family' ? 'bg-success text-white' : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                >
                  {cookedId === 'family' ? '✓ Cooked! Pantry updated' : '🍳 I cooked this — update pantry'}
                </button>
                {canSaveRecipes && (
                  <button
                    onClick={() => handleSaveRecipe(familyRecipe, 'family')}
                    disabled={savingRecipe['family'] || savedRecipes['family']}
                    className={`py-3 px-4 rounded-btn text-sm font-medium transition-all border ${savedRecipes['family']
                      ? 'bg-yellow-50 text-yellow-600 border-yellow-200'
                      : 'bg-surface text-textMuted border-border hover:border-yellow-300 hover:text-yellow-600'
                      } disabled:opacity-50`}
                  >
                    {savingRecipe['family'] ? '...' : savedRecipes['family'] ? '🔖 Saved' : '🔖 Save'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Results */}
          {generated && recipes.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="font-semibold text-textPrimary">{recipes.length} recipes suggested for {mealType.toLowerCase()}</h2>
                <span className="text-xs bg-green-50 text-success border border-green-100 px-3 py-1 rounded-pill font-medium">Based on your pantry</span>
              </div>

              {/* Budget mode toggle */}
              {isPaidPlan && Object.keys(recipeCosts).length > 0 && (
                <div className="flex items-center justify-between mb-4 bg-green-50 border border-green-100 rounded-btn px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <Icon name="dollar" size={16} className="text-green-600" />
                    <span className="text-sm font-medium text-textPrimary">Budget mode</span>
                    <span className="text-xs text-textMuted">Sort by cheapest first</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBudgetMode(prev => !prev)}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 focus:outline-none ${budgetMode ? 'bg-green-500' : 'bg-gray-200'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200 ${budgetMode ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>
              )}

              {/* Ingredient tier filter */}
              {(() => {
                const cookNow = recipes.filter(r => !r.missing || r.missing.length === 0)
                const tonight = recipes.filter(r => r.missing?.length === 1)
                const planAhead = recipes.filter(r => r.missing?.length >= 2)
                return (
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                      { key: 'cookNow', label: 'Cook now', sublabel: '100% in pantry', icon: '🟢', count: cookNow.length, color: activeFilter === 'cookNow' ? 'border-green-400 bg-green-50' : 'border-green-100 bg-green-50/40 hover:border-green-300' },
                      { key: 'tonight', label: 'Tonight', sublabel: 'Need 1 item', icon: '🟡', count: tonight.length, color: activeFilter === 'tonight' ? 'border-yellow-400 bg-yellow-50' : 'border-yellow-100 bg-yellow-50/40 hover:border-yellow-300' },
                      { key: 'planAhead', label: 'Plan ahead', sublabel: 'Need a shop', icon: '🔵', count: planAhead.length, color: activeFilter === 'planAhead' ? 'border-blue-400 bg-blue-50' : 'border-blue-100 bg-blue-50/40 hover:border-blue-300' },
                    ].map(tier => (
                      <button
                        key={tier.key}
                        onClick={() => setActiveFilter(activeFilter === tier.key ? 'all' : tier.key)}
                        className={`rounded-card border-2 px-3 py-3 text-center transition-all ${tier.color} ${tier.count === 0 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                        disabled={tier.count === 0}
                      >
                        <div className="text-xl mb-1">{tier.icon}</div>
                        <p className="text-sm font-semibold text-textPrimary">{tier.label}</p>
                        <p className="text-xs text-textMuted">{tier.sublabel}</p>
                        <p className="text-lg font-bold text-textPrimary mt-1">{tier.count}</p>
                      </button>
                    ))}
                  </div>
                )
              })()}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {recipes.filter(r => {
                  if (activeFilter === 'cookNow') return !r.missing || r.missing.length === 0
                  if (activeFilter === 'tonight') return r.missing?.length === 1
                  if (activeFilter === 'planAhead') return r.missing?.length >= 2
                  return true
                }).sort((a, b) => {
                  if (!budgetMode) return 0
                  const costA = recipeCosts[a.name]?.costPerServing ?? 999
                  const costB = recipeCosts[b.name]?.costPerServing ?? 999
                  return costA - costB
                }).map((recipe, idx) => (
                  <div key={idx} className="card hover:shadow-md transition-all">

                    <div className="flex items-start justify-between mb-3">
                      <div className="text-4xl">{recipe.icon}</div>
                      <span className={`text-xs px-2.5 py-1 rounded-pill font-medium ${recipe.difficulty === 'Easy' ? 'bg-green-50 text-success' : 'bg-orange-50 text-orange-500'
                        }`}>
                        {recipe.difficulty}
                      </span>
                    </div>

                    <h3 className="font-semibold text-textPrimary text-lg mb-1">{recipe.name}</h3>
                    {recipeCosts[recipe.name] && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-xs bg-green-50 text-green-700 border border-green-100 px-2.5 py-1 rounded-pill font-medium">
                          💰 ~${recipeCosts[recipe.name].costPerServing}/serving
                        </span>
                        {recipeCosts[recipe.name].isEstimate && (
                          <span className="text-xs text-textMuted">estimated</span>
                        )}
                      </div>
                    )}
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

                    {/* Missing ingredients */}
                    {recipe.missing?.length > 0 && (
                      <div className="bg-orange-50 border border-orange-100 rounded-btn px-3 py-2 mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-medium text-orange-600">Need to buy:</p>
                          <button
                            onClick={() => handleAddToGrocery(recipe, idx)}
                            disabled={addingToGrocery[idx]}
                            className={`text-xs px-2.5 py-1 rounded-pill font-medium transition-all ${addedToGrocery[idx] ? 'bg-success text-white' : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
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
                                  {isFeatureEnabled('smart_substitutions', plan) && (
                                    <button
                                      onClick={() => canUseSubstitutions ? handleFindSubstitutes(m, idx, recipe.name) : navigate('/app/settings?tab=plan')}
                                      className="text-xs text-primary hover:underline font-medium ml-2 whitespace-nowrap"
                                    >
                                      {!canUseSubstitutions ? '⭐ Upgrade' : activeSubstitution === key ? 'Hide' : '🔄 Substitute'}
                                    </button>
                                  )}
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

                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => setExpandedId(expandedId === idx ? null : idx)}
                        className="btn-secondary flex-1 text-sm"
                      >
                        {expandedId === idx ? 'Hide' : 'View ingredients'}
                      </button>
                      <button
                        onClick={() => handleCook(recipe, idx)}
                        className={`flex-1 text-sm py-2 px-3 rounded-btn font-medium transition-all ${cookedId === idx ? 'bg-success text-white' : 'bg-green-50 text-success border border-green-200 hover:bg-green-100'
                          }`}
                      >
                        {cookedId === idx ? '✓ Pantry updated!' : '🍳 I cooked this'}
                      </button>
                      {canSaveRecipes && (
                        <button
                          onClick={() => handleSaveRecipe(recipe, idx)}
                          disabled={savingRecipe[idx] || savedRecipes[idx]}
                          className={`text-sm py-2 px-3 rounded-btn font-medium transition-all border ${savedRecipes[idx]
                            ? 'bg-yellow-50 text-yellow-600 border-yellow-200'
                            : 'bg-surface text-textMuted border-border hover:border-yellow-300 hover:text-yellow-600'
                            } disabled:opacity-50`}
                        >
                          {savingRecipe[idx] ? '...' : savedRecipes[idx] ? '🔖 Saved' : '🔖 Save'}
                        </button>
                      )}
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
                                className={`text-xs px-3 py-1 rounded-pill border transition-all ${(nutritionView[idx] || 'serving') === 'serving' ? 'bg-primary text-white border-primary' : 'text-textMuted border-border'
                                  }`}
                              >
                                Per serving
                              </button>
                              <button
                                onClick={() => setNutritionView(prev => ({ ...prev, [idx]: 'total' }))}
                                className={`text-xs px-3 py-1 rounded-pill border transition-all ${nutritionView[idx] === 'total' ? 'bg-primary text-white border-primary' : 'text-textMuted border-border'
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

          {/* I cooked this — confirmation modal */}
          {cookedModal && (
            <div className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center sm:p-4 backdrop-blur-sm">
              <div className="bg-white rounded-t-2xl sm:rounded-card shadow-xl w-full max-w-sm p-6 modal-sheet">
                <div className="text-5xl text-center mb-3">🍳</div>
                <h3 className="font-bold text-textPrimary text-center text-lg mb-1">Nice cook!</h3>
                <p className="text-sm text-textMuted text-center mb-5">Here's what Nooka updated for you</p>
                <div className="space-y-2.5 mb-6">
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-btn border ${cookedModal.pantryUpdated ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'
                    }`}>
                    <Icon name="pantry" size={18} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-textPrimary">Pantry updated</p>
                      <p className="text-xs text-textMuted">Ingredients subtracted from your pantry</p>
                    </div>
                    <span className="text-success text-lg">✓</span>
                  </div>

                  <div className={`flex items-center gap-3 px-4 py-3 rounded-btn border ${cookedModal.membersLogged.length > 0 ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'
                    }`}>
                    <Icon name="health" size={18} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-textPrimary">Nutrition logged</p>
                      <p className="text-xs text-textMuted">
                        {cookedModal.membersLogged.length > 0
                          ? `For ${cookedModal.membersLogged.join(', ')}`
                          : 'No members selected'}
                      </p>
                    </div>
                    {cookedModal.membersLogged.length > 0
                      ? <span className="text-success text-lg">✓</span>
                      : <span className="text-textMuted text-lg">—</span>
                    }
                  </div>

                  <div className={`flex items-center gap-3 px-4 py-3 rounded-btn border ${cookedModal.mealPlanMarked ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'
                    }`}>
                    <Icon name="mealplan" size={18} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-textPrimary">Meal plan</p>
                      <p className="text-xs text-textMuted">
                        {cookedModal.mealPlanMarked
                          ? "Today's slot marked as done"
                          : 'No matching slot found for today'}
                      </p>
                    </div>
                    {cookedModal.mealPlanMarked
                      ? <span className="text-success text-lg">✓</span>
                      : <span className="text-textMuted text-lg">—</span>
                    }
                  </div>
                </div>
                <button
                  onClick={() => setCookedModal(null)}
                  className="btn-primary w-full"
                >
                  Done
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

    </div>
  )
}