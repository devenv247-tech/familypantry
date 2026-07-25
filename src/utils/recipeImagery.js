// Two-tier keyword matcher for recipe illustration categories.
//
// TIER 1 — dish-format words (the *form* of the dish). Always checked first.
// If a title contains any tier-1 keyword the match is returned immediately;
// tier-2 words are never consulted. This means "Vindaloo Smash Burger" →
// burger, not curry, and "Chicken Tikka Wrap" → wrap, not curry.
//
// TIER 2 — cuisine/flavor modifiers. Only reached if no tier-1 word matched.
// Covers curry-family titles like "Butter Chicken" or "Dal Tadka" where there
// is no dish-format word to anchor on.
//
// Within each tier keywords are sorted longest-first so multi-word phrases
// ("oat bowl", "stir fry") resolve before their sub-strings.
//
// Known edge case (deferred to Part B when an egg/omelette category is added):
// "Punjabi Masala Egg Omelette" has no tier-1 match, so tier-2 "masala" fires
// and returns curry. Acceptable for now.

const TIER1 = [
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
].sort((a, b) => b[0].length - a[0].length)

const TIER2 = [
  ['butter chicken', 'curry'],
  ['vindaloo',       'curry'],
  ['masala',         'curry'],
  ['tikka',          'curry'],
  ['korma',          'curry'],
  ['curry',          'curry'],
  ['dal',            'curry'],
].sort((a, b) => b[0].length - a[0].length)

export const DEFAULT_CATEGORY = 'dish'

export function getRecipeCategory(title) {
  if (!title) return DEFAULT_CATEGORY
  const lower = title.toLowerCase()
  for (const [kw, cat] of TIER1) {
    if (lower.includes(kw)) return cat
  }
  for (const [kw, cat] of TIER2) {
    if (lower.includes(kw)) return cat
  }
  return DEFAULT_CATEGORY
}
