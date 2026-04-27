import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import { getMembers, addMember, updateMember, deleteMember } from '../api/family'
import { deleteAccount, updateAccount } from '../api/auth'
import { useToast } from '../hooks/useToast'
import { Toast } from '../components/ui/PageState'

const GOALS = ['Lose weight', 'Gain muscle', 'Maintain weight', 'Healthy growth', 'Manage diabetes', 'Heart healthy', 'High protein']
const DIETARY = ['None', 'Vegetarian', 'Vegan', 'Gluten free', 'Dairy free', 'Halal', 'Kosher', 'Keto']
const ALLERGENS = [
  'Peanuts', 'Tree nuts', 'Sesame seeds', 'Milk', 'Eggs',
  'Fish', 'Shellfish', 'Soy', 'Wheat/Gluten', 'Mustard',
  'Sulphites', 'Celery', 'Lupin', 'Molluscs'
]
const PLANS = [
  {
    name: 'Free',
    price: '$0',
    features: ['Pantry tracking', 'Manual grocery list', 'Basic reports', 'Health Canada recalls', 'Manual meal planner', '5 recipes/week'],
  },
  {
    name: 'Family',
    price: '$7/mo',
    features: ['Everything in Free', 'Unlimited recipes', 'Smart expiry predictions', 'Meal pattern learning', 'Budget forecasting', 'Price anomaly detection', 'Seasonal recommendations', 'Smart substitutions', 'Health goal tracking', 'Costco optimizer', 'CO2 footprint tracking'],
  },
  {
    name: 'Premium',
    price: '$15/mo',
    features: ['Everything in Family', 'AI auto meal planning for whole week', 'Cuisine selector for meal plan', 'Grocery list from meal plan', 'Up to 10 family members', 'PDF export', 'Priority support'],
  },
]

