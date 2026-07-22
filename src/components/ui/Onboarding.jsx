import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { addMember } from '../../api/family'
import { addPantryItem } from '../../api/pantry'
import { getTemplates, applyTemplate } from '../../api/pantryTools'
import { suggestRecipes } from '../../api/recipes'
import Icon from '../ui/Icon'

const GOALS = [
  'Lose weight',
  'Gain muscle',
  'Maintain weight',
  'Healthy growth',
  'High protein',
  'Low carb',
  'Heart healthy',
  'Manage diabetes',
  'Manage cholesterol',
  'Manage blood pressure',
  'Improve gut health',
  'Boost energy',
  'Anti-inflammatory',
  'Build endurance',
  'Postpartum recovery',
  'Healthy aging',
]

const DIETARY = [
  'Vegetarian',
  'Vegan',
  'Gluten free',
  'Dairy free',
  'Halal',
  'Kosher',
  'Keto',
  'Paleo',
  'Low sodium',
  'Low sugar',
  'Low fat',
  'High fiber',
  'Nut free',
  'Egg free',
  'Soy free',
  'Shellfish free',
  'Raw food',
  'Whole food plant based',
  'Mediterranean',
  'Intermittent fasting',
]

const ALLERGENS = ['Peanuts', 'Tree nuts', 'Milk', 'Eggs', 'Fish', 'Shellfish', 'Soy', 'Wheat/Gluten', 'Sesame seeds']

const ACTIVITY_LEVELS = [
  { value: 'sedentary',   label: 'Sedentary' },
  { value: 'light',       label: 'Lightly active' },
  { value: 'moderate',    label: 'Moderately active' },
  { value: 'active',      label: 'Active' },
  { value: 'very_active', label: 'Very active' },
]

const GENDER_OPTIONS = [
  { value: 'male',   label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: null,     label: 'Prefer not to say' },
]

