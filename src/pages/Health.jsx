import { useState, useEffect, useRef } from 'react'
import { getHealthData, logWeight, logMeal, updateMemberGoal, deleteNutritionLog, lookupNutrition, searchNutritionCache } from '../api/healthTracker'
import { LoadingSpinner, Toast } from '../components/ui/PageState'
import { useToast } from '../hooks/useToast'

export default function Health() {
  const { toast, showToast, hideToast } = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeMemberId, setActiveMemberId] = useState(null)
  const [activeTab, setActiveTab] = useState('today')
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [showMealModal, setShowMealModal] = useState(false)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [weightForm, setWeightForm] = useState({ weight: '', unit: 'kg', note: '' })
  const [mealForm, setMealForm] = useState({ recipeName: '', mealType: 'Breakfast', calories: '', protein: '', carbs: '', fat: '' })
  const [goalForm, setGoalForm] = useState({ dailyCalorieGoal: '', goalWeight: '' })
  const [saving, setSaving] = useState(false)
  const [lookingUp, setLookingUp] = useState(false)
  const [lookupResult, setLookupResult] = useState(null)
  const [servings, setServings] = useState(1)
  const [suggestions, setSuggestions] = useState([])
const [showSuggestions, setShowSuggestions] = useState(false)
const [searchingCache, setSearchingCache] = useState(false)
const debounceRef = useRef(null)

  useEffect(() => {
    fetchData()
  }, [])

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
      await logMeal({ memberName: activeMember?.name, ...mealForm })
      showToast('Meal logged!')
      setShowMealModal(false)
      setMealForm({ recipeName: '', mealType: 'Breakfast', calories: '', protein: '', carbs: '', fat: '' })
      fetchData()
    } catch (err) {
      showToast('Failed to log meal', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateGoal = async () => {
    setSaving(true)
    try {
      await updateMemberGoal({ memberId: activeMemberId, ...goalForm })
      showToast('Goal updated!')
      setShowGoalModal(false)
      fetchData()
    } catch (err) {
      showToast('Failed to update goal', 'error')
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
          <h1 className="text-2xl font-bold text-textPrimary">❤️ Health tracker</h1>
          <p className="text-textMuted mt-1">Nutrition, weight and goal tracking</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setGoalForm({ dailyCalorieGoal: activeMember?.dailyCalorieGoal || '', goalWeight: activeMember?.goalWeight || '' }); setShowGoalModal(true) }} className="btn-secondary text-sm">
            🎯 Set goals
          </button>
          <button onClick={() => setShowWeightModal(true)} className="btn-secondary text-sm">
            ⚖️ Log weight
          </button>
          <button onClick={() => setShowMealModal(true)} className="btn-primary text-sm">
            + Log meal
          </button>
        </div>
      </div>

      {/* Member selector */}
      <div className="flex gap-2 flex-wrap mb-6">
        {data.members.map(member => (
          <button
            key={member.id}
            onClick={() => setActiveMemberId(member.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-pill border text-sm font-medium transition-all ${
              activeMemberId === member.id
                ? 'bg-primary text-white border-primary'
                : 'bg-surface text-textMuted border-border hover:border-primary hover:text-primary'
            }`}
          >
            <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
              {member.name[0]}
            </span>
            {member.name}
            {member.streak > 0 && (
              <span className="text-xs">🔥{member.streak}</span>
            )}
          </button>
        ))}
      </div>

      {activeMember && (
        <>
          {/* Member overview cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              {
                label: 'Daily goal',
                value: activeMember.dailyCalorieGoal ? `${activeMember.dailyCalorieGoal}` : 'Not set',
                unit: activeMember.dailyCalorieGoal ? 'kcal' : '',
                icon: '🎯',
                color: 'bg-blue-50 border-blue-100'
              },
              {
                label: 'Consumed today',
                value: activeMember.todayTotals.calories,
                unit: 'kcal',
                icon: '🔥',
                color: 'bg-orange-50 border-orange-100'
              },
              {
                label: 'Current weight',
                value: activeMember.currentWeight || '—',
                unit: activeMember.currentWeight ? 'kg' : '',
                icon: '⚖️',
                color: 'bg-purple-50 border-purple-100'
              },
              {
                label: 'Logging streak',
                value: activeMember.streak,
                unit: activeMember.streak === 1 ? 'day' : 'days',
                icon: '🔥',
                color: 'bg-green-50 border-green-100'
              },
            ].map((card, i) => (
              <div key={i} className={`card border ${card.color}`}>
                <div className="text-2xl mb-1">{card.icon}</div>
                <p className="text-xl font-bold text-textPrimary">{card.value} <span className="text-sm font-normal text-textMuted">{card.unit}</span></p>
                <p className="text-xs text-textMuted mt-1">{card.label}</p>
              </div>
            ))}
          </div>

          {/* Calorie progress ring */}
          {activeMember.dailyCalorieGoal && (
            <div className="card mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-textPrimary">Today's progress</h2>
                <span className="text-xs text-textMuted">
                  {new Date().toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center gap-8 flex-wrap">
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

                {/* Macro progress bars */}
                <div className="flex-1 space-y-3 min-w-48">
                  {[
                    { label: 'Protein', consumed: activeMember.todayTotals.protein, goal: activeMember.macroTargets?.protein, unit: 'g', color: 'bg-blue-500' },
                    { label: 'Carbs', consumed: activeMember.todayTotals.carbs, goal: activeMember.macroTargets?.carbs, unit: 'g', color: 'bg-yellow-400' },
                    { label: 'Fat', consumed: activeMember.todayTotals.fat, goal: activeMember.macroTargets?.fat, unit: 'g', color: 'bg-red-400' },
                    { label: 'Fiber', consumed: activeMember.todayTotals.fiber, goal: 25, unit: 'g', color: 'bg-green-500' },
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
                <div className="text-center">
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

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-card mb-6 w-fit">
            {[
              { id: 'today', label: "Today's meals" },
              { id: 'week', label: '7-day history' },
              { id: 'weight', label: 'Weight tracking' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-btn text-sm font-medium transition-all ${
                  activeTab === tab.id ? 'bg-white text-textPrimary shadow-sm' : 'text-textMuted hover:text-textPrimary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Today's meals tab */}
          {activeTab === 'today' && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-textPrimary">Meals logged today</h3>
                <button onClick={() => setShowMealModal(true)} className="btn-primary text-sm py-1.5 px-3">+ Add meal</button>
              </div>
              {activeMember.todayMeals.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">🍽️</div>
                  <p className="text-textMuted text-sm">No meals logged today</p>
                  <p className="text-xs text-textMuted mt-1">Cook a recipe or add a meal manually</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeMember.todayMeals.map((meal, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-btn">
                      <div>
                        <p className="text-sm font-medium text-textPrimary">{meal.recipeName}</p>
                        <p className="text-xs text-textMuted">{meal.mealType} · {new Date(meal.loggedAt).toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          {meal.calories && <p className="text-sm font-semibold text-textPrimary">{Math.round(meal.calories)} kcal</p>}
                          {meal.protein && <p className="text-xs text-textMuted">{Math.round(meal.protein)}g protein</p>}
                        </div>
                        <button onClick={() => handleDeleteLog(meal.id)} className="text-textMuted hover:text-danger text-sm">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 7-day history tab */}
          {activeTab === 'week' && (
            <div className="card">
              <h3 className="font-semibold text-textPrimary mb-4">7-day calorie history</h3>
              <div className="space-y-3">
                {activeMember.last7Days.map((day, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <p className="text-xs text-textMuted w-24 flex-shrink-0">{day.date}</p>
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
                      {day.goal && (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-gray-400 opacity-50"
                          style={{ left: '100%' }}
                        />
                      )}
                    </div>
                    <div className="text-right w-28 flex-shrink-0">
                      <p className="text-xs font-semibold text-textPrimary">{day.calories} kcal</p>
                      {day.mealsLogged > 0 && <p className="text-xs text-textMuted">{day.mealsLogged} meals</p>}
                      {day.calories === 0 && <p className="text-xs text-textMuted">Not logged</p>}
                    </div>
                  </div>
                ))}
              </div>
              {activeMember.dailyCalorieGoal && (
                <div className="mt-4 pt-4 border-t border-border flex items-center gap-4 text-xs text-textMuted">
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-primary"/><span>On track</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-orange-400"/><span>Near goal</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-danger"/><span>Over goal</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-gray-200"/><span>Not logged</span></div>
                </div>
              )}
            </div>
          )}

          {/* Weight tracking tab */}
          {activeTab === 'weight' && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-textPrimary">Weight history</h3>
                <button onClick={() => setShowWeightModal(true)} className="btn-primary text-sm py-1.5 px-3">+ Log weight</button>
              </div>

              {activeMember.goalWeight && (
                <div className="bg-blue-50 border border-blue-100 rounded-btn px-4 py-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-primary">Goal weight: {activeMember.goalWeight} kg</p>
                      {activeMember.currentWeight && (
                        <p className="text-xs text-textMuted mt-0.5">
                          {activeMember.currentWeight > activeMember.goalWeight
                            ? `${(activeMember.currentWeight - activeMember.goalWeight).toFixed(1)} kg to lose`
                            : activeMember.currentWeight < activeMember.goalWeight
                            ? `${(activeMember.goalWeight - activeMember.currentWeight).toFixed(1)} kg to gain`
                            : '🎉 Goal reached!'}
                        </p>
                      )}
                    </div>
                    <div className="text-2xl">
                      {activeMember.currentWeight && activeMember.currentWeight <= activeMember.goalWeight ? '🎉' : '🎯'}
                    </div>
                  </div>
                </div>
              )}

              {activeMember.weightHistory.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">⚖️</div>
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
                          <span className={`text-xs font-medium ${
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

      {/* Log weight modal */}
      {showWeightModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-card shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-textPrimary">⚖️ Log weight</h3>
              <button onClick={() => setShowWeightModal(false)} className="text-textMuted hover:text-textPrimary">✕</button>
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
        </div>
      )}

      {/* Log meal modal */}
      {showMealModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-card shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-textPrimary">🍽️ Log meal</h3>
              <button onClick={() => setShowMealModal(false)} className="text-textMuted hover:text-textPrimary">✕</button>
            </div>
            <p className="text-sm text-textMuted mb-4">Logging for <strong>{activeMember?.name}</strong></p>
            <div className="space-y-3 mb-4">
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
      {/* Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border border-border rounded-btn shadow-lg z-50 mt-1 max-h-48 overflow-y-auto">
          {searchingCache && (
            <div className="px-3 py-2 text-xs text-textMuted">Searching...</div>
          )}
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
      className="btn-secondary text-sm px-3 disabled:opacity-50 whitespace-nowrap"
    >
      {lookingUp || searchingCache ? (
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
      ) : '🔍 Lookup'}
    </button>
  </div>
  <p className="text-xs text-textMuted mt-1">Try "Big Mac", "Tim Hortons bagel", "chicken biryani"</p>
</div>

              {lookupResult && (
                <div className={`rounded-btn px-3 py-2 border text-xs ${
                  lookupResult.confidence === 'high' ? 'bg-green-50 border-green-100' : 'bg-yellow-50 border-yellow-100'
                }`}>
                  <p className="font-medium text-textPrimary">✓ Found: {lookupResult.mealName}</p>
                  <p className="text-textMuted mt-0.5">
                    {lookupResult.servingSize} · Source: {lookupResult.source}
                    {lookupResult.confidence === 'low' && ' · Estimated'}
                  </p>
                </div>
              )}

              <div>
                <label className="label">Meal type</label>
                <select className="input" value={mealForm.mealType} onChange={e => setMealForm(p => ({ ...p, mealType: e.target.value }))}>
                  {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>

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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Calories</label>
                  <input className="input" type="number" placeholder="kcal" value={mealForm.calories} onChange={e => setMealForm(p => ({ ...p, calories: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Protein (g)</label>
                  <input className="input" type="number" placeholder="g" value={mealForm.protein} onChange={e => setMealForm(p => ({ ...p, protein: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Carbs (g)</label>
                  <input className="input" type="number" placeholder="g" value={mealForm.carbs} onChange={e => setMealForm(p => ({ ...p, carbs: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Fat (g)</label>
                  <input className="input" type="number" placeholder="g" value={mealForm.fat} onChange={e => setMealForm(p => ({ ...p, fat: e.target.value }))} />
                </div>
              </div>
              <p className="text-xs text-textMuted">💡 Use lookup to auto-fill nutrition, or enter manually</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowMealModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleLogMeal} disabled={!mealForm.recipeName || saving} className="btn-primary flex-1 disabled:opacity-50">
                {saving ? 'Saving...' : 'Log meal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set goals modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-card shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-textPrimary">🎯 Set goals</h3>
              <button onClick={() => setShowGoalModal(false)} className="text-textMuted hover:text-textPrimary">✕</button>
            </div>
            <p className="text-sm text-textMuted mb-1">Setting goals for <strong>{activeMember?.name}</strong></p>
            {activeMember?.dailyCalorieGoal && (
              <p className="text-xs text-primary mb-4">Auto-calculated goal: {activeMember.dailyCalorieGoal} kcal based on your profile</p>
            )}
            <div className="space-y-3 mb-4">
              <div>
                <label className="label">Daily calorie goal</label>
                <input className="input" type="number" placeholder={`Auto: ${activeMember?.dailyCalorieGoal || '2000'} kcal`} value={goalForm.dailyCalorieGoal} onChange={e => setGoalForm(p => ({ ...p, dailyCalorieGoal: e.target.value }))} />
                <p className="text-xs text-textMuted mt-1">Leave blank to use auto-calculated goal</p>
              </div>
              <div>
                <label className="label">Goal weight (kg)</label>
                <input className="input" type="number" step="0.1" placeholder="e.g. 65" value={goalForm.goalWeight} onChange={e => setGoalForm(p => ({ ...p, goalWeight: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowGoalModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleUpdateGoal} disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save goals'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  )
}