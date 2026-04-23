import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { suggestRecipes } from '../api/recipes'
import { getMembers } from '../api/family'

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

export default function Recipes() {
  const navigate = useNavigate()
  const [members, setMembers] = useState([])
  const [selectedMembers, setSelectedMembers] = useState([])
  const [mealType, setMealType] = useState('Dinner')
  const [loading, setLoading] = useState(false)
  const [recipes, setRecipes] = useState([])
  const [generated, setGenerated] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [limitError, setLimitError] = useState('')
  const [usage, setUsage] = useState(null)

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      const data = await getMembers()
      setMembers(data)
    } catch (err) {
      console.error(err)
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
    try {
      const data = await suggestRecipes(selectedMembers, mealType)
      setRecipes(data.recipes)
      setUsage(data.usage)
      setGenerated(true)
    } catch (err) {
      if (err.response?.data?.limitReached) {
        setLimitError(err.response.data.message)
      }
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-textPrimary">Recipe suggestions</h1>
        <p className="text-textMuted mt-1">AI-powered recipes based on your pantry and health goals</p>
      </div>

      {/* Generator card */}
      <div className="card mb-8 border-2 border-blue-100 bg-blue-50/30">
        <h2 className="font-semibold text-textPrimary mb-5">Who are you cooking for?</h2>

        {/* Member selector */}
        <div className="mb-5">
          <label className="label">Family members</label>
          {members.length === 0 ? (
            <p className="text-sm text-textMuted">
              No members yet —{' '}
              <button onClick={() => navigate('/app/settings')} className="text-primary hover:underline">
                add members in Settings
              </button>
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
                  mealType === t
                    ? 'bg-primary text-white border-primary'
                    : 'bg-surface text-textMuted border-border hover:border-primary hover:text-primary'
                }`}
              >
                {t === 'Breakfast' ? '🌅' : t === 'Lunch' ? '☀️' : t === 'Dinner' ? '🌙' : '🍎'} {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleGenerate}
            disabled={selectedMembers.length === 0 || loading}
            className="btn-primary px-8 py-3 text-base disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Generating...
              </>
            ) : (
              <>🤖 Generate recipes</>
            )}
          </button>
          {selectedMembers.length === 0 && (
            <p className="text-sm text-textMuted">Select at least one member</p>
          )}
        </div>

        {/* Limit error */}
        {limitError && (
          <div className="mt-4 bg-orange-50 border border-orange-100 rounded-card p-4">
            <p className="text-sm font-semibold text-orange-600 mb-1">Weekly limit reached</p>
            <p className="text-sm text-orange-500">{limitError}</p>
            <button
              onClick={() => navigate('/app/settings')}
              className="btn-primary mt-3 text-sm"
            >
              Upgrade to Family plan
            </button>
          </div>
        )}

        {/* Usage indicator for free plan */}
        {usage?.plan === 'free' && !limitError && (
          <div className="mt-4 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-pill overflow-hidden">
              <div
                className="h-full bg-primary rounded-pill transition-all"
                style={{ width: `${(usage.used / usage.limit) * 100}%` }}
              />
            </div>
            <span className="text-xs text-textMuted">{usage.used}/{usage.limit} recipes this week</span>
          </div>
        )}
      </div>

      {/* Results */}
      {generated && recipes.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-textPrimary">
              {recipes.length} recipes suggested for {mealType.toLowerCase()}
            </h2>
            <span className="text-xs bg-green-50 text-success border border-green-100 px-3 py-1 rounded-pill font-medium">
              Based on your pantry
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {recipes.map((recipe, idx) => (
              <div key={idx} className="card hover:shadow-md transition-all">

                <div className="flex items-start justify-between mb-3">
                  <div className="text-4xl">{recipe.icon}</div>
                  <span className={`text-xs px-2.5 py-1 rounded-pill font-medium ${
                    recipe.difficulty === 'Easy'
                      ? 'bg-green-50 text-success'
                      : 'bg-orange-50 text-orange-500'
                  }`}>
                    {recipe.difficulty}
                  </span>
                </div>

                <h3 className="font-semibold text-textPrimary text-lg mb-1">{recipe.name}</h3>
                <p className="text-sm text-textMuted mb-3 leading-relaxed">{recipe.description}</p>

                <div className="flex gap-2 flex-wrap mb-3">
                  {recipe.tags?.map(tag => (
                    <span key={tag} className="text-xs bg-blue-50 text-primary px-2.5 py-1 rounded-pill border border-blue-100">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-4 text-xs text-textMuted mb-4 border-t border-border pt-3">
                  <span>⏱ {recipe.time}</span>
                  <span>👥 Serves {recipe.serves}</span>
                </div>

                {recipe.missing?.length > 0 && (
                  <div className="bg-orange-50 border border-orange-100 rounded-btn px-3 py-2 mb-4">
                    <p className="text-xs font-medium text-orange-600 mb-1">Need to buy:</p>
                    <p className="text-xs text-orange-500">{recipe.missing.join(', ')}</p>
                  </div>
                )}

                {recipe.missing?.length === 0 && (
                  <div className="bg-green-50 border border-green-100 rounded-btn px-3 py-2 mb-4">
                    <p className="text-xs font-medium text-success">All ingredients in stock!</p>
                  </div>
                )}

                <button
                  onClick={() => setExpandedId(expandedId === idx ? null : idx)}
                  className="btn-secondary w-full text-sm"
                >
                  {expandedId === idx ? 'Hide ingredients' : 'View ingredients'}
                </button>

               {expandedId === idx && (
  <div className="mt-4 pt-4 border-t border-border">

    {/* Ingredients */}
    <p className="text-xs font-semibold text-textPrimary mb-2">Ingredients</p>
    <ul className="space-y-1.5 mb-5">
      {recipe.ingredients?.map(ing => (
        <li key={ing} className="flex items-center gap-2 text-sm text-textMuted">
          <span className="w-4 h-4 rounded-full bg-green-100 text-success flex items-center justify-center text-xs flex-shrink-0">✓</span>
          {ing}
        </li>
      ))}
      {recipe.missing?.map(ing => (
        <li key={ing} className="flex items-center gap-2 text-sm text-textMuted">
          <span className="w-4 h-4 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center text-xs flex-shrink-0">+</span>
          {ing} <span className="text-xs text-orange-400">(need to buy)</span>
        </li>
      ))}
    </ul>

    {/* Cooking steps */}
    {recipe.steps?.length > 0 && (
      <>
        <p className="text-xs font-semibold text-textPrimary mb-3">How to make it</p>
        <ol className="space-y-3">
          {recipe.steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-textMuted leading-relaxed">{step}</p>
            </li>
          ))}
        </ol>
      </>
    )}

  </div>
)}

              </div>
            ))}
          </div>
        </>
      )}

    </div>
  )
}