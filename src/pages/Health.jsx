import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Icon from '../components/ui/Icon'
import { getHealthData, logWeight, logMeal, updateMemberGoal, deleteNutritionLog, lookupNutrition, searchNutritionCache, getKidsNutritionSummary, calculateIngredients, describeIngredients } from '../api/healthTracker'
import { saveRecipe, getSavedRecipes } from '../api/savedRecipes'
import { LoadingSpinner, Toast } from '../components/ui/PageState'
import { useToast } from '../hooks/useToast'
import { useAppConfigStore } from '../store/appConfigStore'

const FITNESS_GOAL_OPTS = [
  { value: 'cut',       label: 'Cut',       desc: 'Lose fat while keeping muscle' },
  { value: 'lean_bulk', label: 'Lean Bulk', desc: 'Build muscle with minimal fat gain' },
  { value: 'recomp',    label: 'Recomp',    desc: 'Lose fat and gain muscle simultaneously' },
  { value: 'maintain',  label: 'Maintain',  desc: 'Hold your current weight and composition' },
  { value: null,        label: 'None',       desc: '' },
]

const CUT_RATES = [
  { label: 'Relaxed',    sub: '−0.25%/wk', value: 0.0025 },
  { label: 'Steady',     sub: '−0.5%/wk',  value: 0.005  },
  { label: 'Aggressive', sub: '−0.75%/wk', value: 0.0075 },
  { label: 'Rapid',      sub: '−1%/wk',    value: 0.01   },
]

const LEAN_BULK_RATES = [
  { label: 'Slow',   sub: '+0.1%/wk',   value: 0.001  },
  { label: 'Steady', sub: '+0.25%/wk',  value: 0.0025 },
  { label: 'Fast',   sub: '+0.4%/wk',   value: 0.004  },
]

const GOAL_LABELS = { cut: 'Cut', lean_bulk: 'Lean Bulk', recomp: 'Recomp', maintain: 'Maintain' }