export default function Settings() {
  const { user, family, logout, setAuth, token } = useAuthStore()
  const navigate = useNavigate()
  const { toast, showToast, hideToast } = useToast()
  const [members, setMembers] = useState([])
  const [activeTab, setActiveTab] = useState('members')
  const [editingId, setEditingId] = useState(null)
  const [showAddMember, setShowAddMember] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [newMember, setNewMember] = useState({ name: '', age: '', weight: '', height: '', goals: 'Maintain weight', dietary: 'None', allergens: '' })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [accountForm, setAccountForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    familyName: family?.name || '',
    password: '',
    confirmPassword: '',
  })
  const [savingAccount, setSavingAccount] = useState(false)
  const [notifPrefs, setNotifPrefs] = useState({
    recalls: true,
    expiry: true,
    grocery: true,
    monthly: false,
    recipes: false,
  })

  const TABS = [
    { id: 'members', label: 'Family members', icon: '👨‍👩‍👧‍👦' },
    { id: 'account', label: 'Account', icon: '👤' },
    { id: 'plan', label: 'Plan & billing', icon: '💳' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
  ]

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

  const startEdit = (member) => {
    setEditingId(member.id)
    setEditForm({ ...member })
  }

  const saveEdit = async () => {
    try {
      const updated = await updateMember(editingId, editForm)
      setMembers(prev => prev.map(m => m.id === editingId ? updated : m))
      setEditingId(null)
      showToast('Member updated!')
    } catch (err) {
      showToast('Failed to update member', 'error')
    }
  }

  const handleDeleteMember = async (id) => {
    try {
      await deleteMember(id)
      setMembers(prev => prev.filter(m => m.id !== id))
      showToast('Member removed')
    } catch (err) {
      showToast('Failed to remove member', 'error')
    }
  }

  const handleAddMember = async (e) => {
    e.preventDefault()
    if (!newMember.name.trim()) return
    try {
      const member = await addMember(newMember)
      setMembers(prev => [...prev, member])
      setNewMember({ name: '', age: '', weight: '', height: '', goals: 'Maintain weight', dietary: 'None', allergens: '' })
      setShowAddMember(false)
      showToast('Member added!')
    } catch (err) {
      showToast('Failed to add member', 'error')
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return
    setDeleting(true)
    try {
      await deleteAccount()
      logout()
      navigate('/')
    } catch (err) {
      showToast('Failed to delete account', 'error')
      setDeleting(false)
    }
  }

  const handleUpdateAccount = async () => {
    if (accountForm.password && accountForm.password !== accountForm.confirmPassword) {
      return showToast('Passwords do not match', 'error')
    }
    if (accountForm.password && accountForm.password.length < 6) {
      return showToast('Password must be at least 6 characters', 'error')
    }
    setSavingAccount(true)
    try {
      const updateData = {}
      if (accountForm.name !== user?.name) updateData.name = accountForm.name
      if (accountForm.email !== user?.email) updateData.email = accountForm.email
      if (accountForm.familyName !== family?.name) updateData.familyName = accountForm.familyName
      if (accountForm.password) updateData.password = accountForm.password

      if (Object.keys(updateData).length === 0) {
        showToast('No changes to save')
        setSavingAccount(false)
        return
      }

      const res = await updateAccount(updateData)
      setAuth(token, res.user, res.family || family)
      setAccountForm(prev => ({ ...prev, password: '', confirmPassword: '' }))
      showToast('Account updated successfully!')
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update account', 'error')
    } finally {
      setSavingAccount(false)
    }
  }

  const currentPlan = family?.plan || 'free'
  const currentPlanName = currentPlan === 'premium' ? 'Premium' : currentPlan === 'family' ? 'Family' : 'Free'

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-textPrimary">Settings</h1>
        <p className="text-textMuted mt-1">Manage your family account and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-card mb-8 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-btn text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-surface text-textPrimary shadow-card'
                : 'text-textMuted hover:text-textPrimary'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Members tab */}
      {activeTab === 'members' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-textPrimary">Family members ({members.length})</h2>
            <button onClick={() => setShowAddMember(true)} className="btn-primary flex items-center gap-2">
              + Add member
            </button>
          </div>

          {showAddMember && (
            <div className="card mb-6 border-2 border-primary">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-textPrimary">New family member</h3>
                <button onClick={() => setShowAddMember(false)} className="text-textMuted hover:text-textPrimary text-xl">✕</button>
              </div>
              <form onSubmit={handleAddMember}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="label">Name</label>
                    <input className="input" placeholder="e.g. Raj" value={newMember.name} onChange={e => setNewMember(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Age</label>
                    <input className="input" type="number" placeholder="e.g. 28" value={newMember.age} onChange={e => setNewMember(p => ({ ...p, age: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Weight</label>
                    <input className="input" placeholder="e.g. 70kg" value={newMember.weight} onChange={e => setNewMember(p => ({ ...p, weight: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Height</label>
                    <input className="input" placeholder="e.g. 5'8&quot;" value={newMember.height} onChange={e => setNewMember(p => ({ ...p, height: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Health goal</label>
                    <select className="input" value={newMember.goals} onChange={e => setNewMember(p => ({ ...p, goals: e.target.value }))}>
                      {GOALS.map(g => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Dietary preference</label>
                    <select className="input" value={newMember.dietary} onChange={e => setNewMember(p => ({ ...p, dietary: e.target.value }))}>
                      {DIETARY.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <label className="label">Allergens</label>
                    <div className="flex flex-wrap gap-2">
                      {ALLERGENS.map(allergen => {
                        const selected = (newMember.allergens || '').split(',').map(a => a.trim()).filter(Boolean).includes(allergen)
                        return (
                          <button key={allergen} type="button"
                            onClick={() => {
                              const current = (newMember.allergens || '').split(',').map(a => a.trim()).filter(Boolean)
                              const updated = selected ? current.filter(a => a !== allergen) : [...current, allergen]
                              setNewMember(p => ({ ...p, allergens: updated.join(', ') }))
                            }}
                            className={`text-xs px-3 py-1.5 rounded-pill border font-medium transition-all ${
                              selected ? 'bg-danger text-white border-danger' : 'bg-surface text-textMuted border-border hover:border-danger hover:text-danger'
                            }`}
                          >
                            {selected ? '✕ ' : '+ '}{allergen}
                          </button>
                        )
                      })}
                    </div>
                    {newMember.allergens && <p className="text-xs text-danger mt-2">⚠️ Allergens: {newMember.allergens}</p>}
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => setShowAddMember(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary">Add member</button>
                </div>
              </form>
            </div>
          )}

          {members.length === 0 ? (
            <div className="text-center py-12 text-textMuted">
              <div className="text-4xl mb-3">👨‍👩‍👧‍👦</div>
              <p className="font-medium">No members yet</p>
              <p className="text-sm mt-1">Add your first family member above</p>
            </div>
          ) : (
            <div className="space-y-4">
              {members.map(member => (
                <div key={member.id} className="card">
                  {editingId === member.id ? (
                    <div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="label">Name</label>
                          <input className="input" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
                        </div>
                        <div>
                          <label className="label">Age</label>
                          <input className="input" type="number" value={editForm.age || ''} onChange={e => setEditForm(p => ({ ...p, age: e.target.value }))} />
                        </div>
                        <div>
                          <label className="label">Weight</label>
                          <input className="input" value={editForm.weight || ''} onChange={e => setEditForm(p => ({ ...p, weight: e.target.value }))} />
                        </div>
                        <div>
                          <label className="label">Height</label>
                          <input className="input" value={editForm.height || ''} onChange={e => setEditForm(p => ({ ...p, height: e.target.value }))} />
                        </div>
                        <div>
                          <label className="label">Health goal</label>
                          <select className="input" value={editForm.goals || ''} onChange={e => setEditForm(p => ({ ...p, goals: e.target.value }))}>
                            {GOALS.map(g => <option key={g}>{g}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="label">Dietary preference</label>
                          <select className="input" value={editForm.dietary || ''} onChange={e => setEditForm(p => ({ ...p, dietary: e.target.value }))}>
                            {DIETARY.map(d => <option key={d}>{d}</option>)}
                          </select>
                        </div>
                        <div className="md:col-span-3">
                          <label className="label">Allergens</label>
                          <div className="flex flex-wrap gap-2">
                            {ALLERGENS.map(allergen => {
                              const selected = (editForm.allergens || '').split(',').map(a => a.trim()).filter(Boolean).includes(allergen)
                              return (
                                <button key={allergen} type="button"
                                  onClick={() => {
                                    const current = (editForm.allergens || '').split(',').map(a => a.trim()).filter(Boolean)
                                    const updated = selected ? current.filter(a => a !== allergen) : [...current, allergen]
                                    setEditForm(p => ({ ...p, allergens: updated.join(', ') }))
                                  }}
                                  className={`text-xs px-3 py-1.5 rounded-pill border font-medium transition-all ${
                                    selected ? 'bg-danger text-white border-danger' : 'bg-surface text-textMuted border-border hover:border-danger hover:text-danger'
                                  }`}
                                >
                                  {selected ? '✕ ' : '+ '}{allergen}
                                </button>
                              )
                            })}
                          </div>
                          {editForm.allergens && <p className="text-xs text-danger mt-2">⚠️ Allergens: {editForm.allergens}</p>}
                        </div>
                      </div>
                      <div className="flex gap-3 justify-end">
                        <button onClick={() => setEditingId(null)} className="btn-secondary">Cancel</button>
                        <button onClick={saveEdit} className="btn-primary">Save changes</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {member.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-textPrimary">{member.name}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-pill font-medium ${member.role === 'Admin' ? 'bg-blue-50 text-primary border border-blue-100' : 'bg-gray-100 text-textMuted'}`}>
                            {member.role}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                          {[
                            { label: 'Age', value: member.age ? `${member.age} yrs` : '—' },
                            { label: 'Weight', value: member.weight || '—' },
                            { label: 'Height', value: member.height || '—' },
                            { label: 'Dietary', value: member.dietary || '—' },
                          ].map((item, i) => (
                            <div key={i} className="bg-gray-50 rounded-btn px-3 py-2">
                              <p className="text-xs text-textMuted">{item.label}</p>
                              <p className="text-sm font-medium text-textPrimary">{item.value}</p>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="text-xs bg-green-50 text-success px-2.5 py-1 rounded-pill border border-green-100 font-medium">
                            Goal: {member.goals || '—'}
                          </span>
                          {member.allergens && member.allergens.split(',').map(a => a.trim()).filter(Boolean).map((allergen, i) => (
                            <span key={i} className="text-xs bg-red-50 text-danger px-2.5 py-1 rounded-pill border border-red-100 font-medium">
                              ⚠️ {allergen}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => startEdit(member)} className="btn-secondary text-xs px-3 py-1.5">Edit</button>
                        {member.role !== 'Admin' && (
                          <button onClick={() => handleDeleteMember(member.id)} className="text-xs px-3 py-1.5 rounded-btn border border-border text-danger hover:bg-red-50 transition-all">
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Account tab */}
      {activeTab === 'account' && (
        <div className="card max-w-lg">
          <h2 className="font-semibold text-textPrimary mb-6">Account details</h2>
          <div className="space-y-5">
            <div>
              <label className="label">Family name</label>
              <input className="input" value={accountForm.familyName} onChange={e => setAccountForm(p => ({ ...p, familyName: e.target.value }))} />
            </div>
            <div>
              <label className="label">Your name</label>
              <input className="input" value={accountForm.name} onChange={e => setAccountForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Email address</label>
              <input className="input" type="email" value={accountForm.email} onChange={e => setAccountForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label className="label">New password</label>
              <input className="input" type="password" placeholder="Leave blank to keep current" value={accountForm.password} onChange={e => setAccountForm(p => ({ ...p, password: e.target.value }))} />
            </div>
            <div>
              <label className="label">Confirm new password</label>
              <input className="input" type="password" placeholder="Repeat new password" value={accountForm.confirmPassword} onChange={e => setAccountForm(p => ({ ...p, confirmPassword: e.target.value }))} />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleUpdateAccount} disabled={savingAccount} className="btn-primary disabled:opacity-50">
                {savingAccount ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border">
            <h3 className="font-semibold text-danger mb-2">Danger zone</h3>
            <p className="text-sm text-textMuted mb-4">
              Permanently deletes your family account, all members, pantry items, grocery lists and spending history. This cannot be undone.
            </p>
            {!showDeleteConfirm ? (
              <button onClick={() => setShowDeleteConfirm(true)} className="text-sm text-danger border border-danger/30 px-4 py-2 rounded-btn hover:bg-red-50 transition-all">
                Delete family account
              </button>
            ) : (
              <div className="bg-red-50 border border-red-100 rounded-card p-4">
                <p className="text-sm font-semibold text-danger mb-1">Are you absolutely sure?</p>
                <p className="text-xs text-red-600 mb-3">Type <strong>DELETE</strong> to confirm.</p>
                <input className="input mb-3 text-sm" placeholder="Type DELETE to confirm" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} />
                <div className="flex gap-3">
                  <button onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText('') }} className="btn-secondary text-sm flex-1">Cancel</button>
                  <button onClick={handleDeleteAccount} disabled={deleteConfirmText !== 'DELETE' || deleting} className="text-sm flex-1 py-2 px-4 rounded-btn font-medium bg-danger text-white hover:bg-red-600 disabled:opacity-40 transition-all">
                    {deleting ? 'Deleting...' : 'Permanently delete everything'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Plan tab */}
      {activeTab === 'plan' && (
        <div>
          <h2 className="font-semibold text-textPrimary mb-2">Current plan</h2>
          <p className="text-sm text-textMuted mb-6">
            You are on the <span className="font-semibold text-textPrimary">{currentPlanName}</span> plan.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {PLANS.map((plan, i) => {
              const isCurrent = plan.name.toLowerCase() === currentPlanName.toLowerCase()
              return (
                <div key={i} className={`card border-2 transition-all ${isCurrent ? 'border-primary' : 'border-border'}`}>
                  {isCurrent && (
                    <span className="inline-block bg-blue-50 text-primary text-xs font-semibold px-3 py-1 rounded-pill mb-3 border border-blue-100">
                      Current plan
                    </span>
                  )}
                  {plan.name === 'Premium' && !isCurrent && (
                    <span className="inline-block bg-purple-50 text-purple-600 text-xs font-semibold px-3 py-1 rounded-pill mb-3 border border-purple-100">
                      Most features
                    </span>
                  )}
                  <p className="font-bold text-textPrimary text-lg">{plan.name}</p>
                  <p className="text-2xl font-bold text-textPrimary my-2">{plan.price}</p>
                  <ul className="space-y-1.5 mb-5">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-textMuted">
                        <span className="text-success mt-0.5 flex-shrink-0">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    className={`w-full text-sm py-2 rounded-btn font-medium transition-all ${
                      isCurrent
                        ? 'bg-gray-100 text-textMuted cursor-default'
                        : plan.name === 'Free'
                        ? 'btn-secondary'
                        : 'btn-primary'
                    }`}
                    disabled={isCurrent}
                  >
                    {isCurrent ? 'Current plan' : plan.name === 'Free' ? 'Downgrade' : `Upgrade to ${plan.name}`}
                  </button>
                </div>
              )
            })}
          </div>

          <div className="card max-w-lg">
            <h3 className="font-semibold text-textPrimary mb-1">Billing history</h3>
            <p className="text-xs text-textMuted mb-4">Stripe integration coming soon — billing history will appear here.</p>
            <div className="text-center py-6 text-textMuted">
              <p className="text-3xl mb-2">💳</p>
              <p className="text-sm">No billing history yet</p>
            </div>
          </div>
        </div>
      )}

      {/* Notifications tab */}
      {activeTab === 'notifications' && (
        <div className="card max-w-lg">
          <h2 className="font-semibold text-textPrimary mb-2">Notification preferences</h2>
          <p className="text-xs text-textMuted mb-6">Email notifications will be enabled once SendGrid is configured.</p>
          <div className="space-y-5">
            {[
              { key: 'recalls', label: 'Food recall alerts', sub: 'Get notified when a recalled item matches your pantry' },
              { key: 'expiry', label: 'Expiry reminders', sub: 'Alert when pantry items are about to expire' },
              { key: 'grocery', label: 'Weekly grocery list', sub: 'Auto-generated list every Friday morning' },
              { key: 'monthly', label: 'Monthly spend report', sub: 'Summary of your grocery spending each month' },
              { key: 'recipes', label: 'Recipe suggestions', sub: 'Daily meal ideas based on your pantry' },
            ].map((n) => (
              <div key={n.key} className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-textPrimary">{n.label}</p>
                  <p className="text-xs text-textMuted mt-0.5">{n.sub}</p>
                </div>
                <ToggleSwitch
                  on={notifPrefs[n.key]}
                  onChange={(val) => setNotifPrefs(prev => ({ ...prev, [n.key]: val }))}
                />
              </div>
            ))}
          </div>
          <button
            onClick={() => showToast('Preferences saved! Email notifications coming soon.')}
            className="btn-primary mt-6 w-full"
          >
            Save preferences
          </button>
        </div>
      )}

      {/* Sign out */}
      <div className="mt-8">
        <button onClick={() => { logout(); navigate('/') }} className="text-sm text-danger hover:underline font-medium">
          Sign out of FamilyPantry
        </button>
      </div>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

    </div>
  )
}

function ToggleSwitch({ on, onChange }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`relative w-11 h-6 rounded-pill transition-all flex-shrink-0 ${on ? 'bg-primary' : 'bg-gray-200'}`}
    >
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${on ? 'left-5' : 'left-0.5'}`} />
    </button>
  )
}