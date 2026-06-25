import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getMembers, addMember, updateMember, deleteMember, inviteMember, updateRestockThreshold, updateDigestPreference } from '../api/family'
import { logGrowth } from '../api/baby'
import { deleteAccount, updateAccount, exportMyData } from '../api/auth'
import { useToast } from '../hooks/useToast'
import { Toast } from '../components/ui/PageState'
import { createCheckoutSession, createPortalSession, getSubscription } from '../api/stripe'
import { useAppConfigStore } from '../store/appConfigStore'
import Icon from '../components/ui/Icon'

const GOALS = [
  'Lose weight', 'Gain muscle', 'Maintain weight', 'Healthy growth',
  'High protein', 'Low carb', 'Heart healthy', 'Manage diabetes',
  'Manage cholesterol', 'Manage blood pressure', 'Improve gut health',
  'Boost energy', 'Anti-inflammatory', 'Build endurance',
  'Postpartum recovery', 'Healthy aging',
]

const DIETARY = [
  'Vegetarian', 'Vegan', 'Gluten free', 'Dairy free', 'Halal', 'Kosher',
  'Keto', 'Paleo', 'Low sodium', 'Low sugar', 'Low fat', 'High fiber',
  'Nut free', 'Egg free', 'Soy free', 'Shellfish free', 'Raw food',
  'Whole food plant based', 'Mediterranean', 'Intermittent fasting',
]

const ALLERGENS = [
  'Peanuts', 'Tree nuts', 'Sesame seeds', 'Milk', 'Eggs',
  'Fish', 'Shellfish', 'Soy', 'Wheat/Gluten', 'Mustard',
  'Sulphites', 'Celery', 'Lupin', 'Molluscs',
]

const formatHeight = (raw) => {
  if (!raw) return ''
  if (raw.length === 1) return `${raw}'0"`
  if (raw.length === 2) return `${raw[0]}'${raw[1]}"`
  return `${raw[0]}'${raw.slice(1, 3)}"`
}

