import { useState, useEffect } from 'react'
import { getPantryItems, addPantryItem, deletePantryItem, restockPantryItem } from '../api/pantry'



const SAMPLE_ITEMS = [
  { id: 1, name: 'Milk', qty: '2L', category: 'Fridge', expiry: '2026-04-25', icon: '🥛' },
  { id: 2, name: 'Chicken breast', qty: '1kg', category: 'Freezer', expiry: '2026-05-10', icon: '🍗' },
  { id: 3, name: 'Basmati rice', qty: '5kg', category: 'Dry goods', expiry: '2027-01-01', icon: '🍚' },
  { id: 4, name: 'Eggs', qty: '12', category: 'Fridge', expiry: '2026-04-30', icon: '🥚' },
  { id: 5, name: 'Cumin seeds', qty: '200g', category: 'Spices', expiry: '2026-12-01', icon: '🌿' },
  { id: 6, name: 'Frozen peas', qty: '500g', category: 'Freezer', expiry: '2026-08-01', icon: '🫛' },
  { id: 7, name: 'Atta flour', qty: '10kg', category: 'Dry goods', expiry: '2026-09-01', icon: '🌾' },
  { id: 8, name: 'Yogurt', qty: '1kg', category: 'Fridge', expiry: '2026-04-23', icon: '🥣' },
]

const UNITS = ['pcs', 'kg', 'g', 'mg', 'L', 'ml', 'lb', 'oz', 'cup', 'tbsp', 'tsp', 'gallon']
const EMPTY_FORM = { name: '', quantity: '', unit: 'pcs', category: 'Fridge', expiry: '', icon: '🛒', isCustomCategory: false }
const CATEGORIES = ['All', 'Fridge', 'Freezer', 'Dry goods', 'Spices', 'Snacks']
const ICONS = ['🥛', '🍗', '🍚', '🥚', '🌿', '🫛', '🌾', '🥣', '🧀', '🥦', '🍎', '🥕', '🧅', '🫙', '🥩', '🍞', '🛒']

export default function Pantry() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [restockingId, setRestockingId] = useState(null)
  const [restockQty, setRestockQty] = useState('')
  useEffect(() => {
    fetchItems()
  }, [])
  const fetchItems = async () => {
    try {
      const data = await getPantryItems()
      setItems(data)
    } catch (err) {
      console.error(err)
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
  return setError('Please fill in name and quantity')
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
      setError('')
      setShowForm(false)
    } catch (err) {
      setError('Failed to add item. Please try again.')
    }
  }

   const handleDelete = async (id) => {
    try {
      await deletePantryItem(id)
      setItems(prev => prev.filter(i => i.id !== id))
    } catch (err) {
      console.error(err)
    }
  }
  const handleRestock = async (id) => {
  if (!restockQty || parseFloat(restockQty) <= 0) return
  try {
    const updated = await restockPantryItem(id, parseFloat(restockQty))
    setItems(prev => prev.map(i => i.id === id ? updated : i))
    setRestockingId(null)
    setRestockQty('')
  } catch (err) {
    console.error(err)
  }
}

  return (
    <div className="p-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-textPrimary">Pantry</h1>
          <p className="text-textMuted mt-1">{items.length} items tracked across your home</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <span className="text-lg">+</span> Add item
        </button>
      </div>

      {/* Add item form */}
      {showForm && (
        <div className="card mb-6 border-primary border-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-textPrimary">Add new item</h2>
            <button onClick={() => { setShowForm(false); setError('') }} className="text-textMuted hover:text-textPrimary text-xl leading-none">✕</button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-danger text-sm px-4 py-3 rounded-btn mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleAdd}>
            {/* Icon picker */}
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
    value={form.category}
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
              <button type="button" onClick={() => { setShowForm(false); setError('') }} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Add to pantry</button>
            </div>
          </form>
        </div>
      )}

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-textMuted">
          <div className="text-5xl mb-4">🧺</div>
          <p className="font-medium">No items found</p>
          <p className="text-sm mt-1">Try a different search or add a new item</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(item => (
            <div key={item.id} className="card hover:shadow-md transition-shadow relative group">

              {/* Delete Restock button */}
              <button
  onClick={() => handleDelete(item.id)}
  className="absolute top-3 right-3 w-7 h-7 rounded-full bg-gray-100 text-textMuted hover:bg-red-50 hover:text-danger transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center text-sm"
>
  ✕
</button>

{/* Restock button */}
<button
  onClick={() => {
    setRestockingId(item.id)
    setRestockQty('')
  }}
  className="absolute top-3 left-3 text-xs bg-green-50 text-success px-2 py-1 rounded-pill border border-green-100 opacity-0 group-hover:opacity-100 transition-all font-medium hover:bg-green-100"
>
  + Restock
</button>

{/* Restock form */}
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

              <div className="text-3xl mb-3">{item.icon}</div>
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
                    : `Exp: ${item.expiry}`}
                </span>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  )
}