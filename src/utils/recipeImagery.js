// Keyword → illustration category mapping, sorted longest-first so multi-word
// phrases like "curry soup" resolve before their sub-strings ("curry").
const RAW_KEYWORDS = [
  ['butter chicken', 'curry'],
  ['french toast',   'pancakes'],
  ['quinoa bowl',    'ricebowl'],
  ['grain bowl',     'ricebowl'],
  ['fried rice',     'ricebowl'],
  ['curry soup',     'soup'],
  ['chow mein',      'stirfry'],
  ['pad thai',       'stirfry'],
  ['rice bowl',      'ricebowl'],
  ['oat bowl',       'ricebowl'],
  ['stir-fry',       'stirfry'],
  ['stir fry',       'stirfry'],
  ['sandwich',       'burger'],
  ['shawarma',       'wrap'],
  ['vindaloo',       'curry'],
  ['noodles',        'stirfry'],
  ['biryani',        'ricebowl'],
  ['risotto',        'ricebowl'],
  ['burrito',        'wrap'],
  ['pancake',        'pancakes'],
  ['chapati',        'wrap'],
  ['masala',         'curry'],
  ['waffle',         'pancakes'],
  ['chilla',         'pancakes'],
  ['slider',         'burger'],
  ['burger',         'burger'],
  ['korma',          'curry'],
  ['tikka',          'curry'],
  ['broth',          'soup'],
  ['chili',          'soup'],
  ['pilaf',          'ricebowl'],
  ['salad',          'salad'],
  ['curry',          'curry'],
  ['wrap',           'wrap'],
  ['roll',           'wrap'],
  ['soup',           'soup'],
  ['stew',           'soup'],
  ['slaw',           'salad'],
  ['dal',            'curry'],
]

const KEYWORDS = RAW_KEYWORDS.sort((a, b) => b[0].length - a[0].length)

export const DEFAULT_CATEGORY = 'dish'

export function getRecipeCategory(title) {
  if (!title) return DEFAULT_CATEGORY
  const lower = title.toLowerCase()
  for (const [kw, cat] of KEYWORDS) {
    if (lower.includes(kw)) return cat
  }
  return DEFAULT_CATEGORY
}
