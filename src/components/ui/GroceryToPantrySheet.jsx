import { useState } from 'react'
import Icon from './Icon'
import { addPantryItem, restockPantryItem } from '../../api/pantry'
import { predictExpiry } from '../../api/expiry'
import { isAssumedStaple } from '../../utils/assumedStaples'

const PANTRY_UNITS = ['pcs', 'dozen', 'kg', 'g', 'mg', 'L', 'ml', 'lb', 'oz', 'cup', 'tbsp', 'tsp', 'gallon']

const NON_FOOD_KEYWORDS = [
  'cleaning', 'laundry', 'household', 'paper towel', 'paper product',
  'pharmacy', 'hygiene', 'personal care', 'baby care', 'pet',
  'garden', 'detergent', 'shampoo', 'toothpaste', 'toilet',
]

function normName(s) {
  return (s || '').toLowerCase().replace(/\s+/g, ' ').trim()
}

function findMatch(groceryName, pantryItems) {
  const gn = normName(groceryName)
  const exact = pantryItems.find(p => normName(p.name) === gn)
  if (exact) return exact
  const gw = gn.split(' ').filter(Boolean)
  return pantryItems.find(p => {
    const pw = normName(p.name).split(' ').filter(Boolean)
    const [shorter, longer] = gw.length <= pw.length ? [gw, pw] : [pw, gw]
    return shorter.length > 0 && shorter.every(w => longer.some(l => l === w || l.includes(w) || w.includes(l)))
  }) || null
}

function parseQty(qtyStr) {
  if (!qtyStr || !qtyStr.trim()) return { qty: 1, unit: 'pcs', uncertain: true }
  const m = qtyStr.trim().match(/^(\d+(?:\.\d+)?)\s*(pcs|dozen|kg|g|mg|[Ll]|ml|lb|oz|cup|tbsp|tsp|gallon)?$/i)
  if (!m) return { qty: 1, unit: 'pcs', uncertain: true }
  const qty = parseFloat(m[1])
  if (!qty || qty <= 0) return { qty: 1, unit: 'pcs', uncertain: true }
  const rawU = (m[2] || 'pcs').toLowerCase()
  const unit = rawU === 'l' ? 'L' : rawU
  return { qty, unit, uncertain: false }
}

function isNonFood(category) {
  if (!category) return false
  const c = category.toLowerCase()
  return NON_FOOD_KEYWORDS.some(kw => c.includes(kw))
}

function groceryToPantryCategory(cat) {
  if (!cat) return 'Fridge'
  const c = cat.toLowerCase()
  if (c.includes('frozen') || c.includes('freezer')) return 'Freezer'
  if (c.includes('spice') || c.includes('herb')) return 'Spices'
  if (c.includes('snack') || c.includes('chip') || c.includes('cracker')) return 'Snacks'
  if (c.includes('dry') || c.includes('pasta') || c.includes('grain') || c.includes('rice') ||
      c.includes('cereal') || c.includes('bread') || c.includes('flour') ||
      c.includes('sugar') || c.includes('can')) return 'Dry goods'
  return 'Fridge'
}

function buildRow(groceryItem, pantryItems) {
  const { qty, unit, uncertain } = parseQty(groceryItem.qty)
  const match = findMatch(groceryItem.name, pantryItems)
  const skip = isAssumedStaple(groceryItem.name) || isNonFood(groceryItem.category)

  let action = skip ? 'skip' : match ? 'restock' : 'new'
  let rowUnit = unit
  let unitMismatch = false

  if (match) {
    if (action === 'restock') {
      rowUnit = match.unit
      unitMismatch = !uncertain && match.unit !== unit
    }
  }

  return {
    groceryItem,
    action,
    matchedPantryId: match?.id || '',
    qty,
    unit: rowUnit,
    uncertain: uncertain || unitMismatch,
    unitMismatch,
  }
}

