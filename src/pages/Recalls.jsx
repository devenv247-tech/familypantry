import { useState, useEffect } from 'react'
import { checkPantryMatches, getRecentRecalls } from '../api/recalls'

export default function Recalls() {
  const [matches, setMatches] = useState([])
  const [recentRecalls, setRecentRecalls] = useState([])
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [lastChecked, setLastChecked] = useState(null)
  const [activeCategory, setActiveCategory] = useState('All')

  useEffect(() => {
    checkMatches()
    fetchRecentRecalls()
  }, [])

  const checkMatches = async () => {
    setChecking(true)
    try {
      const data = await checkPantryMatches()
      setMatches(data.matches || [])
      setLastChecked(new Date().toLocaleTimeString())
    } catch (err) {
      console.error(err)
    } finally {
      setChecking(false)
    }
  }

  const fetchRecentRecalls = async () => {
    try {
      const data = await getRecentRecalls()
      setRecentRecalls(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (risk) => {
    if (!risk) return 'bg-gray-50 text-textMuted border-gray-100'
    const r = risk.toLowerCase()
    if (r.includes('class 1') || r.includes('class i ')) return 'bg-red-50 text-danger border-red-100'
    if (r.includes('class 2') || r.includes('class ii')) return 'bg-orange-50 text-orange-600 border-orange-100'
    return 'bg-yellow-50 text-yellow-600 border-yellow-100'
  }

  const categories = ['All', 'Food', 'Health products', 'Consumer products', 'Vehicles']

  const filteredRecalls = recentRecalls.filter(r => {
    if (activeCategory === 'All') return true
    if (activeCategory === 'Food') return r.isFood
    return (r.category || '').toLowerCase().includes(activeCategory.toLowerCase())
  })

  return (
    <div className="p-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-textPrimary">Recall alerts</h1>
          <p className="text-textMuted mt-1">Health Canada recalls — live data</p>
        </div>
        <button
          onClick={checkMatches}
          disabled={checking}
          className="btn-primary flex items-center gap-2"
        >
          {checking ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Scanning...
            </>
          ) : '🔍 Check my pantry'}
        </button>
      </div>

      {/* Pantry matches section */}
      <div className="mb-8">
        <h2 className="font-semibold text-textPrimary mb-3">
          My pantry matches
          {lastChecked && (
            <span className="text-xs text-textMuted font-normal ml-2">Last checked at {lastChecked}</span>
          )}
        </h2>

        {matches.length > 0 ? (
          <div className="card border-2 border-danger bg-red-50/20">
            <div className="flex items-start gap-3 mb-4">
              <span className="text-2xl">🚨</span>
              <div>
                <p className="font-semibold text-danger">{matches.length} recalled item{matches.length > 1 ? 's' : ''} found in your pantry!</p>
                <p className="text-sm text-red-600 mt-0.5">Remove these items immediately and do not consume them.</p>
              </div>
            </div>
            <div className="space-y-3">
              {matches.map((match, i) => (
                <div key={i} className="bg-white rounded-btn p-4 border border-red-100">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs bg-red-100 text-danger px-2 py-0.5 rounded-pill font-medium">In your pantry</span>
                        <span className="text-sm font-semibold text-textPrimary">{match.pantryItem}</span>
                      </div>
                      <p className="text-xs text-textMuted">Matches: {match.recallTitle}</p>
                      <p className="text-xs text-red-500 mt-1">{match.reason}</p>
                      <p className="text-xs text-textMuted mt-1">
                        {new Date(match.date).toLocaleDateString('en-CA')}
                      </p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-pill border font-medium flex-shrink-0 ${getRiskColor(match.risk)}`}>
                      {match.risk || 'Unknown'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card border border-green-100 bg-green-50/20">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-semibold text-success">No recalled items found in your pantry</p>
                <p className="text-sm text-textMuted mt-0.5">
                  {lastChecked ? 'Your pantry is safe based on current Health Canada recalls' : 'Click "Check my pantry" to scan'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent recalls section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-textPrimary">Recent recalls in Canada</h2>
          <span className="text-xs text-textMuted bg-gray-100 px-3 py-1 rounded-pill">Last 7 days</span>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap mb-4">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-pill border text-sm font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface text-textMuted border-border hover:border-primary hover:text-primary'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="card animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2"/>
                <div className="h-3 bg-gray-100 rounded w-1/2"/>
              </div>
            ))}
          </div>
        ) : filteredRecalls.length === 0 ? (
          <div className="text-center py-12 text-textMuted">
            <div className="text-4xl mb-3">✅</div>
            <p className="font-medium">No recent recalls in this category</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRecalls.map((recall, i) => (
              <div key={i} className={`card hover:shadow-md transition-shadow ${recall.isFood ? 'border-l-4 border-l-orange-300' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {recall.isFood && (
                        <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-pill border border-orange-100 font-medium flex-shrink-0">
                          Food
                        </span>
                      )}
                      <p className="font-medium text-textPrimary text-sm">{recall.title}</p>
                    </div>
                    {recall.reason && (
                      <p className="text-xs text-textMuted mt-1">{recall.reason}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-textMuted">
                        📅 {new Date(recall.date).toLocaleDateString('en-CA')}
                      </span>
                      <span className="text-xs text-textMuted">
                        🏢 {recall.distribution}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={`text-xs px-2.5 py-1 rounded-pill border font-medium ${getRiskColor(recall.risk)}`}>
                      {recall.risk || 'Unknown risk'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-textMuted text-center mt-8">
        Data sourced from Health Canada Recalls and Safety Alerts — recalls-rappels.canada.ca
      </p>

    </div>
  )
}