export default function Onboarding({ onComplete }) {
  const { user, family } = useAuthStore()
  const navigate = useNavigate()
  const aiDisclosureKey = `nooka_ai_disclosure_${family?.id}`
  const hasAcknowledgedAI = () => localStorage.getItem(aiDisclosureKey) === 'true'
  const acknowledgeAI = () => localStorage.setItem(aiDisclosureKey, 'true')
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [member, setMember] = useState({
    name: user?.name || '',
    age: '',
    weight: '',
    weightUnit: 'kg',
    height: '',
    goals: [],
    dietary: [],
    allergens: '',
    activityLevel: null,
    gender: undefined,
  })
  const [pantryItem, setPantryItem] = useState({
    name: '',
    quantity: '1',
    unit: 'pcs',
    category: 'Fridge',
    icon: '🛒',
  })
  const [skippedMember, setSkippedMember] = useState(false)
  const [skippedPantry, setSkippedPantry] = useState(false)
  const [firstRecipeData, setFirstRecipeData] = useState(null)
  const [firstRecipeLoading, setFirstRecipeLoading] = useState(false)
  const [firstRecipeError, setFirstRecipeError] = useState(false)
  const [aiConsented, setAiConsented] = useState(false)

  const [templates, setTemplates] = useState([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [applyingTemplate, setApplyingTemplate] = useState(null)
  const [templateSuccess, setTemplateSuccess] = useState(null)
  const [showManualForm, setShowManualForm] = useState(false)
  const [templateError, setTemplateError] = useState('')

  const formatHeight = (raw) => {
    if (!raw) return ''
    if (raw.length === 1) return `${raw}'0"`
    if (raw.length === 2) return `${raw[0]}'${raw[1]}"`
    return `${raw[0]}'${raw.slice(1, 3)}"`
  }
  const toggleAllergen = (allergen) => {
    const current = (member.allergens || '').split(',').map(a => a.trim()).filter(Boolean)
    const selected = current.includes(allergen)
    const updated = selected ? current.filter(a => a !== allergen) : [...current, allergen]
    setMember(p => ({ ...p, allergens: updated.join(', ') }))
  }

  useEffect(() => {
    if (step === 3 && templates.length === 0 && !templatesLoading) {
      setTemplatesLoading(true)
      getTemplates()
        .then(data => setTemplates(data))
        .catch(() => {})
        .finally(() => setTemplatesLoading(false))
    }
  }, [step])

  const handleApplyTemplate = async (templateId) => {
    setApplyingTemplate(templateId)
    setTemplateError('')
    try {
      const result = await applyTemplate(templateId)
      setTemplateSuccess({ message: result.message })
      setTimeout(() => setStep(4), 2000)
    } catch {
      setTemplateError("Couldn't add template — try again or add items manually.")
    } finally {
      setApplyingTemplate(null)
    }
  }

  const handleAddMember = async () => {
    if (!member.name.trim()) return
    setLoading(true)
    try {
      await addMember({
        ...member,
        goals: member.goals.join(', '),
        dietary: member.dietary.join(', '),
        activityLevel: effectiveActivityLevel,
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setStep(3)
    }
  }

  const handleAddPantryItem = async () => {
    if (!pantryItem.name.trim()) return
    setLoading(true)
    try {
      await addPantryItem({
        name: pantryItem.name,
        quantity: parseFloat(pantryItem.quantity) || 1,
        unit: pantryItem.unit,
        category: pantryItem.category,
        icon: pantryItem.icon,
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setStep(4)
    }
  }

  const handleGenerateFirstRecipe = async () => {
    setFirstRecipeLoading(true)
    setFirstRecipeError(false)
    const membersToUse = !skippedMember && member.name.trim() ? [member.name] : ['Family']
    try {
      const data = await suggestRecipes(membersToUse, 'Dinner', 'Any cuisine', [])
      setFirstRecipeData({ recipes: data.recipes, usage: data.usage, mealType: 'Dinner', members: membersToUse })
    } catch {
      setFirstRecipeError(true)
    } finally {
      setFirstRecipeLoading(false)
    }
  }

  const handleCompleteToRecipes = () => {
    localStorage.setItem(`onboarding_complete_${user?.id}`, 'true')
    onComplete()
    navigate('/app/recipes', { state: { preloadedRecipes: firstRecipeData } })
  }

  const handleComplete = () => {
    localStorage.setItem(`onboarding_complete_${user?.id}`, 'true')
    onComplete()
  }

  const isKid = !!(member.age && parseInt(member.age) < 13)
  const effectiveActivityLevel = member.activityLevel ?? (isKid ? 'very_active' : 'moderate')

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center sm:justify-center sm:p-4 backdrop-blur-sm">
      <div className="bg-white w-full sm:w-auto sm:min-w-[520px] max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-card shadow-xl modal-sheet">

        <div className="h-1.5 bg-gray-100 rounded-t-card overflow-hidden">
          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${(step / 4) * 100}%` }} />
        </div>

        <div className="p-6">

          {step === 1 && (
            <div className="text-center py-4">
              <div className="text-6xl mb-4">👋</div>
              <h2 className="text-2xl font-bold text-textPrimary mb-2">
                Welcome to Nooka, {user?.name?.split(' ')[0]}!
              </h2>
              <p className="text-textMuted mb-2">
                You're setting up <span className="font-semibold text-textPrimary">{family?.name}</span>
              </p>
              <p className="text-sm text-textMuted mb-8 max-w-sm mx-auto">
                Let's get you set up in 2 quick steps. It takes less than 2 minutes and makes the app much smarter for your family.
              </p>
              <div className="grid grid-cols-1 gap-3 mb-8 text-left">
                {[
                  { icon: '👨‍👩‍👧‍👦', title: 'Add a family member', desc: 'Health goals and allergens for personalized recipes' },
                  { icon: '🧺', title: 'Add a pantry item', desc: 'Start tracking what you have at home' },
                  { icon: '🫧', title: 'Get AI recipes', desc: 'Personalized meals based on your pantry and health goals' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-btn px-4 py-3">
                    <span className="text-2xl flex-shrink-0">{item.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-textPrimary">{item.title}</p>
                      <p className="text-xs text-textMuted mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setStep(2)} className="btn-primary w-full py-3 text-base">
                Let's get started →
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="mb-6">
                <p className="text-xs text-textMuted mb-1">Step 1 of 2</p>
                <h2 className="text-xl font-bold text-textPrimary">Add a family member</h2>
                <p className="text-sm text-textMuted mt-1">This helps us generate personalized recipes and track health goals</p>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="label">Name</label>
                  <input
                    className="input"
                    placeholder="name"
                    value={member.name}
                    onChange={e => setMember(p => ({ ...p, name: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="label">Age</label>
                    <input className="input" type="number" placeholder="age" value={member.age} onChange={e => setMember(p => ({ ...p, age: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Weight</label>
                    <div className="flex gap-1">
                      <input className="input flex-1 min-w-0" type="number" step="0.1" placeholder="weight" value={member.weight} onChange={e => setMember(p => ({ ...p, weight: e.target.value }))} />
                      <select className="input w-16" value={member.weightUnit} onChange={e => setMember(p => ({ ...p, weightUnit: e.target.value }))}>
                        <option value="kg">kg</option>
                        <option value="lbs">lbs</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="label">Height</label>
                    <input
                      className="input"
                      placeholder="height"
                      value={member.height}
                      onChange={e => setMember(p => ({ ...p, height: e.target.value }))}
                      onBlur={e => {
                        const raw = e.target.value.replace(/\D/g, '')
                        if (raw && !e.target.value.includes("'")) {
                          setMember(p => ({ ...p, height: formatHeight(raw) }))
                        }
                      }}
                    />
                    <p className="text-xs text-textMuted mt-0.5">54 → 5'4"</p>
                  </div>
                </div>

                <div>
                  <label className="label">Health goals <span className="text-textMuted font-normal">(select all that apply)</span></label>
                  <div className="flex flex-wrap gap-2">
                    {GOALS.map(goal => {
                      const selected = member.goals.includes(goal)
                      return (
                        <button key={goal} type="button"
                          onClick={() => setMember(p => ({ ...p, goals: selected ? p.goals.filter(g => g !== goal) : [...p.goals, goal] }))}
                          className={`text-xs px-3 py-1.5 rounded-pill border font-medium transition-all ${selected ? 'bg-primary text-white border-primary' : 'bg-surface text-textMuted border-border hover:border-primary hover:text-primary'}`}
                        >
                          {selected ? '✓ ' : '+ '}{goal}
                        </button>
                      )
                    })}
                  </div>
                  {member.goals.length > 0 && <p className="text-xs text-primary mt-2">Selected: {member.goals.join(', ')}</p>}
                </div>

                <div>
                  <label className="label">Activity level</label>
                  <div className="flex flex-wrap gap-2">
                    {ACTIVITY_LEVELS.map(({ value, label }) => (
                      <button key={value} type="button"
                        onClick={() => setMember(p => ({ ...p, activityLevel: value }))}
                        className={`text-xs px-3 py-1.5 rounded-pill border font-medium transition-all ${
                          effectiveActivityLevel === value
                            ? 'bg-primary text-white border-primary'
                            : 'bg-surface text-textMuted border-border hover:border-primary hover:text-primary'
                        }`}
                      >
                        {effectiveActivityLevel === value ? '✓ ' : '+ '}{label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-textMuted mt-1">Used to calculate daily calorie targets.</p>
                </div>

                <div>
                  <label className="label">Gender <span className="text-textMuted font-normal">(optional)</span></label>
                  <div className="flex flex-wrap gap-2">
                    {GENDER_OPTIONS.map(({ value, label }) => (
                      <button key={label} type="button"
                        onClick={() => setMember(p => ({ ...p, gender: value }))}
                        className={`text-xs px-3 py-1.5 rounded-pill border font-medium transition-all ${
                          member.gender === value && member.gender !== undefined
                            ? 'bg-primary text-white border-primary'
                            : 'bg-surface text-textMuted border-border hover:border-primary hover:text-primary'
                        }`}
                      >
                        {member.gender === value && member.gender !== undefined ? '✓ ' : '+ '}{label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-textMuted mt-1">Used for accurate calorie math.</p>
                </div>

                <div>
                  <label className="label">Dietary preferences <span className="text-textMuted font-normal">(select all that apply)</span></label>
                  <div className="flex flex-wrap gap-2">
                    {DIETARY.map(diet => {
                      const selected = member.dietary.includes(diet)
                      return (
                        <button key={diet} type="button"
                          onClick={() => setMember(p => ({ ...p, dietary: selected ? p.dietary.filter(d => d !== diet) : [...p.dietary, diet] }))}
                          className={`text-xs px-3 py-1.5 rounded-pill border font-medium transition-all ${selected ? 'bg-green-500 text-white border-green-500' : 'bg-surface text-textMuted border-border hover:border-green-400 hover:text-green-600'}`}
                        >
                          {selected ? '✓ ' : '+ '}{diet}
                        </button>
                      )
                    })}
                  </div>
                  {member.dietary.length > 0 && <p className="text-xs text-green-600 mt-2">Selected: {member.dietary.join(', ')}</p>}
                </div>

                <div>
                  <label className="label">Allergens <span className="text-textMuted font-normal">(select all that apply)</span></label>
                  <div className="flex flex-wrap gap-2">
                    {ALLERGENS.map(allergen => {
                      const selected = (member.allergens || '').split(',').map(a => a.trim()).filter(Boolean).includes(allergen)
                      return (
                        <button key={allergen} type="button" onClick={() => toggleAllergen(allergen)}
                          className={`text-xs px-3 py-1.5 rounded-pill border font-medium transition-all ${selected ? 'bg-danger text-white border-danger' : 'bg-surface text-textMuted border-border hover:border-danger hover:text-danger'}`}
                        >
                          {selected ? '✕ ' : '+ '}{allergen}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => { setSkippedMember(true); setStep(3) }} className="btn-secondary flex-1">
                  Skip for now
                </button>
                <button onClick={handleAddMember} disabled={!member.name.trim() || loading} className="btn-primary flex-1 disabled:opacity-50">
                  {loading ? 'Adding...' : 'Add member →'}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="mb-5">
                <p className="text-xs text-textMuted mb-1">Step 2 of 2</p>
                <h2 className="text-xl font-bold text-textPrimary">Stock your pantry</h2>
                <p className="text-sm text-textMuted mt-1">Pick a starter kit to add 15–20 items in one tap</p>
              </div>

              {templateSuccess ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-green-600 text-2xl font-bold">✓</span>
                  </div>
                  <p className="font-semibold text-textPrimary text-lg">{templateSuccess.message}</p>
                  <p className="text-sm text-textMuted mt-1 mb-6">Taking you to the next step...</p>
                  <button onClick={() => setStep(4)} className="btn-primary w-full py-3">
                    Continue →
                  </button>
                </div>
              ) : (
                <>
                  {templateError && (
                    <div className="mb-4 bg-red-50 border border-red-100 text-danger text-sm px-4 py-3 rounded-btn">
                      {templateError}
                    </div>
                  )}

                  {templatesLoading ? (
                    <div className="flex items-center justify-center gap-2 py-10 text-textMuted text-sm">
                      <svg className="animate-spin w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Loading templates...
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                      {templates.map(template => {
                        const isApplying = applyingTemplate === template.id
                        return (
                          <button
                            key={template.id}
                            type="button"
                            disabled={!!applyingTemplate}
                            onClick={() => handleApplyTemplate(template.id)}
                            className={`text-left p-4 rounded-btn border transition-all w-full ${
                              isApplying
                                ? 'border-primary bg-blue-50 opacity-60'
                                : 'border-border hover:border-primary hover:bg-blue-50 active:scale-[0.99]'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-2xl leading-none flex-shrink-0 mt-0.5">{template.icon}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-textPrimary leading-snug">{template.name}</p>
                                <p className="text-xs text-textMuted mt-0.5 line-clamp-2">{template.description}</p>
                                <p className="text-xs text-primary font-medium mt-1.5">
                                  {isApplying ? 'Adding items...' : `${template.itemCount} items`}
                                </p>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  <div className="border-t border-border pt-4 mb-5">
                    <button
                      type="button"
                      onClick={() => setShowManualForm(p => !p)}
                      className="flex items-center gap-2 text-sm text-textMuted hover:text-textPrimary transition-colors font-medium"
                    >
                      <span className={`text-base inline-block transition-transform duration-200 ${showManualForm ? 'rotate-90' : ''}`}>›</span>
                      Or add items manually
                    </button>
                    {showManualForm && (
                      <div className="space-y-4 mt-4">
                        <div>
                          <label className="label">Item name</label>
                          <input className="input" placeholder="e.g. Basmati rice, Chicken breast, Milk..." value={pantryItem.name} onChange={e => setPantryItem(p => ({ ...p, name: e.target.value }))} autoFocus />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="label">Quantity</label>
                            <input className="input" type="number" placeholder="1" value={pantryItem.quantity} onChange={e => setPantryItem(p => ({ ...p, quantity: e.target.value }))} />
                          </div>
                          <div>
                            <label className="label">Unit</label>
                            <select className="input" value={pantryItem.unit} onChange={e => setPantryItem(p => ({ ...p, unit: e.target.value }))}>
                              {['pcs', 'kg', 'g', 'L', 'ml', 'lb', 'oz', 'cup'].map(u => <option key={u}>{u}</option>)}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="label">Category</label>
                          <select className="input" value={pantryItem.category} onChange={e => setPantryItem(p => ({ ...p, category: e.target.value }))}>
                            {['Fridge', 'Freezer', 'Dry goods', 'Spices', 'Snacks'].map(c => <option key={c}>{c}</option>)}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button type="button" onClick={() => { setSkippedPantry(true); setStep(4) }} className="btn-secondary flex-1">
                      Skip for now
                    </button>
                    {showManualForm && (
                      <button type="button" onClick={handleAddPantryItem} disabled={!pantryItem.name.trim() || loading} className="btn-primary flex-1 disabled:opacity-50">
                        {loading ? 'Adding...' : 'Add item →'}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="py-4">

              {/* ── Fallback: skipped pantry or generation failed ── */}
              {(skippedPantry || firstRecipeError) && (
                <div className="text-center">
                  <div className="text-6xl mb-4">🎉</div>
                  <h2 className="text-2xl font-bold text-textPrimary mb-2">You're all set!</h2>
                  <p className="text-textMuted mb-8 max-w-sm mx-auto">
                    Nooka is ready to use. Here's what you can do next:
                  </p>
                  <div className="grid grid-cols-1 gap-3 mb-8 text-left">
                    {[
                      { icon: '🧺', title: 'Add more pantry items', desc: 'The more you add, the better your recipes', link: '/app/pantry' },
                      { icon: null, title: 'Get recipe suggestions', desc: 'AI recipes based on your pantry and health goals', link: '/app/recipes', svgIcon: 'ai' },
                      { icon: '🛒', title: 'Start your grocery list', desc: 'Track what you need to buy this week', link: '/app/grocery' },
                      { icon: '📊', title: 'View reports', desc: 'Track your grocery spending over time', link: '/app/reports' },
                    ].map((item, i) => (
                      <a key={i} href={item.link} className="flex items-start gap-3 bg-gray-50 rounded-btn px-4 py-3 hover:bg-blue-50 hover:border-primary border border-transparent transition-all">
                        {item.svgIcon
                          ? <span className="w-8 h-8 flex items-center justify-center flex-shrink-0 text-primary"><Icon name={item.svgIcon} size={22} /></span>
                          : <span className="text-2xl flex-shrink-0">{item.icon}</span>
                        }
                        <div>
                          <p className="text-sm font-semibold text-textPrimary">{item.title}</p>
                          <p className="text-xs text-textMuted mt-0.5">{item.desc}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                  <button onClick={handleComplete} className="btn-primary w-full py-3 text-base">
                    Go to dashboard →
                  </button>
                </div>
              )}

              {/* ── Loading: inline spinner (no CookingLoader — z-index conflict) ── */}
              {!skippedPantry && !firstRecipeError && firstRecipeLoading && (
                <div className="text-center py-8">
                  <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="animate-spin w-7 h-7 text-primary" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  </div>
                  <p className="font-semibold text-textPrimary mb-1">Finding your first recipe...</p>
                  <p className="text-sm text-textMuted">Checking your pantry and health goals</p>
                  <button onClick={handleComplete} className="text-sm text-textMuted hover:text-textPrimary underline mt-6 py-2">
                    Skip — finish setup
                  </button>
                </div>
              )}

              {/* ── Recipe card ── */}
              {!skippedPantry && !firstRecipeError && !firstRecipeLoading && firstRecipeData && (() => {
                const recipe = firstRecipeData.recipes[0]
                const pantryCount = recipe.ingredients?.length ?? 0
                return (
                  <div>
                    <div className="text-center mb-4">
                      <h2 className="text-xl font-bold text-textPrimary">Your first recipe is ready!</h2>
                      <p className="text-sm text-textMuted mt-1">Based on your pantry — just a taste of what's possible</p>
                    </div>
                    <div className="border border-border rounded-card p-4 mb-3">
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-3xl flex-shrink-0 leading-none mt-0.5">{recipe.icon}</span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-textPrimary line-clamp-2 leading-snug">{recipe.name}</h3>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="text-xs text-textMuted">⏱ {recipe.time}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-pill font-medium ${recipe.difficulty === 'Easy' ? 'bg-green-50 text-success' : 'bg-orange-50 text-orange-500'}`}>
                              {recipe.difficulty}
                            </span>
                            {pantryCount > 0 && (
                              <span className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-pill font-medium">
                                ✓ {pantryCount} pantry item{pantryCount !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {recipe.steps?.length > 0 && (
                        <ol className="space-y-1.5 mb-4">
                          {recipe.steps.slice(0, 3).map((stepText, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                              <p className="text-xs text-textMuted leading-relaxed line-clamp-2">{stepText}</p>
                            </li>
                          ))}
                        </ol>
                      )}
                      <button onClick={handleCompleteToRecipes} className="btn-primary w-full py-3 text-sm">
                        See full recipe →
                      </button>
                    </div>
                    <button onClick={handleComplete} className="text-sm text-textMuted hover:text-textPrimary w-full text-center py-2">
                      Skip — go to dashboard
                    </button>
                  </div>
                )
              })()}

              {/* ── Offer state: disclosure or direct generate ── */}
              {!skippedPantry && !firstRecipeError && !firstRecipeLoading && !firstRecipeData && (
                <div>
                  {!(hasAcknowledgedAI() || aiConsented) ? (
                    /* Compact AI disclosure */
                    <div>
                      <div className="text-center mb-5">
                        <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Icon name="ai" size={24} className="text-primary" />
                        </div>
                        <h2 className="text-xl font-bold text-textPrimary">See AI in action</h2>
                        <p className="text-sm text-textMuted mt-1">Generate your first recipe from your new pantry</p>
                      </div>
                      <div className="bg-gray-50 rounded-card px-4 py-3 mb-4">
                        <p className="text-xs font-semibold text-textPrimary mb-2">Before we generate — a quick note:</p>
                        <p className="text-xs text-textMuted mb-2 leading-relaxed">
                          To generate recipes, Nooka sends anonymous health and pantry data to Anthropic's AI (US servers). Your name, email, and account details are never shared.
                        </p>
                        <ul className="space-y-1 mb-3">
                          {['Dietary preferences & health goals', 'Age ranges of family members', 'Items currently in your pantry'].map((item, i) => (
                            <li key={i} className="flex items-center gap-2 text-xs text-textMuted">
                              <svg className="w-3.5 h-3.5 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              {item}
                            </li>
                          ))}
                        </ul>
                        <p className="text-xs text-textMuted">
                          By continuing you consent per our{' '}
                          <a href="/privacy" target="_blank" className="text-primary hover:underline">Privacy Policy</a>.
                        </p>
                      </div>
                      <button
                        onClick={() => { acknowledgeAI(); setAiConsented(true); handleGenerateFirstRecipe() }}
                        className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 mb-3"
                      >
                        <Icon name="ai" size={16} />
                        Generate my first recipe ✨
                      </button>
                      <button onClick={handleComplete} className="text-sm text-textMuted hover:text-textPrimary w-full text-center py-2">
                        Skip — finish setup
                      </button>
                    </div>
                  ) : (
                    /* AI already acknowledged — direct generate */
                    <div>
                      <div className="text-center mb-6">
                        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <svg className="w-7 h-7 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <h2 className="text-xl font-bold text-textPrimary">Your pantry is stocked!</h2>
                        <p className="text-sm text-textMuted mt-1">Want to see a recipe made from your new pantry?</p>
                      </div>
                      <button
                        onClick={handleGenerateFirstRecipe}
                        className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 mb-3"
                      >
                        <Icon name="ai" size={16} />
                        Generate my first recipe ✨
                      </button>
                      <button onClick={handleComplete} className="text-sm text-textMuted hover:text-textPrimary w-full text-center py-2">
                        Skip — finish setup
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  )
}
