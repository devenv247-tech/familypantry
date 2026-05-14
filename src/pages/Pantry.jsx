import { getPantryItems, addPantryItem, deletePantryItem, restockPantryItem, parseVoiceItem } from '../api/pantry'
import { useState, useEffect, useRef } from 'react'
import { useVoiceInput } from '../hooks/useVoiceInput'
import VoiceOverlay from '../components/ui/VoiceOverlay'
import BarcodeScanner from '../components/ui/BarcodeScanner'
import { lookupBarcode } from '../api/barcode'
import { LoadingSpinner, ErrorState, EmptyState, Toast } from '../components/ui/PageState'
import { useToast } from '../hooks/useToast'
import { predictExpiry, logItemRemoval, getExpiringSoon } from '../api/expiry'
import { getPantryCO2 } from '../api/smartInsights'
import { useAppConfigStore } from '../store/appConfigStore'
import { useAuthStore } from '../store/authStore'
import { scanPantryPhoto, getScanStatus, getTemplates, applyTemplate } from '../api/pantryTools'
import { useNavigate } from 'react-router-dom'

const UNITS = ['pcs', 'dozen', 'kg', 'g', 'mg', 'L', 'ml', 'lb', 'oz', 'cup', 'tbsp', 'tsp', 'gallon']
const EMPTY_FORM = { name: '', quantity: '', unit: 'pcs', category: 'Fridge', expiry: '', icon: '🛒', isCustomCategory: false }
const CATEGORIES = ['All', 'Fridge', 'Freezer', 'Dry goods', 'Spices', 'Snacks']
const ICONS = ['🥛', '🍗', '🍚', '🥚', '🌿', '🫛', '🌾', '🥣', '🧀', '🥦', '🍎', '🥕', '🧅', '🫙', '🥩', '🍞', '🛒']

