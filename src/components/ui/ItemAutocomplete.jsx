// src/components/ui/ItemAutocomplete.jsx
// Client-side autocomplete for pantry item name field
// Uses local Canadian grocery dataset — zero API calls
// Selecting a suggestion auto-fills name, unit, category, icon

import { useState, useRef, useEffect } from 'react'
import CANADIAN_GROCERY_ITEMS from '../../data/canadianGroceryItems'

export default function ItemAutocomplete({ value, onChange, onSelect, placeholder, className }) {
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const wrapperRef = useRef(null)
  const inputRef = useRef(null)

  // Filter dataset on every keystroke
  useEffect(() => {
    const q = value.trim().toLowerCase()
    if (q.length < 2) {
      setSuggestions([])
      setOpen(false)
      return
    }
    const results = CANADIAN_GROCERY_ITEMS.filter(item => {
      const full = `${item.name} ${item.brand}`.toLowerCase()
      return full.includes(q)
    }).slice(0, 8) // max 8 suggestions shown
    setSuggestions(results)
    setOpen(results.length > 0)
    setHighlighted(0)
  }, [value])

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleKeyDown = (e) => {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted(h => Math.min(h + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted(h => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (suggestions[highlighted]) {
        handlePick(suggestions[highlighted])
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const handlePick = (item) => {
    // Auto-fill name with brand if brand exists
    const fullName = item.brand ? `${item.name} — ${item.brand}` : item.name
    onChange(fullName)
    onSelect({
      name: fullName,
      unit: item.unit,
      category: item.category,
      icon: item.icon,
      defaultQty: item.defaultQty,
    })
    setOpen(false)
    setSuggestions([])
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        ref={inputRef}
        className={className}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />
      {open && (
        <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
          {suggestions.map((item, i) => (
            <li
              key={i}
              onMouseDown={() => handlePick(item)}
              onMouseEnter={() => setHighlighted(i)}
              className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                i === highlighted ? 'bg-blue-50' : 'hover:bg-gray-50'
              } ${i !== 0 ? 'border-t border-gray-100' : ''}`}
            >
              <span className="text-lg leading-none flex-shrink-0 w-7 text-center">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                {item.brand && (
                  <p className="text-xs text-gray-400 truncate">{item.brand}</p>
                )}
              </div>
              <div className="flex-shrink-0 text-right">
                <span className="text-xs text-gray-400">{item.defaultQty} {item.unit}</span>
                <p className="text-xs text-gray-300">{item.category}</p>
              </div>
            </li>
          ))}
          <li className="px-3 py-2 text-xs text-gray-400 text-center border-t border-gray-100 bg-gray-50 rounded-b-xl">
            Type anything — you can always add custom items
          </li>
        </ul>
      )}
    </div>
  )
}