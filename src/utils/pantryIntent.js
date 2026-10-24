// Pure function — no imports, no side effects.
// Returns true when a query is asking about pantry stock, expiry, or shopping needs.
// Requires a pantry-type noun OR a direct stock phrase — "make a pasta recipe" does not match.

const DIRECT_STOCK_PHRASES = [
  'critically low', 'running low', 'running out', 'low stock',
  'need to buy', 'what to buy', 'what to restock', 'what to get',
  'what do i need', "what's expiring", 'what is expiring',
  'expiring soon', 'use soon', 'use up soon',
  "what's in my", 'what is in my',
  'what do i have', 'how much do i have',
  'how much of', 'how many do i have', 'do i have any',
  'check my pantry', 'pantry status', 'stock status', 'stock check',
  'out of stock', 'low on', 'short on',
  'what should i buy', 'need to restock',
  'restock list', 'shopping list',
]

const PANTRY_NOUNS = [
  'pantry', 'fridge', 'freezer', 'kitchen', 'shelf',
  'cabinet', 'cupboard', 'inventory', 'stock',
]

const STOCK_VERBS = [
  'have', 'left', 'remaining', 'low', 'expir', 'buy', 'need',
  'run out', 'out of', 'use up', 'running', 'restock',
]

export function isPantryIntent(query) {
  const q = query.toLowerCase().trim()

  for (const phrase of DIRECT_STOCK_PHRASES) {
    if (q.includes(phrase)) return true
  }

  const hasPantryNoun = PANTRY_NOUNS.some(n => q.includes(n))
  const hasStockVerb = STOCK_VERBS.some(v => q.includes(v))
  if (hasPantryNoun && hasStockVerb) return true

  return false
}
