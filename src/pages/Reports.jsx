import { useState, useEffect } from 'react'
import { getReports, getAISavingsTips } from '../api/reports'

const CATEGORY_COLORS = [
  'bg-primary', 'bg-success', 'bg-yellow-400',
  'bg-purple-400', 'bg-orange-400', 'bg-pink-400'
]

const STORE_ICONS = {
  'Superstore': '🛒',
  'Walmart': '🏬',
  'T&T Supermarket': '🏪',
  'Costco': '📦',
  'No Frills': '🧺',
}

export default function Reports() {
  const [data, setData] = useState(null)
  const [tips, setTips] = useState([])
  const [loading, setLoading] = useState(true)
  const [tipsLoading, setTipsLoading] = useState(false)
  const [activeMonth, setActiveMonth] = useState(null)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const reports = await getReports()
      setData(reports)
      if (reports.monthlySpend?.length > 0) {
        setActiveMonth(reports.monthlySpend[reports.monthlySpend.length - 1].month)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchTips = async () => {
    setTipsLoading(true)
    try {
      const res = await getAISavingsTips()
      setTips(res.tips)
    } catch (err) {
      console.error(err)
    } finally {
      setTipsLoading(false)
    }
  }

  const maxSpend = data ? Math.max(...data.monthlySpend.map(m => m.amount), 1) : 1

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-textPrimary">Expense reports</h1>
          <p className="text-textMuted mt-1">Loading your spending data...</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1,2,3,4].map(i => (
            <div key={i} className="card animate-pulse">
              <div className="h-8 bg-gray-100 rounded mb-2"/>
              <div className="h-4 bg-gray-100 rounded w-2/3"/>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const hasData = data?.summary?.totalItems > 0

  return (
    <div className="p-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-textPrimary">Expense reports</h1>
        <p className="text-textMuted mt-1">Track and reduce your family grocery spending</p>
      </div>

      {/* No data state */}
      {!hasData && (
        <div className="card text-center py-12 mb-8 border border-blue-100 bg-blue-50/20">
          <div className="text-5xl mb-4">📊</div>
          <p className="font-semibold text-textPrimary mb-2">No spending data yet</p>
          <p className="text-sm text-textMuted max-w-sm mx-auto">
            Start checking off items in your grocery list when you buy them. Your spending reports will appear here automatically.
          </p>
        </div>
      )}

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'This month', value: `$${data?.summary?.thisMonth || '0.00'}`, sub: 'Current month spend', color: 'text-textPrimary' },
          { label: 'Last month', value: `$${data?.summary?.lastMonth || '0.00'}`, sub: 'Previous month', color: 'text-textMuted' },
          { label: 'Monthly avg', value: `$${parseFloat(data?.summary?.avg || 0).toFixed(2)}`, sub: 'Last 6 months', color: 'text-textMuted' },
          { label: 'Items purchased', value: data?.summary?.totalItems || 0, sub: 'Total tracked', color: 'text-success' },
        ].map((s, i) => (
          <div key={i} className="card">
            <p className="text-xs text-textMuted mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-textMuted mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Bar chart */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-textPrimary">Monthly spending</h2>
            <span className="text-xs text-textMuted">Last 6 months</span>
          </div>
          {hasData ? (
            <div className="flex items-end gap-3 h-40">
              {data.monthlySpend.map((m, i) => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs text-textMuted font-medium">
                    {m.amount > 0 ? `$${m.amount}` : ''}
                  </span>
                  <button
                    onClick={() => setActiveMonth(m.month)}
                    className="w-full rounded-t-md transition-all duration-300 hover:opacity-80"
                    style={{
                      height: `${Math.max((m.amount / maxSpend) * 100, m.amount > 0 ? 8 : 4)}%`,
                      background: activeMonth === m.month ? '#1a73e8' : m.amount > 0 ? '#e8eaed' : '#f5f5f5',
                      minHeight: '4px',
                    }}
                  />
                  <span className={`text-xs font-medium ${activeMonth === m.month ? 'text-primary' : 'text-textMuted'}`}>
                    {m.month}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-textMuted text-sm">
              No spending data yet
            </div>
          )}
        </div>

        {/* Category breakdown */}
        <div className="card">
          <h2 className="font-semibold text-textPrimary mb-5">By category</h2>
          {data?.categories?.length > 0 ? (
            <div className="space-y-4">
              {data.categories.map((cat, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-textPrimary font-medium truncate max-w-[140px]">{cat.name}</span>
                    <span className="text-xs font-semibold text-textPrimary">${cat.amount}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-pill overflow-hidden">
                    <div
                      className={`h-full rounded-pill ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]} transition-all duration-500`}
                      style={{ width: `${cat.percent}%` }}
                    />
                  </div>
                  <p className="text-xs text-textMuted mt-0.5">{cat.percent}% of total</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-textMuted">No category data yet</p>
          )}
        </div>

      </div>

      {/* Store breakdown */}
      {data?.stores?.length > 0 && (
        <div className="card mb-6">
          <h2 className="font-semibold text-textPrimary mb-4">Spending by store</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {data.stores.map((store, i) => (
              <div key={i} className="bg-gray-50 rounded-btn p-3 text-center border border-border">
                <div className="text-2xl mb-1">{STORE_ICONS[store.name] || '🏪'}</div>
                <p className="text-sm font-semibold text-textPrimary">${store.amount}</p>
                <p className="text-xs text-textMuted truncate">{store.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI savings tips */}
      <div className="card mb-6 border-2 border-yellow-100 bg-yellow-50/30">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-textPrimary">💡 AI savings tips</h2>
          <button
            onClick={fetchTips}
            disabled={tipsLoading}
            className="btn-secondary text-xs px-3 py-1.5"
          >
            {tipsLoading ? 'Generating...' : tips.length > 0 ? 'Refresh tips' : 'Generate tips'}
          </button>
        </div>
        {tips.length > 0 ? (
          <div className="space-y-3">
            {tips.map((t, i) => (
              <div key={i} className="flex items-start gap-3 bg-surface rounded-btn p-4 border border-border">
                <span className="text-xl flex-shrink-0">{t.icon}</span>
                <p className="text-sm text-textMuted leading-relaxed">{t.tip}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-textMuted">
            {hasData
              ? 'Click "Generate tips" to get AI-powered savings suggestions based on your spending.'
              : 'Start tracking purchases to get personalized savings tips.'}
          </p>
        )}
      </div>

      {/* Recent shopping trips */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-textPrimary">Recent shopping trips</h2>
        </div>
        {data?.recentTrips?.length > 0 ? (
          <ul className="divide-y divide-border">
            {data.recentTrips.map((t, i) => (
              <li key={i} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                  {STORE_ICONS[t.store] || '🏪'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-textPrimary">{t.store}</p>
                  <p className="text-xs text-textMuted mt-0.5">{t.date} · {t.items} item{t.items > 1 ? 's' : ''}</p>
                </div>
                <span className="text-sm font-bold text-textPrimary">{t.total}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8 text-textMuted">
            <p className="text-sm">No shopping trips recorded yet</p>
            <p className="text-xs mt-1">Check off grocery items when you buy them to track trips</p>
          </div>
        )}
      </div>

    </div>
  )
}