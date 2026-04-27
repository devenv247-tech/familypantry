import { getPantryItems, addPantryItem, deletePantryItem, restockPantryItem } from '../api/pantry'
import { useState, useEffect } from 'react'
import BarcodeScanner from '../components/ui/BarcodeScanner'
import { lookupBarcode } from '../api/barcode'
import { LoadingSpinner, ErrorState, EmptyState, Toast } from '../components/ui/PageState'
import { useToast } from '../hooks/useToast'

const UNITS = ['pcs', 'kg', 'g', 'mg', 'L', 'ml', 'lb', 'oz', 'cup', 'tbsp', 'tsp', 'gallon']
const EMPTY_FORM = { name: '', quantity: '', unit: 'pcs', category: 'Fridge', expiry: '', icon: '🛒', isCustomCategory: false }
const CATEGORIES = ['All', 'Fridge', 'Freezer', 'Dry goods', 'Spices', 'Snacks']
const ICONS = ['🥛', '🍗', '🍚', '🥚', '🌿', '🫛', '🌾', '🥣', '🧀', '🥦', '🍎', '🥕', '🧅', '🫙', '🥩', '🍞', '🛒']

export default function Pantry() {
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
  const { toast, showToast, hideToast } = useToast()

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      setError('')
      const data = await getPantryItems()
      setItems(data)
    } catch (err) {
      console.error(err)
      setError('Failed to load pantry items')
    } finally {
      setLoading(false)
    }
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
    } catch (err) {
      setFormError('Failed to add item. Please try again.')
    }
  }

  const handleDelete = async (id) => {
    try {
      await deletePantryItem(id)
      setItems(prev => prev.filter(i => i.id !== id))
      showToast('Item removed from pantry')
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
      // Check allergens against family members
      if (product.nutrition) {
        const members = await import('../api/family').then(m => m.getMembers())
        const allergenWarnings = []

        members.forEach(member => {
          if (!member.allergens) return
          const memberAllergens = member.allergens.split(',').map(a => a.trim().toLowerCase())
          const productAllergens = Object.keys(product.nutrition).filter(k =>
            k.toLowerCase().includes('allergen') || k.toLowerCase().includes('contains')
          )

          memberAllergens.forEach(allergen => {
            const productText = JSON.stringify(product).toLowerCase()
            if (productText.includes(allergen.toLowerCase())) {
              allergenWarnings.push(`${member.name} — may contain ${allergen}`)
            }
          })
        })

        if (allergenWarnings.length > 0) {
          showToast(`⚠️ Allergen alert: ${allergenWarnings[0]}`, 'error')
        }
      }

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
    console.error(err)
    showToast('Could not look up product. Please add manually.', 'error')
  } finally {
    setScanLoading(false)
  }
}

  return (
    <div className="page-container">

      {/* Barcode scanner */}
      {showScanner && (
        <BarcodeScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-textPrimary">Pantry</h1>
          <p className="text-textMuted mt-1">{items.length} items tracked across your home</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowScanner(true)}
            className="btn-secondary flex items-center gap-2"
            disabled={scanLoading}
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
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <span className="text-lg">+</span> Add item
          </button>
        </div>
      </div>

      {/* Add item form */}
      {showForm && (
        <div className="card mb-6 border-primary border-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-textPrimary">Add new item</h2>
            <button onClick={() => { setShowForm(false); setFormError(''); setScanResult(null) }} className="text-textMuted hover:text-textPrimary text-xl leading-none">✕</button>
          </div>

          {formError && (
            <div className="bg-red-50 border border-red-100 text-danger text-sm px-4 py-3 rounded-btn mb-4">
              {formError}
            </div>
          )}

          <form onSubmit={handleAdd}>
            <div className="mb-4">
              <label className="label">Icon</label>
              <div className="flex gap-2 flex-wrap">
                {ICONS.map(ic => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => update('icon', ic)}
                    className={`w-9 h-9 rounded-btn text-xl flex items-center justify-center border transition-all ${form.icon === ic ? 'border-primary bg-blue-50' : 'border-border hover:bg-gray-50'}`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label">Item name</label>
                <input
                  className="input"
                  placeholder="e.g. Basmati rice"
                  value={form.name}
                  onChange={e => update('name', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Quantity</label>
                <div className="flex gap-2">
                  <input
                    className="input"
                    type="number"
                    placeholder="e.g. 2"
                    value={form.quantity}
                    onChange={e => update('quantity', e.target.value)}
                    style={{ width: '60%' }}
                  />
                  <select
                    className="input"
                    value={form.unit}
                    onChange={e => update('unit', e.target.value)}
                    style={{ width: '40%' }}
                  >
                    {UNITS.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Category</label>
                <select
                  className="input"
                  value={form.isCustomCategory ? '__custom__' : form.category}
                  onChange={e => {
                    if (e.target.value === '__custom__') {
                      update('category', '')
                      update('isCustomCategory', true)
                    } else {
                      update('category', e.target.value)
                      update('isCustomCategory', false)
                    }
                  }}
                >
                  {CATEGORIES.filter(c => c !== 'All').map(c => (
                    <option key={c}>{c}</option>
                  ))}
                  <option value="__custom__">+ Create custom category</option>
                </select>
                {form.isCustomCategory && (
                  <input
                    className="input mt-2"
                    placeholder="e.g. Breakfast items, Baby food..."
                    value={form.category}
                    onChange={e => update('category', e.target.value)}
                    autoFocus
                  />
                )}
              </div>
              <div>
                <label className="label">Expiry date</label>
                <input
                  type="date"
                  className="input"
                  value={form.expiry}
                  onChange={e => update('expiry', e.target.value)}
                />
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
        <input
          className="input flex-1"
          placeholder="Search pantry items..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-pill text-sm font-medium border transition-all ${
                activeCategory === cat
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface text-textMuted border-border hover:border-primary hover:text-primary'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Items grid */}
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchItems} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🧺"
          title="No items found"
          subtitle="Try a different search or add a new item"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(item => (
            <div key={item.id} className="card hover:shadow-md transition-shadow relative group">

              <button
                onClick={() => handleDelete(item.id)}
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-gray-100 text-textMuted hover:bg-red-50 hover:text-danger transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center text-sm"
              >
                ✕
              </button>

              <button
                onClick={() => {
                  setRestockingId(item.id)
                  setRestockQty('')
                }}
                className="absolute top-3 left-3 text-xs bg-green-50 text-success px-2 py-1 rounded-pill border border-green-100 opacity-0 group-hover:opacity-100 transition-all font-medium hover:bg-green-100"
              >
                + Restock
              </button>

              {restockingId === item.id && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-textMuted mb-2">How much did you buy?</p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      className="input text-sm py-1.5"
                      placeholder={`Add ${item.unit}`}
                      value={restockQty}
                      onChange={e => setRestockQty(e.target.value)}
                      autoFocus
                    />
                    <button
                      onClick={() => handleRestock(item.id)}
                      className="btn-primary text-xs px-3 py-1.5 whitespace-nowrap"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setRestockingId(null)}
                      className="btn-secondary text-xs px-3 py-1.5"
                    >
                      Cancel
                    </button>
                  </div>
                  <p className="text-xs text-textMuted mt-1">
                    Current: {item.quantity} {item.unit} → New: {(item.quantity + (parseFloat(restockQty) || 0)).toFixed(1)} {item.unit}
                  </p>
                </div>
              )}

              <div className="text-3xl mb-3 mt-6">{item.icon}</div>
              <p className="font-semibold text-textPrimary">{item.name}</p>
              <p className="text-sm text-textMuted mt-0.5">{item.quantity} {item.unit}</p>

              <div className="flex items-center justify-between mt-4">
                <span className="text-xs bg-gray-100 text-textMuted px-2.5 py-1 rounded-pill">
                  {item.category}
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-pill font-medium ${
                  isExpired(item.expiry)
                    ? 'bg-red-50 text-danger'
                    : isExpiringSoon(item.expiry)
                    ? 'bg-orange-50 text-orange-500'
                    : 'bg-green-50 text-success'
                }`}>
                  {isExpired(item.expiry)
                    ? 'Expired'
                    : isExpiringSoon(item.expiry)
                    ? 'Expiring soon'
                    : item.expiry ? `Exp: ${item.expiry}` : 'No expiry'}
                </span>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

    </div>
  )
}