export default function Health() {
  const { toast, showToast, hideToast } = useToast()
  const { isFeatureEnabled } = useAppConfigStore()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeMemberId, setActiveMemberId] = useState(null)
  const [activeTab, setActiveTab] = useState('today')
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [showMealModal, setShowMealModal] = useState(false)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [weightForm, setWeightForm] = useState({ weight: '', unit: 'kg', note: '' })
  const [mealForm, setMealForm] = useState({ recipeName: '', mealType: 'Breakfast', calories: '', protein: '', carbs: '', fat: '', calcium: '', iron: '', vitaminD: '' })
  const [goalForm, setGoalForm] = useState({ dailyCalorieGoal: '', goalWeight: '', goalWeightUnit: 'kg', goalType: '', fitnessGoal: null, goalRatePct: null, gender: null })
  const [saving, setSaving] = useState(false)
  const [lookingUp, setLookingUp] = useState(false)
  const [lookupResult, setLookupResult] = useState(null)
  const [servings, setServings] = useState(1)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchingCache, setSearchingCache] = useState(false)
  const debounceRef = useRef(null)
  const [kidsData, setKidsData] = useState(null)
  const [kidsLoading, setKidsLoading] = useState(false)
  const [logMode, setLogMode] = useState('quick')
  const [ingredients, setIngredients] = useState([{ name: '', quantity: '', unit: 'g' }])
  const [calculating, setCalculating] = useState(false)
  const [calcResult, setCalcResult] = useState(null)
  const [customMealName, setCustomMealName] = useState('')
  const [saveAsRecipe, setSaveAsRecipe] = useState(false)
  const [savedMeals, setSavedMeals] = useState([])
  const [showSavedSuggestions, setShowSavedSuggestions] = useState(false)
  const [mealDescription, setMealDescription] = useState('')
  const [describeError, setDescribeError] = useState('')
  const [dismissedGenderBanner, setDismissedGenderBanner] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (!activeMemberId || !data) return
    const member = data.members?.find(m => m.id === activeMemberId)
    if (member?.age && member.age < 18) {
      setKidsData(null)
      setKidsLoading(true)
      getKidsNutritionSummary(activeMemberId)
        .then(setKidsData)
        .catch(() => {})
        .finally(() => setKidsLoading(false))
    } else {
      setKidsData(null)
    }
  }, [activeMemberId, data])

  const fetchData = async () => {
    try {
      const res = await getHealthData({ days: 7 })
      setData(res)
      if (res.members?.length > 0 && !activeMemberId) {
        setActiveMemberId(res.members[0].id)
      }
    } catch (err) {
      showToast('Failed to load health data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const activeMember = data?.members?.find(m => m.id === activeMemberId)

  const getCalorieColor = (consumed, goal) => {
    if (!goal) return 'bg-primary'
    const pct = consumed / goal
    if (pct >= 1) return 'bg-danger'
    if (pct >= 0.85) return 'bg-orange-400'
    return 'bg-primary'
  }

  const getCalorieStatus = (consumed, goal) => {
    if (!goal) return null
    const remaining = goal - consumed
    if (remaining < 0) return { text: `${Math.abs(remaining)} cal over goal`, color: 'text-danger' }
    if (remaining < 200) return { text: `${remaining} cal remaining`, color: 'text-orange-500' }
    return { text: `${remaining} cal remaining`, color: 'text-success' }
  }

const getGoalNudges = (member) => {
    if (!member) return []
    const { last7Days, macroTargets, dailyCalorieGoal, goals, todayTotals, recentMeals, streak } = member
    const goal = (goals || '').toLowerCase()
    const nudges = []

    // Count days with meals logged in last 7
    const loggedDays = last7Days.filter(d => d.mealsLogged > 0).length
    const totalDays = last7Days.length

    // Not enough data
    if (loggedDays === 0) return [{
      icon: 'health', color: 'bg-blue-50 border-blue-100', iconClass: 'text-blue-500',
      text: 'Start logging meals to see personalized insights based on your goal.'
    }]

    // Low logging rate
    if (loggedDays < 4) {
      nudges.push({
        icon: 'info', color: 'bg-yellow-50 border-yellow-100', iconClass: 'text-yellow-500',
        text: `Only ${loggedDays} of ${totalDays} days logged this week — track more meals for accurate insights.`
      })
    }

    // Avg calories over logged days
    const avgCalories = loggedDays > 0
      ? Math.round(last7Days.filter(d => d.calories > 0).reduce((s, d) => s + d.calories, 0) / loggedDays)
      : 0

    // Avg macros from recentMeals (last 7 days)
    const recentLogged = (recentMeals || [])
    const avgProtein = recentLogged.length > 0
      ? Math.round(recentLogged.reduce((s, m) => s + (m.protein || 0), 0) / recentLogged.length)
      : 0
    const avgFiber = recentLogged.length > 0
      ? Math.round(recentLogged.reduce((s, m) => s + (m.fiber || 0), 0) / recentLogged.length)
      : 0

    // Days hitting calorie goal
    const daysHittingGoal = dailyCalorieGoal
      ? last7Days.filter(d => d.calories > 0 && d.calories >= dailyCalorieGoal * 0.85 && d.calories <= dailyCalorieGoal * 1.1).length
      : 0

    // ── Goal-specific nudges ──────────────────────────────────────────────────

    if (goal.includes('gain muscle') || goal.includes('high protein')) {
      const proteinTarget = macroTargets?.protein || 120
      if (avgProtein > 0 && avgProtein < proteinTarget * 0.8) {
        nudges.push({
          icon: 'warning', color: 'bg-orange-50 border-orange-100', iconClass: 'text-orange-500',
          text: `Protein is averaging ${avgProtein}g vs your ${proteinTarget}g target — try adding chicken, eggs, or legumes to more meals.`
        })
      } else if (avgProtein >= proteinTarget * 0.9) {
        nudges.push({
          icon: 'star', color: 'bg-green-50 border-green-100', iconClass: 'text-green-500',
          text: `Protein is on track at ${avgProtein}g avg this week — keep it up to support muscle growth!`
        })
      }
      if (avgCalories > 0 && dailyCalorieGoal && avgCalories < dailyCalorieGoal * 0.85) {
        nudges.push({
          icon: 'info', color: 'bg-blue-50 border-blue-100', iconClass: 'text-blue-500',
          text: `Averaging ${avgCalories} kcal vs your ${dailyCalorieGoal} kcal goal — a slight surplus helps muscle gain.`
        })
      }
    }

    if (goal.includes('lose weight')) {
      const proteinTarget = macroTargets?.protein || 100
      if (avgProtein > 0 && avgProtein < proteinTarget * 0.8) {
        nudges.push({
          icon: 'warning', color: 'bg-orange-50 border-orange-100', iconClass: 'text-orange-500',
          text: `Protein is low at ${avgProtein}g avg — keeping protein high helps preserve muscle while losing weight.`
        })
      }
      if (daysHittingGoal >= 5) {
        nudges.push({
          icon: 'star', color: 'bg-green-50 border-green-100', iconClass: 'text-green-500',
          text: `You've hit your calorie goal ${daysHittingGoal} of ${loggedDays} days logged — excellent consistency!`
        })
      } else if (avgCalories > 0 && dailyCalorieGoal && avgCalories > dailyCalorieGoal * 1.1) {
        nudges.push({
          icon: 'warning', color: 'bg-orange-50 border-orange-100', iconClass: 'text-orange-500',
          text: `Averaging ${avgCalories} kcal vs your ${dailyCalorieGoal} kcal target — try trimming portions or snacks to stay in deficit.`
        })
      }
    }

    if (goal.includes('maintain')) {
      if (daysHittingGoal >= 4) {
        nudges.push({
          icon: 'check', color: 'bg-green-50 border-green-100', iconClass: 'text-green-500',
          text: `Calories are consistent this week — ${daysHittingGoal} days within your maintenance range. Great work.`
        })
      } else if (loggedDays >= 4) {
        nudges.push({
          icon: 'info', color: 'bg-blue-50 border-blue-100', iconClass: 'text-blue-500',
          text: `Calorie consistency could be better this week — aim to stay within 10% of your ${dailyCalorieGoal} kcal goal daily.`
        })
      }
    }

    if (goal.includes('improve energy') || goal.includes('energy')) {
      if (avgFiber > 0 && avgFiber < 20) {
        nudges.push({
          icon: 'leaf', color: 'bg-green-50 border-green-100', iconClass: 'text-green-500',
          text: `Fiber is averaging ${avgFiber}g per meal — aim for 25g/day with more vegetables, legumes, and whole grains.`
        })
      }
      if (avgCalories > 0 && dailyCalorieGoal && avgCalories < dailyCalorieGoal * 0.8) {
        nudges.push({
          icon: 'warning', color: 'bg-orange-50 border-orange-100', iconClass: 'text-orange-500',
          text: `Under-eating can cause fatigue — you're averaging ${avgCalories} kcal vs your ${dailyCalorieGoal} kcal goal.`
        })
      }
    }

    // Universal streak nudge
    if (streak >= 5 && nudges.filter(n => n.icon === 'star').length === 0) {
      nudges.push({
        icon: 'star', color: 'bg-yellow-50 border-yellow-100', iconClass: 'text-yellow-500',
        text: `${streak}-day logging streak — consistency is the most important factor in reaching your goal.`
      })
    }

    // No goal set
    if (!goals && nudges.length === 0) {
      nudges.push({
        icon: 'info', color: 'bg-blue-50 border-blue-100', iconClass: 'text-blue-500',
        text: 'Set a goal to get personalized insights — tap "Set goals" above.'
      })
    }

    return nudges.slice(0, 3)
  }

  const handleLogWeight = async () => {
    if (!weightForm.weight) return
    setSaving(true)
    try {
      await logWeight({ memberId: activeMemberId, ...weightForm })
      showToast('Weight logged!')
      setShowWeightModal(false)
      setWeightForm({ weight: '', unit: 'kg', note: '' })
      fetchData()
    } catch (err) {
      showToast('Failed to log weight', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleLookupNutrition = async (mealName) => {
    if (!mealName || mealName.length < 3) return
    setLookingUp(true)
    setLookupResult(null)
    try {
      const result = await lookupNutrition(mealName, servings)
      if (result.found) {
        setMealForm(p => ({
          ...p,
          calories: result.calories || '',
          protein: result.protein || '',
          carbs: result.carbs || '',
          fat: result.fat || '',
          calcium: result.calcium || '',
          iron: result.iron || '',
          vitaminD: result.vitaminD || '',
        }))
        setLookupResult(result)
      }
    } catch (err) {
      if (err.response?.data?.creditsExhausted) {
        showToast('AI service temporarily unavailable. Please try again later.', 'error')
      } else {
        showToast('Could not find nutrition info. Please enter manually.', 'error')
      }
    } finally {
      setLookingUp(false)
    }
  }

  const handleLogMeal = async () => {
    if (!mealForm.recipeName) return
    setSaving(true)
    try {
      await logMeal({ memberName: activeMember?.name, memberId: activeMemberId, ...mealForm })

      // Save as custom recipe if toggled
      if (saveAsRecipe && (logMode === 'ingredients' || logMode === 'describe')) {
        try {
          await saveRecipe({
            name: mealForm.recipeName,
            ingredients: ingredients.filter(i => i.name && i.quantity),
            nutrition: {
              calories: parseFloat(mealForm.calories) || 0,
              protein: parseFloat(mealForm.protein) || 0,
              carbs: parseFloat(mealForm.carbs) || 0,
              fat: parseFloat(mealForm.fat) || 0,
            },
            source: 'custom',
            steps: [],
          })
          showToast('Meal logged and saved to cookbook!')
        } catch {
          showToast('Meal logged! (Could not save recipe — may already exist)')
        }
      } else {
        showToast('Meal logged!')
      }

      resetMealModal()
      fetchData()
    } catch (err) {
      showToast('Failed to log meal', 'error')
    } finally {
      setSaving(false)
    }
  }

  const FOOD_SIGNAL_WORDS = [
    // ── Proteins — Global ─────────────────────────────────────────────────────
    'chicken','beef','pork','fish','salmon','tuna','egg','tofu','lentil','bean','chickpea',
    'lamb','turkey','shrimp','paneer','prawn','crab','lobster','squid','octopus','clam','mussel',
    'duck','goat','mutton','venison','bison','bacon','sausage','ham','pepperoni','sardine',
    'mackerel','tilapia','cod','halibut','trout','herring','anchovy','mahi','catfish',
    'tempeh','seitan','edamame','quorn','jackfruit','mince','ground',
    // South Asian proteins
    'dal','daal','chana','rajma','moong','urad','masoor','toor','kala chana',
    // East Asian proteins
    'pork belly','char siu','lap cheong','kimchi','natto','miso',

    // ── Dairy & Alternatives ──────────────────────────────────────────────────
    'milk','cheese','yogurt','cream','butter','ghee','paneer','curd','lassi','buttermilk',
    'whey','casein','kefir','cottage','ricotta','mozzarella','cheddar','feta','brie','gouda',
    'parmesan','halloumi','quark','skyr','oat milk','almond milk','soy milk','coconut milk',
    'condensed','evaporated','gelato','custard','pudding',

    // ── Grains & Breads — Global ──────────────────────────────────────────────
    'rice','pasta','bread','roti','naan','tortilla','oat','quinoa','flour','chapati','paratha',
    'noodle','spaghetti','penne','fusilli','linguine','fettuccine','udon','soba','vermicelli',
    'glass noodle','rice noodle','pad thai noodle','couscous','bulgur','farro','barley','millet',
    'amaranth','teff','buckwheat','semolina','polenta','grits','cornmeal','tapioca','sago',
    'pita','bagel','ciabatta','focaccia','baguette','sourdough','brioche','croissant',
    'injera','ugali','fufu','eba','plantain','yam','cassava','taro','poi',
    'idli','dosa','uttapam','appam','paratha','poori','puri','bhatura','kulcha','laccha',
    'pao','bun','steamed bun','mantou','baozi','dumpling skin','wonton','spring roll wrapper',
    'lavash','pide','bazlama','somun','pretzel','rye bread','pumpernickel','cracker','rice cake',

    // ── Vegetables — Global ───────────────────────────────────────────────────
    'salad','vegetable','veggie','potato','tomato','onion','garlic','spinach','broccoli',
    'carrot','pepper','cucumber','lettuce','mushroom','zucchini','eggplant','aubergine',
    'cauliflower','kale','corn','pea','cabbage','bok choy','pak choi','chinese cabbage',
    'brussels sprout','asparagus','artichoke','celery','leek','scallion','spring onion',
    'shallot','radish','daikon','turnip','parsnip','beet','beetroot','sweet potato',
    'yam','butternut squash','pumpkin','acorn squash','okra','bitter gourd','karela',
    'drumstick','moringa','lotus root','bamboo shoot','water chestnut','jicama',
    'tomatillo','chayote','nopales','plantain','breadfruit','jackfruit','banana flower',
    'fiddlehead','rhubarb','fennel','endive','radicchio','watercress','arugula','rocket',
    'capsicum','chilli','jalapeño','habanero','serrano','poblano','anaheim',
    'green bean','snap pea','snow pea','edamame','mung bean sprout','bean sprout',
    'sabzi','bhindi','lauki','tinda','karela','methi','palak','sarson','bathua',

    // ── Fruits ────────────────────────────────────────────────────────────────
    'apple','banana','mango','strawberry','berry','orange','grape','pear','peach',
    'melon','avocado','lemon','lime','pineapple','papaya','guava','passion fruit',
    'dragon fruit','lychee','longan','rambutan','durian','jackfruit','starfruit',
    'pomegranate','fig','date','prune','apricot','plum','cherry','blueberry',
    'raspberry','blackberry','cranberry','kiwi','coconut','watermelon','cantaloupe',
    'honeydew','mandarin','clementine','tangerine','grapefruit','pomelo','kumquat',
    'persimmon','tamarind','amla','jamun','chikoo','sitaphal','custard apple',

    // ── World Cuisines & Dishes ───────────────────────────────────────────────
    // Indian subcontinent
    'curry','biryani','dal','daal','sabzi','khichdi','upma','poha','halwa','kheer',
    'idli','dosa','uttapam','sambar','rasam','chole','rajma','palak paneer','butter chicken',
    'tikka','tandoori','korma','vindaloo','saag','aloo','gobi','matar','keema',
    'nihari','haleem','paya','kofta','seekh','shami','paratha','puri','bhatura',
    'lassi','chai','masala chai','kulfi','raita','chutney','pickle','papad',
    // East Asian
    'sushi','ramen','pho','pad thai','fried rice','noodle','dumpling','dim sum',
    'gyoza','momo','wontons','spring roll','baozi','bao','mantou','congee','jook',
    'bibimbap','bulgogi','kimchi','japchae','tteokbokki','doenjang','gochujang',
    'mapo tofu','kung pao','sweet sour','orange chicken','peking duck','hot pot',
    'steamboat','sukiyaki','shabu','tempura','tonkatsu','yakitori','teriyaki','miso soup',
    'edamame','onigiri','takoyaki','okonomiyaki','matcha','boba','bubble tea',
    // Southeast Asian
    'laksa','rendang','nasi','mee','satay','gado gado','peanut sauce','sambal',
    'tom yum','tom kha','green curry','red curry','massaman','pad see ew',
    'banh mi','pho','bun bo','goi cuon','bun cha','com tam','hu tieu',
    'nasi lemak','nasi goreng','mee goreng','char kway teow','hainanese chicken',
    'adobo','sinigang','kare kare','lechon','sisig','pancit','lumpia',
    // Middle Eastern & Mediterranean
    'hummus','falafel','shawarma','kebab','kofta','tabouleh','fattoush','kibbeh',
    'mansaf','maqluba','kabsa','machboos','jollof','tagine','couscous','harira',
    'pita','lavash','manakish','fatayer','sambosa','borek','dolma','stuffed grape leaf',
    'tzatziki','baba ganoush','muhammara','labneh','za\'atar','sumac',
    'moussaka','spanakopita','tiropita','souvlaki','gyros',
    // African
    'jollof','egusi','ogbono','fufu','eba','amala','suya','chin chin','puff puff',
    'injera','wat','tibs','kitfo','ful medames','shakshuka','tagine','chermoula',
    'bunny chow','bobotie','potjie','chakalaka','pap','sadza','ugali','matoke',
    // Latin American
    'taco','burrito','enchilada','tamale','quesadilla','nachos','guacamole','salsa',
    'ceviche','lomo saltado','aji de gallina','causa','anticucho','chicharron',
    'arepa','empanada','pupusa','bandeja paisa','sancocho','feijoada','moqueca',
    'churrasco','asado','chimichurri','locro','mazamorra',
    // European
    'pasta','pizza','risotto','gnocchi','lasagne','carbonara','bolognese','pesto',
    'paella','tortilla española','gazpacho','patatas bravas','churros',
    'croissant','crepe','ratatouille','bouillabaisse','cassoulet','coq au vin',
    'schnitzel','bratwurst','pretzel','sauerkraut','pierogi','borscht','goulash',
    'stroganoff','blini','pelmeni','varenyky','shchi','okroshka',
    'fish chips','shepherd pie','bangers mash','full english','scone','haggis',
    // North American
    'burger','hotdog','bbq','mac cheese','clam chowder','gumbo','jambalaya',
    'po boy','biscuits gravy','pancake','waffle','french toast','hash brown',
    'poutine','butter tart','nanaimo bar','tourtière','bannock',
    // Soups & Stews
    'soup','stew','broth','stock','bisque','chowder','minestrone','ramen',
    'pho','laksa','soto','pozole','menudo','caldo','caldillo',

    // ── Cooking Methods ───────────────────────────────────────────────────────
    'grilled','baked','fried','boiled','steamed','roasted','cooked','raw','mixed',
    'blended','sautéed','sauteed','braised','poached','smoked','cured','pickled',
    'fermented','stir fried','deep fried','pan fried','air fried','slow cooked',
    'pressure cooked','microwaved','toasted','charred','barbecued','marinated',

    // ── Quantities & Measures ─────────────────────────────────────────────────
    'cup','tbsp','tsp','gram','grams','kg','piece','slice','handful','scoop',
    'portion','serving','half','whole','quarter','third','bowl','plate','can',
    'tin','jar','bottle','pack','bag','bunch','head','clove','knob','dash','pinch',
    'oz','ounce','pound','lb','ml','litre','liter','tablespoon','teaspoon',

    // ── Condiments, Sauces & Extras ───────────────────────────────────────────
    'oil','sauce','salt','sugar','honey','peanut','almond','protein','powder',
    'supplement','soy sauce','fish sauce','oyster sauce','hoisin','sriracha',
    'ketchup','mustard','mayo','mayonnaise','ranch','vinegar','balsamic',
    'tahini','harissa','gochujang','doenjang','miso','worcestershire',
    'hot sauce','chilli sauce','curry paste','coconut cream','tomato paste',
    'stock cube','bouillon','gravy','relish','jam','jelly','marmalade','syrup',
    'maple','agave','molasses','treacle','chocolate','cocoa','vanilla','cinnamon',
    'turmeric','cumin','coriander','cardamom','clove','nutmeg','paprika','chilli',
    'garam masala','five spice','za\'atar','berbere','ras el hanout','herbes',
    'basil','oregano','thyme','rosemary','parsley','cilantro','mint','dill',
    'lemongrass','galangal','ginger','wasabi','horseradish',

    // ── Snacks, Drinks & Extras ───────────────────────────────────────────────
    'smoothie','shake','juice','coffee','tea','latte','chai','matcha','protein shake',
    'granola','muesli','cereal','cracker','chip','crisp','popcorn','pretzel',
    'nut','walnut','cashew','pistachio','pecan','hazelnut','macadamia','pine nut',
    'seed','flaxseed','chia','hemp','sunflower','pumpkin seed','sesame',
    'dried fruit','trail mix','energy bar','protein bar','meal replacement',
    'supplement','multivitamin','omega','collagen','creatine',

    // ── Generic meal words ────────────────────────────────────────────────────
    'breakfast','lunch','dinner','snack','meal','dish','food','eat','ate',
    'leftovers','homemade','takeout','restaurant','order','made',
  ]

  const validateDescription = (text) => {
    const cleaned = text.trim().toLowerCase()

    if (cleaned.length < 5) {
      return 'Please describe your meal in more detail.'
    }

    // Detect pure repetition e.g. "ahahahah", "lololol", "aaaaaa"
    const repetitionPattern = /^(.{1,4})\1{3,}$/i
    if (repetitionPattern.test(cleaned.replace(/\s/g, ''))) {
      return 'That doesn\'t look like a meal — try describing what you ate.'
    }

    // Detect if it's all the same character repeated
    const uniqueChars = new Set(cleaned.replace(/\s/g, '')).size
    if (uniqueChars < 3 && cleaned.length > 4) {
      return 'That doesn\'t look like a meal — try describing what you ate.'
    }

    // Check for at least one food signal word
    const words = cleaned.split(/\s+/)
    const hasFood = words.some(w => FOOD_SIGNAL_WORDS.some(f => w.includes(f)))
    if (!hasFood) {
      return 'No food detected — try something like "rice and dal with yogurt" or "grilled chicken with vegetables".'
    }

    return null // valid
  }

  const handleCalculateIngredients = async () => {
    const isDescribeMode = logMode === 'describe'
    if (isDescribeMode) {
      const validationError = validateDescription(mealDescription)
      if (validationError) {
        setDescribeError(validationError)
        return
      }
      setDescribeError('')
    }
    if (!isDescribeMode && !ingredients.some(i => i.name.trim() && i.quantity)) return
    setCalculating(true)
    setCalcResult(null)
    try {
      const result = isDescribeMode
        ? await describeIngredients(mealDescription)
        : await calculateIngredients(ingredients.filter(i => i.name.trim() && i.quantity))
      if (result.found) {
        setMealForm(p => ({
          ...p,
          recipeName: customMealName || 'Home-cooked meal',
          calories: result.calories || '',
          protein: result.protein || '',
          carbs: result.carbs || '',
          fat: result.fat || '',
          calcium: result.calcium || '',
          iron: result.iron || '',
          vitaminD: result.vitaminD || '',
        }))
        setCalcResult(result)
      }
    } catch (err) {
      showToast('Could not calculate nutrition. Please try again.', 'error')
    } finally {
      setCalculating(false)
    }
  }

  const addIngredient = () => setIngredients(p => [...p, { name: '', quantity: '', unit: 'g' }])

  const removeIngredient = (idx) => setIngredients(p => p.filter((_, i) => i !== idx))

  const updateIngredient = (idx, field, value) =>
    setIngredients(p => p.map((ing, i) => i === idx ? { ...ing, [field]: value } : ing))

  const resetMealModal = () => {
    setShowMealModal(false)
    setMealForm({ recipeName: '', mealType: 'Breakfast', calories: '', protein: '', carbs: '', fat: '', calcium: '', iron: '', vitaminD: '' })
    setServings(1)
    setLookupResult(null)
    setLogMode('quick')
    setIngredients([{ name: '', quantity: '', unit: 'g' }])
    setCalcResult(null)
    setCustomMealName('')
    setSuggestions([])
    setShowSuggestions(false)
    setSaveAsRecipe(false)
    setShowSavedSuggestions(false)
    setMealDescription('')
    setDescribeError('')
  }
  const openMealModal = async () => {
    setShowMealModal(true)
    try {
      const data = await getSavedRecipes()
      // Only custom home-cooked ones (no steps/missing = came from ingredient builder)
      setSavedMeals(data.filter(r => r.nutrition && !r.steps?.length))
    } catch {
      setSavedMeals([])
    }
  }

  const handleLoadSavedMeal = (recipe) => {
    setCustomMealName(recipe.name)
    setMealForm(p => ({
      ...p,
      recipeName: recipe.name,
      calories: recipe.nutrition?.calories || '',
      protein: recipe.nutrition?.protein || '',
      carbs: recipe.nutrition?.carbs || '',
      fat: recipe.nutrition?.fat || '',
    }))
    if (recipe.ingredients) {
      const parsed = Array.isArray(recipe.ingredients) ? recipe.ingredients : []
      if (parsed.length > 0) setIngredients(parsed)
    }
    setCalcResult(recipe.nutrition ? { ...recipe.nutrition, found: true } : null)
    setShowSavedSuggestions(false)
  }

  const handleUpdateGoal = async () => {
    setSaving(true)
    try {
      const weightInKg = goalForm.goalWeight && goalForm.goalWeightUnit === 'lbs'
        ? (parseFloat(goalForm.goalWeight) / 2.205).toFixed(1)
        : goalForm.goalWeight
      await updateMemberGoal({
        memberId: activeMemberId,
        dailyCalorieGoal: goalForm.dailyCalorieGoal,
        goalWeight: weightInKg,
        goals: goalForm.goalType,
        fitnessGoal: goalForm.fitnessGoal,
        goalRatePct: goalForm.goalRatePct,
        gender: goalForm.gender,
      })
      showToast('Goals updated!')
      setShowGoalModal(false)
      fetchData()
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update goals', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteLog = async (id) => {
    try {
      await deleteNutritionLog(id)
      showToast('Entry removed')
      fetchData()
    } catch (err) {
      showToast('Failed to remove entry', 'error')
    }
  }

  const handleMealNameChange = (value) => {
    setMealForm(p => ({ ...p, recipeName: value }))
    setLookupResult(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setSearchingCache(true)
      try {
        const res = await searchNutritionCache(value)
        if (res.results?.length > 0) {
          setSuggestions(res.results)
          setShowSuggestions(true)
        } else {
          setSuggestions([])
          setShowSuggestions(false)
        }
      } catch {
        setSuggestions([])
      } finally {
        setSearchingCache(false)
      }
    }, 300)
  }

  const handleSelectSuggestion = (item) => {
    setMealForm(p => ({
      ...p,
      recipeName: item.mealName,
      calories: item.calories || '',
      protein: item.protein || '',
      carbs: item.carbs || '',
      fat: item.fat || '',
      calcium: item.calcium || '',
      iron: item.iron || '',
      vitaminD: item.vitaminD || '',
    }))
    setLookupResult({
      found: true,
      mealName: item.mealName,
      servingSize: item.servingSize || '1 serving',
      source: item.source || 'Nooka cache',
      confidence: 'high',
    })
    setSuggestions([])
    setShowSuggestions(false)
  }

  if (loading) return <div className="page-container"><LoadingSpinner /></div>

  if (!data?.members?.length) {
    return (
      <div className="page-container">
        <div className="text-center py-16">
          <div className="text-5xl mb-4">👨‍👩‍👧‍👦</div>
          <h2 className="text-xl font-bold text-textPrimary mb-2">No family members yet</h2>
          <p className="text-textMuted mb-6">Add family members in Settings to start tracking health goals</p>
          <a href="/app/settings" className="btn-primary">Go to Settings</a>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-textPrimary">Health tracker</h1>
          <p className="text-textMuted mt-1">Nutrition, weight and goal tracking</p>
        </div>
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => {
              setGoalForm({
                dailyCalorieGoal: activeMember?.dailyCalorieGoal || '',
                goalWeight: activeMember?.goalWeight || '',
                goalWeightUnit: 'kg',
                goalType: activeMember?.goals || '',
                fitnessGoal: activeMember?.fitnessGoal ?? null,
                goalRatePct: activeMember?.goalRatePct ?? null,
                gender: activeMember?.gender ?? null,
              })
              setShowGoalModal(true)
            }}
            className="btn-secondary text-sm flex-1 sm:flex-none flex items-center justify-center gap-1.5"
          >
            <Icon name="star" size={14} /> Set goals
          </button>
          <button onClick={() => setShowWeightModal(true)} className="btn-secondary text-sm flex-1 sm:flex-none flex items-center justify-center gap-1.5">
            <Icon name="dashboard" size={14} /> Log weight
          </button>
          <button onClick={openMealModal} className="btn-primary text-sm flex-1 sm:flex-none flex items-center justify-center gap-1.5">
            <Icon name="add" size={14} /> Log meal
          </button>
        </div>
      </div>

      {/* Member selector */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-6">
        {data.members.map(member => (
          <button
            key={member.id}
            onClick={() => setActiveMemberId(member.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-pill border text-sm font-medium transition-all whitespace-nowrap ${
              activeMemberId === member.id
                ? 'bg-primary text-white border-primary'
                : 'bg-surface text-textMuted border-border hover:border-primary hover:text-primary'
            }`}
          >
            <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
              {member.name[0]}
            </span>
            {member.name}
            {member.age && member.age < 18 && (
              <Icon name="family" size={13} className="opacity-70" />
            )}
            {member.streak > 0 && (
              <span className="flex items-center gap-0.5 text-xs">
                <Icon name="star" size={11} className="text-yellow-400" />
                {member.streak}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeMember && (
        <>
          {/* Kids Nutrition Mode */}
          {(kidsLoading || kidsData) && (
            <div className="card mb-6 border-2 border-purple-100 bg-gradient-to-br from-purple-50/50 to-blue-50/30">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Icon name="family" size={24} className="text-purple-500" />
                  <div>
                    <h2 className="font-semibold text-textPrimary">Kids nutrition check</h2>
                    <p className="text-xs text-textMuted">Weekly targets based on Health Canada guidelines</p>
                  </div>
                </div>
                {kidsData && (
                  <div className={`text-center px-3 py-1.5 rounded-pill text-sm font-semibold border ${
                    kidsData.overallPct >= 75 ? 'bg-green-50 text-green-700 border-green-200' :
                    kidsData.overallPct >= 45 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                    'bg-purple-50 text-purple-700 border-purple-200'
                  }`}>
                    {kidsData.overallPct >= 75 ? 'Looking great!' :
                     kidsData.overallPct >= 45 ? 'Getting there' :
                     'Room to grow'}
                  </div>
                )}
              </div>

              {kidsLoading ? (
                <div className="flex items-center gap-3 py-4">
                  <div className="w-5 h-5 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
                  <p className="text-sm text-textMuted">Checking {activeMember?.name}'s nutrition…</p>
                </div>
              ) : kidsData && (
                <>
                  {!kidsData.hasData && (
                    <div className="bg-white/70 rounded-btn p-4 mb-4 text-center">
                      <p className="text-sm text-textMuted">No meals logged yet this week for {kidsData.member.name}.</p>
                      <p className="text-xs text-textMuted mt-1">Cook a recipe and click "I cooked this" to start tracking!</p>
                    </div>
                  )}

                  <div className="space-y-4 mb-4">
                    {kidsData.nutrients.map((nutrient) => (
                      <div key={nutrient.key}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{nutrient.emoji}</span>
                            <div>
                              <p className="text-sm font-medium text-textPrimary">{nutrient.label}</p>
                              <p className="text-xs text-textMuted">{nutrient.why}</p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <p className="text-sm font-semibold text-textPrimary">
                              {nutrient.consumed}<span className="text-xs font-normal text-textMuted"> / {nutrient.target}{nutrient.unit} wk</span>
                            </p>
                            <p className={`text-xs font-medium ${
                              nutrient.pct >= 80 ? 'text-green-600' :
                              nutrient.pct >= 50 ? 'text-yellow-600' :
                              'text-purple-600'
                            }`}>{nutrient.pct}%</p>
                          </div>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              nutrient.pct >= 80 ? 'bg-green-400' :
                              nutrient.pct >= 50 ? 'bg-yellow-400' :
                              'bg-purple-400'
                            }`}
                            style={{ width: `${Math.max(nutrient.pct, 2)}%` }}
                          />
                        </div>
                        {nutrient.pct < 70 && (
                          <p className="text-xs text-textMuted mt-1">
                            Try: {nutrient.foods.slice(0, 3).join(', ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {kidsData.aiTip ? (
                    <div className="flex items-start gap-3 bg-white/80 rounded-btn p-3 border border-purple-100">
                      <Icon name="sparkle" size={18} className="text-purple-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-textPrimary leading-relaxed">{kidsData.aiTip}</p>
                    </div>
                  ) : kidsData.hasData && (
                    <div className="flex items-start gap-3 bg-white/80 rounded-btn p-3 border border-purple-100">
                      <Icon name="sparkle" size={18} className="text-purple-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-textMuted">Log more meals this week to get personalized nutrition tips for {kidsData.member.name}.</p>
                    </div>
                  )}

                  <p className="text-xs text-textMuted mt-3 text-center">
                    Based on Health Canada DRI for age {kidsData.member.age} · Micronutrient data from AI-enriched meal logs
                  </p>
                </>
              )}
            </div>
          )}

          {/* Member overview cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Daily goal', value: activeMember.dailyCalorieGoal ? `${activeMember.dailyCalorieGoal}` : 'Not set', unit: activeMember.dailyCalorieGoal ? 'kcal' : '', icon: 'reports', color: 'bg-blue-50 border-blue-100' },
              { label: 'Consumed today', value: activeMember.todayTotals.calories, unit: 'kcal', icon: 'health', color: 'bg-orange-50 border-orange-100' },
              { label: 'Current weight', value: activeMember.currentWeight || '—', unit: activeMember.currentWeight ? 'kg' : '', icon: 'dashboard', color: 'bg-purple-50 border-purple-100' },
              { label: 'Logging streak', value: activeMember.streak, unit: activeMember.streak === 1 ? 'day' : 'days', icon: 'star', color: 'bg-green-50 border-green-100' },
            ].map((card, i) => (
              <div key={i} className={`card border ${card.color}`}>
                <Icon name={card.icon} size={22} className="mb-1 text-textMuted" />
                <p className="text-xl font-bold text-textPrimary">{card.value} <span className="text-sm font-normal text-textMuted">{card.unit}</span></p>
                <p className="text-xs text-textMuted mt-1">{card.label}</p>
              </div>
            ))}
          </div>

          {/* Targets card */}
          {activeMember.targets && (
            <div className="card mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-textPrimary">Daily targets</h2>
                <span className="text-xs px-2.5 py-1 rounded-pill font-medium bg-primary/10 text-primary border border-primary/20">
                  {GOAL_LABELS[activeMember.fitnessGoal] || activeMember.fitnessGoal}
                  {activeMember.goalRatePct != null && (
                    <span>
                      {' · '}{activeMember.fitnessGoal === 'lean_bulk' ? '+' : '−'}{parseFloat((activeMember.goalRatePct * 100).toFixed(2))}%/wk
                    </span>
                  )}
                </span>
              </div>

              <div className="text-center mb-5">
                <p className="text-4xl font-bold text-textPrimary">{activeMember.targets.calories}</p>
                <p className="text-sm text-textMuted mt-0.5">kcal / day</p>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  { label: 'Protein', value: activeMember.targets.macros.protein, color: 'text-blue-600' },
                  { label: 'Carbs',   value: activeMember.targets.macros.carbs,   color: 'text-yellow-600' },
                  { label: 'Fat',     value: activeMember.targets.macros.fat,     color: 'text-red-500' },
                  { label: 'Fiber',   value: activeMember.targets.macros.fiber,   color: 'text-green-600' },
                ].map((m, i) => (
                  <div key={i} className="text-center bg-gray-50 rounded-btn py-2.5 px-1">
                    <p className={`text-base font-bold ${m.color}`}>{m.value}g</p>
                    <p className="text-xs text-textMuted">{m.label}</p>
                  </div>
                ))}
              </div>

              {activeMember.targets.flooredRatePct != null && activeMember.goalRatePct != null &&
                activeMember.targets.flooredRatePct < activeMember.goalRatePct && (
                <div className="flex items-start gap-2 mb-3 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-btn">
                  <Icon name="warning" size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">
                    Your rate was capped at {parseFloat((activeMember.targets.flooredRatePct * 100).toFixed(2))}%/wk to keep calories at a safe minimum.
                  </p>
                </div>
              )}

              <p className="text-xs text-textMuted flex items-center gap-1.5">
                <Icon name="info" size={12} />
                {activeMember.targets.source === 'adaptive'
                  ? 'Calibrated from your real data'
                  : 'Estimated — log meals and weigh-ins to unlock adaptive targets'}
              </p>
            </div>
          )}

          {/* Gender missing banner */}
          {activeMember.genderMissing && !dismissedGenderBanner && (
            <div className="flex items-start gap-3 px-3 py-3 rounded-btn border bg-blue-50 border-blue-100 mb-6">
              <Icon name="info" size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-textPrimary leading-relaxed flex-1">
                Set gender in Settings for a more accurate daily calorie target.
              </p>
              <button onClick={() => setDismissedGenderBanner(true)} className="text-textMuted hover:text-textPrimary flex-shrink-0 p-0.5">
                <Icon name="close" size={14} />
              </button>
            </div>
          )}

          {/* Calorie progress */}
          {activeMember.dailyCalorieGoal && (
            <div className="card mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-textPrimary">Today's progress</h2>
                <span className="text-xs text-textMuted">
                  {new Date().toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center gap-6 flex-wrap">
                {/* Calorie ring */}
                <div className="relative w-32 h-32 flex-shrink-0">
                  <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#f0f0f0" strokeWidth="12"/>
                    <circle
                      cx="60" cy="60" r="50" fill="none"
                      stroke={activeMember.todayTotals.calories >= activeMember.dailyCalorieGoal ? '#ef4444' : '#3b82f6'}
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={`${Math.min((activeMember.todayTotals.calories / activeMember.dailyCalorieGoal) * 314, 314)} 314`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-lg font-bold text-textPrimary">{activeMember.todayTotals.calories}</p>
                    <p className="text-xs text-textMuted">of {activeMember.dailyCalorieGoal}</p>
                  </div>
                </div>

                {/* Macro bars */}
                <div className="flex-1 space-y-3 min-w-0">
                  {[
                    { label: 'Protein', consumed: activeMember.todayTotals.protein, goal: activeMember.macroTargets?.protein, color: 'bg-blue-500' },
                    { label: 'Carbs', consumed: activeMember.todayTotals.carbs, goal: activeMember.macroTargets?.carbs, color: 'bg-yellow-400' },
                    { label: 'Fat', consumed: activeMember.todayTotals.fat, goal: activeMember.macroTargets?.fat, color: 'bg-red-400' },
                    { label: 'Fiber', consumed: activeMember.todayTotals.fiber, goal: 25, color: 'bg-green-500' },
                  ].map((macro, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-textMuted">{macro.label}</span>
                        <span className="text-xs text-textMuted">{macro.consumed}g / {macro.goal}g</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-pill overflow-hidden">
                        <div
                          className={`h-full rounded-pill transition-all ${macro.color}`}
                          style={{ width: `${Math.min((macro.consumed / (macro.goal || 1)) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Status */}
                <div className="text-center w-full sm:w-auto">
                  {(() => {
                    const status = getCalorieStatus(activeMember.todayTotals.calories, activeMember.dailyCalorieGoal)
                    return status ? (
                      <div>
                        <p className={`text-sm font-semibold ${status.color}`}>{status.text}</p>
                        <p className="text-xs text-textMuted mt-1">based on your {activeMember.goals} goal</p>
                      </div>
                    ) : null
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Goal nudges */}
          {(() => {
            const nudges = getGoalNudges(activeMember)
            if (!nudges.length) return null
            return (
              <div className="card mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Icon name="sparkle" size={16} className="text-primary" />
                  <h2 className="font-semibold text-textPrimary text-sm">
                    {activeMember.goals
                      ? `Insights for your ${activeMember.goals} goal`
                      : 'This week\'s insights'}
                  </h2>
                </div>
                <div className="space-y-2">
                  {nudges.map((nudge, i) => (
                    <div key={i} className={`flex items-start gap-3 px-3 py-3 rounded-btn border ${nudge.color}`}>
                      <Icon name={nudge.icon} size={15} className={`${nudge.iconClass} flex-shrink-0 mt-0.5`} />
                      <p className="text-sm text-textPrimary leading-relaxed">{nudge.text}</p>
                    </div>
                  ))}
                </div>
                {!activeMember.goals && (
                  <button
                    onClick={() => {
                      setGoalForm({ dailyCalorieGoal: activeMember?.dailyCalorieGoal || '', goalWeight: activeMember?.goalWeight || '', goalWeightUnit: 'kg', goalType: activeMember?.goals || '', fitnessGoal: activeMember?.fitnessGoal ?? null, goalRatePct: activeMember?.goalRatePct ?? null, gender: activeMember?.gender ?? null })
                      setShowGoalModal(true)
                    }}
                    className="mt-3 text-sm text-primary font-medium hover:underline flex items-center gap-1"
                  >
                    <Icon name="star" size={13} /> Set a goal to unlock personalized insights
                  </button>
                )}
              </div>
            )
          })()}

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-card mb-6 overflow-x-auto scrollbar-hide">
            {[
              { id: 'today', label: "Today's meals" },
              { id: 'week', label: '7-day history' },
              { id: 'weight', label: 'Weight' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-btn text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-white text-textPrimary shadow-sm' : 'text-textMuted hover:text-textPrimary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Today's meals */}
          {activeTab === 'today' && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-textPrimary">Meals logged today</h3>
                <button onClick={openMealModal} className="btn-primary text-sm py-1.5 px-3 flex items-center gap-1.5">
                  <Icon name="add" size={14} /> Add meal
                </button>
              </div>
              {activeMember.todayMeals.length === 0 ? (
                <div className="text-center py-8">
                  <Icon name="recipes" size={40} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-textMuted text-sm">No meals logged today</p>
                  <p className="text-xs text-textMuted mt-1">Cook a recipe or add a meal manually</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeMember.todayMeals.map((meal, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-btn">
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="text-sm font-medium text-textPrimary truncate">{meal.recipeName}</p>
                        <p className="text-xs text-textMuted">{meal.mealType} · {new Date(meal.loggedAt).toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          {meal.calories && <p className="text-sm font-semibold text-textPrimary">{Math.round(meal.calories)} kcal</p>}
                          {meal.protein && <p className="text-xs text-textMuted">{Math.round(meal.protein)}g protein</p>}
                        </div>
                        <button onClick={() => handleDeleteLog(meal.id)} className="text-textMuted hover:text-danger p-1">
                          <Icon name="close" size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 7-day history */}
          {activeTab === 'week' && (
            <div className="card">
              <h3 className="font-semibold text-textPrimary mb-4">7-day calorie history</h3>
              <div className="space-y-3">
                {activeMember.last7Days.map((day, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <p className="text-xs text-textMuted w-20 flex-shrink-0">{day.date}</p>
                    <div className="flex-1 h-6 bg-gray-100 rounded-pill overflow-hidden relative">
                      <div
                        className={`h-full rounded-pill transition-all ${
                          day.calories === 0 ? 'bg-gray-200' :
                          day.goal && day.calories > day.goal ? 'bg-danger' :
                          day.goal && day.calories >= day.goal * 0.85 ? 'bg-orange-400' :
                          'bg-primary'
                        }`}
                        style={{ width: day.goal ? `${Math.min((day.calories / day.goal) * 100, 100)}%` : `${Math.min(day.calories / 30, 100)}%` }}
                      />
                    </div>
                    <div className="text-right w-24 flex-shrink-0">
                      <p className="text-xs font-semibold text-textPrimary">{day.calories} kcal</p>
                      {day.mealsLogged > 0 && <p className="text-xs text-textMuted">{day.mealsLogged} meals</p>}
                      {day.calories === 0 && <p className="text-xs text-textMuted">Not logged</p>}
                    </div>
                  </div>
                ))}
              </div>
              {activeMember.dailyCalorieGoal && (
                <div className="mt-4 pt-4 border-t border-border flex items-center gap-4 text-xs text-textMuted flex-wrap">
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-primary"/><span>On track</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-orange-400"/><span>Near goal</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-danger"/><span>Over goal</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-gray-200"/><span>Not logged</span></div>
                </div>
              )}
            </div>
          )}

          {/* Weight tracking */}
          {activeTab === 'weight' && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-textPrimary">Weight history</h3>
                <button onClick={() => setShowWeightModal(true)} className="btn-primary text-sm py-1.5 px-3 flex items-center gap-1.5">
                  <Icon name="add" size={14} /> Log weight
                </button>
              </div>

              {activeMember.goalWeight && (
                <div className="bg-blue-50 border border-blue-100 rounded-btn px-4 py-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-primary">Goal weight: {activeMember.goalWeight} kg</p>
                      {activeMember.currentWeight && (
                        <p className="text-xs text-textMuted mt-0.5">
                          {(() => {
                            const currentKg = activeMember.weightUnit === 'lbs'
                              ? activeMember.currentWeight / 2.205
                              : activeMember.currentWeight
                            const diff = Math.abs(currentKg - activeMember.goalWeight).toFixed(1)
                            if (currentKg > activeMember.goalWeight) return `${diff} kg to lose`
                            if (currentKg < activeMember.goalWeight) return `${diff} kg to gain`
                            return 'Goal reached!'
                          })()}
                        </p>
                      )}
                    </div>
                    <Icon name="star" size={24} className="text-primary opacity-60" />
                  </div>
                </div>
              )}

              {activeMember.weightHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Icon name="dashboard" size={40} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-textMuted text-sm">No weight logged yet</p>
                  <p className="text-xs text-textMuted mt-1">Log your weight to track progress over time</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeMember.weightHistory.map((log, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                      <div>
                        <p className="text-sm font-semibold text-textPrimary">{log.weight} {log.unit}</p>
                        {log.note && <p className="text-xs text-textMuted">{log.note}</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        {i < activeMember.weightHistory.length - 1 && (
                          <span className={`text-xs font-medium flex items-center gap-0.5 ${
                            log.weight < activeMember.weightHistory[i + 1].weight ? 'text-success' :
                            log.weight > activeMember.weightHistory[i + 1].weight ? 'text-danger' :
                            'text-textMuted'
                          }`}>
                            {log.weight < activeMember.weightHistory[i + 1].weight ? '↓' :
                             log.weight > activeMember.weightHistory[i + 1].weight ? '↑' : '→'}
                            {Math.abs(log.weight - activeMember.weightHistory[i + 1].weight).toFixed(1)} kg
                          </span>
                        )}
                        <p className="text-xs text-textMuted">
                          {new Date(log.date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Log weight modal ── */}
      {showWeightModal && createPortal(
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-end sm:items-center sm:justify-center sm:p-4 backdrop-blur-sm">
          <div className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-card shadow-xl p-6 max-h-[90vh] overflow-y-auto modal-sheet">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-textPrimary">Log weight</h3>
              <button onClick={() => setShowWeightModal(false)} className="text-textMuted hover:text-textPrimary p-1">
                <Icon name="close" size={20} />
              </button>
            </div>
            <p className="text-sm text-textMuted mb-4">Logging for <strong>{activeMember?.name}</strong></p>
            <div className="space-y-3 mb-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="label">Weight</label>
                  <input className="input" type="number" step="0.1" placeholder="e.g. 70.5" value={weightForm.weight} onChange={e => setWeightForm(p => ({ ...p, weight: e.target.value }))} autoFocus />
                </div>
                <div className="w-24">
                  <label className="label">Unit</label>
                  <select className="input" value={weightForm.unit} onChange={e => setWeightForm(p => ({ ...p, unit: e.target.value }))}>
                    <option value="kg">kg</option>
                    <option value="lbs">lbs</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Note <span className="text-textMuted font-normal">(optional)</span></label>
                <input className="input" placeholder="e.g. Morning weight, after workout..." value={weightForm.note} onChange={e => setWeightForm(p => ({ ...p, note: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowWeightModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleLogWeight} disabled={!weightForm.weight || saving} className="btn-primary flex-1 disabled:opacity-50">
                {saving ? 'Saving...' : 'Log weight'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Log meal modal ── */}
      {showMealModal && createPortal(
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-end sm:items-center sm:justify-center sm:p-4 backdrop-blur-sm">
         <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-card shadow-xl overflow-hidden" style={{ maxHeight: '82vh', display: 'flex', flexDirection: 'column' }}>

            {/* Header */}
            <div className="modal-header bg-white px-4 pt-4 pb-3 border-b border-border">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-bold text-textPrimary text-base leading-tight">Log meal</h3>
                  <p className="text-xs text-textMuted">Logging for <strong>{activeMember?.name}</strong></p>
                </div>
                <button onClick={resetMealModal} className="text-textMuted hover:text-textPrimary p-1 -mr-1">
                  <Icon name="close" size={18} />
                </button>
              </div>

              {/* Mode toggle — 3 equal pills */}
              <div className="flex rounded-lg border border-border overflow-hidden">
                {[
                  { mode: 'quick', icon: 'search', label: 'Lookup' },
                  { mode: 'describe', icon: 'edit', label: 'Describe' },
                  { mode: 'ingredients', icon: 'filter', label: 'Builder' },
                ].map(({ mode, icon, label }) => (
                  <button
                    key={mode}
                    onClick={() => {
                      setLogMode(mode)
                      setCalcResult(null)
                      setLookupResult(null)
                      setDescribeError('')
                    }}
                    className={`flex-1 py-2 text-xs font-semibold transition-colors flex items-center justify-center gap-1 ${
                      logMode === mode ? 'bg-primary text-white' : 'text-textMuted bg-white'
                    }`}
                  >
                    <Icon name={icon} size={12} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable body */}
            <div className="modal-body px-4 py-3 space-y-3">

              {logMode === 'describe' ? (
                <>
                  <div>
                    <label className="label">Describe your meal</label>
                    <textarea
                      className="input w-full resize-none"
                      rows={5}
                      placeholder={"e.g. grilled salmon with half cup rice and steamed broccoli\nor: 2 eggs scrambled with cheese on toast\nor: leftover chicken curry with rice, medium portion"}
                      value={mealDescription}
                      onChange={e => setMealDescription(e.target.value)}
                      autoFocus
                    />
                    <p className="text-xs text-textMuted mt-1">Describe anything — home cooking, leftovers, a snack, any cuisine. Claude will estimate the macros.</p>
                    {describeError && (
                      <div className="flex items-start gap-2 mt-2 px-3 py-2 bg-red-50 border border-red-100 rounded-btn">
                        <Icon name="warning" size={14} className="text-danger flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-danger">{describeError}</p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleCalculateIngredients}
                    disabled={calculating || !mealDescription.trim()}
                    className="btn-secondary w-full disabled:opacity-50 flex items-center justify-center gap-2 py-3"
                  >
                    {calculating ? (
                      <>
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                        Calculating...
                      </>
                    ) : (
                      <><Icon name="sparkle" size={16} className="text-primary" /> Get macros</>
                    )}
                  </button>

                  {calcResult && (
                    <>
                      <div className="rounded-btn bg-green-50 border border-green-100 p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Icon name="check" size={16} className="text-success" />
                          <p className="text-sm font-semibold text-success">{calcResult.mealName}</p>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-center mb-3">
                          {[
                            { label: 'Cal', value: calcResult.calories, color: 'text-orange-600' },
                            { label: 'Protein', value: `${calcResult.protein}g`, color: 'text-blue-600' },
                            { label: 'Carbs', value: `${calcResult.carbs}g`, color: 'text-yellow-600' },
                            { label: 'Fat', value: `${calcResult.fat}g`, color: 'text-red-500' },
                          ].map((m, i) => (
                            <div key={i} className="bg-white rounded-btn p-2 border border-green-100">
                              <p className={`text-sm font-bold ${m.color}`}>{m.value}</p>
                              <p className="text-xs text-textMuted">{m.label}</p>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-textMuted flex items-center gap-1">
                          <Icon name="info" size={12} /> Confidence: {calcResult.confidence} · {calcResult.source}
                        </p>
                      </div>

                      <div>
                        <label className="label">Meal name</label>
                        <input
                          className="input"
                          value={mealForm.recipeName}
                          onChange={e => setMealForm(p => ({ ...p, recipeName: e.target.value }))}
                          placeholder="Edit name if needed"
                        />
                      </div>

                      <div>
                        <label className="label">Meal type</label>
                        <select className="input" value={mealForm.mealType} onChange={e => setMealForm(p => ({ ...p, mealType: e.target.value }))}>
                          {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(t => <option key={t}>{t}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="label">Adjust nutrition <span className="text-textMuted font-normal">(edit if needed)</span></label>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="label text-xs">Calories</label>
                            <input className="input" type="number" value={mealForm.calories} onChange={e => setMealForm(p => ({ ...p, calories: e.target.value }))} />
                          </div>
                          <div>
                            <label className="label text-xs">Protein (g)</label>
                            <input className="input" type="number" value={mealForm.protein} onChange={e => setMealForm(p => ({ ...p, protein: e.target.value }))} />
                          </div>
                          <div>
                            <label className="label text-xs">Carbs (g)</label>
                            <input className="input" type="number" value={mealForm.carbs} onChange={e => setMealForm(p => ({ ...p, carbs: e.target.value }))} />
                          </div>
                          <div>
                            <label className="label text-xs">Fat (g)</label>
                            <input className="input" type="number" value={mealForm.fat} onChange={e => setMealForm(p => ({ ...p, fat: e.target.value }))} />
                          </div>
                        </div>
                      </div>

                      {/* Save to cookbook toggle — describe mode */}
                      <button
                        type="button"
                        onClick={() => setSaveAsRecipe(p => !p)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-btn border transition-colors ${
                          saveAsRecipe ? 'bg-primary/5 border-primary' : 'bg-gray-50 border-border'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          saveAsRecipe ? 'bg-primary border-primary' : 'border-gray-300'
                        }`}>
                          {saveAsRecipe && <Icon name="check" size={12} className="text-white" strokeWidth={3} />}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-textPrimary">Save to cookbook</p>
                          <p className="text-xs text-textMuted">Recall this meal next time without recalculating</p>
                        </div>
                        <Icon name="cookbook" size={16} className="ml-auto text-textMuted" />
                      </button>
                    </>
                  )}
                </>
              ) : logMode === 'quick' ? (
                <>
                  {/* Meal name + lookup */}
                  <div>
                    <label className="label">Meal name</label>
                    <div className="flex gap-2 relative">
                      <div className="flex-1 relative">
                        <input
                          className="input w-full"
                          placeholder="e.g. Junior Chicken McDonald's"
                          value={mealForm.recipeName}
                          onChange={e => handleMealNameChange(e.target.value)}
                          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                          autoFocus
                        />
                        {showSuggestions && suggestions.length > 0 && (
                          <div className="absolute top-full left-0 right-0 bg-white border border-border rounded-btn shadow-lg z-50 mt-1 max-h-48 overflow-y-auto">
                            {searchingCache && <div className="px-3 py-2 text-xs text-textMuted">Searching...</div>}
                            {suggestions.map((item, i) => (
                              <button
                                key={i}
                                type="button"
                                onMouseDown={() => handleSelectSuggestion(item)}
                                className="w-full text-left px-3 py-2.5 hover:bg-gray-50 border-b border-border last:border-0 transition-colors"
                              >
                                <p className="text-sm font-medium text-textPrimary">{item.mealName}</p>
                                <p className="text-xs text-textMuted">
                                  {item.calories ? `${item.calories} kcal` : ''}{item.protein ? ` · ${item.protein}g protein` : ''} · {item.source || 'cached'}
                                </p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleLookupNutrition(mealForm.recipeName)}
                        disabled={lookingUp || mealForm.recipeName.length < 3}
                        className="btn-secondary text-sm px-3 disabled:opacity-50 whitespace-nowrap flex items-center gap-1.5"
                      >
                        {lookingUp || searchingCache ? (
                          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                          </svg>
                        ) : <Icon name="search" size={14} />}
                        Lookup
                      </button>
                    </div>
                    <p className="text-xs text-textMuted mt-1">Try "Big Mac", "Tim Hortons bagel", "chicken biryani"</p>
                  </div>

                  {/* Lookup result badge */}
                  {lookupResult && (
                    <div className={`rounded-btn px-3 py-2 border text-xs flex items-start gap-2 ${
                      lookupResult.confidence === 'high' ? 'bg-green-50 border-green-100' : 'bg-yellow-50 border-yellow-100'
                    }`}>
                      <Icon name="check" size={14} className="text-success mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-textPrimary">{lookupResult.mealName}</p>
                        <p className="text-textMuted mt-0.5">
                          {lookupResult.servingSize} · {lookupResult.source}
                          {lookupResult.confidence === 'low' && ' · Estimated'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Meal type */}
                  <div>
                    <label className="label">Meal type</label>
                    <select className="input" value={mealForm.mealType} onChange={e => setMealForm(p => ({ ...p, mealType: e.target.value }))}>
                      {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>

                  {/* Servings */}
                  <div>
                    <label className="label">Servings</label>
                    <div className="flex items-center gap-3">
                      <input
                        className="input w-24"
                        type="number"
                        step="0.5"
                        min="0.5"
                        value={servings}
                        onChange={e => setServings(parseFloat(e.target.value) || 1)}
                      />
                      <p className="text-xs text-textMuted">Change servings then lookup again to recalculate</p>
                    </div>
                  </div>

                  {/* Macros */}
                  <div>
                    <label className="label">Nutrition <span className="text-textMuted font-normal">(auto-filled or enter manually)</span></label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label text-xs">Calories</label>
                        <input className="input" type="number" placeholder="kcal" value={mealForm.calories} onChange={e => setMealForm(p => ({ ...p, calories: e.target.value }))} />
                      </div>
                      <div>
                        <label className="label text-xs">Protein (g)</label>
                        <input className="input" type="number" placeholder="g" value={mealForm.protein} onChange={e => setMealForm(p => ({ ...p, protein: e.target.value }))} />
                      </div>
                      <div>
                        <label className="label text-xs">Carbs (g)</label>
                        <input className="input" type="number" placeholder="g" value={mealForm.carbs} onChange={e => setMealForm(p => ({ ...p, carbs: e.target.value }))} />
                      </div>
                      <div>
                        <label className="label text-xs">Fat (g)</label>
                        <input className="input" type="number" placeholder="g" value={mealForm.fat} onChange={e => setMealForm(p => ({ ...p, fat: e.target.value }))} />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Ingredient builder */}
                  <div className="relative">
                    <label className="label">Meal name <span className="text-textMuted font-normal">(optional)</span></label>
                    <input
                      className="input"
                      placeholder="e.g. Protein Bowl..."
                      value={customMealName}
                      onChange={e => {
                        setCustomMealName(e.target.value)
                        setMealForm(p => ({ ...p, recipeName: e.target.value }))
                        setShowSavedSuggestions(e.target.value.length > 0 && savedMeals.length > 0)
                      }}
                      onFocus={() => savedMeals.length > 0 && setShowSavedSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSavedSuggestions(false), 150)}
                      autoFocus
                    />
                    {showSavedSuggestions && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-border rounded-btn shadow-lg z-50 mt-1 max-h-40 overflow-y-auto">
                        <p className="px-3 py-1.5 text-xs text-textMuted font-medium border-b border-border">Saved meals</p>
                        {savedMeals
                          .filter(r => !customMealName || r.name.toLowerCase().includes(customMealName.toLowerCase()))
                          .map((recipe, i) => (
                            <button
                              key={i}
                              type="button"
                              onMouseDown={() => handleLoadSavedMeal(recipe)}
                              className="w-full text-left px-3 py-2.5 hover:bg-gray-50 border-b border-border last:border-0"
                            >
                              <p className="text-sm font-medium text-textPrimary">{recipe.name}</p>
                              {recipe.nutrition && (
                                <p className="text-xs text-textMuted">
                                  {recipe.nutrition.calories} kcal · {recipe.nutrition.protein}g protein
                                </p>
                              )}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="label">Ingredients</label>
                    <div className="space-y-2">
                      {ingredients.map((ing, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <input
                            className="input flex-1 min-w-0"
                            placeholder="e.g. chicken breast"
                            value={ing.name}
                            onChange={e => updateIngredient(idx, 'name', e.target.value)}
                          />
                          <input
                            className="input w-16 shrink-0"
                            type="number"
                            placeholder="qty"
                            value={ing.quantity}
                            onChange={e => updateIngredient(idx, 'quantity', e.target.value)}
                          />
                          <select
                            className="input w-16 shrink-0 px-1 text-sm"
                            value={ing.unit}
                            onChange={e => updateIngredient(idx, 'unit', e.target.value)}
                          >
                            {['g', 'kg', 'ml', 'L', 'oz', 'lb', 'cup', 'tbsp', 'tsp', 'pcs'].map(u => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </select>
                          {ingredients.length > 1 && (
                            <button
                              onClick={() => removeIngredient(idx)}
                              className="text-textMuted hover:text-danger shrink-0 p-1"
                            >
                              <Icon name="close" size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={addIngredient}
                      className="mt-3 text-sm text-primary font-medium hover:underline flex items-center gap-1"
                    >
                      <Icon name="add" size={14} /> Add ingredient
                    </button>
                  </div>

                  {/* Calculate button */}
                  <button
                    onClick={handleCalculateIngredients}
                    disabled={calculating || !ingredients.some(i => i.name && i.quantity)}
                    className="btn-secondary w-full disabled:opacity-50 flex items-center justify-center gap-2 py-3"
                  >
                    {calculating ? (
                      <>
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                        Calculating macros...
                      </>
                    ) : (
                      <>
                        <Icon name="sparkle" size={16} className="text-primary" />
                        Calculate macros
                      </>
                    )}
                  </button>

                  {/* Calc result */}
                  {calcResult && (
                    <div className="rounded-btn bg-green-50 border border-green-100 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Icon name="check" size={16} className="text-success" />
                        <p className="text-sm font-semibold text-success">Macros calculated</p>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center mb-3">
                        {[
                          { label: 'Cal', value: calcResult.calories, color: 'text-orange-600' },
                          { label: 'Protein', value: `${calcResult.protein}g`, color: 'text-blue-600' },
                          { label: 'Carbs', value: `${calcResult.carbs}g`, color: 'text-yellow-600' },
                          { label: 'Fat', value: `${calcResult.fat}g`, color: 'text-red-500' },
                        ].map((m, i) => (
                          <div key={i} className="bg-white rounded-btn p-2 border border-green-100">
                            <p className={`text-sm font-bold ${m.color}`}>{m.value}</p>
                            <p className="text-xs text-textMuted">{m.label}</p>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-textMuted flex items-center gap-1">
                        <Icon name="info" size={12} /> Review and adjust below before logging
                      </p>
                    </div>
                  )}

                  {/* Save toggle */}
                  {calcResult && (
                    <button
                      type="button"
                      onClick={() => setSaveAsRecipe(p => !p)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-btn border transition-colors ${
                        saveAsRecipe ? 'bg-primary/5 border-primary' : 'bg-gray-50 border-border'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        saveAsRecipe ? 'bg-primary border-primary' : 'border-gray-300'
                      }`}>
                        {saveAsRecipe && <Icon name="check" size={12} className="text-white" strokeWidth={3} />}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-textPrimary">Save to cookbook</p>
                        <p className="text-xs text-textMuted">Recall this meal next time you log</p>
                      </div>
                      <Icon name="cookbook" size={16} className="ml-auto text-textMuted" />
                    </button>
                  )}

                  {/* Meal type */}
                  <div>
                    <label className="label">Meal type</label>
                    <select className="input" value={mealForm.mealType} onChange={e => setMealForm(p => ({ ...p, mealType: e.target.value }))}>
                      {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>

                  {/* Editable macro fields — always shown in ingredient mode */}
                  <div>
                    <label className="label">Adjust nutrition <span className="text-textMuted font-normal">(edit if needed)</span></label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label text-xs">Calories</label>
                        <input className="input" type="number" placeholder="kcal" value={mealForm.calories} onChange={e => setMealForm(p => ({ ...p, calories: e.target.value }))} />
                      </div>
                      <div>
                        <label className="label text-xs">Protein (g)</label>
                        <input className="input" type="number" placeholder="g" value={mealForm.protein} onChange={e => setMealForm(p => ({ ...p, protein: e.target.value }))} />
                      </div>
                      <div>
                        <label className="label text-xs">Carbs (g)</label>
                        <input className="input" type="number" placeholder="g" value={mealForm.carbs} onChange={e => setMealForm(p => ({ ...p, carbs: e.target.value }))} />
                      </div>
                      <div>
                        <label className="label text-xs">Fat (g)</label>
                        <input className="input" type="number" placeholder="g" value={mealForm.fat} onChange={e => setMealForm(p => ({ ...p, fat: e.target.value }))} />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

           {/* Footer */}
            <div className="modal-footer bg-white border-t border-border px-4 py-3 flex gap-2">
              <button onClick={resetMealModal} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={handleLogMeal}
                disabled={!mealForm.recipeName || saving}
                className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <Icon name="check" size={14} /> Log meal
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Set goals modal ── */}
      {showGoalModal && createPortal(
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-end sm:items-center sm:justify-center sm:p-4 backdrop-blur-sm">
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-card shadow-xl overflow-hidden" style={{ maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>

            {/* Header */}
            <div className="modal-header bg-white px-6 pt-5 pb-4 border-b border-border flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-textPrimary">Set goals</h3>
                  <p className="text-sm text-textMuted mt-0.5">For <strong>{activeMember?.name}</strong></p>
                </div>
                <button onClick={() => setShowGoalModal(false)} className="text-textMuted hover:text-textPrimary p-1">
                  <Icon name="close" size={20} />
                </button>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="modal-body px-6 py-5 space-y-5">

              {/* Gender */}
              <div>
                <label className="label">Gender</label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { label: 'Male', value: 'male' },
                    { label: 'Female', value: 'female' },
                    { label: 'Prefer not to say', value: null },
                  ].map(opt => (
                    <button
                      key={String(opt.value)}
                      type="button"
                      onClick={() => setGoalForm(p => ({ ...p, gender: opt.value }))}
                      className={`text-xs px-3 py-1.5 rounded-pill border font-medium transition-all ${
                        goalForm.gender === opt.value
                          ? 'bg-primary text-white border-primary'
                          : 'bg-surface text-textMuted border-border hover:border-primary hover:text-primary'
                      }`}
                    >
                      {goalForm.gender === opt.value ? '✓ ' : ''}{opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-textMuted mt-1.5">Used for accurate calorie math.</p>
              </div>

              {/* Fitness goal */}
              <div>
                <label className="label">Fitness goal</label>
                {!isFeatureEnabled('fitness_coach') ? (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 border border-border rounded-btn">
                    <Icon name="crown" size={18} className="text-textMuted flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-textPrimary">Unlock with Premium</p>
                      <p className="text-xs text-textMuted">Smart fitness goals, adaptive calorie targets and macro splits.</p>
                    </div>
                    <a href="/app/settings?tab=plan" className="text-xs text-primary font-medium hover:underline flex-shrink-0">Upgrade →</a>
                  </div>
                ) : activeMember?.age && activeMember.age < 18 ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: 'Maintain', value: 'maintain' },
                        { label: 'None', value: null },
                      ].map(opt => (
                        <button
                          key={String(opt.value)}
                          type="button"
                          onClick={() => setGoalForm(p => ({ ...p, fitnessGoal: opt.value, goalRatePct: null }))}
                          className={`text-xs px-3 py-1.5 rounded-pill border font-medium transition-all ${
                            goalForm.fitnessGoal === opt.value
                              ? 'bg-primary text-white border-primary'
                              : 'bg-surface text-textMuted border-border hover:border-primary hover:text-primary'
                          }`}
                        >
                          {goalForm.fitnessGoal === opt.value ? '✓ ' : ''}{opt.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-amber-700 flex items-start gap-1.5">
                      <Icon name="info" size={12} className="flex-shrink-0 mt-0.5" />
                      Growth-focused — deficit goals unlock at 18.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {FITNESS_GOAL_OPTS.map(opt => (
                        <button
                          key={String(opt.value)}
                          type="button"
                          onClick={() => {
                            const defaultRate = opt.value === 'cut' ? 0.005 : opt.value === 'lean_bulk' ? 0.0025 : null
                            setGoalForm(p => ({ ...p, fitnessGoal: opt.value, goalRatePct: defaultRate }))
                          }}
                          className={`text-xs px-3 py-1.5 rounded-pill border font-medium transition-all ${
                            goalForm.fitnessGoal === opt.value
                              ? 'bg-primary text-white border-primary'
                              : 'bg-surface text-textMuted border-border hover:border-primary hover:text-primary'
                          }`}
                        >
                          {goalForm.fitnessGoal === opt.value ? '✓ ' : ''}{opt.label}
                        </button>
                      ))}
                    </div>
                    {goalForm.fitnessGoal != null && (
                      <p className="text-xs text-textMuted leading-relaxed">
                        {FITNESS_GOAL_OPTS.find(o => o.value === goalForm.fitnessGoal)?.desc}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Rate — only for cut / lean_bulk */}
              {isFeatureEnabled('fitness_coach') && (goalForm.fitnessGoal === 'cut' || goalForm.fitnessGoal === 'lean_bulk') && (
                <div>
                  <label className="label">
                    Rate {goalForm.fitnessGoal === 'cut' ? '(fat loss)' : '(muscle gain)'}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(goalForm.fitnessGoal === 'cut' ? CUT_RATES : LEAN_BULK_RATES).map(rate => (
                      <button
                        key={rate.value}
                        type="button"
                        onClick={() => setGoalForm(p => ({ ...p, goalRatePct: rate.value }))}
                        className={`text-xs px-3 py-1.5 rounded-pill border font-medium transition-all ${
                          goalForm.goalRatePct === rate.value
                            ? 'bg-primary text-white border-primary'
                            : 'bg-surface text-textMuted border-border hover:border-primary hover:text-primary'
                        }`}
                      >
                        {goalForm.goalRatePct === rate.value ? '✓ ' : ''}{rate.label} <span className={goalForm.goalRatePct === rate.value ? 'opacity-80' : 'opacity-60'}>{rate.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Goal weight */}
              <div>
                <label className="label">Goal weight <span className="text-textMuted font-normal">(optional)</span></label>
                <div className="flex gap-2">
                  <input
                    className="input flex-1"
                    type="number"
                    step="0.1"
                    placeholder={goalForm.goalWeightUnit === 'lbs' ? 'e.g. 145' : 'e.g. 65'}
                    value={goalForm.goalWeight}
                    onChange={e => setGoalForm(p => ({ ...p, goalWeight: e.target.value }))}
                  />
                  <select
                    className="input w-24"
                    value={goalForm.goalWeightUnit || 'kg'}
                    onChange={e => setGoalForm(p => ({ ...p, goalWeightUnit: e.target.value }))}
                  >
                    <option value="kg">kg</option>
                    <option value="lbs">lbs</option>
                  </select>
                </div>
              </div>

              {/* Manual calorie override */}
              <div>
                <label className="label">Daily calorie goal <span className="text-textMuted font-normal">(optional override)</span></label>
                <input
                  className="input"
                  type="number"
                  placeholder={`Auto: ${activeMember?.dailyCalorieGoal || '2000'} kcal`}
                  value={goalForm.dailyCalorieGoal}
                  onChange={e => setGoalForm(p => ({ ...p, dailyCalorieGoal: e.target.value }))}
                />
                <p className="text-xs text-textMuted mt-1">Leave blank to use auto-calculated goal based on your profile</p>
              </div>

              {/* Focus area — feeds the nudge system */}
              <div>
                <label className="label">Focus area <span className="text-textMuted font-normal">(for personalized insights)</span></label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'lose weight',   icon: 'leaf',  label: 'Lose weight',    desc: 'Calorie deficit · balanced macros', color: 'border-green-200 bg-green-50',  activeColor: 'border-green-500 bg-green-50',  iconClass: 'text-green-600'  },
                    { value: 'gain muscle',   icon: 'star',  label: 'Gain muscle',    desc: 'Calorie surplus · high protein',   color: 'border-blue-200 bg-blue-50',    activeColor: 'border-blue-500 bg-blue-50',    iconClass: 'text-blue-600'   },
                    { value: 'maintain',      icon: 'check', label: 'Maintain',       desc: 'Hit calorie goal · balanced',      color: 'border-purple-200 bg-purple-50', activeColor: 'border-purple-500 bg-purple-50', iconClass: 'text-purple-600' },
                    { value: 'improve energy',icon: 'sun',   label: 'Improve energy', desc: 'Focus on fiber · complex carbs',   color: 'border-orange-200 bg-orange-50', activeColor: 'border-orange-500 bg-orange-50', iconClass: 'text-orange-600' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setGoalForm(p => ({ ...p, goalType: p.goalType === opt.value ? '' : opt.value }))}
                      className={`text-left p-3 rounded-btn border-2 transition-all ${
                        goalForm.goalType === opt.value ? opt.activeColor + ' ring-1 ring-offset-1' : 'border-border bg-surface hover:border-gray-300'
                      }`}
                    >
                      <Icon name={opt.icon} size={18} className={`mb-1.5 ${goalForm.goalType === opt.value ? opt.iconClass : 'text-textMuted'}`} />
                      <p className={`text-sm font-semibold ${goalForm.goalType === opt.value ? 'text-textPrimary' : 'text-textMuted'}`}>
                        {opt.label}
                      </p>
                      <p className="text-xs text-textMuted mt-0.5 leading-tight">{opt.desc}</p>
                    </button>
                  ))}
                </div>
                {goalForm.goalType && (
                  <p className="text-xs text-primary mt-2 flex items-center gap-1">
                    <Icon name="sparkle" size={12} />
                    Macro targets will auto-adjust for your goal
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer bg-white border-t border-border px-6 py-4 flex gap-3 flex-shrink-0">
              <button onClick={() => setShowGoalModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleUpdateGoal} disabled={saving} className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? 'Saving...' : <><Icon name="check" size={14} /> Save goals</>}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  )
}