import NookaIcon from '../components/ui/NookaIcon'
import Icon from '../components/ui/Icon'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { getAdminStats, getAdminFamilies, updateFamilyPlan, deleteFamily, getFeatureFlags, updateFeatureFlag, getUsageStats, getAnnouncements, createAnnouncement, deleteAnnouncement, getApiStatus, getCacheStats, deleteCacheItem, clearExpiredCache, clearAllCache } from '../api/admin'
import { Toast } from '../components/ui/PageState'
import { useToast } from '../hooks/useToast'

const TABS = [
  { id: 'overview', label: 'Overview', icon: 'chart' },
  { id: 'families', label: 'Families', icon: 'family' },
  { id: 'features', label: 'Feature flags', icon: 'flag' },
  { id: 'announcements', label: 'Announcements', icon: 'megaphone' },
  { id: 'usage', label: 'Usage stats', icon: 'reports' },
  { id: 'costs', label: 'Costs & revenue', icon: 'dollar' },
  { id: 'cache', label: 'Nutrition cache', icon: 'database' },
]

export default function Admin() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { toast, showToast, hideToast } = useToast()
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState(null)
  const [families, setFamilies] = useState([])
  const [familiesTotal, setFamiliesTotal] = useState(0)
  const [flags, setFlags] = useState([])
  const [usage, setUsage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [deletingId, setDeletingId] = useState(null)
  const [updatingPlan, setUpdatingPlan] = useState(null)
  const [updatingFlag, setUpdatingFlag] = useState(null)
  const [announcements, setAnnouncements] = useState([])
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', message: '', icon: '🎉' })
  const [savingAnnouncement, setSavingAnnouncement] = useState(false)
  const [apiStatus, setApiStatus] = useState(null)
  const [cacheStats, setCacheStats] = useState(null)
  const [clearingCache, setClearingCache] = useState(false)

  useEffect(() => {
    // Check admin access
    if (!user) {
      navigate('/login')
      return
    }
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [statsData, familiesData, flagsData, usageData, announcementsData, apiStatusData] = await Promise.all([
        getAdminStats(),
        getAdminFamilies(),
        getFeatureFlags(),
        getUsageStats(),
        getAnnouncements(),
        getApiStatus(),
      ])
      setStats(statsData)
      setFamilies(familiesData.families || [])
      setFamiliesTotal(familiesData.total || 0)
      setFlags(flagsData)
      setUsage(usageData)
      setAnnouncements(announcementsData)
      setApiStatus(apiStatusData)
    } catch (err) {
      if (err.response?.status === 403) {
        showToast('Access denied — admin only', 'error')
        navigate('/app')
      } else {
        showToast('Failed to load admin data', 'error')
      }
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    if (activeTab === 'cache') fetchCacheStats()
  }, [activeTab])

  const fetchCacheStats = async () => {
    try {
      const data = await getCacheStats()
      setCacheStats(data)
    } catch (err) {
      showToast('Failed to load cache stats', 'error')
    }
  }

  const handleClearExpired = async () => {
    setClearingCache(true)
    try {
      const result = await clearExpiredCache()
      showToast(`Cleared ${result.deleted} expired items`)
      fetchCacheStats()
    } catch (err) {
      showToast('Failed to clear cache', 'error')
    } finally {
      setClearingCache(false)
    }
  }

  const handleClearAll = async () => {
    if (!window.confirm('Clear ALL cached nutrition data? Users will trigger new API calls.')) return
    setClearingCache(true)
    try {
      const result = await clearAllCache()
      showToast(`Cleared all ${result.deleted} cached items`)
      fetchCacheStats()
    } catch (err) {
      showToast('Failed to clear cache', 'error')
    } finally {
      setClearingCache(false)
    }
  }

  const handleDeleteCacheItem = async (id) => {
    try {
      await deleteCacheItem(id)
      setCacheStats(prev => ({
        ...prev,
        total: prev.total - 1,
        active: prev.active - 1,
        topItems: prev.topItems.filter(i => i.id !== id)
      }))
      showToast('Cache item deleted')
    } catch (err) {
      showToast('Failed to delete item', 'error')
    }
  }
  const fetchFamilies = async () => {
    try {
      const data = await getAdminFamilies({ search, plan: planFilter })
      setFamilies(data.families || [])
      setFamiliesTotal(data.total || 0)
    } catch (err) {
      showToast('Failed to load families', 'error')
    }
  }

  const handleUpdatePlan = async (familyId, plan) => {
    setUpdatingPlan(familyId)
    try {
      await updateFamilyPlan(familyId, plan)
      setFamilies(prev => prev.map(f => f.id === familyId ? { ...f, plan } : f))
      showToast(`Plan updated to ${plan}!`)
    } catch (err) {
      showToast('Failed to update plan', 'error')
    } finally {
      setUpdatingPlan(null)
    }
  }

  const handleDeleteFamily = async (id, name) => {
    if (!window.confirm(`Permanently delete "${name}" and all their data? This cannot be undone.`)) return
    setDeletingId(id)
    try {
      await deleteFamily(id)
      setFamilies(prev => prev.filter(f => f.id !== id))
      showToast('Family deleted')
    } catch (err) {
      showToast('Failed to delete family', 'error')
    } finally {
      setDeletingId(null)
    }
  }
  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.message) return
    setSavingAnnouncement(true)
    try {
      const created = await createAnnouncement(newAnnouncement)
      setAnnouncements(prev => [created, ...prev])
      setNewAnnouncement({ title: '', message: '', icon: '🎉' })
      showToast('Announcement created! Users will see it on next page load.')
    } catch (err) {
      showToast('Failed to create announcement', 'error')
    } finally {
      setSavingAnnouncement(false)
    }
  }

  const handleDeleteAnnouncement = async (id) => {
    try {
      await deleteAnnouncement(id)
      setAnnouncements(prev => prev.filter(a => a.id !== id))
      showToast('Announcement removed')
    } catch (err) {
      showToast('Failed to remove announcement', 'error')
    }
  }
  const handleUpdateFlag = async (id, data) => {
    setUpdatingFlag(id)
    try {
      const updated = await updateFeatureFlag(id, data)
      setFlags(prev => prev.map(f => f.id === id ? updated.flag : f))
      showToast('Feature flag updated!')
    } catch (err) {
      showToast('Failed to update flag', 'error')
    } finally {
      setUpdatingFlag(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🔐</div>
          <p className="text-textMuted">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Admin navbar */}
      <nav className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <NookaIcon size={32} />
          <div>
            <p className="font-semibold text-sm">Nooka Admin</p>
            <p className="text-xs text-gray-400">Signed in as {user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/app')}
          className="text-sm text-gray-300 hover:text-white transition-colors"
        >
          ← Back to app
        </button>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Tabs */}
        <div className="flex gap-1 bg-white p-1 rounded-xl border border-gray-200 mb-8 w-fit overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:text-gray-900'
                }`}
            >
              <Icon name={tab.icon} size={15} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Platform overview</h2>

            {/* API Status Alert */}
            {apiStatus && !apiStatus.anthropic.alive && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <span className="text-2xl">🚨</span>
                <div className="flex-1">
                  <p className="font-semibold text-red-800">Anthropic API is down!</p>
                  <p className="text-sm text-red-600 mt-1">{apiStatus.anthropic.error}</p>
                  {apiStatus.anthropic.lastError && (
                    <p className="text-xs text-red-500 mt-1">{apiStatus.anthropic.lastError}</p>
                  )}
                  <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-xs text-red-700 hover:underline font-medium mt-2 inline-block">
                    Top up credits at console.anthropic.com →
                  </a>
                </div>
              </div>
            )}

            {apiStatus?.anthropic.alive && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-3">
                <span className="text-green-500">✓</span>
                <p className="text-sm text-green-700 font-medium">Anthropic API is healthy</p>
                <span className="text-xs text-green-500 ml-auto">Last checked: {new Date(apiStatus.anthropic.lastChecked).toLocaleTimeString()}</span>
              </div>
            )}

            {/* Key metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total families', value: stats.families.total, icon: '👨‍👩‍👧‍👦', color: 'bg-blue-50 border-blue-100' },
                { label: 'New this week', value: stats.families.newThisWeek, icon: '✨', color: 'bg-green-50 border-green-100' },
                { label: 'New this month', value: stats.families.newThisMonth, icon: '📅', color: 'bg-purple-50 border-purple-100' },
                { label: 'Total users', value: stats.users.total, icon: '👤', color: 'bg-orange-50 border-orange-100' },
              ].map((s, i) => (
                <div key={i} className={`bg-white rounded-xl border p-5 ${s.color}`}>
                  <div className="text-2xl mb-2">{s.icon}</div>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Plan breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { plan: 'Free', count: stats.families.byPlan.free || 0, color: 'bg-gray-50 border-gray-200', badge: 'bg-gray-100 text-gray-600' },
                { plan: 'Family', count: stats.families.byPlan.family || 0, color: 'bg-blue-50 border-blue-200', badge: 'bg-blue-100 text-blue-700' },
                { plan: 'Premium', count: stats.families.byPlan.premium || 0, color: 'bg-purple-50 border-purple-200', badge: 'bg-purple-100 text-purple-700' },
              ].map((p, i) => (
                <div key={i} className={`bg-white rounded-xl border p-5 ${p.color}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${p.badge}`}>{p.plan}</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{p.count}</p>
                  <p className="text-xs text-gray-500 mt-1">families on {p.plan} plan</p>
                </div>
              ))}
            </div>

            {/* Content stats */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Platform content</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: 'Pantry items', value: stats.content.pantryItems, icon: '🧺' },
                  { label: 'Grocery items', value: stats.content.groceryItems, icon: '🛒' },
                  { label: 'Meal plans', value: stats.content.mealPlans, icon: '📅' },
                  { label: 'Saved recipes', value: stats.content.savedRecipes, icon: '📖' },
                  { label: 'Cooked meals', value: stats.content.cookedMeals, icon: '🍳' },
                  { label: 'Family members', value: stats.members.total, icon: '👥' },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3">
                    <span className="text-xl">{s.icon}</span>
                    <div>
                      <p className="font-bold text-gray-900">{s.value}</p>
                      <p className="text-xs text-gray-500">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Families tab */}
        {activeTab === 'families' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Families ({familiesTotal})</h2>
              <button onClick={fetchFamilies} className="text-sm text-gray-500 hover:text-gray-900">↻ Refresh</button>
            </div>

            {/* Search and filter */}
            <div className="flex gap-3 flex-wrap">
              <input
                className="flex-1 min-w-48 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
                placeholder="Search by family name or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchFamilies()}
              />
              <select
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
                value={planFilter}
                onChange={e => { setPlanFilter(e.target.value); fetchFamilies() }}
              >
                <option value="all">All plans</option>
                <option value="free">Free</option>
                <option value="family">Family</option>
                <option value="premium">Premium</option>
              </select>
              <button
                onClick={fetchFamilies}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-700"
              >
                Search
              </button>
            </div>

            {/* Families table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Family</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Plan</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Members</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Pantry</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Joined</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {families.map(family => (
                    <tr key={family.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{family.name}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{family.users?.[0]?.email || '—'}</td>
                      <td className="px-4 py-3">
                        <select
                          value={family.plan}
                          onChange={e => handleUpdatePlan(family.id, e.target.value)}
                          disabled={updatingPlan === family.id}
                          className={`text-xs px-2 py-1 rounded-full border font-medium focus:outline-none ${family.plan === 'premium' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                              family.plan === 'family' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                'bg-gray-100 text-gray-600 border-gray-200'
                            }`}
                        >
                          <option value="free">Free</option>
                          <option value="family">Family</option>
                          <option value="premium">Premium</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{family.members?.length || 0}</td>
                      <td className="px-4 py-3 text-gray-500">{family._count?.pantryItems || 0}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(family.createdAt).toLocaleDateString('en-CA')}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDeleteFamily(family.id, family.name)}
                          disabled={deletingId === family.id || family.users?.some(u => u.isAdmin)}
                          className="text-xs text-red-500 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          {deletingId === family.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {families.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <p>No families found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Feature flags tab */}
        {activeTab === 'features' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Feature flags</h2>
            <p className="text-sm text-gray-500">Toggle features on/off and control which plan is required to access them.</p>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Feature</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Description</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Required plan</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {flags.map(flag => (
                    <tr key={flag.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900 font-mono text-xs">{flag.name}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{flag.description || '—'}</td>
                      <td className="px-4 py-3">
                        <select
                          value={flag.requiredPlan}
                          onChange={e => handleUpdateFlag(flag.id, { requiredPlan: e.target.value })}
                          disabled={updatingFlag === flag.id}
                          className={`text-xs px-2 py-1 rounded-full border font-medium focus:outline-none ${flag.requiredPlan === 'premium' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                              flag.requiredPlan === 'family' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                'bg-gray-100 text-gray-600 border-gray-200'
                            }`}
                        >
                          <option value="free">Free</option>
                          <option value="family">Family</option>
                          <option value="premium">Premium</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                       <button
                          onClick={() => handleUpdateFlag(flag.id, { enabled: !flag.enabled })}
                          disabled={updatingFlag === flag.id}
                          style={{
                            position: 'relative',
                            display: 'inline-block',
                            width: '44px',
                            height: '24px',
                            minWidth: '44px',
                            borderRadius: '12px',
                            border: 'none',
                            cursor: 'pointer',
                            backgroundColor: flag.enabled ? '#22c55e' : '#d1d5db',
                            transition: 'background-color 0.2s ease',
                            opacity: updatingFlag === flag.id ? 0.5 : 1,
                          }}
                        >
                          <span
                            style={{
                              position: 'absolute',
                              top: '2px',
                              left: flag.enabled ? '22px' : '2px',
                              width: '20px',
                              height: '20px',
                              backgroundColor: 'white',
                              borderRadius: '50%',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                              transition: 'left 0.2s ease',
                            }}
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* Announcements tab */}
        {activeTab === 'announcements' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Announcements</h2>
            <p className="text-sm text-gray-500">Send in-app notifications to all users. They'll see a banner at the top of the app until they dismiss it.</p>

            {/* Create announcement */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Create new announcement</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-20">
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Icon</label>
                    <input
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-center"
                      value={newAnnouncement.icon}
                      onChange={e => setNewAnnouncement(p => ({ ...p, icon: e.target.value }))}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Title</label>
                    <input
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
                      placeholder="e.g. New feature: CO2 tracking!"
                      value={newAnnouncement.title}
                      onChange={e => setNewAnnouncement(p => ({ ...p, title: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Message</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 resize-none"
                    placeholder="e.g. You can now track the CO2 footprint of your pantry items. Check it out in the Pantry page!"
                    rows={3}
                    value={newAnnouncement.message}
                    onChange={e => setNewAnnouncement(p => ({ ...p, message: e.target.value }))}
                  />
                </div>

                {/* Preview */}
                {newAnnouncement.title && (
                  <div className="bg-blue-600 text-white px-4 py-3 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{newAnnouncement.icon}</span>
                      <div>
                        <p className="text-sm font-semibold">{newAnnouncement.title}</p>
                        <p className="text-xs opacity-90">{newAnnouncement.message}</p>
                      </div>
                    </div>
                    <span className="text-white/70 text-xl ml-4">✕</span>
                  </div>
                )}

                <button
                  onClick={handleCreateAnnouncement}
                  disabled={!newAnnouncement.title || !newAnnouncement.message || savingAnnouncement}
                  className="bg-gray-900 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
                >
                  {savingAnnouncement ? 'Sending...' : 'Send to all users'}
                </button>
              </div>
            </div>

            {/* Active announcements */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Active announcements ({announcements.length})</h3>
              {announcements.length === 0 ? (
                <p className="text-sm text-gray-400">No active announcements</p>
              ) : (
                <div className="space-y-3">
                  {announcements.map(a => (
                    <div key={a.id} className="flex items-start justify-between bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
                      <div className="flex items-start gap-3">
                        <span className="text-xl">{a.icon}</span>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{a.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{a.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{new Date(a.createdAt).toLocaleDateString('en-CA')}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteAnnouncement(a.id)}
                        className="text-xs text-red-500 hover:text-red-700 ml-4 flex-shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        {/* Usage stats tab */}
        {activeTab === 'usage' && usage && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Usage statistics</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Meals cooked (7d)', value: usage.meals.cooked7Days, icon: '🍳' },
                { label: 'Meals cooked (30d)', value: usage.meals.cooked30Days, icon: '📅' },
                { label: 'Recipes logged (7d)', value: usage.recipes.last7Days, icon: '📖' },
                { label: 'Recipes logged (30d)', value: usage.recipes.last30Days, icon: '🫧' },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="text-2xl mb-2">{s.icon}</div>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top cuisines */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Top cuisines</h3>
                {usage.topCuisines.length > 0 ? (
                  <div className="space-y-3">
                    {usage.topCuisines.map((c, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{c.cuisine}</span>
                        <span className="text-sm font-semibold text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded-full">{c.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No data yet</p>
                )}
              </div>

              {/* Top meal types */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Top meal types</h3>
                {usage.topMealTypes.length > 0 ? (
                  <div className="space-y-3">
                    {usage.topMealTypes.map((m, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{m.type}</span>
                        <span className="text-sm font-semibold text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded-full">{m.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No data yet</p>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Nutrition cache tab */}
        {activeTab === 'cache' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Nutrition cache</h2>
              <div className="flex gap-2">
                <button
                  onClick={fetchCacheStats}
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  ↻ Refresh
                </button>
                <button
                  onClick={handleClearExpired}
                  disabled={clearingCache}
                  className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Clear expired
                </button>
                <button
                  onClick={handleClearAll}
                  disabled={clearingCache}
                  className="text-sm px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50"
                >
                  Clear all
                </button>
              </div>
            </div>

            {cacheStats ? (
              <>
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Total cached items', value: cacheStats.total, icon: '🗄️', color: 'bg-blue-50 border-blue-100' },
                    { label: 'Active (not expired)', value: cacheStats.active, icon: '✅', color: 'bg-green-50 border-green-100' },
                    { label: 'Expired items', value: cacheStats.expired, icon: '⏰', color: 'bg-orange-50 border-orange-100' },
                  ].map((s, i) => (
                    <div key={i} className={`bg-white rounded-xl border p-5 ${s.color}`}>
                      <div className="text-2xl mb-2">{s.icon}</div>
                      <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                      <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Top cached items */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Top cached items</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Most looked up nutrition items — served from cache</p>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Meal</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Source</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Calories</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Hits</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Expires</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {cacheStats.topItems.map((item, i) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900 text-xs">{item.mealName}</p>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${item.confidence === 'high' ? 'bg-green-100 text-green-700' :
                                item.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-gray-100 text-gray-600'
                              }`}>
                              {item.confidence}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{item.source}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{item.calories ? `${Math.round(item.calories)} kcal` : '—'}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-semibold text-primary bg-blue-50 px-2 py-0.5 rounded-full">
                              {item.hitCount}x
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">
                            {new Date(item.expiresAt) < new Date() ? (
                              <span className="text-orange-500">Expired</span>
                            ) : (
                              new Date(item.expiresAt).toLocaleDateString('en-CA')
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleDeleteCacheItem(item.id)}
                              className="text-xs text-red-500 hover:text-red-700"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                      {cacheStats.topItems.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">
                            No cached items yet. Users will populate the cache as they look up nutrition info.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-sm font-medium text-blue-800 mb-1">💡 How caching works</p>
                  <p className="text-xs text-blue-600 leading-relaxed">
                    When a user looks up nutrition for a meal, the result is cached for 90 days.
                    Any other user searching for the same meal gets the cached result instantly — no API call made.
                    Hit count shows how many times each item was served from cache instead of calling Claude.
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <p>Loading cache stats...</p>
              </div>
            )}
          </div>
        )}
        {/* Costs & revenue tab */}
        {activeTab === 'costs' && stats && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Costs & revenue</h2>

            {/* Revenue */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">💰 Revenue</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Monthly recurring revenue', value: `$${stats.revenue.mrr}`, sub: 'Active subscriptions', color: 'text-green-600' },
                  { label: 'Revenue this month', value: `$${stats.revenue.thisMonth}`, sub: 'Stripe payments', color: 'text-blue-600' },
                  { label: 'Active subscriptions', value: stats.revenue.activeSubscriptions, sub: 'Paying customers', color: 'text-purple-600' },
                ].map((s, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Costs */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">💸 Monthly costs</h3>
              <div className="space-y-3">
                {[
                  { service: 'DigitalOcean', cost: '$12.00', note: 'Backend server — fixed monthly', status: '🟢 Active' },
                  { service: 'Supabase', cost: '$0.00', note: 'Database — free tier', status: '🟢 Active' },
                  { service: 'Vercel', cost: '$0.00', note: 'Frontend hosting — free tier', status: '🟢 Active' },
                  { service: 'Anthropic API', cost: 'Variable', note: 'AI recipe + meal generation — pay per use', status: '🟢 Active' },
                  { service: 'Stripe', cost: '2.9% + 30¢', note: 'Per transaction fee only', status: '🟢 Active' },
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{s.service}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{s.note}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{s.cost}</p>
                      <p className="text-xs text-gray-400">{s.status}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">Fixed costs total</p>
                <p className="text-lg font-bold text-gray-900">$12.00/month</p>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-green-600">Net profit (MRR - Fixed)</p>
                <p className="text-lg font-bold text-green-600">${(parseFloat(stats.revenue.mrr) - 12).toFixed(2)}/month</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  )
}