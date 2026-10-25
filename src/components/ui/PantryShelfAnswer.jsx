import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from './Icon'
import { addGroceryItem, updateGroceryItem, getGroceryItems } from '../../api/grocery'

// Normalised item shape consumed by this component:
// {
//   id?: string,
//   name: string,
//   quantity?: number | string,
//   unit?: string,
//   displayQty: string,      // human-readable quantity string
//   icon?: string,           // emoji
//   category?: string,
//   stockPct?: number,       // 0–100, null if unknown
//   daysUntilExpiry?: number,// null if unknown, negative = expired
//   status: 'critical'|'low'|'expiring'|'good',
// }

function catStyle(category) {
  switch ((category || '').toLowerCase()) {
    case 'fridge':     return 'bg-indigo-50 text-indigo-600'
    case 'freezer':    return 'bg-blue-50 text-blue-600'
    case 'dry goods':  return 'bg-amber-50 text-amber-700'
    case 'spices':     return 'bg-orange-50 text-orange-600'
    case 'snacks':     return 'bg-food-50 text-food-600'
    default:           return 'bg-stone-50 text-stone-600'
  }
}

function barColor(status) {
  if (status === 'critical') return 'bg-food-600'
  if (status === 'low')      return 'bg-amber-400'
  return 'bg-fresh-600'
}

