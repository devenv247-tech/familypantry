import { useState, useEffect } from 'react'
import { getGroceryItems, addGroceryItem, updateGroceryItem, deleteGroceryItem, clearCheckedItems } from '../api/grocery'

const STORES = ['All stores', 'Superstore', 'Walmart', 'T&T Supermarket']

export default function Grocery() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeStore, setActiveStore] = useState('All stores')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', qty: '', store: 'Superstore', price: '', category: '', isCustomStore: false })
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      const data = await getGroceryItems()
      setItems(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const update = (f, v) => setForm(p => ({ ...p, [f]: v }))

  const filtered = items.filter(i =>
    activeStore === 'All stores' || i.store === activeStore
  )

  const toggleCheck = async (id) => {
    const item = items.find(i => i.id === id)
    try {
      const updated = await updateGroceryItem(id, { checked: !item.checked })
      setItems(prev => prev.map(i => i.id === id ? updated : i))
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteGroceryItem(id)
      setItems(prev => prev.filter(i => i.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    try {
      const item = await addGroceryItem(form)
      setItems(prev => [item, ...prev])
      setForm({ name: '', qty: '', store: 'Superstore', price: '', category: '', isCustomStore: false })
      setShowForm(false)
    } catch (err) {
      console.error(err)
    }
  }

  const handleClearChecked = async () => {
    try {
      await clearCheckedItems()
      setItems(prev => prev.filter(i => !i.checked))
    } catch (err) {
      console.error(err)
    }
  }
  const handleEdit = async (id) => {
  try {
    const updated = await updateGroceryItem(id, editForm)
    setItems(prev => prev.map(i => i.id === id ? updated : i))
    setEditingId(null)
    setEditForm({})
  } catch (err) {
    console.error(err)
  }
}
  const totalCost = items
    .filter(i => !i.checked)
    .reduce((sum, i) => sum + parseFloat(i.price?.replace('$', '') || 0), 0)

  const checkedCount = items.filter(i => i.checked).length

  return (
    <div className="p-8 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-textPrimary">Grocery list</h1>
          <p className="text-textMuted mt-1">{checkedCount} of {items.length} items checked off</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowForm(true)}
            className="btn-secondary flex items-center gap-2"
          >
            + Add item
          </button>
          <button className="btn-primary flex items-center gap-2">
            🤖 Auto-generate
          </button>
        </div>
      </div>

      {/* Stats strip */}
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
                <label className="label">Estimated price</label>
                <input className="input" placeholder="e.g. $3.99" value={form.price} onChange={e => update('price', e.target.value)} />
              </div>
            <div>
  <label className="label">Store</label>
  <select
    className="input"
    value={form.isCustomStore ? '__custom__' : form.store}
    onChange={e => {
      if (e.target.value === '__custom__') {
        update('store', '')
        update('isCustomStore', true)
      } else {
        update('store', e.target.value)
        update('isCustomStore', false)
      }
    }}
  >
    {STORES.filter(s => s !== 'All stores').map(s => <option key={s}>{s}</option>)}
    <option value="__custom__">+ Custom store</option>
  </select>
  {form.isCustomStore && (
    <input
      className="input mt-2"
      placeholder="e.g. Costco, No Frills..."
      value={form.store}
      onChange={e => update('store', e.target.value)}
      autoFocus
    />
  )}
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
        {STORES.map(store => (
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

      {/* Loading */}
      {loading && (
        <div className="text-center py-12 text-textMuted">
          <p className="text-sm">Loading grocery list...</p>
        </div>
      )}

      {/* Items list */}
      {!loading && (
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
                    <select
                      className="input text-sm py-1.5"
                      value={editForm.store || ''}
                      onChange={e => setEditForm(p => ({ ...p, store: e.target.value }))}
                    >
                      <option value="">Select store</option>
                      {STORES.filter(s => s !== 'All stores').map(s => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Price</label>
                    <input
                      className="input text-sm py-1.5"
                      placeholder="e.g. $3.99"
                      value={editForm.price || ''}
                      onChange={e => setEditForm(p => ({ ...p, price: e.target.value }))}
                    />
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
                  <p className={`text-sm font-medium ${item.checked ? 'line-through text-textMuted' : 'text-textPrimary'}`}>
                    {item.name}
                  </p>
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
          <button
            onClick={handleClearChecked}
            className="text-sm text-danger hover:underline font-medium"
          >
            Remove {checkedCount} checked item{checkedCount > 1 ? 's' : ''}
          </button>
        </div>
      )}

    </div>
  )
}