const getBabyAgeMonths = (birthDate) => {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  const now = new Date()
  return (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
}

const getBabyStageLabel = (months) => {
  if (months === null) return null
  if (months < 6)  return { stage: 0, label: 'Breast milk / formula only', color: 'bg-gray-100 text-gray-600 border-gray-200' }
  if (months < 7)  return { stage: 1, label: 'Stage 1 — first purées',      color: 'bg-pink-50 text-pink-600 border-pink-200' }
  if (months < 9)  return { stage: 2, label: 'Stage 2 — mashed textures',   color: 'bg-orange-50 text-orange-600 border-orange-200' }
  if (months < 12) return { stage: 3, label: 'Stage 3 — soft finger foods', color: 'bg-yellow-50 text-yellow-600 border-yellow-200' }
  if (months < 18) return { stage: 4, label: 'Stage 4 — family foods',      color: 'bg-green-50 text-green-600 border-green-200' }
  if (months < 36) return { stage: 5, label: 'Stage 5 — toddler foods',     color: 'bg-blue-50 text-blue-600 border-blue-200' }
  return { stage: 5, label: 'Toddler (36+ months)', color: 'bg-blue-50 text-blue-600 border-blue-200' }
}

// ─── Pill toggle button ───────────────────────────────────────────────────────
function PillButton({ selected, onClick, children, variant = 'primary' }) {
  const colors = {
    primary: selected ? 'bg-primary text-white border-primary' : 'bg-surface text-textMuted border-border hover:border-primary hover:text-primary',
    green:   selected ? 'bg-green-500 text-white border-green-500' : 'bg-surface text-textMuted border-border hover:border-green-400 hover:text-green-600',
    red:     selected ? 'bg-danger text-white border-danger' : 'bg-surface text-textMuted border-border hover:border-danger hover:text-danger',
  }
  return (
    <button type="button" onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-pill border font-medium transition-all ${colors[variant]}`}>
      {children}
    </button>
  )
}

// ─── Toggle switch ────────────────────────────────────────────────────────────
function ToggleSwitch({ on, onChange }) {
  return (
    <div
      onClick={() => onChange(!on)}
      style={{
        borderRadius: '9999px',
        width: '44px',
        height: '24px',
        flexShrink: 0,
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.2s',
        background: on ? '#2563eb' : '#d1d5db',
        display: 'inline-block',
      }}
    >
      <div style={{
        position: 'absolute',
        top: '2px',
        width: '20px',
        height: '20px',
        background: '#fff',
        borderRadius: '50%',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        transition: 'left 0.2s',
        left: on ? '22px' : '2px',
      }} />
    </div>
  )
}
// ─── Section header ───────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return <p className="text-xs font-semibold text-textMuted uppercase tracking-wide mb-2">{children}</p>
}

export default function Settings() {
  const { user, family, logout, setAuth, token } = useAuthStore()
  const { isFeatureEnabled } = useAppConfigStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { toast, showToast, hideToast } = useToast()

  // ── Flags ──────────────────────────────────────────────────────────────────
  const [flags, setFlags] = useState([])
  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/app/config/public`)
      .then(r => setFlags(r.data.flags || []))
      .catch(() => setFlags([]))
  }, [])

  const buildPlanFeatures = (planKey) => {
    const base = {
      free:    ['Pantry tracking', 'Barcode scanner', 'Manual grocery list', 'Basic spending reports', 'Manual meal planner', '5 AI recipes per week', 'Up to 5 family members', 'Weekly pantry digest email'],
      family:  ['Everything in Free', 'Expiry alerts + recipe ideas in digest'],
      premium: ['Everything in Family', 'Full weekly digest — meal plan + nutrition tips'],
    }
    const fromFlags = flags
      .filter(f => f.requiredPlan === planKey)
      .map(f => {
        if (!f.description) return f.name
        if (f.description.startsWith('{')) return 'AI recipe generation'
        return f.description
      })
    return [...(base[planKey] || []), ...fromFlags]
  }

  const PLANS = [
    { name: 'Free',    price: '$0',        period: 'forever',  features: buildPlanFeatures('free'),    highlight: false },
    { name: 'Family',  price: '$9.99',     period: '/month',   features: buildPlanFeatures('family'),  highlight: true  },
    { name: 'Premium', price: '$17.99',    period: '/month',   features: buildPlanFeatures('premium'), highlight: false },
  ]

  // ── Tabs ───────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('members')

  const TABS = [
    { id: 'members',       label: 'Family',        icon: 'family'   },
    { id: 'account',       label: 'Account',       icon: 'settings' },
    { id: 'plan',          label: 'Plan',          icon: 'crown'    },
    { id: 'notifications', label: 'Notifications', icon: 'bell'     },
  ]

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab) setActiveTab(tab)
  }, [])

  // ── Members ────────────────────────────────────────────────────────────────
  const [members, setMembers] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [showAddMember, setShowAddMember] = useState(false)
  const [editForm, setEditForm] = useState({})

  const EMPTY_MEMBER = {
    name: '', age: '', weight: '', weightUnit: 'kg', height: '',
    goals: [], dietary: [], allergens: '',
    isBaby: false, birthDate: '', babyHeight: '', babyWeightUnit: 'kg', babyHeightUnit: 'cm',
  }
  const [newMember, setNewMember] = useState(EMPTY_MEMBER)

  useEffect(() => { fetchMembers() }, [])

  const fetchMembers = async () => {
    try { setMembers(await getMembers()) } catch (err) { console.error(err) }
  }

  const startEdit = (member) => {
    setEditingId(member.id)
    setEditForm({
      ...member,
      goals:      member.goals   ? member.goals.split(',').map(g => g.trim()).filter(Boolean)   : [],
      dietary:    member.dietary ? member.dietary.split(',').map(d => d.trim()).filter(Boolean)  : [],
      weightUnit: member.weightUnit || 'kg',
    })
  }

  const saveEdit = async () => {
    try {
      const updated = await updateMember(editingId, {
        ...editForm,
        goals:   Array.isArray(editForm.goals)   ? editForm.goals.join(', ')   : editForm.goals,
        dietary: Array.isArray(editForm.dietary) ? editForm.dietary.join(', ') : editForm.dietary,
      })
      setMembers(prev => prev.map(m => m.id === editingId ? updated : m))
      setEditingId(null)
      showToast('Member updated!')
    } catch { showToast('Failed to update member', 'error') }
  }

  const handleDeleteMember = async (id) => {
    try {
      await deleteMember(id)
      setMembers(prev => prev.filter(m => m.id !== id))
      showToast('Member removed')
    } catch { showToast('Failed to remove member', 'error') }
  }

  const handleAddMember = async (e) => {
    e.preventDefault()
    if (!newMember.name.trim()) return
    if (newMember.isBaby && !newMember.birthDate) return showToast('Date of birth is required', 'error')
    if (newMember.isBaby && !newMember.weight)    return showToast('Weight is required', 'error')
    if (newMember.isBaby && !newMember.babyHeight) return showToast('Height is required', 'error')
    try {
      const member = await addMember({
        ...newMember,
        goals:     newMember.goals.join(', '),
        dietary:   newMember.dietary.join(', '),
        birthDate: newMember.isBaby && newMember.birthDate ? newMember.birthDate : undefined,
      })

      // Auto-log first growth entry
      if (newMember.isBaby && newMember.weight && newMember.babyHeight) {
        try {
          await logGrowth(member.id, {
            weight:     parseFloat(newMember.weight),
            height:     parseFloat(newMember.babyHeight),
            weightUnit: newMember.babyWeightUnit || 'kg',
            heightUnit: newMember.babyHeightUnit || 'cm',
            note:       'Initial measurement',
          })
        } catch (err) { console.error('Failed to log initial growth:', err) }
      }

      setMembers(prev => [...prev, member])
      setNewMember(EMPTY_MEMBER)
      setShowAddMember(false)
      showToast('Member added!')
    } catch { showToast('Failed to add member', 'error') }
  }

  // ── Invite ─────────────────────────────────────────────────────────────────
  const [inviteModal, setInviteModal] = useState(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteSending, setInviteSending] = useState(false)

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    setInviteSending(true)
    try {
      await inviteMember(inviteModal.id, inviteEmail)
      setMembers(prev => prev.map(m => m.id === inviteModal.id ? { ...m, email: inviteEmail } : m))
      setInviteModal(null)
      setInviteEmail('')
      showToast('Invite sent!')
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to send invite', 'error')
    } finally { setInviteSending(false) }
  }

  // ── Account ────────────────────────────────────────────────────────────────
  const [accountForm, setAccountForm] = useState({
    name: user?.name || '', email: user?.email || '',
    familyName: family?.name || '', password: '', confirmPassword: '',
  })
  const [savingAccount, setSavingAccount] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [restockThreshold, setRestockThreshold] = useState(family?.restockThresholdPercent ?? 20)
  const [savingThreshold, setSavingThreshold] = useState(false)

  const handleUpdateAccount = async () => {
    if (accountForm.password && accountForm.password !== accountForm.confirmPassword)
      return showToast('Passwords do not match', 'error')
    if (accountForm.password && accountForm.password.length < 6)
      return showToast('Password must be at least 6 characters', 'error')
    setSavingAccount(true)
    try {
      const updateData = {}
      if (accountForm.name !== user?.name)           updateData.name       = accountForm.name
      if (accountForm.email !== user?.email)         updateData.email      = accountForm.email
      if (accountForm.familyName !== family?.name)   updateData.familyName = accountForm.familyName
      if (accountForm.password)                      updateData.password   = accountForm.password
      if (Object.keys(updateData).length === 0) { showToast('No changes to save'); setSavingAccount(false); return }
      const res = await updateAccount(updateData)
      setAuth(token, res.user, res.family || family)
      setAccountForm(prev => ({ ...prev, password: '', confirmPassword: '' }))
      showToast('Account updated!')
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update account', 'error')
    } finally { setSavingAccount(false) }
  }

  const handleSaveThreshold = async () => {
    setSavingThreshold(true)
    try {
      await updateRestockThreshold(restockThreshold)
      setAuth(token, user, { ...family, restockThresholdPercent: restockThreshold })
      showToast('Threshold saved!')
    } catch { showToast('Failed to save threshold', 'error') }
    finally { setSavingThreshold(false) }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return
    setDeleting(true)
    try { await deleteAccount(); logout(); navigate('/') }
    catch { showToast('Failed to delete account', 'error'); setDeleting(false) }
  }

  const [exporting, setExporting] = useState(false)
  const handleExportData = async () => {
    setExporting(true)
    try {
      await exportMyData()
      showToast('Your data export has been downloaded!')
    } catch {
      showToast('Failed to export data', 'error')
    } finally {
      setExporting(false)
    }
  }

  // ── Plan ───────────────────────────────────────────────────────────────────
  const [subscription, setSubscription] = useState(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)
  const [upgradingPlan, setUpgradingPlan] = useState('')

  useEffect(() => {
    if (activeTab === 'plan') fetchSubscription()
  }, [activeTab])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === 'true') {
      showToast('🎉 Subscription activated!')
      setActiveTab('plan')
      fetchSubscription()
      window.history.replaceState({}, '', '/app/settings')
    }
    if (params.get('cancelled') === 'true') {
      showToast('Checkout cancelled.', 'error')
      setActiveTab('plan')
      window.history.replaceState({}, '', '/app/settings')
    }
  }, [])

  const fetchSubscription = async () => {
    setSubscriptionLoading(true)
    try {
      const data = await getSubscription()
      setSubscription(data)
      if (data?.plan && data.plan !== family?.plan)
        setAuth(token, user, { ...family, plan: data.plan })
    } catch (err) { console.error(err) }
    finally { setSubscriptionLoading(false) }
  }

  const handleUpgrade = async (plan) => {
    setUpgradingPlan(plan)
    try {
      const { url } = await createCheckoutSession(plan.toLowerCase())
      window.location.href = url
    } catch { showToast('Failed to start checkout.', 'error'); setUpgradingPlan('') }
  }

  const handleManageBilling = async () => {
    try { const { url } = await createPortalSession(); window.location.href = url }
    catch { showToast('Failed to open billing portal.', 'error') }
  }

  // ── Notifications ──────────────────────────────────────────────────────────
  const [notifPrefs, setNotifPrefs] = useState({
    recalls: true, expiry: true, grocery: true, monthly: false, recipes: false,
  })
  const [digestEnabled, setDigestEnabled] = useState(family?.digestEnabled ?? true)
  const [savingDigest, setSavingDigest] = useState(false)

  const handleDigestToggle = async (val) => {
    setDigestEnabled(val)
    setSavingDigest(true)
    try {
      await updateDigestPreference(val)
      showToast(val ? 'Weekly digest enabled' : 'Weekly digest disabled')
    } catch {
      setDigestEnabled(!val) // revert on error
      showToast('Failed to update preference', 'error')
    } finally {
      setSavingDigest(false)
    }
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const currentPlan = family?.plan || 'free'
  const currentPlanName = currentPlan === 'premium' ? 'Premium' : currentPlan === 'family' ? 'Family' : 'Free'

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-textPrimary">Settings</h1>
        <p className="text-textMuted mt-1 text-sm">Manage your family account and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-card mb-8 overflow-x-auto scrollbar-hide">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-btn text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'bg-surface text-textPrimary shadow-card' : 'text-textMuted hover:text-textPrimary'
            }`}>
            <Icon name={tab.icon} size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── MEMBERS TAB ───────────────────────────────────────────────────── */}
      {activeTab === 'members' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-textPrimary">Family members</h2>
              <p className="text-xs text-textMuted mt-0.5">{members.length} member{members.length !== 1 ? 's' : ''} in your family</p>
            </div>
            <button onClick={() => setShowAddMember(true)} className="btn-primary flex items-center gap-2 text-sm">
              <Icon name="add" size={15} />
              Add member
            </button>
          </div>

          {/* Add member form */}
          {showAddMember && (
            <div className="card mb-6 border-2 border-primary">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-semibold text-textPrimary">New family member</h3>
                  <p className="text-xs text-textMuted mt-0.5">Fill in the details below</p>
                </div>
                <button onClick={() => { setShowAddMember(false); setNewMember(EMPTY_MEMBER) }}
                  className="w-7 h-7 flex items-center justify-center rounded-btn hover:bg-gray-100 text-textMuted">
                  <Icon name="close" size={16} />
                </button>
              </div>
              <form onSubmit={handleAddMember}>

                {/* Baby toggle */}
                <button
                  type="button"
                  onClick={() => setNewMember(p => ({ ...EMPTY_MEMBER, isBaby: !p.isBaby }))}
                  className={`w-full flex items-center gap-3 mb-5 p-3 rounded-card border transition-all text-left ${newMember.isBaby ? 'bg-pink-50 border-pink-200' : 'bg-gray-50 border-border hover:border-gray-300'}`}
                >
                  <div className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${newMember.isBaby ? 'bg-pink-400' : 'bg-gray-300'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200 ${newMember.isBaby ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-textPrimary">This is a baby or toddler 🍼</p>
                    <p className="text-xs text-textMuted">Enables stage tracking, allergen scheduler, and growth monitoring</p>
                  </div>
                </button>

                {/* Core fields */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
                  <div className={newMember.isBaby ? 'col-span-2 md:col-span-3' : ''}>
                    <label className="label">Name <span className="text-danger">*</span></label>
                    <input className="input" placeholder="e.g. Emma"
                      value={newMember.name} onChange={e => setNewMember(p => ({ ...p, name: e.target.value }))} />
                  </div>

                  {newMember.isBaby ? (
                    <>
                      <div>
                        <label className="label">Date of birth <span className="text-danger">*</span></label>
                        <input className="input" type="date"
                          max={new Date().toISOString().split('T')[0]}
                          value={newMember.birthDate}
                          onChange={e => setNewMember(p => ({ ...p, birthDate: e.target.value }))} />
                      </div>
                      <div>
                        <label className="label">Weight <span className="text-danger">*</span></label>
                        <div className="flex gap-2">
                          <input className="input flex-1" type="number" step="0.1" min="0" max="60"
                            placeholder={newMember.babyWeightUnit === 'lbs' ? 'e.g. 16.5' : 'e.g. 7.5'}
                            value={newMember.weight}
                            onChange={e => setNewMember(p => ({ ...p, weight: e.target.value }))} />
                          <select className="input w-20" value={newMember.babyWeightUnit}
                            onChange={e => setNewMember(p => ({ ...p, babyWeightUnit: e.target.value }))}>
                            <option value="kg">kg</option>
                            <option value="lbs">lbs</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="label">Height <span className="text-danger">*</span></label>
                        <div className="flex gap-2">
                          <input className="input flex-1" type="number" step="0.1" min="0" max="150"
                            placeholder={newMember.babyHeightUnit === 'in' ? 'e.g. 27' : 'e.g. 68.5'}
                            value={newMember.babyHeight}
                            onChange={e => setNewMember(p => ({ ...p, babyHeight: e.target.value }))} />
                          <select className="input w-20" value={newMember.babyHeightUnit}
                            onChange={e => setNewMember(p => ({ ...p, babyHeightUnit: e.target.value }))}>
                            <option value="cm">cm</option>
                            <option value="in">in</option>
                          </select>
                        </div>
                        <p className="text-xs text-textMuted mt-1">Tracked against WHO standards</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="label">Age</label>
                        <input className="input" type="number" placeholder="e.g. 32"
                          value={newMember.age} onChange={e => setNewMember(p => ({ ...p, age: e.target.value }))} />
                      </div>
                      <div>
                        <label className="label">Weight</label>
                        <div className="flex gap-2">
                          <input className="input flex-1" type="number" step="0.1" placeholder="e.g. 70"
                            value={newMember.weight} onChange={e => setNewMember(p => ({ ...p, weight: e.target.value }))} />
                          <select className="input w-20" value={newMember.weightUnit}
                            onChange={e => setNewMember(p => ({ ...p, weightUnit: e.target.value }))}>
                            <option value="kg">kg</option>
                            <option value="lbs">lbs</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="label">Height</label>
                        <input className="input" placeholder="Type 54 for 5'4&quot;"
                          value={newMember.height}
                          onChange={e => setNewMember(p => ({ ...p, height: e.target.value }))}
                          onBlur={e => {
                            const raw = e.target.value.replace(/\D/g, '')
                            if (raw && !e.target.value.includes("'"))
                              setNewMember(p => ({ ...p, height: formatHeight(raw) }))
                          }} />
                        <p className="text-xs text-textMuted mt-1">54 → auto formats to 5'4"</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Goals — non-baby only */}
                {!newMember.isBaby && (
                  <div className="mb-5">
                    <SectionLabel>Health goals</SectionLabel>
                    <div className="flex flex-wrap gap-2">
                      {GOALS.map(goal => {
                        const selected = (newMember.goals || []).includes(goal)
                        return (
                          <PillButton key={goal} selected={selected} variant="primary"
                            onClick={() => setNewMember(p => ({
                              ...p, goals: selected ? p.goals.filter(g => g !== goal) : [...(p.goals || []), goal]
                            }))}>
                            {selected ? '✓ ' : '+ '}{goal}
                          </PillButton>
                        )
                      })}
                    </div>
                    {newMember.goals.length > 0 && (
                      <p className="text-xs text-primary mt-2">Selected: {newMember.goals.join(', ')}</p>
                    )}
                  </div>
                )}

                {/* Dietary — non-baby only */}
                {!newMember.isBaby && (
                  <div className="mb-5">
                    <SectionLabel>Dietary preferences</SectionLabel>
                    <div className="flex flex-wrap gap-2">
                      {DIETARY.map(diet => {
                        const selected = (newMember.dietary || []).includes(diet)
                        return (
                          <PillButton key={diet} selected={selected} variant="green"
                            onClick={() => setNewMember(p => ({
                              ...p, dietary: selected ? p.dietary.filter(d => d !== diet) : [...(p.dietary || []), diet]
                            }))}>
                            {selected ? '✓ ' : '+ '}{diet}
                          </PillButton>
                        )
                      })}
                    </div>
                    {newMember.dietary.length > 0 && (
                      <p className="text-xs text-green-600 mt-2">Selected: {newMember.dietary.join(', ')}</p>
                    )}
                  </div>
                )}

                {/* Allergens — always shown */}
                <div className="mb-5">
                  <SectionLabel>Allergens</SectionLabel>
                  {newMember.isBaby && (
                    <p className="text-xs text-pink-600 mb-2">💡 Track introductions step by step in the baby profile after adding.</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {ALLERGENS.map(allergen => {
                      const selected = (newMember.allergens || '').split(',').map(a => a.trim()).filter(Boolean).includes(allergen)
                      return (
                        <PillButton key={allergen} selected={selected} variant="red"
                          onClick={() => {
                            const current = (newMember.allergens || '').split(',').map(a => a.trim()).filter(Boolean)
                            const updated = selected ? current.filter(a => a !== allergen) : [...current, allergen]
                            setNewMember(p => ({ ...p, allergens: updated.join(', ') }))
                          }}>
                          {selected ? '✕ ' : '+ '}{allergen}
                        </PillButton>
                      )
                    })}
                  </div>
                  {newMember.allergens && (
                    <p className="text-xs text-danger mt-2">⚠️ {newMember.allergens}</p>
                  )}
                </div>

                <div className="flex gap-3 justify-end pt-2 border-t border-border">
                  <button type="button" onClick={() => { setShowAddMember(false); setNewMember(EMPTY_MEMBER) }} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary">Add member</button>
                </div>
              </form>
            </div>
          )}

          {/* Member list */}
          {members.length === 0 ? (
            <div className="card text-center py-16 text-textMuted">
              <Icon name="family" size={36} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No members yet</p>
              <p className="text-sm mt-1">Add your first family member above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map(member => {
                const babyMonths = member.isBaby ? getBabyAgeMonths(member.birthDate) : null
                const babyStage  = babyMonths !== null ? getBabyStageLabel(babyMonths) : null
                return (
                  <div key={member.id} className="card">
                    {editingId === member.id ? (
                      /* ── Edit form ─────────────────────────────────────── */
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <p className="font-semibold text-textPrimary">Edit {member.name}</p>
                          <button onClick={() => setEditingId(null)} className="w-7 h-7 flex items-center justify-center rounded-btn hover:bg-gray-100 text-textMuted">
                            <Icon name="close" size={16} />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <label className="label">Name</label>
                            <input className="input" value={editForm.name}
                              onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
                          </div>
                          <div>
                            <label className="label">{editForm.isBaby ? 'Date of birth' : 'Age'}</label>
                            {editForm.isBaby ? (
                              <input className="input" type="date"
                                max={new Date().toISOString().split('T')[0]}
                                value={editForm.birthDate ? new Date(editForm.birthDate).toISOString().split('T')[0] : ''}
                                onChange={e => setEditForm(p => ({ ...p, birthDate: e.target.value }))} />
                            ) : (
                              <input className="input" type="number" value={editForm.age || ''}
                                onChange={e => setEditForm(p => ({ ...p, age: e.target.value }))} />
                            )}
                          </div>
                          {!editForm.isBaby && (
                            <>
                              <div>
                                <label className="label">Weight</label>
                                <div className="flex gap-2">
                                  <input className="input flex-1" type="number" step="0.1" min="0"
                                    value={editForm.weight || ''}
                                    onChange={e => setEditForm(p => ({ ...p, weight: e.target.value }))} />
                                  <select className="input w-20" value={editForm.weightUnit || 'kg'}
                                    onChange={e => setEditForm(p => ({ ...p, weightUnit: e.target.value }))}>
                                    <option value="kg">kg</option>
                                    <option value="lbs">lbs</option>
                                  </select>
                                </div>
                              </div>
                              <div>
                                <label className="label">Height</label>
                                <input className="input" placeholder="e.g. 54 → 5'4&quot;"
                                  value={editForm.height || ''}
                                  onChange={e => setEditForm(p => ({ ...p, height: e.target.value }))}
                                  onBlur={e => {
                                    const raw = e.target.value.replace(/\D/g, '')
                                    if (raw && !e.target.value.includes("'"))
                                      setEditForm(p => ({ ...p, height: formatHeight(raw) }))
                                  }} />
                                <p className="text-xs text-textMuted mt-1">Type 54 for 5'4"</p>
                              </div>
                            </>
                          )}
                        </div>

                        {!editForm.isBaby && (
                          <>
                            <div className="mb-4">
                              <SectionLabel>Health goals</SectionLabel>
                              <div className="flex flex-wrap gap-2">
                                {GOALS.map(goal => {
                                  const current = Array.isArray(editForm.goals) ? editForm.goals : (editForm.goals || '').split(',').map(g => g.trim()).filter(Boolean)
                                  const selected = current.includes(goal)
                                  return (
                                    <PillButton key={goal} selected={selected} variant="primary"
                                      onClick={() => setEditForm(p => ({ ...p, goals: selected ? current.filter(g => g !== goal) : [...current, goal] }))}>
                                      {selected ? '✓ ' : '+ '}{goal}
                                    </PillButton>
                                  )
                                })}
                              </div>
                            </div>
                            <div className="mb-4">
                              <SectionLabel>Dietary preferences</SectionLabel>
                              <div className="flex flex-wrap gap-2">
                                {DIETARY.map(diet => {
                                  const current = Array.isArray(editForm.dietary) ? editForm.dietary : (editForm.dietary || '').split(',').map(d => d.trim()).filter(Boolean)
                                  const selected = current.includes(diet)
                                  return (
                                    <PillButton key={diet} selected={selected} variant="green"
                                      onClick={() => setEditForm(p => ({ ...p, dietary: selected ? current.filter(d => d !== diet) : [...current, diet] }))}>
                                      {selected ? '✓ ' : '+ '}{diet}
                                    </PillButton>
                                  )
                                })}
                              </div>
                            </div>
                          </>
                        )}

                        <div className="mb-4">
                          <SectionLabel>Allergens</SectionLabel>
                          <div className="flex flex-wrap gap-2">
                            {ALLERGENS.map(allergen => {
                              const selected = (editForm.allergens || '').split(',').map(a => a.trim()).filter(Boolean).includes(allergen)
                              return (
                                <PillButton key={allergen} selected={selected} variant="red"
                                  onClick={() => {
                                    const current = (editForm.allergens || '').split(',').map(a => a.trim()).filter(Boolean)
                                    const updated = selected ? current.filter(a => a !== allergen) : [...current, allergen]
                                    setEditForm(p => ({ ...p, allergens: updated.join(', ') }))
                                  }}>
                                  {selected ? '✕ ' : '+ '}{allergen}
                                </PillButton>
                              )
                            })}
                          </div>
                          {editForm.allergens && <p className="text-xs text-danger mt-2">⚠️ {editForm.allergens}</p>}
                        </div>

                        <div className="flex gap-3 justify-end pt-3 border-t border-border">
                          <button onClick={() => setEditingId(null)} className="btn-secondary">Cancel</button>
                          <button onClick={saveEdit} className="btn-primary">Save changes</button>
                        </div>
                      </div>
                    ) : (
                      /* ── View card ─────────────────────────────────────── */
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        {/* Avatar */}
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ${member.isBaby ? 'bg-pink-400' : 'bg-primary'}`}>
                          {member.isBaby ? '🍼' : (member.name?.[0]?.toUpperCase() || '?')}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <p className="font-semibold text-textPrimary">{member.name}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-pill font-medium border ${
                              member.role === 'Admin' ? 'bg-blue-50 text-primary border-blue-100' : 'bg-gray-100 text-textMuted border-gray-200'
                            }`}>{member.role}</span>
                            {member.isBaby && (
                              <span className="text-xs px-2 py-0.5 rounded-pill font-medium bg-pink-50 text-pink-600 border border-pink-100">
                                🍼 Baby & Toddler
                              </span>
                            )}
                            {member.inviteAccepted && (
                              <span className="text-xs px-2 py-0.5 rounded-pill bg-green-50 text-success border border-green-100 font-medium">
                                ✓ Has login
                              </span>
                            )}
                          </div>

                          {/* Baby stage */}
                          {babyStage && (
                            <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-pill font-medium border mb-2 ${babyStage.color}`}>
                              Stage {babyStage.stage} · {babyStage.label} · {babyMonths}mo
                            </span>
                          )}

                          {/* Stats grid */}
                          {member.isBaby ? (
                            <div className="grid grid-cols-3 gap-2 mt-1">
                              {[
                                { label: 'Age',      value: babyMonths !== null ? `${babyMonths} months` : '—' },
                                { label: 'Born',     value: member.birthDate ? new Date(member.birthDate).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' }) : '—' },
                                { label: 'Allergens', value: member.allergens ? member.allergens.split(',').filter(Boolean).length + ' flagged' : 'None' },
                              ].map((item, i) => (
                                <div key={i} className="bg-gray-50 rounded-btn px-3 py-2">
                                  <p className="text-xs text-textMuted">{item.label}</p>
                                  <p className="text-sm font-medium text-textPrimary">{item.value}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1">
                              {[
                                { label: 'Age',     value: member.age    ? `${member.age} yrs`                            : '—' },
                                { label: 'Weight',  value: member.weight ? `${member.weight} ${member.weightUnit || 'kg'}` : '—' },
                                { label: 'Height',  value: member.height || '—' },
                                { label: 'Dietary', value: member.dietary || '—' },
                              ].map((item, i) => (
                                <div key={i} className="bg-gray-50 rounded-btn px-3 py-2">
                                  <p className="text-xs text-textMuted">{item.label}</p>
                                  <p className="text-sm font-medium text-textPrimary truncate">{item.value}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Tags */}
                          {!member.isBaby && member.goals && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <span className="text-xs bg-green-50 text-success px-2.5 py-1 rounded-pill border border-green-100 font-medium">
                                {member.goals.split(',')[0]?.trim()}
                                {member.goals.split(',').length > 1 && ` +${member.goals.split(',').length - 1}`}
                              </span>
                              {member.allergens && member.allergens.split(',').map(a => a.trim()).filter(Boolean).map((allergen, i) => (
                                <span key={i} className="text-xs bg-red-50 text-danger px-2.5 py-1 rounded-pill border border-red-100 font-medium">
                                  ⚠️ {allergen}
                                </span>
                              ))}
                            </div>
                          )}
                          {member.isBaby && member.allergens && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {member.allergens.split(',').map(a => a.trim()).filter(Boolean).map((allergen, i) => (
                                <span key={i} className="text-xs bg-red-50 text-danger px-2.5 py-1 rounded-pill border border-red-100 font-medium">
                                  ⚠️ {allergen}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 flex-shrink-0 flex-wrap">
                          <button onClick={() => startEdit(member)} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5">
                            <Icon name="edit" size={13} /> Edit
                          </button>
                          {member.isBaby && (
                            <button onClick={() => navigate(`/app/baby/${member.id}`)}
                              className="text-xs px-3 py-1.5 rounded-btn border border-pink-200 text-pink-600 hover:bg-pink-50 transition-all">
                              🍼 View profile
                            </button>
                          )}
                          {member.role !== 'Admin' && !member.inviteAccepted && (
                            <button onClick={() => { setInviteModal(member); setInviteEmail(member.email || '') }}
                              className="text-xs px-3 py-1.5 rounded-btn border border-border text-primary hover:bg-blue-50 transition-all">
                              {member.email ? 'Resend invite' : 'Invite to login'}
                            </button>
                          )}
                          {member.role !== 'Admin' && (
                            <button onClick={() => handleDeleteMember(member.id)}
                              className="text-xs px-3 py-1.5 rounded-btn border border-border text-danger hover:bg-red-50 transition-all flex items-center gap-1.5">
                              <Icon name="trash" size={13} /> Remove
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── INVITE MODAL ──────────────────────────────────────────────────── */}
      {inviteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center sm:p-4">
          <div className="bg-white w-full max-w-sm rounded-t-2xl sm:rounded-card shadow-xl p-6 modal-sheet">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-textPrimary">Invite {inviteModal.name}</h3>
              <button onClick={() => { setInviteModal(null); setInviteEmail('') }}
                className="w-7 h-7 flex items-center justify-center rounded-btn hover:bg-gray-100 text-textMuted">
                <Icon name="close" size={16} />
              </button>
            </div>
            <p className="text-sm text-textMuted mb-4">
              They'll receive an email to set their password and join your family account.
            </p>
            <div className="mb-4">
              <label className="label">Email address</label>
              <input className="input" type="email" placeholder="their@email.com"
                value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} autoFocus />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setInviteModal(null); setInviteEmail('') }} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleInvite} disabled={!inviteEmail.trim() || inviteSending}
                className="btn-primary flex-1 disabled:opacity-50">
                {inviteSending ? 'Sending...' : 'Send invite'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ACCOUNT TAB ───────────────────────────────────────────────────── */}
      {activeTab === 'account' && (
        <div className="space-y-6 max-w-lg">

          {/* Profile */}
          <div className="card">
            <h2 className="font-semibold text-textPrimary mb-5">Account details</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Family name</label>
                <input className="input" value={accountForm.familyName}
                  onChange={e => setAccountForm(p => ({ ...p, familyName: e.target.value }))} />
              </div>
              <div>
                <label className="label">Your name</label>
                <input className="input" value={accountForm.name}
                  onChange={e => setAccountForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className="label">Email address</label>
                <input className="input" type="email" value={accountForm.email}
                  onChange={e => setAccountForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <label className="label">New password</label>
                <input className="input" type="password" placeholder="Leave blank to keep current"
                  value={accountForm.password} onChange={e => setAccountForm(p => ({ ...p, password: e.target.value }))} />
              </div>
              <div>
                <label className="label">Confirm new password</label>
                <input className="input" type="password" placeholder="Repeat new password"
                  value={accountForm.confirmPassword} onChange={e => setAccountForm(p => ({ ...p, confirmPassword: e.target.value }))} />
              </div>
              <button onClick={handleUpdateAccount} disabled={savingAccount} className="btn-primary disabled:opacity-50">
                {savingAccount ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>

          {/* Restock threshold */}
          <div className="card">
            <h3 className="font-semibold text-textPrimary mb-1">Grocery restock threshold</h3>
            <p className="text-sm text-textMuted mb-4">
              Nooka suggests restocking when stock drops below this percentage of the usual amount.
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-textMuted">Alert me at</span>
                <span className="text-sm font-bold text-primary">{restockThreshold}% remaining</span>
              </div>
              <input type="range" min={5} max={50} step={5} value={restockThreshold}
                onChange={e => setRestockThreshold(parseInt(e.target.value))} className="w-full accent-primary" />
              <div className="flex justify-between text-xs text-textMuted">
                <span>5% — run lean</span>
                <span>50% — early warning</span>
              </div>
              <button onClick={handleSaveThreshold} disabled={savingThreshold} className="btn-primary text-sm disabled:opacity-50">
                {savingThreshold ? 'Saving...' : 'Save threshold'}
              </button>
            </div>
          </div>

          {/* Data export */}
          <div className="card">
            <h3 className="font-semibold text-textPrimary mb-1">Export your data</h3>
            <p className="text-sm text-textMuted mb-4">
              Download a copy of all personal data Nooka holds for your account — your right under PIPEDA.
            </p>
            <button
              onClick={handleExportData}
              disabled={exporting}
              className="text-sm border border-border px-4 py-2 rounded-btn hover:bg-gray-50 transition-all disabled:opacity-50 flex items-center gap-2">
              <Icon name="download" size={14} />
              {exporting ? 'Preparing export...' : 'Download my data'}
            </button>
          </div>

          {/* Danger zone */}
          <div className="card border border-red-100">
            <h3 className="font-semibold text-danger mb-1">Danger zone</h3>
            <p className="text-sm text-textMuted mb-4">
              Permanently deletes your account, all members, pantry items, and history. Cannot be undone.
            </p>
            {!showDeleteConfirm ? (
              <button onClick={() => setShowDeleteConfirm(true)}
                className="text-sm text-danger border border-danger/30 px-4 py-2 rounded-btn hover:bg-red-50 transition-all">
                Delete family account
              </button>
            ) : (
              <div className="bg-red-50 border border-red-100 rounded-card p-4">
                <p className="text-sm font-semibold text-danger mb-1">Are you absolutely sure?</p>
                <p className="text-xs text-red-600 mb-3">Type <strong>DELETE</strong> to confirm.</p>
                <input className="input mb-3 text-sm" placeholder="Type DELETE to confirm"
                  value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} />
                <div className="flex gap-3">
                  <button onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText('') }} className="btn-secondary text-sm flex-1">Cancel</button>
                  <button onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== 'DELETE' || deleting}
                    className="text-sm flex-1 py-2 px-4 rounded-btn font-medium bg-danger text-white hover:bg-red-600 disabled:opacity-40 transition-all">
                    {deleting ? 'Deleting...' : 'Permanently delete'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PLAN TAB ──────────────────────────────────────────────────────── */}
      {activeTab === 'plan' && (
        <div>
          <div className="mb-6">
            <h2 className="font-semibold text-textPrimary mb-1">Plan & billing</h2>
            <p className="text-sm text-textMuted">
              You're on the <span className="font-semibold text-textPrimary">{currentPlanName}</span> plan.
              {subscription?.subscription?.currentPeriodEnd && (
                <span> · Renews {subscription.subscription.currentPeriodEnd}</span>
              )}
              {subscription?.subscription?.cancelAtPeriodEnd && (
                <span className="text-danger"> · Cancels at period end</span>
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {PLANS.map((plan) => {
              const isCurrent = plan.name.toLowerCase() === currentPlanName.toLowerCase()
              return (
                <div key={plan.name} className={`card border-2 transition-all flex flex-col ${
                  isCurrent          ? 'border-primary'      :
                  plan.highlight     ? 'border-green-200'    :
                  plan.name === 'Premium' ? 'border-purple-200' : 'border-border'
                }`}>
                  <div className="mb-3">
                    {isCurrent && (
                      <span className="inline-block bg-blue-50 text-primary text-xs font-semibold px-3 py-1 rounded-pill border border-blue-100">
                        ✓ Current plan
                      </span>
                    )}
                    {plan.highlight && !isCurrent && (
                      <span className="inline-block bg-green-50 text-success text-xs font-semibold px-3 py-1 rounded-pill border border-green-100">
                        Most popular
                      </span>
                    )}
                    {plan.name === 'Premium' && !isCurrent && (
                      <span className="inline-block bg-purple-50 text-purple-600 text-xs font-semibold px-3 py-1 rounded-pill border border-purple-100">
                        ⭐ Most features
                      </span>
                    )}
                  </div>
                  <p className="font-bold text-textPrimary text-lg">{plan.name}</p>
                  <div className="flex items-baseline gap-1 my-2">
                    <span className="text-2xl font-bold text-textPrimary">{plan.price}</span>
                    <span className="text-xs text-textMuted">{plan.period}</span>
                  </div>
                  <ul className="space-y-1.5 mb-5 flex-1">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-textMuted">
                        <Icon name="check" size={13} className="text-success mt-0.5 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => !isCurrent && plan.name !== 'Free' && handleUpgrade(plan.name)}
                    disabled={isCurrent || plan.name === 'Free' || !!upgradingPlan}
                    className={`w-full text-sm py-2.5 rounded-btn font-medium transition-all disabled:opacity-50 ${
                      isCurrent        ? 'bg-gray-100 text-textMuted cursor-default' :
                      plan.name === 'Free'    ? 'bg-gray-100 text-textMuted cursor-default' :
                      plan.name === 'Premium' ? 'bg-purple-600 text-white hover:bg-purple-700' :
                      'btn-primary'
                    }`}>
                    {upgradingPlan === plan.name.toLowerCase() ? (
                      <span className="flex items-center justify-center gap-2">
                        <Icon name="refresh" size={14} className="animate-spin" />
                        Redirecting...
                      </span>
                    ) : isCurrent ? 'Current plan'
                      : plan.name === 'Free' ? 'Free forever'
                      : `Upgrade to ${plan.name} →`}
                  </button>
                </div>
              )
            })}
          </div>

          {subscription?.subscription && (
            <div className="card max-w-lg mb-4">
              <h3 className="font-semibold text-textPrimary mb-2">Manage subscription</h3>
              <p className="text-sm text-textMuted mb-4">
                Change payment method, download invoices, or cancel through the Stripe billing portal.
              </p>
              <button onClick={handleManageBilling} className="btn-secondary text-sm">
                Open billing portal →
              </button>
            </div>
          )}

          <div className="card max-w-lg">
            <h3 className="font-semibold text-textPrimary mb-1">Billing history</h3>
            <p className="text-xs text-textMuted mb-4">Full history available in the billing portal above.</p>
            {subscriptionLoading ? (
              <div className="flex items-center justify-center py-6">
                <Icon name="refresh" size={20} className="animate-spin text-primary" />
              </div>
            ) : subscription?.subscription ? (
              <div className="flex items-center justify-between py-3 border-b border-border">
                <p className="text-sm text-textPrimary">{currentPlanName} plan — active</p>
                <span className="text-xs bg-green-50 text-success px-2.5 py-1 rounded-pill font-medium border border-green-100">
                  {subscription.subscription.status}
                </span>
              </div>
            ) : (
              <div className="text-center py-6 text-textMuted">
                <Icon name="dollar" size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No billing history yet</p>
              </div>
            )}
          </div>

          <p className="text-xs text-textMuted mt-4 text-center">
            All prices in CAD · No hidden fees · Cancel anytime · Powered by Stripe
          </p>
        </div>
      )}

      {/* ── NOTIFICATIONS TAB ─────────────────────────────────────────────── */}
      {activeTab === 'notifications' && (
        <div className="card max-w-lg">
          <h2 className="font-semibold text-textPrimary mb-1">Notification preferences</h2>
          <p className="text-xs text-textMuted mb-6">Email notifications are coming soon.</p>
          <div className="space-y-5">
            {[
              { key: 'recalls', label: 'Food recall alerts',   sub: 'Instant alert when a recalled item matches your pantry' },
              { key: 'expiry',  label: 'Expiry reminders',     sub: 'Alert before pantry items expire' },
              { key: 'grocery', label: 'Weekly grocery list',  sub: 'Auto-generated list every Friday morning' },
              { key: 'monthly', label: 'Monthly spend report', sub: 'Summary of grocery spending each month' },
              { key: 'recipes', label: 'Recipe suggestions',   sub: 'Daily meal ideas based on your pantry' },
            ].map((n) => (
              <div key={n.key} className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-textPrimary">{n.label}</p>
                  <p className="text-xs text-textMuted mt-0.5">{n.sub}</p>
                </div>
                <ToggleSwitch on={notifPrefs[n.key]} onChange={(val) => setNotifPrefs(prev => ({ ...prev, [n.key]: val }))} />
              </div>
            ))}
          </div>
          {/* Weekly digest */}
          <div className="flex items-start justify-between gap-4 py-3 border-b border-border">
            <div>
              <p className="text-sm font-medium text-textPrimary">Weekly pantry digest</p>
              <p className="text-xs text-textMuted mt-0.5">
                Sunday email with expiring items
                {family?.plan === 'free' ? '' : ' and recipe suggestions'}
              </p>
            </div>
            <ToggleSwitch on={digestEnabled} onChange={handleDigestToggle} />
          </div>

          <button onClick={() => showToast('Preferences saved!')} className="btn-primary mt-6 w-full">
            Save preferences
          </button>
        </div>
      )}

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <div className="mt-10 pt-6 border-t border-border flex items-center justify-between">
        <p className="text-xs text-textMuted">
          Need help?{' '}
          <a href="mailto:support@nooka.ca" className="text-primary hover:underline font-medium">support@nooka.ca</a>
        </p>
        <button onClick={() => { logout(); navigate('/') }}
          className="text-sm text-danger hover:underline font-medium flex items-center gap-1.5">
          Sign out
        </button>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  )
}