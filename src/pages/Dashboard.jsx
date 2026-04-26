import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import { getDashboardStats, getRecentActivity } from '../api/dashboard'
import { getMembers } from '../api/family'
import { LoadingSpinner, ErrorState, Toast } from '../components/ui/PageState'
import { useToast } from '../hooks/useToast'

const quickActions = [
  { label: 'Add pantry item', icon: '➕', to: '/app/pantry' },
  { label: 'Get recipe ideas', icon: '🤖', to: '/app/recipes' },
  { label: 'View grocery list', icon: '🛒', to: '/app/grocery' },
  { label: 'See reports', icon: '📊', to: '/app/reports' },
]

export default function Dashboard() {
  const { user, family } = useAuthStore()
  const navigate = useNavigate()
  const { toast, showToast, hideToast } = useToast()
  const [stats, setStats] = useState(null)
  const [activity, setActivity] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setError('')
      const [statsData, activityData, membersData] = await Promise.all([
        getDashboardStats(),
        getRecentActivity(),
        getMembers(),
      ])
      setStats(statsData)
      setActivity(activityData)
      setMembers(membersData)
    } catch (err) {
      console.error(err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="h-8 bg-gray-100 rounded w-64 mb-2 animate-pulse"/>
          <div className="h-4 bg-gray-100 rounded w-48 animate-pulse"/>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1,2,3,4].map(i => (
            <div key={i} className="card animate-pulse">
              <div className="h-8 bg-gray-100 rounded mb-2"/>
              <div className="h-4 bg-gray-100 rounded w-2/3"/>
            </div>
          ))}
        </div>
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <ErrorState message={error} onRetry={fetchData} />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-textPrimary">
          {greeting}, {user?.name || 'there'} 👋
        </h1>
        <p className="text-textMuted mt-1">
          Here's what's happening with <span className="font-medium text-textPrimary">{family?.name || 'your family'}</span> today.
        </p>
      </div>

      {/* Expiry alert */}
      {stats && (stats.expiringSoon > 0 || stats.expired > 0) && (
        <div className="bg-orange-50 border border-orange-100 rounded-card px-5 py-4 mb-6 flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-orange-600">Pantry alert</p>
            <p className="text-sm text-orange-500 mt-0.5">
              {stats.expired > 0 && `${stats.expired} item${stats.expired > 1 ? 's' : ''} expired. `}
              {stats.expiringSoon > 0 && `${stats.expiringSoon} item${stats.expiringSoon > 1 ? 's' : ''} expiring within 3 days.`}
              <button onClick={() => navigate('/app/pantry')} className="ml-2 underline font-medium">Check pantry</button>
            </p>
          </div>
        </div>
      )}

      {/* Recall alert */}
      <div className="bg-red-50 border border-red-100 rounded-card px-5 py-4 mb-8 flex items-start gap-3">
        <span className="text-xl">🚨</span>
        <div>
          <p className="text-sm font-semibold text-danger">Health Canada Recall Alert</p>
          <p className="text-sm text-red-600 mt-0.5">
            Check the Recall alerts page for items that may match your pantry.
            <button onClick={() => navigate('/app/recalls')} className="ml-2 underline font-medium">View recalls</button>
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Pantry items', value: stats?.pantryCount || 0, icon: '🧺', color: 'bg-blue-50 text-primary' },
          { label: 'Family members', value: stats?.memberCount || 0, icon: '👨‍👩‍👧‍👦', color: 'bg-green-50 text-success' },
          { label: 'Grocery items', value: stats?.groceryCount || 0, icon: '🛒', color: 'bg-orange-50 text-orange-500' },
          { label: 'Total spend', value: `$${stats?.totalSpend || '0.00'}`, icon: '📊', color: 'bg-purple-50 text-purple-500' },
        ].map((s, i) => (
          <div key={i} className="card flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${s.color}`}>
              {s.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-textPrimary">{s.value}</p>
              <p className="text-xs text-textMuted">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Plan usage for free plan */}
      {stats?.plan === 'free' && (
        <div className="card mb-6 border border-blue-100 bg-blue-50/30">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-textPrimary">Free plan — recipe usage this week</p>
            <button
              onClick={() => navigate('/app/settings')}
              className="text-xs text-primary hover:underline font-medium"
            >
              Upgrade
            </button>
          </div>
          <div className="h-2 bg-gray-100 rounded-pill overflow-hidden">
            <div
              className="h-full bg-primary rounded-pill transition-all"
              style={{ width: `${Math.min((stats.recipeCount / 5) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-textMuted mt-1">{stats.recipeCount}/5 recipes used this week</p>
        </div>
      )}

      {/* Quick actions + activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Quick actions */}
        <div className="card">
          <h2 className="font-semibold text-textPrimary mb-4">Quick actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((a, i) => (
              <button
                key={i}
                onClick={() => navigate(a.to)}
                className="flex items-center gap-3 p-3 rounded-btn border border-border hover:bg-gray-50 hover:border-primary transition-all text-left"
              >
                <span className="text-xl">{a.icon}</span>
                <span className="text-sm font-medium text-textPrimary">{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="card">
          <h2 className="font-semibold text-textPrimary mb-4">Recent activity</h2>
          {activity.length === 0 ? (
            <p className="text-sm text-textMuted">No activity yet — start by adding pantry items!</p>
          ) : (
            <div className="space-y-4">
              {activity.map((a, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-50 rounded-full flex items-center justify-center text-lg border border-border flex-shrink-0">
                    {a.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-textPrimary font-medium truncate">{a.text}</p>
                    <p className="text-xs text-textMuted">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Members strip */}
      <div className="card mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-textPrimary">Family members</h2>
          <button
            onClick={() => navigate('/app/settings')}
            className="text-sm text-primary hover:underline font-medium"
          >
            Manage members
          </button>
        </div>
        <div className="flex gap-3 flex-wrap">
          {members.length === 0 ? (
            <p className="text-sm text-textMuted">No members yet</p>
          ) : (
            members.map((member, i) => (
              <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-pill px-4 py-2 border border-border">
                <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {member.name?.[0]?.toUpperCase()}
                </div>
                <span className="text-sm font-medium text-textPrimary">{member.name}</span>
              </div>
            ))
          )}
          <button
            onClick={() => navigate('/app/settings')}
            className="flex items-center gap-2 px-4 py-2 rounded-pill border border-dashed border-border text-sm text-textMuted hover:border-primary hover:text-primary transition-all"
          >
            + Add member
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

    </div>
  )
}