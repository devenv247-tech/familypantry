// Ingredients every household has; never ask users to buy or subtract these.
// Whole-name match only — "coconut water", "sparkling water", "soda water",
// "sea salt flakes", "salted butter", and "ice cream" must NOT match because
// they are distinct products a household may genuinely need to buy.
// The backend already excludes water, ice, and salt from shopping-list output;
// this helper applies the same rule on the frontend for display and payload filtering.
const ASSUMED_STAPLES = new Set([
  'water',
  'tap water',
  'cold water',
  'hot water',
  'warm water',
  'boiling water',
  'filtered water',
  'ice',
  'ice cubes',
  'crushed ice',
  'salt',
])

export function isAssumedStaple(name) {
  return ASSUMED_STAPLES.has((name ?? '').toLowerCase().trim())
}

// Filters an array of string or {name, ...} ingredient items, removing assumed staples.
export function filterStaples(items) {
  return (items ?? []).filter(
    item => !isAssumedStaple(typeof item === 'string' ? item : (item?.name ?? ''))
  )
}
