import { useState, useEffect } from 'react'
import { getRecalls, checkPantryMatches } from '../api/recalls'

export default function Recalls() {
  const [recalls, setRecalls] = useState([])
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [lastChecked, setLastChecked] = useState(null)

  useEffect(() => {
    fetchRecalls()
    checkMatches()
  }, [])

  const fetchRecalls = async () => {
    try {
      const data = await getRecalls()
      setRecalls(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

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

  const getRiskColor = (risk) => {
    if (!risk) return 'bg-gray-50 text-textMuted border-gray-100'
    const r = risk.toLowerCase()
    if (r.includes('high') || r.includes('class i') || r.includes('1')) return 'bg-red-50 text-danger border-red-100'
    if (r.includes('medium') || r.includes('class ii') || r.includes('2')) return 'bg-orange-50 text-orange-600 border-orange-100'
    return 'bg-yellow-50 text-yellow-600 border-yellow-100'
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-textPrimary">Food recall alerts</h1>
          <p className="text-textMuted mt-1">Live data from Health Canada — updated daily</p>
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
              Checking...
            </>
          ) : '🔍 Check my pantry'}
        </button>
      </div>

      {matches.length > 0 ? (
        <div className="card mb-8 border-2 border-danger bg-red-50/20">
          <div className="flex items-start gap-3 mb-4">
            <span className="text-2xl">🚨</span>
            <div>
              <p className="font-semibold text-danger">Recalled items found in your pantry!</p>
              <p className="text-sm text-red-600 mt-0.5">Remove these items immediately and do not consume them.</p>
            </div>
          </div>
          <div className="space-y-3">
            {matches.map((match, i) => (
              <div key={i} className="bg-white rounded-btn p-4 border border-red-100">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-textPrimary text-sm">{match.pantryItem}</p>
                    <p className="text-xs text-textMuted mt-0.5">Matches: {match.recallTitle}</p>
                    <p className="text-xs text-red-500 mt-1">{match.reason}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-pill border font-medium flex-shrink-0 ${getRiskColor(match.risk)}`}>
                    {match.risk}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card mb-8 border border-green-100 bg-green-50/20">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-semibold text-success">No recalled items found in your pantry</p>
              <p className="text-sm text-textMuted mt-0.5">
                {lastChecked ? `Last checked at ${lastChecked}` : 'Click check my pantry to scan'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-textPrimary">Recent food recalls in Canada</h2>
        <span className="text-xs text-textMuted">Last 90 days</span>
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
      ) : recalls.length === 0 ? (
        <div className="text-center py-12 text-textMuted">
          <div className="text-4xl mb-3">✅</div>
          <p className="font-medium">No recent food recalls</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recalls.map((recall, i) => (
            <div key={i} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-textPrimary text-sm">{recall.title}</p>
                  {recall.brand && (
                    <p className="text-xs text-textMuted mt-0.5">Brand: {recall.brand}</p>
                  )}
                  {recall.reason && (
                    <p className="text-xs text-danger mt-1">{recall.reason}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-textMuted">
                      {new Date(recall.date).toLocaleDateString('en-CA')}
                    </span>
                    <span className="text-xs text-textMuted">
                      📍 {recall.distribution}
                    </span>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-pill border font-medium flex-shrink-0 ${getRiskColor(recall.risk)}`}>
                  {recall.risk || 'Unknown risk'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-textMuted text-center mt-8">
        Data sourced from Health Canada Recalls and Safety Alerts — recalls-rappels.canada.ca
      </p>

    </div>
  )
}