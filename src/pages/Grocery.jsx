import { useState, useEffect } from 'react'
import { getGroceryItems, addGroceryItem, updateGroceryItem, deleteGroceryItem, clearCheckedItems } from '../api/grocery'
import { recordPrice, checkPriceAnomaly, getPriceAlerts } from '../api/priceAnomaly'
import { LoadingSpinner, ErrorState, Toast } from '../components/ui/PageState'
import { useToast } from '../hooks/useToast'

export default function Grocery() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeStore, setActiveStore] = useState('All stores')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', qty: '', store: '', price: '', category: '', isCustomStore: false })
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [priceAlerts, setPriceAlerts] = useState([])
  const [anomalyModal, setAnomalyModal] = useState(null)
  const { toast, showToast, hideToast } = useToast()

  const DEFAULT_STORES = ['Superstore', 'Walmart', 'T&T Supermarket', 'Costco', 'No Frills']

  const allStores = [...new Set([
    ...DEFAULT_STORES,
    ...items.map(i => i.store).filter(Boolean)
  ])]

  useEffect(() => {
    fetchItems()
    fetchPriceAlerts()
  }, [])

  const fetchItems = async () => {
    try {
      setError('')
      const data = await getGroceryItems()
      setItems(data)
    } catch (err) {
      setError('Failed to load grocery list')
    } finally {
      setLoading(false)
    }
  }

  const fetchPriceAlerts = async () => {
    try {
      const data = await getPriceAlerts()
      setPriceAlerts(data.alerts || [])
    } catch (err) {
      console.error('Failed to load price alerts:', err)
    }
  }

  const update = (f, v) => setForm(p => ({ ...p, [f]: v }))

  const filtered = items.filter(i =>
    activeStore === 'All stores' || i.store === activeStore
  )

  const toggleCheck = async (id) => {
    const item = items.find(i => i.id === id)
    try {
      const updated = await updateGroceryItem(id, { checked: !item.checked, purchased: !item.checked, purchasedAt: !item.checked ? new Date() : null })
      setItems(prev => prev.map(i => i.id === id ? updated : i))

      // Record price when item is checked off
      if (!item.checked && item.price && parseFloat(item.price) > 0) {
        try {
          await recordPrice(item.name, parseFloat(item.price), item.store)
          await fetchPriceAlerts()
        } catch (e) {
          console.log('Price record skipped:', e.message)
        }
      }
    } catch (err) {
      showToast('Failed to update item', 'error')
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteGroceryItem(id)
      setItems(prev => prev.filter(i => i.id !== id))
      showToast('Item removed')
    } catch (err) {
      showToast('Failed to delete item', 'error')
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    try {
      const item = await addGroceryItem(form)
      setItems(prev => [item, ...prev])

      // Check price anomaly if price is set
      if (form.price && parseFloat(form.price) > 0) {
        try {
          const anomaly = await checkPriceAnomaly(form.name, parseFloat(form.price), form.store)
          if (anomaly.hasAnomaly) {
            setAnomalyModal(anomaly.anomaly)
          }
        } catch (e) {
          console.log('Price check skipped:', e.message)
        }
      }

      setForm({ name: '', qty: '', store: '', price: '', category: '', isCustomStore: false })
      setShowForm(false)
      showToast('Item added to grocery list!')
    } catch (err) {
      showToast('Failed to add item', 'error')
    }
  }

  const handleEdit = async (id) => {
    try {
      const updated = await updateGroceryItem(id, editForm)
      setItems(prev => prev.map(i => i.id === id ? updated : i))
      setEditingId(null)
      setEditForm({})
      showToast('Item updated!')
    } catch (err) {
      showToast('Failed to update item', 'error')
    }
  }

  const handleClearChecked = async () => {
    try {
      await clearCheckedItems()
      setItems(prev => prev.filter(i => !i.checked))
      showToast('Checked items removed')
    } catch (err) {
      showToast('Failed to clear items', 'error')
    }
  }

  const totalCost = items
    .filter(i => !i.checked)
    .reduce((sum, i) => sum + parseFloat(i.price?.replace('$', '') || 0), 0)

  const checkedCount = items.filter(i => i.checked).length

  const StoreSelect = ({ value, isCustom, onChange, onCustomChange, className = 'input' }) => (
    <>
      <select
        className={className}
        value={isCustom ? '__custom__' : value || ''}
        onChange={e => {
          if (e.target.value === '__custom__') {
            onChange('', true)
          } else {
            onChange(e.target.value, false)
          }
        }}
      >
        <option value="">Select store</option>
        {allStores.map(s => <option key={s}>{s}</option>)}
        <option value="__custom__">+ Custom store</option>
      </select>
      {isCustom && (
        <input
          className={`${className} mt-2`}
          placeholder="e.g. Safeway, FreshCo..."
          value={value}
          onChange={e => onCustomChange(e.target.value)}
          autoFocus
        />
      )}
    </>
  )

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8 max-w-5xl mx-auto">

      {/* Price anomaly modal */}
      {anomalyModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-card shadow-xl w-full max-w-sm p-6">
            <div className="text-3xl mb-3 text-center">{anomalyModal.icon}</div>
            <h3 className="font-semibold text-textPrimary text-lg mb-2 text-center">{anomalyModal.message}</h3>
            <p className="text-sm text-textMuted text-center mb-2">{anomalyModal.detail}</p>
            <div className={`rounded-btn px-4 py-3 mb-4 text-center ${
              anomalyModal.type === 'high' ? 'bg-orange-50 border border-orange-100' : 'bg-green-50 border border-green-100'
            }`}>
              <p className={`text-sm font-medium ${anomalyModal.type === 'high' ? 'text-orange-600' : 'text-success'}`}>
                {anomalyModal.suggestion}
              </p>
            </div>
            <button onClick={() => setAnomalyModal(null)} className="btn-primary w-full">Got it</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-textPrimary">Grocery list</h1>
          <p className="text-textMuted mt-1">{checkedCount} of {items.length} items checked off</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowForm(true)} className="btn-secondary flex items-center gap-2">
            + Add item
          </button>
          <button className="btn-primary flex items-center gap-2">
            🤖 Auto-generate
          </button>
        </div>
      </div>

    {/* Price alerts */}
      {priceAlerts.length > 0 && !priceAlerts.locked && (
        <div className="card mb-6 border border-orange-100 bg-orange-50/20">
          <h2 className="font-semibold text-textPrimary mb-3">💰 Price alerts</h2>
          <div className="space-y-2">
            {priceAlerts.map((alert, i) => (
              <div key={i} className={`flex items-center justify-between rounded-btn px-3 py-2 border text-xs ${
                alert.type === 'high' ? 'bg-orange-50 border-orange-100' : 'bg-green-50 border-green-100'
              }`}>
                <div className="flex items-center gap-2">
                  <span>{alert.icon}</span>
                  <div>
                    <p className={`font-medium ${alert.type === 'high' ? 'text-orange-700' : 'text-success'}`}>
                      {alert.itemName}
                    </p>
                    <p className="text-textMuted">
                      Avg: ${alert.avgPrice} → Now: ${alert.currentPrice}
                      {alert.store && ` at ${alert.store}`}
                    </p>
                  </div>
                </div>
                <span className={`font-bold px-2 py-0.5 rounded-pill ${
                  alert.type === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-success'
                }`}>
                  {alert.percentChange > 0 ? '+' : ''}{alert.percentChange}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card text-center">
          <p className="text-2xl font-bold text-textPrimary">{items.length}</p>
          <p className="text-xs text-textMuted mt-1">Total items</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-success">{checkedCount}</p>
          <p className="text-xs text-textMuted mt-1">Checked off</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-primary">${totalCost.toFixed(2)}</p>
          <p className="text-xs text-textMuted mt-1">Estimated total</p>
        </div>
      </div>

      {/* Add item form */}
      {showForm && (
        <div className="card mb-6 border-2 border-primary">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-textPrimary">Add item</h2>
            <button onClick={() => setShowForm(false)} className="text-textMuted hover:text-textPrimary text-xl">✕</button>
          </div>
          <form onSubmit={handleAdd}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="label">Item name</label>
                <input className="input" placeholder="e.g. Milk" value={form.name} onChange={e => update('name', e.target.value)} />
              </div>
              <div>
                <label className="label">Quantity</label>
                <input className="input" placeholder="e.g. 2L" value={form.qty} onChange={e => update('qty', e.target.value)} />
              </div>
              <div>
                <label className="label">Estimated price <span className="text-textMuted font-normal">(for anomaly detection)</span></label>
                <div className="flex items-center border border-border rounded-btn focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-primary transition-all">
                  <span className="px-3 text-textMuted text-sm border-r border-border bg-gray-50 rounded-l-btn py-2.5">$</span>
                  <input
                    className="flex-1 px-3 py-2.5 text-sm text-textPrimary outline-none rounded-r-btn"
                    placeholder="0.00"
                    value={form.price?.replace('$', '') || ''}
                    onChange={e => update('price', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="label">Store</label>
                <StoreSelect
                  value={form.store}
                  isCustom={form.isCustomStore}
                  onChange={(val, isCustom) => {
                    update('store', val)
                    update('isCustomStore', isCustom)
                  }}
                  onCustomChange={val => update('store', val)}
                />
              </div>
              <div>
                <label className="label">Category</label>
                <input className="input" placeholder="e.g. Dairy" value={form.category} onChange={e => update('category', e.target.value)} />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Add to list</button>
            </div>
          </form>
        </div>
      )}

      {/* Store filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        {['All stores', ...new Set(items.map(i => i.store).filter(Boolean))].map(store => (
          <button
            key={store}
            onClick={() => setActiveStore(store)}
            className={`px-4 py-2 rounded-pill border text-sm font-medium transition-all ${
              activeStore === store
                ? 'bg-primary text-white border-primary'
                : 'bg-surface text-textMuted border-border hover:border-primary hover:text-primary'
            }`}
          >
            {store}
          </button>
        ))}
      </div>

      {/* Progress bar */}
      {items.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between text-xs text-textMuted mb-1.5">
            <span>Shopping progress</span>
            <span>{Math.round((checkedCount / items.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-pill overflow-hidden">
            <div
              className="h-full bg-success rounded-pill transition-all duration-500"
              style={{ width: `${(checkedCount / items.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Items list */}
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchItems} />
      ) : (
        <div className="card p-0 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-textMuted">
              <div className="text-4xl mb-3">🛒</div>
              <p className="font-medium">No items yet</p>
              <p className="text-sm mt-1">Click Add item to get started</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map(item => (
                <li key={item.id} className="border-b border-border last:border-0">
                  {editingId === item.id ? (
                    <div className="px-5 py-4 bg-blue-50/30">
                      <p className="text-xs font-semibold text-textPrimary mb-3">Edit item</p>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="label">Name</label>
                          <input
                            className="input text-sm py-1.5"
                            value={editForm.name || ''}
                            onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="label">Quantity</label>
                          <input
                            className="input text-sm py-1.5"
                            value={editForm.qty || ''}
                            onChange={e => setEditForm(p => ({ ...p, qty: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="label">Store</label>
                          <StoreSelect
                            value={editForm.store}
                            isCustom={editForm.isCustomStore}
                            onChange={(val, isCustom) => setEditForm(p => ({ ...p, store: val, isCustomStore: isCustom }))}
                            onCustomChange={val => setEditForm(p => ({ ...p, store: val }))}
                            className="input text-sm py-1.5"
                          />
                        </div>
                        <div>
                          <label className="label">Price</label>
                          <div className="flex items-center border border-border rounded-btn focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-primary transition-all">
                            <span className="px-3 text-textMuted text-sm border-r border-border bg-gray-50 rounded-l-btn py-2.5">$</span>
                            <input
                              className="flex-1 px-3 py-2.5 text-sm text-textPrimary outline-none rounded-r-btn"
                              placeholder="0.00"
                              value={editForm.price?.replace('$', '') || ''}
                              onChange={e => setEditForm(p => ({ ...p, price: e.target.value }))}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditingId(null)} className="btn-secondary text-xs py-1.5">Cancel</button>
                        <button onClick={() => handleEdit(item.id)} className="btn-primary text-xs py-1.5">Save</button>
                      </div>
                    </div>
                  ) : (
                    <div className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group ${item.checked ? 'opacity-50' : ''}`}>
                      <button
                        onClick={() => toggleCheck(item.id)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          item.checked
                            ? 'bg-success border-success text-white'
                            : 'border-border hover:border-primary'
                        }`}
                      >
                        {item.checked && <span className="text-xs">✓</span>}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-sm font-medium ${item.checked ? 'line-through text-textMuted' : 'text-textPrimary'}`}>
                            {item.name}
                          </p>
                          {/* Price alert badge on item */}
                          {priceAlerts.find(a => a.itemName.toLowerCase() === item.name.toLowerCase()) && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-pill font-medium ${
                              priceAlerts.find(a => a.itemName.toLowerCase() === item.name.toLowerCase())?.type === 'high'
                                ? 'bg-orange-100 text-orange-600'
                                : 'bg-green-100 text-success'
                            }`}>
                              {priceAlerts.find(a => a.itemName.toLowerCase() === item.name.toLowerCase())?.icon}
                              {priceAlerts.find(a => a.itemName.toLowerCase() === item.name.toLowerCase())?.percentChange > 0 ? '+' : ''}
                              {priceAlerts.find(a => a.itemName.toLowerCase() === item.name.toLowerCase())?.percentChange}%
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-textMuted">{item.qty}</span>
                          {item.category && (
                            <span className="text-xs bg-gray-100 text-textMuted px-2 py-0.5 rounded-pill">{item.category}</span>
                          )}
                        </div>
                      </div>

                      <span className="text-xs bg-blue-50 text-primary px-2.5 py-1 rounded-pill border border-blue-100 hidden sm:block">
                        {item.store || 'No store'}
                      </span>

                      <span className="text-sm font-semibold text-textPrimary min-w-[48px] text-right">
                        {item.price}
                      </span>

                      <button
                        onClick={() => {
                          setEditingId(item.id)
                          setEditForm({
                            name: item.name,
                            qty: item.qty,
                            store: item.store,
                            price: item.price,
                            category: item.category,
                            isCustomStore: false,
                          })
                        }}
                        className="w-7 h-7 rounded-full hover:bg-blue-50 hover:text-primary text-textMuted transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center text-sm"
                      >
                        ✎
                      </button>

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="w-7 h-7 rounded-full hover:bg-red-50 hover:text-danger text-textMuted transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Clear checked */}
      {checkedCount > 0 && (
        <div className="mt-4 flex justify-end">
          <button onClick={handleClearChecked} className="text-sm text-danger hover:underline font-medium">
            Remove {checkedCount} checked item{checkedCount > 1 ? 's' : ''}
          </button>
        </div>
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

    </div>
  )
}