export default function Pantry() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [restockingId, setRestockingId] = useState(null)
  const [restockQty, setRestockQty] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const [scanLoading, setScanLoading] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const [expiringSoon, setExpiringSoon] = useState([])
  const [co2Data, setCo2Data] = useState(null)
  const [showCO2, setShowCO2] = useState(false)

  // Photo scan state
  const [photoScanning, setPhotoScanning] = useState(false)
  const [scannedItems, setScannedItems] = useState([])
  const [showPhotoResults, setShowPhotoResults] = useState(false)
  const [scanStatus, setScanStatus] = useState(null)
  const [selectedScannedItems, setSelectedScannedItems] = useState([])
  const photoInputRef = useRef(null)

  // Templates state
  const [showTemplates, setShowTemplates] = useState(false)
  const [templates, setTemplates] = useState([])
  const [applyingTemplate, setApplyingTemplate] = useState(null)

  const { toast, showToast, hideToast } = useToast()
 const { state: voiceState, supported: voiceSupported, start: startVoice, stop: stopVoice, setIdle: setVoiceIdle } = useVoiceInput({
    onResult: async (transcript) => {
      try {
        const parsed = await parseVoiceItem(transcript, 'pantry')
        setForm({
          name: parsed.name || '',
          quantity: parsed.quantity || 1,
          unit: parsed.unit || 'pcs',
          category: parsed.category || 'Fridge',
          expiry: '',
          icon: parsed.icon || '🛒',
          isCustomCategory: false,
        })
        setShowForm(true)
        showToast(`🎙️ Heard: "${transcript}"`)
      } catch (err) {
        showToast('Could not understand. Please try again.', 'error')
      } finally {
        setVoiceIdle()
      }
    },
    onError: (msg) => showToast(msg, 'error'),
  })
  const { family } = useAuthStore()
  const { isFeatureEnabled } = useAppConfigStore()
  const plan = family?.plan?.toLowerCase() || 'free'

  const canPhotoScan = isFeatureEnabled('pantry_photo_scan', plan)
  const canUseTemplates = isFeatureEnabled('pantry_templates', plan)
  const canUseVoice = isFeatureEnabled('voice_input', plan)

  useEffect(() => {
    fetchItems()
    fetchExpiringSoon()
    fetchCO2()
    if (canPhotoScan) fetchScanStatus()
    if (canUseTemplates) fetchTemplates()
  }, [])

  const fetchItems = async () => {
    try {
      setError('')
      const data = await getPantryItems()
      setItems(data)
    } catch (err) {
      setError('Failed to load pantry items')
    } finally {
      setLoading(false)
    }
  }

  const fetchExpiringSoon = async () => {
    try {
      const data = await getExpiringSoon()
      setExpiringSoon(data)
    } catch (err) {
      console.error('Failed to load expiring soon:', err)
    }
  }

  const fetchCO2 = async () => {
    try {
      const data = await getPantryCO2()
      setCo2Data(data)
    } catch (err) {
      console.error('Failed to load CO2 data:', err)
    }
  }

  const fetchScanStatus = async () => {
    try {
      const data = await getScanStatus()
      setScanStatus(data)
    } catch (err) {
      console.error('Failed to load scan status:', err)
    }
  }

  const fetchTemplates = async () => {
    try {
      const data = await getTemplates()
      setTemplates(data)
    } catch (err) {
      console.error('Failed to load templates:', err)
    }
  }

  const getItemCO2 = (itemName) => {
    if (!co2Data?.items) return null
    return co2Data.items.find(i => i.name.toLowerCase() === itemName.toLowerCase())
  }

  const update = (f, v) => setForm(p => ({ ...p, [f]: v }))

  const filtered = items.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = activeCategory === 'All' || item.category === activeCategory
    return matchSearch && matchCat
  })

  const isExpiringSoon = (expiry) => {
    if (!expiry) return false
    const days = Math.ceil((new Date(expiry) - new Date()) / (1000 * 60 * 60 * 24))
    return days <= 3
  }

  const isExpired = (expiry) => {
    if (!expiry) return false
    return new Date(expiry) < new Date()
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.quantity) {
      return setFormError('Please fill in name and quantity')
    }
    try {
      const item = await addPantryItem({
        name: form.name,
        quantity: parseFloat(form.quantity),
        unit: form.unit,
        category: form.category,
        expiry: form.expiry || null,
        icon: form.icon,
      })
      setItems(prev => [item, ...prev])
      setForm(EMPTY_FORM)
      setFormError('')
      setShowForm(false)
      setScanResult(null)
      showToast('Item added to pantry!')
      fetchCO2()
      if (!form.expiry) {
        try {
          await predictExpiry(item.name, item.category, item.id)
          await fetchExpiringSoon()
        } catch (e) {
          console.log('Expiry prediction skipped:', e.message)
        }
      }
    } catch (err) {
      setFormError('Failed to add item. Please try again.')
    }
  }

  const handleDelete = async (id) => {
    try {
      const existing = items.find(i => i.id === id)
      await deletePantryItem(id)
      setItems(prev => prev.filter(i => i.id !== id))
      setExpiringSoon(prev => prev.filter(i => i.id !== id))
      showToast('Item removed from pantry')
      fetchCO2()
      if (existing) {
        try {
          await logItemRemoval(existing.name, existing.category, existing.predictedExpiry, existing.expiry, 'used')
        } catch (e) {}
      }
    } catch (err) {
      showToast('Failed to delete item', 'error')
    }
  }

  const handleRestock = async (id) => {
    if (!restockQty || parseFloat(restockQty) <= 0) return
    try {
      const updated = await restockPantryItem(id, parseFloat(restockQty))
      setItems(prev => prev.map(i => i.id === id ? updated : i))
      setRestockingId(null)
      setRestockQty('')
      showToast('Pantry restocked!')
    } catch (err) {
      showToast('Failed to restock item', 'error')
    }
  }

  const handleScan = async (barcode) => {
    setShowScanner(false)
    setScanLoading(true)
    try {
      const product = await lookupBarcode(barcode)
      if (product && product.name) {
        let qty = 1
        let unit = 'pcs'
        if (product.quantity) {
          const match = product.quantity.match(/(\d+\.?\d*)\s*(kg|g|ml|l|oz|lb)?/i)
          if (match) {
            qty = parseFloat(match[1])
            unit = match[2]?.toLowerCase() || 'pcs'
            if (unit === 'l') unit = 'L'
          }
        }
        setScanResult(product)
        setForm({
          name: `${product.brand ? product.brand + ' ' : ''}${product.name}`.trim(),
          quantity: qty,
          unit,
          category: 'Fridge',
          expiry: '',
          icon: '🛒',
          isCustomCategory: false,
        })
        setShowForm(true)
      } else {
        showToast('Product not found. Please add manually.', 'error')
      }
    } catch (err) {
      showToast('Could not look up product. Please add manually.', 'error')
    } finally {
      setScanLoading(false)
    }
  }

  const handlePhotoScan = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setPhotoScanning(true)
    setShowPhotoResults(false)
    setScannedItems([])

    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const base64 = event.target.result.split(',')[1]
        const mimeType = file.type

        try {
          const result = await scanPantryPhoto(base64, mimeType)
          setScannedItems(result.items || [])
          setSelectedScannedItems(result.items?.map((_, i) => i) || [])
          setShowPhotoResults(true)
          setScanStatus(prev => ({
            ...prev,
            scansUsed: result.scansUsed,
            scansRemaining: result.scansRemaining,
          }))
          showToast(`Found ${result.items?.length || 0} items in your photo!`)
        } catch (err) {
          if (err.response?.status === 403) {
            if (err.response?.data?.limitReached) {
              showToast(err.response.data.message, 'error')
            } else {
              navigate('/app/settings?tab=plan')
            }
          } else if (err.response?.data?.creditsExhausted) {
            showToast('AI service temporarily unavailable. Please try again later.', 'error')
          } else {
            showToast('Failed to scan photo. Please try again.', 'error')
          }
        } finally {
          setPhotoScanning(false)
        }
      }
      reader.readAsDataURL(file)
    } catch (err) {
      showToast('Failed to read photo', 'error')
      setPhotoScanning(false)
    }

    // Reset file input
    e.target.value = ''
  }

  const handleAddScannedItems = async () => {
    const itemsToAdd = scannedItems.filter((_, i) => selectedScannedItems.includes(i))
    if (itemsToAdd.length === 0) return

    let added = 0
    for (const item of itemsToAdd) {
      try {
        const newItem = await addPantryItem({
          name: item.name,
          quantity: item.quantity || 1,
          unit: item.unit || 'pcs',
          category: item.category || 'Fridge',
          icon: item.icon || '🛒',
        })
        setItems(prev => [newItem, ...prev])
        added++
      } catch (err) {
        console.error('Failed to add item:', item.name)
      }
    }

    showToast(`Added ${added} items to pantry!`)
    setShowPhotoResults(false)
    setScannedItems([])
    setSelectedScannedItems([])
    fetchCO2()
  }

  const handleApplyTemplate = async (templateId, templateName) => {
    setApplyingTemplate(templateId)
    try {
      const result = await applyTemplate(templateId)
      showToast(result.message)
      fetchItems()
      setShowTemplates(false)
    } catch (err) {
      if (err.response?.status === 403) {
        navigate('/app/settings?tab=plan')
      } else {
        showToast('Failed to apply template', 'error')
      }
    } finally {
      setApplyingTemplate(null)
    }
  }

