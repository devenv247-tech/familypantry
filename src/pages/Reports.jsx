import { useState } from 'react'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
const SPEND_DATA = [280, 310, 265, 342, 290, 318]

const CATEGORIES = [
  { name: 'Vegetables & fruits', amount: 89, color: 'bg-success', percent: 26 },
  { name: 'Meat & protein', amount: 112, color: 'bg-primary', percent: 33 },
  { name: 'Dairy', amount: 54, color: 'bg-yellow-400', percent: 16 },
  { name: 'Dry goods & grains', amount: 48, color: 'bg-purple-400', percent: 14 },
  { name: 'Snacks & drinks', amount: 39, color: 'bg-orange-400', percent: 11 },
]

const TRANSACTIONS = [
  { id: 1, store: 'Superstore', date: 'Apr 18, 2026', amount: '$124.50', items: 18, icon: '🛒' },
  { id: 2, store: 'T&T Supermarket', date: 'Apr 14, 2026', amount: '$67.20', items: 9, icon: '🏪' },
  { id: 3, store: 'Walmart', date: 'Apr 10, 2026', amount: '$89.30', items: 14, icon: '🏬' },
  { id: 4, store: 'Superstore', date: 'Apr 4, 2026', amount: '$61.00', items: 11, icon: '🛒' },
]

const TIPS = [
  { tip: 'You spend 23% more on meat than similar families. Try 2 vegetarian meals per week to save ~$25/mo.', icon: '💡' },
  { tip: 'Buying basmati rice in bulk at Costco could save you $18/month vs Superstore.', icon: '💰' },
  { tip: 'You threw away $34 worth of food last month. Check expiry dates in your pantry weekly.', icon: '🗑️' },
]

export default function Reports() {
  const [activeMonth, setActiveMonth] = useState('Apr')
  const maxSpend = Math.max(...SPEND_DATA)

  return (
    <div className="p-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-textPrimary">Expense reports</h1>
        <p className="text-textMuted mt-1">Track and reduce your family grocery spending</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'This month', value: '$342', sub: '+8% vs last month', color: 'text-danger' },
          { label: 'Last month', value: '$318', sub: 'March 2026', color: 'text-textMuted' },
          { label: 'Monthly avg', value: '$301', sub: 'Last 6 months', color: 'text-textMuted' },
          { label: 'Potential savings', value: '$43', sub: 'See tips below', color: 'text-success' },
        ].map((s, i) => (
          <div key={i} className="card">
            <p className="text-xs text-textMuted mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-textPrimary">{s.value}</p>
            <p className={`text-xs mt-1 font-medium ${s.color}`}>{s.sub}</p>
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
          <div className="flex items-end gap-3 h-40">
            {MONTHS.map((month, i) => (
              <div key={month} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs text-textMuted font-medium">${SPEND_DATA[i]}</span>
                <button
                  onClick={() => setActiveMonth(month)}
                  className="w-full rounded-t-md transition-all duration-300 hover:opacity-80"
                  style={{
                    height: `${(SPEND_DATA[i] / maxSpend) * 100}%`,
                    background: activeMonth === month ? '#1a73e8' : '#e8eaed',
                    minHeight: '8px',
                  }}
                />
                <span className={`text-xs font-medium ${activeMonth === month ? 'text-primary' : 'text-textMuted'}`}>
                  {month}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Category breakdown */}
        <div className="card">
          <h2 className="font-semibold text-textPrimary mb-5">By category</h2>
          <div className="space-y-4">
            {CATEGORIES.map((cat, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-textPrimary font-medium truncate max-w-[140px]">{cat.name}</span>
                  <span className="text-xs font-semibold text-textPrimary">${cat.amount}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-pill overflow-hidden">
                  <div
                    className={`h-full rounded-pill ${cat.color} transition-all duration-500`}
                    style={{ width: `${cat.percent}%` }}
                  />
                </div>
                <p className="text-xs text-textMuted mt-0.5">{cat.percent}% of total</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Savings tips */}
      <div className="card mb-6 border-2 border-yellow-100 bg-yellow-50/30">
        <h2 className="font-semibold text-textPrimary mb-4">💡 AI savings tips</h2>
        <div className="space-y-3">
          {TIPS.map((t, i) => (
            <div key={i} className="flex items-start gap-3 bg-surface rounded-btn p-4 border border-border">
              <span className="text-xl flex-shrink-0">{t.icon}</span>
              <p className="text-sm text-textMuted leading-relaxed">{t.tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-textPrimary">Recent shopping trips</h2>
        </div>
        <ul className="divide-y divide-border">
          {TRANSACTIONS.map(t => (
            <li key={t.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                {t.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-textPrimary">{t.store}</p>
                <p className="text-xs text-textMuted mt-0.5">{t.date} · {t.items} items</p>
              </div>
              <span className="text-sm font-bold text-textPrimary">{t.amount}</span>
            </li>
          ))}
        </ul>
      </div>

    </div>
  )
}