export default function GroceryToPantrySheet({ checkedItems, pantryItems, onClose, onDone }) {
  const [rows, setRows] = useState(() => checkedItems.map(g => buildRow(g, pantryItems)))
  const [saving, setSaving] = useState(false)

  const upd = (idx, patch) => setRows(r => r.map((x, i) => i === idx ? { ...x, ...patch } : x))
  const getPI = (id) => pantryItems.find(p => p.id === id)

  const handleConfirm = async () => {
    setSaving(true)
    let added = 0, failed = 0
    const synced = []

    for (const row of rows) {
      if (row.action === 'skip') {
        synced.push(row.groceryItem.id)
        continue
      }
      try {
        if (row.action === 'restock' && row.matchedPantryId) {
          await restockPantryItem(row.matchedPantryId, row.qty)
          synced.push(row.groceryItem.id)
          added++
        } else if (row.action === 'new') {
          const newItem = await addPantryItem({
            name: row.groceryItem.name.trim(),
            quantity: row.qty,
            unit: row.unit,
            category: groceryToPantryCategory(row.groceryItem.category),
            icon: '🛒',
          })
          synced.push(row.groceryItem.id)
          added++
          predictExpiry(newItem.name, newItem.category, newItem.id).catch(() => {})
        }
      } catch (err) {
        failed++
      }
    }

    setSaving(false)
    onDone(synced, added, failed)
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-end sm:items-center sm:justify-center sm:p-4 backdrop-blur-sm">
      <div
        className="bg-white w-full sm:w-auto sm:min-w-[520px] sm:max-w-lg flex flex-col rounded-t-3xl sm:rounded-3xl shadow-xl modal-sheet"
        style={{ maxHeight: '85dvh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
          <div>
            <h3 className="text-base font-bold text-stone-900">Add to pantry</h3>
            <p className="text-xs text-stone-500 mt-0.5">{rows.length} item{rows.length !== 1 ? 's' : ''} · review and confirm</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-btn hover:bg-stone-100 text-stone-600">
            <Icon name="close" size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 min-h-0">
          {rows.map((row, idx) => {
            const pantryItem = getPI(row.matchedPantryId)
            return (
              <div
                key={row.groceryItem.id}
                className={`rounded-2xl border p-4 transition-opacity ${row.action === 'skip' ? 'opacity-40 bg-stone-50 border-stone-100' : 'bg-white border-stone-200'}`}
              >
                <div className="flex items-start gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-900 truncate">{row.groceryItem.name}</p>
                    {row.groceryItem.qty && (
                      <p className="text-xs text-stone-500 mt-0.5">{row.groceryItem.qty}</p>
                    )}
                  </div>
                  <select
                    className="text-xs border border-border rounded-btn px-2 py-1.5 bg-white text-stone-700 flex-shrink-0 max-w-[180px]"
                    value={row.action}
                    onChange={e => {
                      const a = e.target.value
                      const patch = { action: a }
                      if (a === 'restock') {
                        const fallback = row.matchedPantryId ? getPI(row.matchedPantryId) : pantryItems[0]
                        if (fallback) {
                          const { qty: pq, unit: pu, uncertain: punc } = parseQty(row.groceryItem.qty)
                          patch.matchedPantryId = fallback.id
                          patch.unit = fallback.unit
                          patch.unitMismatch = !punc && fallback.unit !== pu
                          patch.uncertain = punc || patch.unitMismatch
                        }
                      } else if (a === 'new') {
                        const { unit: nu } = parseQty(row.groceryItem.qty)
                        patch.unit = nu
                        patch.unitMismatch = false
                        patch.uncertain = false
                      }
                      upd(idx, patch)
                    }}
                  >
                    <option value="restock" disabled={pantryItems.length === 0}>
                      {row.action === 'restock' && pantryItem
                        ? `Restock: ${pantryItem.name}`
                        : 'Restock existing…'}
                    </option>
                    <option value="new">Add as new item</option>
                    <option value="skip">Skip</option>
                  </select>
                </div>

                {row.action !== 'skip' && (
                  <>
                    {row.action === 'restock' && (
                      <div className="mb-3">
                        <label className="text-xs text-stone-600 block mb-1">Pantry item to restock</label>
                        <select
                          className="input text-sm py-1.5 w-full"
                          value={row.matchedPantryId}
                          onChange={e => {
                            const pi = getPI(e.target.value)
                            const { unit: gu, uncertain: gunc } = parseQty(row.groceryItem.qty)
                            upd(idx, {
                              matchedPantryId: e.target.value,
                              unit: pi ? pi.unit : gu,
                              unitMismatch: pi ? (!gunc && pi.unit !== gu) : false,
                              uncertain: gunc || (pi ? pi.unit !== gu : false),
                            })
                          }}
                        >
                          {pantryItems.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.quantity} {p.unit})
                            </option>
                          ))}
                        </select>
                        {pantryItem && (
                          <p className="text-xs text-stone-500 mt-1">Current stock: {pantryItem.quantity} {pantryItem.unit}</p>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-xs text-stone-600 block mb-1">
                          {row.action === 'restock' ? 'Amount to add' : 'Quantity'}
                        </label>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          className="input text-sm py-1.5 w-full"
                          value={row.qty}
                          onChange={e => upd(idx, { qty: parseFloat(e.target.value) || 1 })}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-stone-600 block mb-1">Unit</label>
                        <select
                          className="input text-sm py-1.5"
                          value={row.unit}
                          disabled={row.action === 'restock'}
                          onChange={e => upd(idx, { unit: e.target.value })}
                        >
                          {PANTRY_UNITS.map(u => <option key={u}>{u}</option>)}
                        </select>
                      </div>
                    </div>

                    {row.uncertain && (
                      <div className="mt-2 flex items-center gap-1.5 bg-amber-50 text-amber-700 rounded-btn px-3 py-1.5">
                        <Icon name="warning" size={12} className="flex-shrink-0 text-amber-600" />
                        <span className="text-xs">
                          {row.unitMismatch
                            ? `Pantry uses ${row.unit} — confirm the number`
                            : 'Check quantity'}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-border">
          <div className="flex gap-3">
            <button onClick={onClose} disabled={saving} className="btn-secondary flex-1 min-h-[44px]">
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={saving}
              className="flex-1 min-h-[44px] bg-food-600 text-white rounded-btn font-semibold text-sm hover:bg-food-700 disabled:opacity-50 transition-all"
            >
              {saving ? 'Saving…' : 'Add to pantry'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