return (
    <div className="page-container">
      <VoiceOverlay state={voiceState} onCancel={() => { stopVoice(); setVoiceIdle() }} />

      {/* Barcode scanner */}
      {showScanner && (
        <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}

      {/* Hidden photo input */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoScan}
      />

      {/* Photo scan results modal */}
      {showPhotoResults && scannedItems.length > 0 && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center sm:p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-card shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-textPrimary">📸 Photo scan results</h3>
                <button onClick={() => setShowPhotoResults(false)} className="text-textMuted hover:text-textPrimary text-xl">✕</button>
              </div>
              <p className="text-sm text-textMuted mb-4">
                Found {scannedItems.length} items. Select which ones to add to your pantry.
              </p>

              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setSelectedScannedItems(scannedItems.map((_, i) => i))}
                  className="text-xs text-primary hover:underline"
                >
                  Select all
                </button>
                <span className="text-textMuted">·</span>
                <button
                  onClick={() => setSelectedScannedItems([])}
                  className="text-xs text-textMuted hover:underline"
                >
                  Deselect all
                </button>
              </div>

              <div className="space-y-2 mb-6">
                {scannedItems.map((item, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedScannedItems(prev =>
                      prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
                    )}
                    className={`flex items-center gap-3 p-3 rounded-btn border cursor-pointer transition-all ${
                      selectedScannedItems.includes(i)
                        ? 'border-primary bg-blue-50'
                        : 'border-border hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedScannedItems.includes(i) ? 'border-primary bg-primary' : 'border-gray-300'
                    }`}>
                      {selectedScannedItems.includes(i) && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span className="text-xl">{item.icon}</span>
                    <div className="flex-1 min-w-0" onClick={e => e.stopPropagation()}>
                      <input
                        className="text-sm font-medium text-textPrimary bg-transparent border-b border-transparent hover:border-gray-300 focus:border-primary focus:outline-none w-full"
                        value={item.name}
                        onChange={e => {
                          const updated = [...scannedItems]
                          updated[i] = { ...updated[i], name: e.target.value }
                          setScannedItems(updated)
                        }}
                      />
                      <div className="flex items-center gap-1 mt-0.5" onClick={e => e.stopPropagation()}>
  <input
    className="text-xs text-textMuted bg-transparent border-b border-transparent hover:border-gray-300 focus:border-primary focus:outline-none w-16"
    type="number"
    min="0.1"
    step="0.1"
    value={item.quantity}
    onChange={e => {
      const updated = [...scannedItems]
      updated[i] = { ...updated[i], quantity: parseFloat(e.target.value) || 1 }
      setScannedItems(updated)
    }}
  />
  <span className="text-xs text-textMuted">{item.unit} · {item.category}</span>
</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowPhotoResults(false)} className="btn-secondary flex-1">Cancel</button>
                <button
                  onClick={handleAddScannedItems}
                  disabled={selectedScannedItems.length === 0}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  Add {selectedScannedItems.length} items to pantry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Templates modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center sm:p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-card shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-textPrimary">🗂️ Pantry starter templates</h3>
                <button onClick={() => setShowTemplates(false)} className="text-textMuted hover:text-textPrimary text-xl">✕</button>
              </div>
              <p className="text-sm text-textMuted mb-6">
                Choose a grocery template to quickly populate your pantry with common staples. Existing items won't be duplicated.
              </p>
              <div className="space-y-3">
                {templates.map(template => (
                  <div key={template.id} className="flex items-center justify-between p-4 rounded-btn border border-border hover:border-primary transition-all">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{template.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-textPrimary">{template.name}</p>
                        <p className="text-xs text-textMuted">{template.description}</p>
                        <p className="text-xs text-primary mt-0.5">{template.itemCount} items</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleApplyTemplate(template.id, template.name)}
                      disabled={applyingTemplate === template.id}
                      className="btn-primary text-sm px-4 py-2 disabled:opacity-50 flex-shrink-0"
                    >
                      {applyingTemplate === template.id ? 'Adding...' : 'Use template'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scan result preview */}
      {scanResult && (
        <div className="card mb-4 border border-primary bg-blue-50/20">
          <div className="flex items-center gap-3">
            {scanResult.image && (
              <img src={scanResult.image} alt={scanResult.name} className="w-12 h-12 object-contain rounded-btn" />
            )}
            <div>
              <p className="text-sm font-semibold text-textPrimary">{scanResult.name}</p>
              {scanResult.brand && <p className="text-xs text-textMuted">{scanResult.brand}</p>}
              <p className="text-xs text-success mt-0.5">✓ Product found — form filled automatically</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
     <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-textPrimary">Pantry</h1>
          <p className="text-textMuted mt-1">{items.length} items tracked across your home</p>
        </div>
        <div className="flex gap-2 flex-wrap sm:flex-nowrap overflow-x-auto pb-1">
          {/* Barcode scan */}
          <button
            onClick={() => setShowScanner(true)}
            disabled={scanLoading}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            {scanLoading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Looking up...
              </>
            ) : '📷 Scan barcode'}
          </button>

          {/* AI Photo scan */}
          {canPhotoScan && (
            <button
              onClick={() => photoInputRef.current?.click()}
              disabled={photoScanning}
              className="btn-secondary flex items-center gap-2 text-sm border-purple-200 text-purple-600 hover:bg-purple-50"
            >
              {photoScanning ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Scanning photo...
                </>
              ) : (
                <>
                  🫧 AI photo scan
                  {scanStatus?.scansRemaining !== null && scanStatus?.scansRemaining !== undefined && (
                    <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-pill">
                      {scanStatus.scansRemaining} left
                    </span>
                  )}
                </>
              )}
            </button>
          )}

          {/* Templates */}
          {canUseTemplates && (
            <button
              onClick={() => setShowTemplates(true)}
              className="btn-secondary flex items-center gap-2 text-sm border-orange-200 text-orange-600 hover:bg-orange-50"
            >
              🗂️ Grocery Templates
            </button>
          )}

        {/* Voice input */}
          {voiceSupported && canUseVoice && (
            <button
              onClick={startVoice}
              disabled={voiceState !== 'idle'}
              title="Add item by voice"
              className={`relative flex items-center gap-2 text-sm px-3 py-2 rounded-btn border font-medium transition-all overflow-hidden ${
                voiceState === 'listening'
                  ? 'border-red-300 text-red-600 bg-red-50'
                  : voiceState === 'parsing'
                  ? 'border-blue-200 text-primary bg-blue-50'
                  : 'btn-secondary'
              }`}
            >
              {/* Ripple ring when listening */}
              {voiceState === 'listening' && (
                <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="w-full h-full rounded-btn border-2 border-red-400 opacity-40 animate-ping absolute" />
                </span>
              )}

              {voiceState === 'parsing' ? (
                <>
                  <svg className="animate-spin w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  <span>Parsing...</span>
                </>
              ) : voiceState === 'listening' ? (
                <>
                  <span className="relative flex h-3 w-3 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                  </span>
                  <span>Listening...</span>
                </>
              ) : (
                <>🎙️ <span>Voice add</span></>
              )}
            </button>
          )}

          {/* Add item */}
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <span className="text-lg">+</span> Add item
          </button>
        </div>
      </div>

      {/* CO2 footprint summary banner */}
      {isFeatureEnabled('co2_tracking', plan) && co2Data?.locked && (
        <div className="mb-6 rounded-card border border-green-200 bg-green-50 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-green-800">🌍 CO2 footprint tracking</p>
            <p className="text-xs text-green-600 mt-1">Available on Family plan ($7/mo)</p>
          </div>
          <a href="/app/settings?tab=plan" className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-pill font-medium hover:bg-green-700 transition-all">
            Upgrade →
          </a>
        </div>
      )}

      {isFeatureEnabled('co2_tracking', plan) && co2Data && !co2Data.locked && co2Data.totalCO2 > 0 && (
        <div className="mb-6 rounded-card border border-green-200 bg-green-50 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-green-800">🌍 Pantry CO2 footprint</p>
            <button onClick={() => setShowCO2(!showCO2)} className="text-xs text-green-700 hover:underline font-medium">
              {showCO2 ? 'Hide details' : 'Show details'}
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-2xl font-bold text-green-700">{co2Data.totalCO2}kg</p>
              <p className="text-xs text-green-600">CO2 in your pantry</p>
            </div>
            <div className="flex-1 h-2 bg-green-200 rounded-pill overflow-hidden">
              <div className="h-full bg-green-500 rounded-pill" style={{ width: `${Math.min((co2Data.totalCO2 / co2Data.canadianAvgMonthly) * 100, 100)}%` }} />
            </div>
            <div className="text-right">
              <p className={`text-sm font-semibold ${co2Data.comparison <= 0 ? 'text-success' : 'text-orange-500'}`}>
                {co2Data.comparison !== null ? co2Data.comparison <= 0 ? `${Math.abs(co2Data.comparison)}% below avg` : `${co2Data.comparison}% above avg` : ''}
              </p>
              <p className="text-xs text-green-600">vs {co2Data.canadianAvgMonthly}kg avg</p>
            </div>
          </div>
          {showCO2 && (
            <div className="mt-3 pt-3 border-t border-green-200">
              <p className="text-xs font-semibold text-green-800 mb-2">Top contributors</p>
              <div className="space-y-1">
                {co2Data.items.filter(i => i.co2Total > 0).sort((a, b) => b.co2Total - a.co2Total).slice(0, 5).map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-green-800">{item.co2Label?.icon} {item.name}</span>
                    <span className="text-green-700 font-medium">{item.co2Total}kg CO2</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Expiring soon banner */}
      {isFeatureEnabled('smart_expiry', plan) && expiringSoon.length > 0 && (
        <div className="mb-6 rounded-card border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm font-semibold text-yellow-800 mb-2">⚠️ Expiring Soon</p>
          <div className="flex flex-col gap-1">
            {expiringSoon.map(item => (
              <div key={item.id} className="flex items-center justify-between text-xs">
                <span className="text-yellow-900">{item.icon} {item.name}</span>
                <span className={`font-semibold px-2 py-0.5 rounded-pill ${
                  item.urgency === 'expired' ? 'bg-red-100 text-red-700' :
                  item.urgency === 'critical' ? 'bg-orange-100 text-orange-700' :
                  item.urgency === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {item.isExpired ? 'Expired' : item.daysLeft === 0 ? 'Today' : `${item.daysLeft}d left`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add item form */}
      {showForm && (
        <div className="card mb-6 border-primary border-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-textPrimary">Add new item</h2>
            <button onClick={() => { setShowForm(false); setFormError(''); setScanResult(null) }} className="text-textMuted hover:text-textPrimary text-xl leading-none">✕</button>
          </div>
          {formError && (
            <div className="bg-red-50 border border-red-100 text-danger text-sm px-4 py-3 rounded-btn mb-4">{formError}</div>
          )}
          <form onSubmit={handleAdd}>
            <div className="mb-4">
              <label className="label">Icon</label>
              <div className="flex gap-2 flex-wrap">
                {ICONS.map(ic => (
                  <button key={ic} type="button" onClick={() => update('icon', ic)}
                    className={`w-9 h-9 rounded-btn text-xl flex items-center justify-center border transition-all ${form.icon === ic ? 'border-primary bg-blue-50' : 'border-border hover:bg-gray-50'}`}>
                    {ic}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label">Item name</label>
                <input className="input" placeholder="e.g. Natrel 2% Milk, Dempster's Bread..." value={form.name} onChange={e => update('name', e.target.value)} />
                <p className="text-xs text-textMuted mt-1.5">💡 Include brand name for more accurate recall alerts</p>
              </div>
              <div>
                <label className="label">Quantity</label>
                <div className="flex gap-2">
                  <input className="input" type="number" placeholder="e.g. 2" value={form.quantity} onChange={e => update('quantity', e.target.value)} style={{ width: '60%' }} />
                  <select className="input" value={form.unit} onChange={e => update('unit', e.target.value)} style={{ width: '40%' }}>
                    {UNITS.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Category</label>
                <select className="input" value={form.isCustomCategory ? '__custom__' : form.category}
                  onChange={e => {
                    if (e.target.value === '__custom__') { update('category', ''); update('isCustomCategory', true) }
                    else { update('category', e.target.value); update('isCustomCategory', false) }
                  }}>
                  {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                  <option value="__custom__">+ Create custom category</option>
                </select>
                {form.isCustomCategory && (
                  <input className="input mt-2" placeholder="e.g. Breakfast items, Baby food..." value={form.category} onChange={e => update('category', e.target.value)} autoFocus />
                )}
              </div>
              <div>
                <label className="label">Expiry date <span className="text-textMuted font-normal">(leave blank to auto-predict)</span></label>
                <input type="date" className="input" value={form.expiry} onChange={e => update('expiry', e.target.value)} />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => { setShowForm(false); setFormError(''); setScanResult(null) }} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Add to pantry</button>
            </div>
          </form>
        </div>
      )}

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 mt-4">
        <input className="input flex-1" placeholder="Search pantry items..." value={search} onChange={e => setSearch(e.target.value)} />
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-pill text-sm font-medium border transition-all ${
                activeCategory === cat ? 'bg-primary text-white border-primary' : 'bg-surface text-textMuted border-border hover:border-primary hover:text-primary'
              }`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Items grid */}
      {loading ? <LoadingSpinner /> : error ? <ErrorState message={error} onRetry={fetchItems} /> : filtered.length === 0 ? (
        <EmptyState icon="🧺" title="No items found" subtitle="Try a different search or add a new item" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(item => {
            const itemCO2 = getItemCO2(item.name)
            return (
              <div key={item.id} className="card hover:shadow-md transition-shadow relative group">
                <button onClick={() => handleDelete(item.id)}
                  className="absolute top-3 right-3 w-7 h-7 rounded-full bg-gray-100 text-textMuted hover:bg-red-50 hover:text-danger transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center text-sm">
                  ✕
                </button>
                <button onClick={() => { setRestockingId(item.id); setRestockQty('') }}
                  className="absolute top-3 left-3 text-xs bg-green-50 text-success px-2 py-1 rounded-pill border border-green-100 opacity-0 group-hover:opacity-100 transition-all font-medium hover:bg-green-100">
                  + Restock
                </button>
                {restockingId === item.id && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-textMuted mb-2">How much did you buy?</p>
                    <div className="flex gap-2">
                      <input type="number" className="input text-sm py-1.5" placeholder={`Add ${item.unit}`} value={restockQty} onChange={e => setRestockQty(e.target.value)} autoFocus />
                      <button onClick={() => handleRestock(item.id)} className="btn-primary text-xs px-3 py-1.5 whitespace-nowrap">Add</button>
                      <button onClick={() => setRestockingId(null)} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
                    </div>
                    <p className="text-xs text-textMuted mt-1">Current: {item.quantity} {item.unit} → New: {(item.quantity + (parseFloat(restockQty) || 0)).toFixed(1)} {item.unit}</p>
                  </div>
                )}
                <div className="text-3xl mb-3 mt-6">{item.icon}</div>
                <p className="font-semibold text-textPrimary">{item.name}</p>
                <p className="text-sm text-textMuted mt-0.5">{item.quantity} {item.unit}</p>
                {item.expirySource === 'ai_predicted' && item.predictedExpiry && <p className="text-xs text-blue-400 mt-1">🫧 AI predicted expiry</p>}
                {item.expirySource === 'pattern_learned' && item.predictedExpiry && <p className="text-xs text-purple-400 mt-1">📊 Learned from your history</p>}
                {itemCO2?.co2Label && <p className="text-xs text-green-600 mt-1">{itemCO2.co2Label.icon} {itemCO2.co2Label.label} CO2</p>}
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs bg-gray-100 text-textMuted px-2.5 py-1 rounded-pill">{item.category}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-pill font-medium ${
                    isExpired(item.expiry || item.predictedExpiry) ? 'bg-red-50 text-danger' :
                    isExpiringSoon(item.expiry || item.predictedExpiry) ? 'bg-orange-50 text-orange-500' :
                    'bg-green-50 text-success'
                  }`}>
                    {isExpired(item.expiry || item.predictedExpiry) ? 'Expired' :
                     isExpiringSoon(item.expiry || item.predictedExpiry) ? 'Expiring soon' :
                     item.expiry ? `Exp: ${item.expiry}` :
                     item.predictedExpiry ? `~${new Date(item.predictedExpiry).toLocaleDateString('en-CA')}` : 'No expiry'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

    </div>
  )
}