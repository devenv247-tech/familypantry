// Two-tier keyword matcher for recipe illustration categories.
//
// TIER1_SPECIFIC — dish-format words (the *form* of the dish). Always wins.
//   "Vindaloo Smash Burger" → burger, not curry.
//   "Chicken Tikka Wrap" → wrap, not curry.
//
// TIER1_GENERIC — broad form fallbacks. Checked after all TIER1_SPECIFIC pass.
//   "Protein Bowl" → ricebowl via "bowl" only when no specific tier-1 matched.
//   "Punjabi Masala Egg Omelette" → dish (tier-2 masala no longer fires).
//
// TIER2 — cuisine/flavor modifiers. Only reached if no tier-1 word matched.
//   "Butter Chicken with Garlic Naan" → curry via "butter chicken".
//
// Within each tier, findEarliest() returns the category whose keyword appears
// earliest in the title — so "Wrap with Summer Slaw" → wrap (pos 0) not salad
// (pos 17). Longest-first sort is kept to break ties consistently.

const byLengthDesc = (a, b) => b[0].length - a[0].length

const TIER1_SPECIFIC = [
  ['french toast',  'pancakes'],
  ['quinoa bowl',   'ricebowl'],
  ['grain bowl',    'ricebowl'],
  ['fried rice',    'ricebowl'],
  ['chow mein',     'stirfry'],
  ['pad thai',      'stirfry'],
  ['rice bowl',     'ricebowl'],
  ['oat bowl',      'ricebowl'],
  ['stir-fry',      'stirfry'],
  ['stir fry',      'stirfry'],
  ['sandwich',      'burger'],
  ['shawarma',      'wrap'],
  ['noodles',       'stirfry'],
  ['biryani',       'ricebowl'],
  ['risotto',       'ricebowl'],
  ['burrito',       'wrap'],
  ['pancake',       'pancakes'],
  ['chapati',       'wrap'],
  ['waffle',        'pancakes'],
  ['chilla',        'pancakes'],
  ['slider',        'burger'],
  ['burger',        'burger'],
  ['pilaf',         'ricebowl'],
  ['salad',         'salad'],
  ['broth',         'soup'],
  ['chili',         'soup'],
  ['wrap',          'wrap'],
  ['roll',          'wrap'],
  ['taco',          'wrap'],
  ['soup',          'soup'],
  ['stew',          'soup'],
  ['slaw',          'salad'],
].sort(byLengthDesc)

const TIER1_GENERIC = [
  ['omelette', 'dish'],
  ['frittata', 'dish'],
  ['omelet',   'dish'],
  ['bowl',     'ricebowl'],
].sort(byLengthDesc)

const TIER2 = [
  ['butter chicken', 'curry'],
  ['vindaloo',       'curry'],
  ['masala',         'curry'],
  ['tikka',          'curry'],
  ['korma',          'curry'],
  ['curry',          'curry'],
  ['dal',            'curry'],
].sort(byLengthDesc)

export const DEFAULT_CATEGORY = 'dish'

function findEarliest(keywords, lower) {
  let best = null
  let bestPos = Infinity
  for (const [kw, cat] of keywords) {
    const pos = lower.indexOf(kw)
    if (pos !== -1 && pos < bestPos) {
      bestPos = pos
      best = cat
    }
  }
  return best
}

export function getRecipeCategory(title) {
  if (!title) return DEFAULT_CATEGORY
  // Normalize whitespace (handles double-spaces and non-breaking spaces from API)
  const lower = title.toLowerCase().replace(/[\s ]+/g, ' ').trim()
  return (
    findEarliest(TIER1_SPECIFIC, lower) ||
    findEarliest(TIER1_GENERIC, lower) ||
    findEarliest(TIER2, lower) ||
    DEFAULT_CATEGORY
  )
}
