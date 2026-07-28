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
  ['mac and cheese','pasta'],
  ['overnight oats','oatmeal'],
  ['scrambled egg', 'omelette'],
  ['banana bread',  'cake'],
  ['chia pudding',  'oatmeal'],
  ['yogurt bowl',   'yogurtbowl'],
  ['naan pizza',    'pizza'],
  ['egg bhurji',    'omelette'],
  ['quinoa bowl',   'ricebowl'],
  ['grain bowl',    'ricebowl'],
  ['fried rice',    'ricebowl'],
  ['chow mein',     'stirfry'],
  ['pad thai',      'stirfry'],
  ['bruschetta',    'toast'],
  ['fettuccine',    'pasta'],
  ['spaghetti',     'pasta'],
  ['rice bowl',     'ricebowl'],
  ['oat bowl',      'ricebowl'],
  ['stir-fry',      'stirfry'],
  ['stir fry',      'stirfry'],
  ['sandwich',      'burger'],
  ['shawarma',      'wrap'],
  ['flatbread',     'pizza'],
  ['smoothie',      'smoothie'],
  ['noodles',       'stirfry'],
  ['biryani',       'ricebowl'],
  ['macaroni',      'pasta'],
  ['risotto',       'ricebowl'],
  ['omelette',      'omelette'],
  ['crostini',      'toast'],
  ['frittata',      'omelette'],
  ['porridge',      'oatmeal'],
  ['burrito',       'wrap'],
  ['pancake',       'pancakes'],
  ['cupcake',       'muffin'],
  ['lasagna',       'pasta'],
  ['tartine',       'toast'],
  ['brownie',       'cake'],
  ['biscuit',       'cookie'],
  ['parfait',       'yogurtbowl'],
  ['oatmeal',       'oatmeal'],
  ['chapati',       'wrap'],
  ['gnocchi',       'pasta'],
  ['skewer',        'skewers'],
  ['waffle',        'pancakes'],
  ['chilla',        'pancakes'],
  ['muffin',        'muffin'],
  ['cookie',        'cookie'],
  ['slider',        'burger'],
  ['burger',        'burger'],
  ['omelet',        'omelette'],
  ['pilaf',         'ricebowl'],
  ['pasta',         'pasta'],
  ['kebab',         'skewers'],
  ['kabob',         'skewers'],
  ['pizza',         'pizza'],
  ['salad',         'salad'],
  ['tikka',         'skewers'],
  ['broth',         'soup'],
  ['penne',         'pasta'],
  ['toast',         'toast'],
  ['chili',         'soup'],
  ['satay',         'skewers'],
  ['shake',         'smoothie'],
  ['lassi',         'smoothie'],
  ['yogurt',        'yogurtbowl'],
  ['wrap',          'wrap'],
  ['roll',          'wrap'],
  ['taco',          'taco'],
  ['soup',          'soup'],
  ['stew',          'soup'],
  ['cake',          'cake'],
  ['loaf',          'cake'],
  ['slaw',          'salad'],
  // ── protein & dish-form additions ──────────────────────────────────────────
  ['beef tenderloin', 'steak'],
  ['hot chocolate',   'drink'],
  ['hash brown',      'fries'],
  ['roast beef',      'steak'],
  ['schnitzel',       'chicken'],
  ['dumpling',        'dumpling'],
  ['pierogi',         'dumpling'],
  ['onigiri',         'sushi'],
  ['brisket',         'ribs'],
  ['halibut',         'fish'],
  ['tilapia',         'fish'],
  ['wedges',          'fries'],
  ['shrimp',          'shrimp'],
  ['salmon',          'fish'],
  ['samosa',          'dumpling'],
  ['cutlet',          'chicken'],
  ['coffee cake',     'cake'],
  ['coffee',          'drink'],
  ['gyoza',           'dumpling'],
  ['prawn',           'shrimp'],
  ['trout',           'fish'],
  ['sushi',           'sushi'],
  ['steak',           'steak'],
  ['latte',           'drink'],
  ['fries',           'fries'],
  ['tater',           'fries'],
  ['kadha',           'drink'],
  ['poke',            'sushi'],
  ['chai',            'drink'],
  ['fish',            'fish'],
  ['ribs',            'ribs'],
  ['momo',            'dumpling'],
  ['cod',             'fish'],
  ['tea',             'drink'],
].sort(byLengthDesc)

const TIER1_GENERIC = [
  // Checked only after all TIER1_SPECIFIC pass — broad ingredient/form fallbacks.
  ['poached egg', 'eggs'],
  ['boiled egg',  'eggs'],
  ['fried egg',   'eggs'],
  ['chicken',     'chicken'],
  ['bowl',        'ricebowl'],
  ['egg',         'eggs'],
  ['rice',        'riceplate'],
].sort(byLengthDesc)

const TIER2 = [
  ['butter chicken', 'curry'],
  ['vindaloo',       'curry'],
  ['masala',         'curry'],
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

// Deduplicates allergenWarnings from the LLM (which often emits the same
// {allergen, ingredient} pair multiple times) and groups by allergen so the
// UI shows "contains Milk (Feta, Butter)" instead of four identical lines.
export function groupAllergenWarnings(warnings) {
  if (!warnings?.length) return []
  const seen = new Set()
  const groups = new Map()
  for (const w of warnings) {
    const key = `${w.allergen}||${w.ingredient}`
    if (seen.has(key)) continue
    seen.add(key)
    if (!groups.has(w.allergen)) groups.set(w.allergen, [])
    groups.get(w.allergen).push(w.ingredient)
  }
  return Array.from(groups.entries()).map(([allergen, ingredients]) => ({ allergen, ingredients }))
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
