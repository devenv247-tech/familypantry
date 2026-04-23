import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import { getMembers, addMember, updateMember, deleteMember } from '../api/family'

const GOALS = ['Lose weight', 'Gain muscle', 'Maintain weight', 'Healthy growth', 'Manage diabetes', 'Heart healthy', 'High protein']
const DIETARY = ['None', 'Vegetarian', 'Vegan', 'Gluten free', 'Dairy free', 'Halal', 'Kosher', 'Keto']
const PLANS = [
  { name: 'Free', price: '$0', features: 'Unlimited members · 5 recipes/week' },
  { name: 'Family', price: '$7/mo', features: 'Unlimited recipes · expense reports · recall alerts' },
  { name: 'Premium', price: '$15/mo', features: 'Everything + multiple families + price comparison' },
]

export default function Settings() {
  const { user, family, logout } = useAuthStore()
  const navigate = useNavigate()
  const [members, setMembers] = useState([])
  const [activeTab, setActiveTab] = useState('members')
  const [editingId, setEditingId] = useState(null)
  const [showAddMember, setShowAddMember] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [newMember, setNewMember] = useState({ name: '', age: '', weight: '', height: '', goals: 'Maintain weight', dietary: 'None' })

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
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteMember = async (id) => {
    try {
      await deleteMember(id)
      setMembers(prev => prev.filter(m => m.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddMember = async (e) => {
    e.preventDefault()
    if (!newMember.name.trim()) return
    try {
      const member = await addMember(newMember)
      setMembers(prev => [...prev, member])
      setNewMember({ name: '', age: '', weight: '', height: '', goals: 'Maintain weight', dietary: 'None' })
      setShowAddMember(false)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-textPrimary">Settings</h1>
        <p className="text-textMuted mt-1">Manage your family account and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-card mb-8 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-btn text-sm font-medium transition-all ${
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

          {/* Add member form */}
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
                </div>
                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => setShowAddMember(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary">Add member</button>
                </div>
              </form>
            </div>
          )}

          {/* Members list */}
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
                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-xs bg-green-50 text-success px-2.5 py-1 rounded-pill border border-green-100 font-medium">
                            Goal: {member.goals || '—'}
                          </span>
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
              <input className="input" defaultValue={family?.name || ''} />
            </div>
            <div>
              <label className="label">Your name</label>
              <input className="input" defaultValue={user?.name || ''} />
            </div>
            <div>
              <label className="label">Email address</label>
              <input className="input" type="email" defaultValue={user?.email || ''} />
            </div>
            <div>
              <label className="label">New password</label>
              <input className="input" type="password" placeholder="Leave blank to keep current" />
            </div>
            <div className="flex gap-3 pt-2">
              <button className="btn-primary">Save changes</button>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-border">
            <h3 className="font-semibold text-danger mb-2">Danger zone</h3>
            <p className="text-sm text-textMuted mb-4">Deleting your account is permanent and cannot be undone.</p>
            <button className="text-sm text-danger border border-danger/30 px-4 py-2 rounded-btn hover:bg-red-50 transition-all">
              Delete family account
            </button>
          </div>
        </div>
      )}

      {/* Plan tab */}
      {activeTab === 'plan' && (
        <div>
          <h2 className="font-semibold text-textPrimary mb-6">Current plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {PLANS.map((plan, i) => (
              <div key={i} className={`card border-2 transition-all ${plan.name === 'Family' ? 'border-primary' : 'border-border'}`}>
                {plan.name === 'Family' && (
                  <span className="inline-block bg-blue-50 text-primary text-xs font-semibold px-3 py-1 rounded-pill mb-3 border border-blue-100">
                    Current plan
                  </span>
                )}
                <p className="font-bold text-textPrimary text-lg">{plan.name}</p>
                <p className="text-2xl font-bold text-textPrimary my-2">{plan.price}</p>
                <p className="text-xs text-textMuted mb-4">{plan.features}</p>
                <button className={plan.name === 'Family' ? 'btn-secondary w-full text-sm' : 'btn-primary w-full text-sm'}>
                  {plan.name === 'Family' ? 'Current plan' : `Switch to ${plan.name}`}
                </button>
              </div>
            ))}
          </div>
          <div className="card max-w-lg">
            <h3 className="font-semibold text-textPrimary mb-4">Billing history</h3>
            {[
              { date: 'Apr 1, 2026', amount: '$7.00', status: 'Paid' },
              { date: 'Mar 1, 2026', amount: '$7.00', status: 'Paid' },
              { date: 'Feb 1, 2026', amount: '$7.00', status: 'Paid' },
            ].map((b, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <p className="text-sm text-textPrimary">{b.date}</p>
                <div className="flex items-center gap-3">
                  <span className="text-xs bg-green-50 text-success px-2.5 py-1 rounded-pill font-medium">{b.status}</span>
                  <span className="text-sm font-semibold text-textPrimary">{b.amount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notifications tab */}
      {activeTab === 'notifications' && (
        <div className="card max-w-lg">
          <h2 className="font-semibold text-textPrimary mb-6">Notification preferences</h2>
          <div className="space-y-5">
            {[
              { label: 'Food recall alerts', sub: 'Get notified when a recalled item matches your pantry', on: true },
              { label: 'Expiry reminders', sub: 'Alert when pantry items are about to expire', on: true },
              { label: 'Weekly grocery list', sub: 'Auto-generated list every Friday morning', on: true },
              { label: 'Monthly spend report', sub: 'Summary of your grocery spending each month', on: false },
              { label: 'Recipe suggestions', sub: 'Daily meal ideas based on your pantry', on: false },
            ].map((n, i) => (
              <div key={i} className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-textPrimary">{n.label}</p>
                  <p className="text-xs text-textMuted mt-0.5">{n.sub}</p>
                </div>
                <ToggleSwitch defaultOn={n.on} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sign out */}
      <div className="mt-8">
        <button
          onClick={() => { logout(); navigate('/') }}
          className="text-sm text-danger hover:underline font-medium"
        >
          Sign out of FamilyPantry
        </button>
      </div>

    </div>
  )
}

function ToggleSwitch({ defaultOn }) {
  const [on, setOn] = useState(defaultOn)
  return (
    <button
      onClick={() => setOn(!on)}
      className={`relative w-11 h-6 rounded-pill transition-all flex-shrink-0 ${on ? 'bg-primary' : 'bg-gray-200'}`}
    >
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${on ? 'left-5' : 'left-0.5'}`} />
    </button>
  )
}