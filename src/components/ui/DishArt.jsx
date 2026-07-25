// Flat SVG dish illustrations — one per recipe category.
// All share viewBox="0 0 220 180" and the food/fresh/stone palette.
// Palette constants (matches tailwind.config.js + CLAUDE.md color system):
//   food-500 #F76707  food-600 #E8590C  food-700 #D9480F
//   food-100 #FFE8CC  food-200 #FFD8A8
//   fresh-600 #2F9E44  fresh-700 #2B8A3E
//   stone-100 #F5F5F4  stone-300 #D6D3D1  cream #FAFAF9
//   amber-400 #FBBF24  (cheese, yolk, syrup only)
//
// Geometry language shared across all dishes:
//   Bowl body: M<left> <y> a<rx> <ry> 0 0 0 <2rx> 0 z  (CCW = curves downward in SVG)
//   Bowl rim:  M<left> <y> a<rx> <ry-flat> 0 0 1 <2rx> 0 a<rx> <ry-flat> 0 0 1 -<2rx> 0
//   Steam:     path with two quadratic bezier humps, stroke food-200, no fill
//   Garnish:   small circles in fresh-700

const DISH_ART = {

  // ── curry ──────────────────────────────────────────────────────────────────
  // Deep bowl, chunky curry, herb garnish, 3 steam wisps.
  curry: (
    <>
      {/* steam */}
      <path d="M78 38 q-6 10 0 20 q6 10 0 18" stroke="#FFD8A8" strokeWidth="5" strokeLinecap="round" fill="none"/>
      <path d="M110 30 q-6 10 0 20 q6 10 0 18" stroke="#FFD8A8" strokeWidth="5" strokeLinecap="round" fill="none"/>
      <path d="M142 38 q-6 10 0 20 q6 10 0 18" stroke="#FFD8A8" strokeWidth="5" strokeLinecap="round" fill="none"/>
      {/* bowl body */}
      <path d="M30 100 a80 62 0 0 0 160 0 z" fill="#E8590C"/>
      {/* bowl rim */}
      <path d="M30 100 a80 20 0 0 1 160 0 a80 20 0 0 1 -160 0" fill="#D9480F"/>
      {/* curry chunks */}
      <ellipse cx="85" cy="118" rx="14" ry="10" fill="#F76707"/>
      <ellipse cx="115" cy="128" rx="12" ry="9" fill="#F76707"/>
      <ellipse cx="142" cy="115" rx="13" ry="9" fill="#F76707"/>
      {/* garnish */}
      <circle cx="90" cy="105" r="5" fill="#2B8A3E"/>
      <circle cx="115" cy="102" r="4" fill="#2B8A3E"/>
      <circle cx="138" cy="106" r="5" fill="#2B8A3E"/>
    </>
  ),

  // ── ricebowl ───────────────────────────────────────────────────────────────
  // Bowl with pale rice mound, saffron highlights, herb on top.
  ricebowl: (
    <>
      {/* steam */}
      <path d="M88 32 q-5 9 0 18 q5 9 0 16" stroke="#FFD8A8" strokeWidth="5" strokeLinecap="round" fill="none"/>
      <path d="M132 28 q-5 9 0 18 q5 9 0 16" stroke="#FFD8A8" strokeWidth="5" strokeLinecap="round" fill="none"/>
      {/* bowl body */}
      <path d="M35 102 a75 58 0 0 0 150 0 z" fill="#E8590C"/>
      {/* bowl rim */}
      <path d="M35 102 a75 18 0 0 1 150 0 a75 18 0 0 1 -150 0" fill="#D9480F"/>
      {/* rice mound base */}
      <path d="M55 102 a55 32 0 0 0 110 0 z" fill="#FAFAF9"/>
      {/* rice surface ridge */}
      <path d="M72 102 a38 20 0 0 0 76 0 z" fill="#FFE8CC"/>
      {/* saffron accents */}
      <ellipse cx="88" cy="96" rx="8" ry="5" fill="#FBBF24"/>
      <ellipse cx="132" cy="96" rx="8" ry="5" fill="#FBBF24"/>
      {/* herb garnish */}
      <circle cx="110" cy="92" r="6" fill="#2F9E44"/>
      <circle cx="126" cy="97" r="4" fill="#2B8A3E"/>
    </>
  ),

  // ── wrap ───────────────────────────────────────────────────────────────────
  // Side view: rolled wrap with open left end showing filling.
  wrap: (
    <>
      {/* wrap body */}
      <rect x="38" y="80" width="144" height="58" rx="29" fill="#E8590C"/>
      {/* left open end — cream lining */}
      <ellipse cx="67" cy="109" rx="26" ry="29" fill="#FFE8CC"/>
      {/* filling — green */}
      <ellipse cx="67" cy="109" rx="18" ry="21" fill="#2F9E44"/>
      {/* filling — orange layer */}
      <ellipse cx="67" cy="114" rx="15" ry="12" fill="#F76707"/>
      {/* right closed end */}
      <ellipse cx="182" cy="109" rx="20" ry="29" fill="#D9480F"/>
      {/* fold detail lines */}
      <path d="M96 80 Q108 109 96 138" stroke="#D9480F" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M128 80 Q140 109 128 138" stroke="#D9480F" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    </>
  ),

  // ── burger ─────────────────────────────────────────────────────────────────
  // Stacked: top bun with seeds, tomato, lettuce, cheese, patty, bottom bun.
  burger: (
    <>
      {/* bottom bun */}
      <path d="M54 138 a56 18 0 0 0 112 0 z" fill="#FBBF24"/>
      {/* patty */}
      <ellipse cx="110" cy="130" rx="54" ry="11" fill="#D9480F"/>
      {/* cheese slice */}
      <path d="M60 122 l100 0 l10 8 l-110 0 z" fill="#FBBF24"/>
      {/* lettuce */}
      <ellipse cx="110" cy="115" rx="58" ry="10" fill="#2F9E44"/>
      {/* tomato */}
      <ellipse cx="110" cy="107" rx="50" ry="8" fill="#F76707"/>
      {/* top bun dome */}
      <path d="M54 100 a56 40 0 0 1 112 0 z" fill="#FBBF24"/>
      {/* sesame seeds */}
      <ellipse cx="94" cy="82" rx="5" ry="2.5" fill="#FFE8CC"/>
      <ellipse cx="118" cy="77" rx="5" ry="2" fill="#FFE8CC"/>
      <ellipse cx="110" cy="72" rx="4" ry="2" fill="#FFE8CC"/>
    </>
  ),

  // ── pancakes ───────────────────────────────────────────────────────────────
  // 3-stack pancakes on plate, syrup pool + drips, butter block on top.
  pancakes: (
    <>
      {/* plate */}
      <ellipse cx="110" cy="158" rx="76" ry="12" fill="#D6D3D1"/>
      {/* bottom pancake */}
      <ellipse cx="110" cy="142" rx="65" ry="13" fill="#E8590C"/>
      {/* middle pancake */}
      <ellipse cx="110" cy="124" rx="61" ry="12" fill="#F76707"/>
      {/* top pancake */}
      <ellipse cx="110" cy="107" rx="58" ry="11" fill="#E8590C"/>
      {/* syrup pool */}
      <ellipse cx="110" cy="96" rx="40" ry="9" fill="#FBBF24"/>
      {/* butter block */}
      <rect x="93" y="88" width="26" height="13" rx="3" fill="#FAFAF9"/>
      {/* syrup drips */}
      <path d="M72 110 q-6 18 0 30" stroke="#FBBF24" strokeWidth="5" strokeLinecap="round" fill="none"/>
      <path d="M148 112 q6 15 0 26" stroke="#FBBF24" strokeWidth="5" strokeLinecap="round" fill="none"/>
    </>
  ),

  // ── salad ──────────────────────────────────────────────────────────────────
  // Pale bowl, layered greens, tomato & cheese toppings, herb dots on rim.
  salad: (
    <>
      {/* bowl body — lighter stone for contrast with greens */}
      <path d="M30 102 a80 56 0 0 0 160 0 z" fill="#F5F5F4"/>
      {/* greens base */}
      <ellipse cx="110" cy="122" rx="66" ry="24" fill="#2F9E44"/>
      {/* lighter green layer */}
      <ellipse cx="96" cy="110" rx="42" ry="18" fill="#2B8A3E"/>
      {/* tomato */}
      <circle cx="88" cy="106" r="12" fill="#F76707"/>
      <circle cx="138" cy="108" r="11" fill="#E8590C"/>
      {/* cheese dot */}
      <circle cx="114" cy="120" r="9" fill="#FBBF24"/>
      {/* bowl rim */}
      <path d="M30 102 a80 20 0 0 1 160 0 a80 20 0 0 1 -160 0" fill="#D6D3D1"/>
      {/* herb garnish */}
      <circle cx="97" cy="98" r="5" fill="#2B8A3E"/>
      <circle cx="122" cy="96" r="4" fill="#2B8A3E"/>
    </>
  ),

  // ── stirfry ────────────────────────────────────────────────────────────────
  // Wide wok with noodle swirls (detail strokes), green & orange veg chunks.
  stirfry: (
    <>
      {/* steam */}
      <path d="M88 32 q-5 9 0 18 q5 9 0 15" stroke="#FFD8A8" strokeWidth="5" strokeLinecap="round" fill="none"/>
      <path d="M132 26 q-5 9 0 18 q5 9 0 15" stroke="#FFD8A8" strokeWidth="5" strokeLinecap="round" fill="none"/>
      {/* wok body */}
      <path d="M22 108 a88 58 0 0 0 176 0 z" fill="#D9480F"/>
      {/* wok rim */}
      <path d="M22 108 a88 20 0 0 1 176 0 a88 20 0 0 1 -176 0" fill="#E8590C"/>
      {/* noodle swirl 1 */}
      <path d="M50 116 q22-20 44 0 q22 20 44 0 q18-16 36 0" stroke="#FFE8CC" strokeWidth="6" strokeLinecap="round" fill="none"/>
      {/* noodle swirl 2 */}
      <path d="M58 132 q20-16 42 0 q20 16 42 0" stroke="#FAFAF9" strokeWidth="5" strokeLinecap="round" fill="none"/>
      {/* veggie chunks */}
      <ellipse cx="76" cy="125" rx="11" ry="7" fill="#2F9E44"/>
      <ellipse cx="150" cy="122" rx="11" ry="7" fill="#2F9E44"/>
      <ellipse cx="114" cy="140" rx="12" ry="7" fill="#F76707"/>
    </>
  ),

  // ── soup ───────────────────────────────────────────────────────────────────
  // Wide shallow bowl (cream interior), orange broth surface, floating chunks.
  // Differentiated from curry by: shallower bowl, lighter bowl fill, visible broth.
  soup: (
    <>
      {/* steam */}
      <path d="M80 30 q-5 10 0 20 q5 10 0 17" stroke="#FFD8A8" strokeWidth="5" strokeLinecap="round" fill="none"/>
      <path d="M110 24 q-5 10 0 20 q5 10 0 17" stroke="#FFD8A8" strokeWidth="5" strokeLinecap="round" fill="none"/>
      <path d="M140 30 q-5 10 0 20 q5 10 0 17" stroke="#FFD8A8" strokeWidth="5" strokeLinecap="round" fill="none"/>
      {/* wide shallow bowl — cream interior */}
      <path d="M20 104 a90 50 0 0 0 180 0 z" fill="#FFE8CC"/>
      {/* broth surface */}
      <path d="M20 104 a90 18 0 0 1 180 0 a90 18 0 0 1 -180 0" fill="#F76707"/>
      {/* floating chunks */}
      <circle cx="72" cy="101" r="10" fill="#D9480F"/>
      <ellipse cx="120" cy="98" rx="14" ry="8" fill="#E8590C"/>
      <circle cx="160" cy="102" r="8" fill="#D9480F"/>
      {/* herb garnish */}
      <circle cx="95" cy="96" r="5" fill="#2B8A3E"/>
      <circle cx="142" cy="94" r="5" fill="#2B8A3E"/>
    </>
  ),

  // ── dish (default cloche) ──────────────────────────────────────────────────
  // Plate + domed cloche lid + knob. Used when no category matches.
  dish: (
    <>
      {/* plate rim */}
      <ellipse cx="110" cy="148" rx="84" ry="16" fill="#D6D3D1"/>
      {/* plate surface */}
      <ellipse cx="110" cy="141" rx="78" ry="12" fill="#F5F5F4"/>
      {/* cloche dome */}
      <path d="M32 141 a78 70 0 0 1 156 0 z" fill="#E8590C"/>
      {/* dome highlight */}
      <path d="M58 141 a52 48 0 0 1 104 0 z" fill="#F76707"/>
      {/* knob stem */}
      <rect x="106" y="68" width="8" height="14" rx="4" fill="#D9480F"/>
      {/* knob ball */}
      <circle cx="110" cy="66" r="11" fill="#D9480F"/>
      {/* knob highlight */}
      <circle cx="106" cy="62" r="4" fill="#F76707"/>
    </>
  ),
}

const SIZES = {
  sm: { width: 72,  height: 59  },
  md: { width: 120, height: 98  },
  lg: { width: 200, height: 164 },
}

export default function DishArt({ category = 'dish', size = 'md', className = '' }) {
  const art = DISH_ART[category] || DISH_ART.dish
  const { width, height } = SIZES[size] || SIZES.md
  return (
    <svg
      viewBox="0 0 220 180"
      width={width}
      height={height}
      aria-hidden="true"
      className={`flex-shrink-0 ${className}`}
    >
      {art}
    </svg>
  )
}
