import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getBabyProfile,
  getAllergenIntroductions,
  logAllergenIntroduction,
  removeAllergenIntroduction,
  getFeedingLog,
  addFeedingLog,
  deleteFeedingLog,
  generateBabyRecipe,
} from '../api/baby'
import { useToast } from '../hooks/useToast'
import { Toast } from '../components/ui/PageState'
import { useAuthStore } from '../store/authStore'
import Icon from '../components/ui/Icon'

const BIG_9 = ['Peanuts', 'Egg', 'Milk', 'Tree nuts', 'Wheat', 'Soy', 'Sesame', 'Fish', 'Shellfish']

const TEXTURES = ['Smooth purée', 'Mashed', 'Lumpy', 'Soft chunks', 'Soft family food', 'Family table']

const REACTIONS = [
  { value: 'none', label: '✅ No reaction', color: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'mild', label: '⚠️ Mild reaction', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { value: 'severe', label: '🚨 Severe reaction', color: 'bg-red-50 text-red-700 border-red-200' },
]

const STAGE_INFO = [
  { stage: 0, color: 'bg-gray-100 text-gray-600 border-gray-200',     foods: 'Breast milk or formula only. No solids yet.' },
  { stage: 1, color: 'bg-pink-50 text-pink-700 border-pink-200',      foods: 'Iron-fortified cereals, pureed meat, mashed legumes, pureed vegetables and fruits.' },
  { stage: 2, color: 'bg-orange-50 text-orange-700 border-orange-200',foods: 'Mashed or minced foods. Soft cooked vegetables, mashed banana, yogurt, soft tofu.' },
  { stage: 3, color: 'bg-yellow-50 text-yellow-700 border-yellow-200',foods: 'Soft finger foods. Small soft pieces of cooked veg, ripe fruit, cheese cubes, pasta.' },
  { stage: 4, color: 'bg-green-50 text-green-700 border-green-200',   foods: 'Most family foods cut small. Avoid honey, whole nuts, hard raw vegetables, large grapes.' },
  { stage: 5, color: 'bg-blue-50 text-blue-700 border-blue-200',      foods: 'Full toddler diet. Focus on variety, iron-rich foods, and healthy fats.' },
]

export default function BabyProfile() {
  const { memberId } = useParams()
  const navigate = useNavigate()
  const { family } = useAuthStore()
  const { toast, showToast, hideToast } = useToast()
  const [activeTab, setActiveTab] = useState('stage')
  const [profile, setProfile] = useState(null)
  const [allergens, setAllergens] = useState([])
  const [feedingLogs, setFeedingLogs] = useState([])
  const [loading, setLoading] = useState(true)

  // Allergen intro form
  const [introForm, setIntroForm] = useState({ allergen: '', reaction: 'none', notes: '', introducedAt: new Date().toISOString().split('T')[0] })
  const [savingIntro, setSavingIntro] = useState(false)

  // Feeding log form
  const [feedForm, setFeedForm] = useState({ foodName: '', portionG: '', texture: '', reaction: 'none', notes: '' })
  const [savingFeed, setSavingFeed] = useState(false)

  // Recipe generator
  const [recipe, setRecipe] = useState(null)
  const [generatingRecipe, setGeneratingRecipe] = useState(false)
  const [recipeMealType, setRecipeMealType] = useState('any')

  const planName = family?.plan || 'free'
  const canUseAllergenTracker = ['family', 'premium'].includes(planName)
  const canUseFeedingLog = ['family', 'premium'].includes(planName)
  const canUseRecipeGenerator = planName === 'premium'

  useEffect(() => {
    loadProfile()
  }, [memberId])

  useEffect(() => {
    if (activeTab === 'allergens' && canUseAllergenTracker) loadAllergens()
    if (activeTab === 'feeding' && canUseFeedingLog) loadFeedingLog()
  }, [activeTab])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const data = await getBabyProfile(memberId)
      setProfile(data)
    } catch (err) {
      showToast('Failed to load baby profile', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadAllergens = async () => {
    try {
      const data = await getAllergenIntroductions(memberId)
      setAllergens(data)
    } catch (err) {
      showToast('Failed to load allergen data', 'error')
    }
  }

  const loadFeedingLog = async () => {
    try {
      const data = await getFeedingLog(memberId)
      setFeedingLogs(data)
    } catch (err) {
      showToast('Failed to load feeding log', 'error')
    }
  }

  const handleLogAllergen = async () => {
    if (!introForm.allergen) return showToast('Select an allergen', 'error')
    setSavingIntro(true)
    try {
      const result = await logAllergenIntroduction(memberId, introForm)
      setAllergens(prev => {
        const exists = prev.find(a => a.allergen === result.allergen)
        return exists ? prev.map(a => a.allergen === result.allergen ? result : a) : [...prev, result]
      })
      setIntroForm({ allergen: '', reaction: 'none', notes: '', introducedAt: new Date().toISOString().split('T')[0] })
      showToast('Allergen introduction logged!')
    } catch (err) {
      showToast('Failed to log allergen', 'error')
    } finally {
      setSavingIntro(false)
    }
  }

  const handleRemoveAllergen = async (allergen) => {
    try {
      await removeAllergenIntroduction(memberId, allergen)
      setAllergens(prev => prev.filter(a => a.allergen !== allergen))
      showToast('Removed')
    } catch (err) {
      showToast('Failed to remove', 'error')
    }
  }

  const handleAddFeedingLog = async () => {
    if (!feedForm.foodName.trim()) return showToast('Enter a food name', 'error')
    setSavingFeed(true)
    try {
      const result = await addFeedingLog(memberId, feedForm)
      setFeedingLogs(prev => [result, ...prev])
      setFeedForm({ foodName: '', portionG: '', texture: '', reaction: 'none', notes: '' })
      showToast('Feeding logged!')
    } catch (err) {
      showToast('Failed to log feeding', 'error')
    } finally {
      setSavingFeed(false)
    }
  }

  const handleGenerateRecipe = async () => {
    setGeneratingRecipe(true)
    setRecipe(null)
    try {
      const data = await generateBabyRecipe(memberId, { mealType: recipeMealType })
      setRecipe(data)
    } catch (err) {
      if (err.response?.data?.limitReached) {
        showToast('Premium plan required to generate baby recipes', 'error')
      } else if (err.response?.data?.error) {
        showToast(err.response.data.error, 'error')
      } else {
        showToast('Failed to generate recipe', 'error')
      }
    } finally {
      setGeneratingRecipe(false)
    }
  }

  const handleDeleteFeedingLog = async (logId) => {
    try {
      await deleteFeedingLog(memberId, logId)
      setFeedingLogs(prev => prev.filter(l => l.id !== logId))
      showToast('Entry removed')
    } catch (err) {
      showToast('Failed to remove entry', 'error')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <svg className="animate-spin w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
    </div>
  )

  if (!profile) return (
    <div className="text-center py-20 text-textMuted">
      <p className="text-4xl mb-3">🍼</p>
      <p className="font-medium">Baby profile not found</p>
      <button onClick={() => navigate('/app/settings')} className="btn-secondary mt-4">← Back to settings</button>
    </div>
  )

  const stageInfo = STAGE_INFO[profile.stage ?? 0]
  const introducedAllergens = allergens.map(a => a.allergen)

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/app/settings')} className="text-textMuted hover:text-textPrimary text-sm">← Back</button>
      </div>

      <div className="card mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-pink-100 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
            🍼
          </div>
          <div>
            <h1 className="text-xl font-bold text-textPrimary">{profile.member.name}</h1>
            <p className="text-sm text-textMuted">
              {profile.ageMonths !== null ? `${profile.ageMonths} months old` : 'Age unknown'}
              {profile.member.birthDate && (
                <span className="ml-2 text-xs">· Born {new Date(profile.member.birthDate).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              )}
            </p>
            {profile.stage !== null && (
              <span className={`inline-block mt-1 text-xs px-2.5 py-1 rounded-pill border font-medium ${stageInfo.color}`}>
                Stage {profile.stage} — {profile.label}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-card mb-6">
        {[
          { id: 'stage',    label: 'Stage tracker',   iconComponent: 'chart' },
      { id: 'allergens',label: 'Allergen tracker', iconComponent: 'warning' },
      { id: 'feeding',  label: 'Feeding log',      iconComponent: 'cookbook' },
      { id: 'recipes',  label: 'Recipes',          iconComponent: 'sparkle' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-btn text-xs font-medium transition-all ${
              activeTab === tab.id ? 'bg-surface text-textPrimary shadow-card' : 'text-textMuted hover:text-textPrimary'
            }`}
          >
            {tab.iconComponent
              ? <Icon name={tab.iconComponent} size={15} />
              : <span>{tab.icon}</span>
            }
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Stage tracker tab */}
      {activeTab === 'stage' && (
        <div className="space-y-4">
          <div className={`card border ${stageInfo.color}`}>
            <p className="font-semibold text-sm mb-1">Current stage — what to feed now</p>
            <p className="text-sm leading-relaxed">{stageInfo.foods}</p>
          </div>

          {/* Stage timeline */}
          <div className="card">
            <p className="font-semibold text-textPrimary mb-4">Stage timeline</p>
            <div className="space-y-3">
              {STAGE_INFO.map((s, i) => {
                const isCurrent = i === (profile.stage ?? 0)
                const isPast = i < (profile.stage ?? 0)
                return (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-card border transition-all ${
                    isCurrent ? `${s.color} border-current` : isPast ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-gray-50 border-gray-100'
                  }`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      isCurrent ? 'bg-white shadow' : isPast ? 'bg-gray-200 text-gray-500' : 'bg-gray-200 text-gray-400'
                    }`}>
                      {isPast ? '✓' : i}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-xs font-semibold text-textPrimary">
                          {['0–5 months', '6 months', '7–8 months', '9–11 months', '12–17 months', '18–35 months'][i]}
                        </p>
                        {isCurrent && <span className="text-xs bg-white px-2 py-0.5 rounded-pill font-semibold shadow-sm">← Now</span>}
                      </div>
                      <p className="text-xs text-textMuted leading-relaxed">{s.foods}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Health Canada note */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-card">
            <span className="text-lg flex-shrink-0">🇨🇦</span>
            <p className="text-xs text-blue-700 leading-relaxed">
              Stage guidance follows <strong>Health Canada's infant feeding recommendations</strong>. Always consult your pediatrician or public health nurse for personalized advice.
            </p>
          </div>
        </div>
      )}

      {/* Allergen tracker tab */}
      {activeTab === 'allergens' && (
        <div className="space-y-4">
          {!canUseAllergenTracker ? (
            <div className="card text-center py-10">
              <p className="text-3xl mb-3">🧪</p>
              <p className="font-semibold text-textPrimary mb-1">Family plan required</p>
              <p className="text-sm text-textMuted mb-4">Upgrade to track allergen introductions and keep a safety record.</p>
              <button onClick={() => navigate('/app/settings?tab=plan')} className="btn-primary">View plans →</button>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-card">
                <span className="text-lg flex-shrink-0">💡</span>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Health Canada recommends introducing the top 9 allergens <strong>early and repeatedly</strong>, starting around 6 months. Track each introduction and any reactions below.
                </p>
              </div>

              {/* Big 9 grid */}
              <div className="card">
                <p className="font-semibold text-textPrimary mb-3">The Big 9 allergens</p>
                <div className="grid grid-cols-3 gap-2">
                  {BIG_9.map(allergen => {
                    const intro = allergens.find(a => a.allergen === allergen)
                    const reaction = REACTIONS.find(r => r.value === intro?.reaction)
                    return (
                      <div key={allergen} className={`p-2.5 rounded-card border text-center transition-all ${
                        intro ? (reaction?.color || 'bg-green-50 text-green-700 border-green-200') : 'bg-gray-50 border-gray-100'
                      }`}>
                        <p className="text-xs font-semibold text-textPrimary mb-0.5">{allergen}</p>
                        {intro ? (
                          <>
                            <p className="text-xs text-textMuted">{new Date(intro.introducedAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}</p>
                            <p className="text-xs font-medium mt-0.5">{reaction?.label || '✅ Introduced'}</p>
                          </>
                        ) : (
                          <p className="text-xs text-textMuted">Not yet</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Log new introduction */}
              <div className="card">
                <p className="font-semibold text-textPrimary mb-3">Log an introduction</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="label">Allergen</label>
                    <select className="input" value={introForm.allergen} onChange={e => setIntroForm(p => ({ ...p, allergen: e.target.value }))}>
                      <option value="">Select allergen</option>
                      {BIG_9.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Date introduced</label>
                    <input className="input" type="date" max={new Date().toISOString().split('T')[0]} value={introForm.introducedAt} onChange={e => setIntroForm(p => ({ ...p, introducedAt: e.target.value }))} />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="label">Reaction</label>
                  <div className="flex gap-2 flex-wrap">
                    {REACTIONS.map(r => (
                      <button key={r.value} type="button"
                        onClick={() => setIntroForm(p => ({ ...p, reaction: r.value }))}
                        className={`text-xs px-3 py-1.5 rounded-pill border font-medium transition-all ${
                          introForm.reaction === r.value ? r.color : 'bg-surface text-textMuted border-border'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-3">
                  <label className="label">Notes <span className="text-textMuted font-normal">(optional)</span></label>
                  <input className="input" placeholder="e.g. mixed into oatmeal, ate well" value={introForm.notes} onChange={e => setIntroForm(p => ({ ...p, notes: e.target.value }))} />
                </div>
                <button onClick={handleLogAllergen} disabled={savingIntro || !introForm.allergen} className="btn-primary w-full disabled:opacity-50">
                  {savingIntro ? 'Saving...' : 'Log introduction'}
                </button>
              </div>

              {/* Introduction history */}
              {allergens.length > 0 && (
                <div className="card">
                  <p className="font-semibold text-textPrimary mb-3">Introduction history</p>
                  <div className="space-y-2">
                    {allergens.map(a => {
                      const reaction = REACTIONS.find(r => r.value === a.reaction)
                      return (
                        <div key={a.id} className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className={`text-xs px-2 py-0.5 rounded-pill border font-medium flex-shrink-0 ${reaction?.color || 'bg-green-50 text-green-700 border-green-200'}`}>
                              {a.allergen}
                            </span>
                            <span className="text-xs text-textMuted">{new Date(a.introducedAt).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            {a.notes && <span className="text-xs text-textMuted truncate">· {a.notes}</span>}
                          </div>
                          <button onClick={() => handleRemoveAllergen(a.allergen)} className="text-xs text-danger hover:underline flex-shrink-0">Remove</button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Feeding log tab */}
      {activeTab === 'feeding' && (
        <div className="space-y-4">
          {!canUseFeedingLog ? (
            <div className="card text-center py-10">
              <p className="text-3xl mb-3">📓</p>
              <p className="font-semibold text-textPrimary mb-1">Family plan required</p>
              <p className="text-sm text-textMuted mb-4">Upgrade to keep a daily feeding log for your baby.</p>
              <button onClick={() => navigate('/app/settings?tab=plan')} className="btn-primary">View plans →</button>
            </div>
          ) : (
            <>
              {/* Add entry */}
              <div className="card">
                <p className="font-semibold text-textPrimary mb-3">Log a feeding</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="col-span-2">
                    <label className="label">Food</label>
                    <input className="input" placeholder="e.g. Sweet potato purée" value={feedForm.foodName} onChange={e => setFeedForm(p => ({ ...p, foodName: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Amount (g) <span className="text-textMuted font-normal">optional</span></label>
                    <input className="input" type="number" placeholder="e.g. 60" value={feedForm.portionG} onChange={e => setFeedForm(p => ({ ...p, portionG: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Texture</label>
                    <select className="input" value={feedForm.texture} onChange={e => setFeedForm(p => ({ ...p, texture: e.target.value }))}>
                      <option value="">Select texture</option>
                      {TEXTURES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="label">Reaction</label>
                  <div className="flex gap-2 flex-wrap">
                    {REACTIONS.map(r => (
                      <button key={r.value} type="button"
                        onClick={() => setFeedForm(p => ({ ...p, reaction: r.value }))}
                        className={`text-xs px-3 py-1.5 rounded-pill border font-medium transition-all ${
                          feedForm.reaction === r.value ? r.color : 'bg-surface text-textMuted border-border'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-3">
                  <label className="label">Notes <span className="text-textMuted font-normal">(optional)</span></label>
                  <input className="input" placeholder="e.g. loved it, ate the whole portion" value={feedForm.notes} onChange={e => setFeedForm(p => ({ ...p, notes: e.target.value }))} />
                </div>
                <button onClick={handleAddFeedingLog} disabled={savingFeed || !feedForm.foodName.trim()} className="btn-primary w-full disabled:opacity-50">
                  {savingFeed ? 'Saving...' : 'Log feeding'}
                </button>
              </div>

              {/* Log entries */}
              {feedingLogs.length === 0 ? (
                <div className="card text-center py-10 text-textMuted">
                  <p className="text-3xl mb-2">📓</p>
                  <p className="text-sm">No feeding entries yet — log your first one above</p>
                </div>
              ) : (
                <div className="card">
                  <p className="font-semibold text-textPrimary mb-3">Recent feedings</p>
                  <div className="space-y-2">
                    {feedingLogs.map(log => {
                      const reaction = REACTIONS.find(r => r.value === log.reaction)
                      return (
                        <div key={log.id} className="flex items-start justify-between gap-3 py-2.5 border-b border-border last:border-0">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <p className="text-sm font-medium text-textPrimary">{log.foodName}</p>
                              {reaction && (
                                <span className={`text-xs px-2 py-0.5 rounded-pill border font-medium ${reaction.color}`}>
                                  {reaction.label}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-textMuted flex-wrap">
                              <span>{new Date(log.loggedAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                              {log.portionG && <span>· {log.portionG}g</span>}
                              {log.texture && <span>· {log.texture}</span>}
                              {log.notes && <span>· {log.notes}</span>}
                            </div>
                          </div>
                          <button onClick={() => handleDeleteFeedingLog(log.id)} className="text-xs text-danger hover:underline flex-shrink-0 mt-0.5">Remove</button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Recipes tab */}
      {activeTab === 'recipes' && (
        <div className="space-y-4">
          {!canUseRecipeGenerator ? (
            <div className="card text-center py-10">
              <p className="text-3xl mb-3">🫧</p>
              <p className="font-semibold text-textPrimary mb-1">Premium plan required</p>
              <p className="text-sm text-textMuted mb-4">Upgrade to generate AI baby-safe recipes tailored to your baby's exact stage and pantry.</p>
              <button onClick={() => navigate('/app/settings?tab=plan')} className="btn-primary">View plans →</button>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-2 p-3 bg-pink-50 border border-pink-100 rounded-card">
                <span className="text-lg flex-shrink-0">🍼</span>
                <p className="text-xs text-pink-700 leading-relaxed">
                  Recipes are generated for <strong>Stage {profile.stage} ({profile.label})</strong> using what's in your pantry. All recipes follow Health Canada safety guidelines — no honey, no choking hazards, no added salt.
                </p>
              </div>

              {/* Meal type selector */}
              <div className="card">
                <p className="font-semibold text-textPrimary mb-3">🫧 Generate a baby-safe recipe</p>
                <div className="mb-4">
                  <label className="label">Meal type</label>
                  <div className="flex flex-wrap gap-2">
                    {['any', 'breakfast', 'lunch', 'dinner', 'snack'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setRecipeMealType(type)}
                        className={`text-xs px-3 py-1.5 rounded-pill border font-medium transition-all capitalize ${
                          recipeMealType === type
                            ? 'bg-primary text-white border-primary'
                            : 'bg-surface text-textMuted border-border hover:border-primary hover:text-primary'
                        }`}
                      >
                        {type === 'any' ? 'Any meal' : type}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleGenerateRecipe}
                  disabled={generatingRecipe}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {generatingRecipe ? (
                    <span className="flex items-center justify-center gap-2">
                      <Icon name="refresh" size={16} className="animate-spin" />
                      Generating safe recipe...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Icon name="sparkles" size={16} />
                      Generate recipe
                    </span>
                  )}
                </button>
              </div>

              {/* Generated recipe */}
              {recipe && (
                <div className="card">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{recipe.icon}</span>
                    <div>
                      <h3 className="font-bold text-textPrimary">{recipe.name}</h3>
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        <span className="text-xs bg-pink-50 text-pink-600 border border-pink-100 px-2 py-0.5 rounded-pill font-medium">Stage {recipe.stage}</span>
                        <span className="text-xs text-textMuted">⏱ {recipe.time}</span>
                        <span className="text-xs text-textMuted">👶 {recipe.ageRange}</span>
                        <span className="text-xs text-textMuted">🥄 {recipe.texture}</span>
                        {recipe.freezable && <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-pill font-medium">❄️ Freezable</span>}
                      </div>
                    </div>
                  </div>

                  {/* Health note */}
                  {recipe.healthNote && (
                    <div className="bg-green-50 border border-green-100 rounded-card px-3 py-2 mb-4">
                      <p className="text-xs font-semibold text-green-700 mb-0.5">💚 Nutrition note</p>
                      <p className="text-xs text-green-700">{recipe.healthNote}</p>
                    </div>
                  )}

                  {/* Safety note */}
                  {recipe.safetyNote && (
                    <div className="bg-yellow-50 border border-yellow-100 rounded-card px-3 py-2 mb-4">
                      <p className="text-xs font-semibold text-yellow-700 mb-0.5">⚠️ Safety reminder</p>
                      <p className="text-xs text-yellow-700">{recipe.safetyNote}</p>
                    </div>
                  )}

                  {/* Ingredients */}
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-textPrimary mb-2">Ingredients <span className="text-textMuted font-normal text-xs">({recipe.portions})</span></p>
                    <div className="space-y-1.5">
                      {recipe.ingredients?.map((ing, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                          <span className="text-textPrimary font-medium">{ing.amount} {ing.name}</span>
                          {ing.prep && <span className="text-textMuted">— {ing.prep}</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Steps */}
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-textPrimary mb-2">Instructions</p>
                    <div className="space-y-2">
                      {recipe.steps?.map((step, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-xs">
                          <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                          <p className="text-textMuted leading-relaxed">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Freezing tip */}
                  {recipe.freezingTip && (
                    <div className="bg-blue-50 border border-blue-100 rounded-card px-3 py-2">
                      <p className="text-xs font-semibold text-blue-700 mb-0.5">❄️ Freeze & reheat</p>
                      <p className="text-xs text-blue-700">{recipe.freezingTip}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  )
}