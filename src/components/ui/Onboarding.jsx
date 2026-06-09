import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { addMember } from '../../api/family'
import { addPantryItem } from '../../api/pantry'

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

export default function Onboarding({ onComplete }) {
  const { user, family } = useAuthStore()
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

  const handleAddMember = async () => {
    if (!member.name.trim()) return
    setLoading(true)
    try {
      await addMember({
        ...member,
        goals: member.goals.join(', '),
        dietary: member.dietary.join(', '),
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

  const handleComplete = () => {
    localStorage.setItem(`onboarding_complete_${user?.id}`, 'true')
    onComplete()
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center sm:justify-center sm:p-4 backdrop-blur-sm">
      <div className="bg-white w-full sm:w-auto sm:min-w-[520px] max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-card shadow-xl">

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
              <div className="mb-6">
                <p className="text-xs text-textMuted mb-1">Step 2 of 2</p>
                <h2 className="text-xl font-bold text-textPrimary">Add your first pantry item</h2>
                <p className="text-sm text-textMuted mt-1">What's in your kitchen right now? Add one item to get started</p>
              </div>
              <div className="space-y-4 mb-6">
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
              <div className="flex gap-3">
                <button onClick={() => { setSkippedPantry(true); setStep(4) }} className="btn-secondary flex-1">
                  Skip for now
                </button>
                <button onClick={handleAddPantryItem} disabled={!pantryItem.name.trim() || loading} className="btn-primary flex-1 disabled:opacity-50">
                  {loading ? 'Adding...' : 'Add item →'}
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-4">
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

        </div>
      </div>
    </div>
  )
}
