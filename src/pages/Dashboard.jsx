import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'

const stats = [
  { label: 'Pantry items', value: '24', icon: '🧺', color: 'bg-blue-50 text-primary' },
  { label: 'Family members', value: '4', icon: '👨‍👩‍👧‍👦', color: 'bg-green-50 text-success' },
  { label: 'Recipes this week', value: '7', icon: '🍽️', color: 'bg-orange-50 text-orange-500' },
  { label: 'Monthly spend', value: '$342', icon: '📊', color: 'bg-purple-50 text-purple-500' },
]

const quickActions = [
  { label: 'Add pantry item', icon: '➕', to: '/app/pantry' },
  { label: 'Get recipe ideas', icon: '🤖', to: '/app/recipes' },
  { label: 'View grocery list', icon: '🛒', to: '/app/grocery' },
  { label: 'See reports', icon: '📊', to: '/app/reports' },
]

const recentActivity = [
  { text: 'Milk added to pantry', time: '2 min ago', icon: '🥛' },
  { text: 'Recipe suggested: Butter Chicken', time: '1 hour ago', icon: '🍗' },
  { text: 'Grocery list updated', time: '3 hours ago', icon: '🛒' },
  { text: 'Priya\'s health goals updated', time: 'Yesterday', icon: '💪' },
]

export default function Dashboard() {
  const { user, family } = useAuthStore()
  const navigate = useNavigate()

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

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

      {/* Recall alert */}
      <div className="bg-red-50 border border-red-100 rounded-card px-5 py-4 mb-8 flex items-start gap-3">
        <span className="text-xl">🚨</span>
        <div>
          <p className="text-sm font-semibold text-danger">Health Canada Recall Alert</p>
          <p className="text-sm text-red-600 mt-0.5">
            Certain Pillsbury Pizza Pops recalled due to E. coli contamination.
            <button className="ml-2 underline font-medium">Check your pantry</button>
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <div key={i} className="card flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${s.color} bg-opacity-50`}>
              {s.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-textPrimary">{s.value}</p>
              <p className="text-xs text-textMuted">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

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
          <div className="space-y-4">
            {recentActivity.map((a, i) => (
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
        </div>

      </div>

      {/* Members strip */}
      <div className="card mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-textPrimary">Family members</h2>
          <button className="text-sm text-primary hover:underline font-medium">Manage members</button>
        </div>
        <div className="flex gap-4 flex-wrap">
          {['Jas', 'Priya', 'Arjun', 'Meena'].map((name, i) => (
            <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-pill px-4 py-2 border border-border">
              <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                {name[0]}
              </div>
              <span className="text-sm font-medium text-textPrimary">{name}</span>
            </div>
          ))}
          <button className="flex items-center gap-2 px-4 py-2 rounded-pill border border-dashed border-border text-sm text-textMuted hover:border-primary hover:text-primary transition-all">
            + Add member
          </button>
        </div>
      </div>

    </div>
  )
}