function PantryItemTile({ item, onAddToGrocery, adding, added }) {
  const showExpiry = item.daysUntilExpiry !== null && item.daysUntilExpiry !== undefined
    && item.daysUntilExpiry >= 0 && item.daysUntilExpiry <= 7

  return (
    <div className="bg-white rounded-3xl border border-border p-3 flex flex-col gap-2 shadow-card">
      <div className="flex items-start gap-2.5">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl ${catStyle(item.category)}`}>
          {item.icon || '🛒'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-stone-900 text-sm truncate">{item.name}</p>
          <p className="text-xs text-stone-600 mt-0.5">{item.displayQty || '—'}</p>
        </div>
        {showExpiry && (
          <span className="text-xs bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-pill flex-shrink-0">
            {item.daysUntilExpiry === 0 ? 'Today' : `${item.daysUntilExpiry}d`}
          </span>
        )}
      </div>

      {item.stockPct !== null && item.stockPct !== undefined && (
        <div className="w-full h-1.5 bg-stone-100 rounded-pill overflow-hidden">
          <div
            className={`h-full rounded-pill motion-safe:transition-all ${barColor(item.status)}`}
            style={{ width: `${item.stockPct}%` }}
          />
        </div>
      )}

      <button
        onClick={onAddToGrocery}
        disabled={adding || added}
        className={`w-full text-xs py-1.5 px-3 rounded-pill font-medium transition-all min-h-[44px] sm:min-h-0 disabled:opacity-60 ${
          added
            ? 'bg-fresh-50 text-fresh-700 border border-fresh-100'
            : 'bg-food-50 text-food-600 border border-food-100 hover:bg-food-600 hover:text-white hover:border-food-600'
        }`}
      >
        {added
          ? <><Icon name="check" size={11} className="inline mr-1" />Added!</>
          : adding ? 'Adding...' : '+ Grocery'}
      </button>
    </div>
  )
}

function Section({ title, iconName, items, onAddToGrocery, addingMap, addedMap }) {
  if (!items.length) return null
  return (
    <div className="mb-5">
      <h3 className="font-semibold text-stone-800 text-sm mb-2 flex items-center gap-1.5">
        <Icon name={iconName} size={14} className="flex-shrink-0" />
        {title}
        <span className="text-xs font-normal text-stone-500 ml-1">({items.length})</span>
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {items.map(item => (
          <PantryItemTile
            key={item.id || item.name}
            item={item}
            onAddToGrocery={() => onAddToGrocery(item)}
            adding={!!addingMap[item.id || item.name]}
            added={!!addedMap[item.id || item.name]}
          />
        ))}
      </div>
    </div>
  )
}

export default function PantryShelfAnswer({ items, showToast, onAskWithAI, tips }) {
  const navigate = useNavigate()
  const [addingMap, setAddingMap] = useState({})
  const [addedMap, setAddedMap] = useState({})
  const [showWellStocked, setShowWellStocked] = useState(false)
  const [shoppingChecked, setShoppingChecked] = useState({})
  const [addingAll, setAddingAll] = useState(false)
  const [showMoreShopping, setShowMoreShopping] = useState(false)
  const [showMoreTips, setShowMoreTips] = useState(false)

  if (!items || items.length === 0) {
    return (
      <div className="card border-2 border-dashed border-stone-200 text-center py-8 mb-6">
        <Icon name="pantry" size={36} className="mx-auto text-stone-300 mb-3" />
        <p className="font-semibold text-stone-900 mb-1">Your pantry is empty</p>
        <p className="text-sm text-stone-600 mb-4">Add items to start tracking stock levels.</p>
        <button onClick={() => navigate('/app/pantry')} className="btn-primary text-sm">
          Add items to pantry
        </button>
      </div>
    )
  }

  const restock  = items.filter(i => i.status === 'critical')
  const low      = items.filter(i => i.status === 'low')
  const useSoon  = items.filter(i => i.status === 'expiring')
  const good     = items.filter(i => i.status === 'good')

  const lowCount      = restock.length + low.length
  const expiringCount = useSoon.length
  const headline = restock.length > 0
    ? `${restock.length} item${restock.length > 1 ? 's' : ''} need restocking`
    : lowCount > 0
    ? `${lowCount} item${lowCount > 1 ? 's' : ''} getting low`
    : expiringCount > 0
    ? `${expiringCount} item${expiringCount > 1 ? 's' : ''} expiring soon`
    : 'All stocked up!'

  const addOneToGrocery = async (item) => {
    const key = item.id || item.name
    setAddingMap(prev => ({ ...prev, [key]: true }))
    try {
      const currentList = await getGroceryItems()
      const existing = currentList.find(g =>
        g.name.toLowerCase().trim() === item.name.toLowerCase().trim()
      )
      if (existing) {
        const newQty = ((parseFloat(existing.qty) || 0) + (parseFloat(item.quantity) || 0))
        await updateGroceryItem(existing.id, {
          qty: `${newQty}${item.unit ? ' ' + item.unit : ''}`.trim()
        })
      } else {
        await addGroceryItem({
          name: item.name,
          qty: item.displayQty || '',
          category: item.category || 'Pantry',
          store: '',
          price: '',
        })
      }
      setAddedMap(prev => ({ ...prev, [key]: true }))
      showToast(`${item.name} added to grocery list`)
      setTimeout(() => setAddedMap(prev => ({ ...prev, [key]: false })), 3000)
    } catch {
      showToast('Failed to add to grocery list', 'error')
    } finally {
      setAddingMap(prev => ({ ...prev, [key]: false }))
    }
  }

  const restockItems = restock
  const visibleShoppingItems = showMoreShopping ? restockItems : restockItems.slice(0, 6)

  const handleAddAllToGrocery = async () => {
    const toAdd = restockItems.filter(item => {
      const key = item.id || item.name
      return shoppingChecked[key] !== false
    })
    if (!toAdd.length) return
    setAddingAll(true)
    try {
      const currentList = await getGroceryItems()
      await Promise.all(toAdd.map(async item => {
        const existing = currentList.find(g =>
          g.name.toLowerCase().trim() === item.name.toLowerCase().trim()
        )
        if (existing) {
          const newQty = ((parseFloat(existing.qty) || 0) + (parseFloat(item.quantity) || 0))
          await updateGroceryItem(existing.id, {
            qty: `${newQty}${item.unit ? ' ' + item.unit : ''}`.trim()
          })
        } else {
          await addGroceryItem({
            name: item.name,
            qty: item.displayQty || '',
            category: item.category || 'Pantry',
            store: '',
            price: '',
          })
        }
      }))
      showToast(`${toAdd.length} items added to grocery list`)
    } catch {
      showToast('Failed to add items to grocery list', 'error')
    } finally {
      setAddingAll(false)
    }
  }

  const visibleTips = showMoreTips ? tips : (tips || []).slice(0, 3)

  return (
    <div className="mb-6">
      {/* Summary strip */}
      <div className="bg-white rounded-3xl border border-border p-4 mb-5 shadow-card">
        <h2 className="font-display text-xl font-semibold text-stone-900 mb-3">{headline}</h2>
        <div className="flex gap-2 flex-wrap">
          <span className="text-xs bg-stone-50 text-stone-600 border border-stone-100 px-3 py-1.5 rounded-pill">
            {items.length} checked
          </span>
          <span className={`text-xs px-3 py-1.5 rounded-pill ${
            lowCount > 0
              ? 'bg-food-50 text-food-600 border border-food-100'
              : 'bg-stone-50 text-stone-600 border border-stone-100'
          }`}>
            {lowCount} low
          </span>
          <span className={`text-xs px-3 py-1.5 rounded-pill ${
            expiringCount > 0
              ? 'bg-amber-50 text-amber-700 border border-amber-100'
              : 'bg-stone-50 text-stone-600 border border-stone-100'
          }`}>
            {expiringCount} expiring
          </span>
        </div>
      </div>

      {/* Restock now */}
      <Section
        title="Restock now"
        iconName="warning"
        items={restock}
        onAddToGrocery={addOneToGrocery}
        addingMap={addingMap}
        addedMap={addedMap}
      />

      {/* Getting low */}
      <Section
        title="Getting low"
        iconName="info"
        items={low}
        onAddToGrocery={addOneToGrocery}
        addingMap={addingMap}
        addedMap={addedMap}
      />

      {/* Use soon */}
      <Section
        title="Use soon"
        iconName="clock"
        items={useSoon}
        onAddToGrocery={addOneToGrocery}
        addingMap={addingMap}
        addedMap={addedMap}
      />

      {/* Well stocked — collapsed by default */}
      {good.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-stone-800 text-sm flex items-center gap-1.5">
              <Icon name="check" size={14} className="text-fresh-600" />
              Well stocked
              <span className="text-xs font-normal text-stone-500 ml-1">({good.length})</span>
            </h3>
            <button
              onClick={() => setShowWellStocked(v => !v)}
              className="text-xs text-primary hover:underline font-medium"
            >
              {showWellStocked ? 'Collapse' : 'Show all'}
            </button>
          </div>

          {!showWellStocked && (
            <div className="flex flex-wrap gap-2">
              {good.slice(0, 6).map(item => (
                <span
                  key={item.id || item.name}
                  className="flex items-center gap-1.5 text-xs bg-stone-50 text-stone-600 border border-stone-100 px-2.5 py-1 rounded-pill"
                >
                  <span>{item.icon || '🛒'}</span>
                  <span className="truncate max-w-[80px]">{item.name}</span>
                  <span className="text-stone-500">{item.displayQty}</span>
                </span>
              ))}
              {good.length > 6 && (
                <span className="text-xs text-stone-500 py-1 self-center">+{good.length - 6} more</span>
              )}
            </div>
          )}

          {showWellStocked && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {good.map(item => (
                <PantryItemTile
                  key={item.id || item.name}
                  item={item}
                  onAddToGrocery={() => addOneToGrocery(item)}
                  adding={!!addingMap[item.id || item.name]}
                  added={!!addedMap[item.id || item.name]}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Shopping list card — only for restock items */}
      {restockItems.length > 0 && (
        <div className="card border border-border mb-4">
          <h3 className="font-semibold text-stone-900 mb-3 flex items-center gap-1.5">
            <Icon name="grocery" size={16} />
            Shopping list
          </h3>
          <div className="space-y-2 mb-4">
            {visibleShoppingItems.map(item => {
              const key = item.id || item.name
              return (
                <label key={key} className="flex items-center gap-3 cursor-pointer min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={shoppingChecked[key] !== false}
                    onChange={e => setShoppingChecked(prev => ({ ...prev, [key]: e.target.checked }))}
                    className="w-4 h-4 accent-food-600 flex-shrink-0"
                  />
                  <span className="text-sm text-stone-900 flex-1">{item.name}</span>
                  <span className="text-xs text-stone-600">{item.displayQty}</span>
                </label>
              )
            })}
          </div>
          {restockItems.length > 6 && (
            <button
              onClick={() => setShowMoreShopping(v => !v)}
              className="text-xs text-primary hover:underline mb-3 block"
            >
              {showMoreShopping ? 'Show less' : `Show ${restockItems.length - 6} more`}
            </button>
          )}
          <button
            onClick={handleAddAllToGrocery}
            disabled={addingAll}
            className="btn-primary w-full text-sm py-2.5"
          >
            {addingAll ? 'Adding...' : 'Add all to grocery list'}
          </button>
        </div>
      )}

      {/* AI Tips — only when AI path provides them */}
      {tips && tips.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 mb-4">
          <p className="text-xs font-semibold text-primary mb-2 flex items-center gap-1.5">
            <Icon name="bubble" size={13} className="text-primary" />
            Tips
          </p>
          <ul className="space-y-1.5">
            {visibleTips.map((tip, i) => (
              <li key={i} className="text-xs text-primary leading-relaxed">· {tip}</li>
            ))}
          </ul>
          {tips.length > 3 && (
            <button
              onClick={() => setShowMoreTips(v => !v)}
              className="text-xs text-primary hover:underline mt-2 font-medium"
            >
              {showMoreTips ? 'Show less' : `Show ${tips.length - 3} more`}
            </button>
          )}
        </div>
      )}

      {/* Secondary CTA — only when showing local pantry data */}
      {onAskWithAI && (
        <div className="flex justify-center mt-2">
          <button
            onClick={onAskWithAI}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-primary border border-indigo-200 rounded-pill text-sm font-medium hover:bg-indigo-100 transition-all min-h-[44px]"
          >
            <Icon name="bubble" size={14} />
            Ask Nooka AI for more
          </button>
        </div>
      )}
    </div>
  )
}
