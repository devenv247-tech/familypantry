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
  // Stone-100 bowl with overflowing leaf mounds in fresh-600/700, orange
  // tomatoes and amber cheese tucked among the greens. Green is dominant.
  // Draw order: bowl → green base → rim → leaf mounds (overflow rim) → toppings.
  salad: (
    <>
      {/* bowl body */}
      <path d="M28 106 a82 56 0 0 0 164 0 z" fill="#F5F5F4"/>
      {/* green fill base inside bowl */}
      <ellipse cx="110" cy="130" rx="70" ry="24" fill="#2F9E44"/>
      {/* bowl rim — painted before mounds so leaves can overflow above it */}
      <path d="M28 106 a82 20 0 0 1 164 0 a82 20 0 0 1 -164 0" fill="#D6D3D1"/>
      {/* left leaf mound — rises above rim */}
      <ellipse cx="72" cy="88" rx="34" ry="32" fill="#2B8A3E"/>
      {/* right leaf mound */}
      <ellipse cx="150" cy="90" rx="30" ry="28" fill="#2F9E44"/>
      {/* center leaf mound — tallest, dominant */}
      <ellipse cx="112" cy="78" rx="40" ry="38" fill="#2B8A3E"/>
      {/* tomato left */}
      <circle cx="60" cy="110" r="13" fill="#F76707"/>
      {/* tomato right */}
      <circle cx="162" cy="111" r="11" fill="#E8590C"/>
      {/* tomato center-front */}
      <circle cx="104" cy="120" r="9" fill="#F76707"/>
      {/* cheese dot — tucked front-right, outside center mound */}
      <circle cx="140" cy="116" r="8" fill="#FBBF24"/>
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

  // ── taco ───────────────────────────────────────────────────────────────────
  // Front-on U-shaped shell, filling and garnish peeking at the top opening.
  taco: (
    <>
      {/* outer shell */}
      <path d="M50 82 C53 142 80 160 110 160 C140 160 167 142 170 82 Z" fill="#FFD8A8"/>
      {/* inner fold / shadow */}
      <path d="M68 82 C70 138 88 154 110 154 C132 154 150 138 152 82 Z" fill="#F76707"/>
      {/* lettuce base */}
      <ellipse cx="110" cy="77" rx="52" ry="13" fill="#2F9E44"/>
      {/* protein chunks */}
      <ellipse cx="90" cy="74" rx="17" ry="9" fill="#E8590C"/>
      <ellipse cx="130" cy="74" rx="15" ry="8" fill="#F76707"/>
      {/* garnish flecks */}
      <circle cx="75" cy="69" r="5" fill="#2B8A3E"/>
      <circle cx="112" cy="67" r="4" fill="#2F9E44"/>
      <circle cx="145" cy="70" r="5" fill="#2B8A3E"/>
    </>
  ),

  // ── pizza ──────────────────────────────────────────────────────────────────
  // Top-down: food-100 crust ring, food-600 sauce, pepperoni dots, 2 slice lines.
  pizza: (
    <>
      {/* crust */}
      <circle cx="110" cy="100" r="76" fill="#FFE8CC"/>
      {/* sauce + cheese surface */}
      <circle cx="110" cy="100" r="62" fill="#F76707"/>
      {/* pepperoni */}
      <circle cx="110" cy="78" r="11" fill="#E8590C"/>
      <circle cx="86" cy="112" r="11" fill="#E8590C"/>
      <circle cx="134" cy="112" r="11" fill="#E8590C"/>
      <circle cx="110" cy="122" r="9" fill="#D9480F"/>
      {/* slice lines */}
      <line x1="110" y1="24" x2="110" y2="176" stroke="#FFE8CC" strokeWidth="3"/>
      <line x1="34" y1="100" x2="186" y2="100" stroke="#FFE8CC" strokeWidth="3"/>
    </>
  ),

  // ── pasta ──────────────────────────────────────────────────────────────────
  // Wide stone-100 plate, food-600 sauce bed, cream noodle swirls, herb fleck.
  pasta: (
    <>
      {/* plate rim */}
      <ellipse cx="110" cy="138" rx="82" ry="18" fill="#F5F5F4"/>
      {/* inner plate */}
      <ellipse cx="110" cy="138" rx="68" ry="12" fill="#FAFAF9"/>
      {/* sauce / pasta bed */}
      <ellipse cx="110" cy="116" rx="60" ry="36" fill="#E8590C"/>
      {/* noodle swirl 1 */}
      <path d="M68 110 q20-18 42 0 q20 18 42 0" stroke="#FAFAF9" strokeWidth="7" strokeLinecap="round" fill="none"/>
      {/* noodle swirl 2 */}
      <path d="M78 126 q16-14 32 0 q16 14 32 0" stroke="#FFE8CC" strokeWidth="6" strokeLinecap="round" fill="none"/>
      {/* herb fleck */}
      <circle cx="112" cy="100" r="6" fill="#2F9E44"/>
      <circle cx="128" cy="106" r="4" fill="#2B8A3E"/>
    </>
  ),

  // ── omelette ───────────────────────────────────────────────────────────────
  // Folded dome amber-400, cream crease at fold base, green filling, stone plate.
  omelette: (
    <>
      {/* plate */}
      <ellipse cx="110" cy="148" rx="80" ry="13" fill="#F5F5F4"/>
      {/* omelette dome */}
      <path d="M36 122 a74 42 0 0 1 148 0 Z" fill="#FBBF24"/>
      {/* fold crease — cream underside */}
      <path d="M36 122 a74 14 0 0 0 148 0 a74 14 0 0 0 -148 0" fill="#FAFAF9"/>
      {/* filling peek */}
      <ellipse cx="88" cy="120" rx="18" ry="8" fill="#2F9E44"/>
      <ellipse cx="132" cy="120" rx="15" ry="7" fill="#2B8A3E"/>
      {/* egg surface highlight */}
      <ellipse cx="110" cy="96" rx="30" ry="14" fill="#FFE8CC"/>
    </>
  ),

  // ── skewers ────────────────────────────────────────────────────────────────
  // Two diagonal stone-300 sticks, alternating cubes food-600/fresh-600/food-500.
  skewers: (
    <>
      {/* stick 1 */}
      <line x1="52" y1="38" x2="150" y2="158" stroke="#D6D3D1" strokeWidth="8" strokeLinecap="round"/>
      {/* stick 2 */}
      <line x1="80" y1="34" x2="178" y2="154" stroke="#D6D3D1" strokeWidth="8" strokeLinecap="round"/>
      {/* cubes on stick 1 */}
      <rect x="62" y="60" width="26" height="26" rx="4" fill="#E8590C"/>
      <rect x="88" y="88" width="26" height="26" rx="4" fill="#2F9E44"/>
      <rect x="114" y="116" width="26" height="26" rx="4" fill="#F76707"/>
      {/* cubes on stick 2 */}
      <rect x="90" y="56" width="26" height="26" rx="4" fill="#2F9E44"/>
      <rect x="116" y="84" width="26" height="26" rx="4" fill="#E8590C"/>
      <rect x="142" y="112" width="26" height="26" rx="4" fill="#F76707"/>
    </>
  ),

  // ── smoothie ───────────────────────────────────────────────────────────────
  // Tall rounded-rect glass, food-500 fill, cream straw, fresh-green leaf garnish.
  smoothie: (
    <>
      {/* glass body */}
      <rect x="74" y="42" width="72" height="118" rx="12" fill="#F5F5F4"/>
      {/* liquid fill */}
      <rect x="78" y="48" width="64" height="94" rx="8" fill="#F76707"/>
      {/* glass shine */}
      <rect x="82" y="50" width="13" height="84" rx="6" fill="#FAFAF9"/>
      {/* straw */}
      <rect x="122" y="28" width="8" height="86" rx="4" fill="#FAFAF9"/>
      {/* leaf garnish */}
      <ellipse cx="104" cy="46" rx="16" ry="9" fill="#2F9E44"/>
      <ellipse cx="118" cy="42" rx="11" ry="7" fill="#2B8A3E"/>
    </>
  ),

  // ── toast ──────────────────────────────────────────────────────────────────
  // Rounded-square food-200 slice, food-600 crust ring, amber-400 spread, herb flecks.
  toast: (
    <>
      {/* toast slice */}
      <rect x="42" y="40" width="136" height="122" rx="24" fill="#FFD8A8"/>
      {/* crust edge */}
      <rect x="42" y="40" width="136" height="122" rx="24" fill="none" stroke="#E8590C" strokeWidth="12"/>
      {/* topping — amber spread */}
      <rect x="62" y="60" width="96" height="82" rx="14" fill="#FBBF24"/>
      {/* herb flecks */}
      <circle cx="88" cy="88" r="7" fill="#2F9E44"/>
      <circle cx="118" cy="80" r="6" fill="#2B8A3E"/>
      <circle cx="108" cy="112" r="7" fill="#2F9E44"/>
      <circle cx="138" cy="106" r="6" fill="#2B8A3E"/>
    </>
  ),

  // ── muffin ─────────────────────────────────────────────────────────────────
  // food-600 dome overhanging a food-200 fluted-trapezoid wrapper.
  muffin: (
    <>
      {/* paper wrapper */}
      <path d="M72 164 L58 128 L162 128 L148 164 Z" fill="#FFD8A8"/>
      {/* wrapper ribs */}
      <line x1="84" y1="128" x2="77" y2="164" stroke="#E8590C" strokeWidth="5"/>
      <line x1="110" y1="128" x2="110" y2="164" stroke="#E8590C" strokeWidth="5"/>
      <line x1="136" y1="128" x2="143" y2="164" stroke="#E8590C" strokeWidth="5"/>
      {/* dome — overhangs wrapper slightly */}
      <path d="M44 132 a66 72 0 0 1 132 0 Z" fill="#E8590C"/>
      {/* dome highlight */}
      <ellipse cx="92" cy="86" rx="30" ry="20" fill="#F76707"/>
    </>
  ),

  // ── cookie ─────────────────────────────────────────────────────────────────
  // food-200 circle with scattered food-700 chip dots.
  cookie: (
    <>
      {/* cookie body */}
      <circle cx="110" cy="100" r="72" fill="#FFD8A8"/>
      {/* chocolate chips */}
      <ellipse cx="84" cy="78" rx="12" ry="9" fill="#D9480F"/>
      <ellipse cx="128" cy="76" rx="11" ry="8" fill="#D9480F"/>
      <ellipse cx="72" cy="112" rx="11" ry="8" fill="#D9480F"/>
      <ellipse cx="120" cy="116" rx="12" ry="9" fill="#D9480F"/>
      <ellipse cx="146" cy="96" rx="11" ry="8" fill="#D9480F"/>
      <ellipse cx="96" cy="130" rx="11" ry="8" fill="#D9480F"/>
    </>
  ),

  // ── cake ───────────────────────────────────────────────────────────────────
  // Side-view slice: two food-200 sponge layers, food-600 filling stripe, amber-400 frosting.
  cake: (
    <>
      {/* plate */}
      <ellipse cx="110" cy="158" rx="80" ry="12" fill="#F5F5F4"/>
      {/* bottom sponge */}
      <rect x="38" y="118" width="144" height="40" rx="5" fill="#FFD8A8"/>
      {/* filling stripe */}
      <rect x="38" y="106" width="144" height="16" rx="2" fill="#E8590C"/>
      {/* top sponge */}
      <rect x="38" y="66" width="144" height="44" rx="5" fill="#FFD8A8"/>
      {/* frosting */}
      <rect x="34" y="54" width="152" height="20" rx="8" fill="#FBBF24"/>
    </>
  ),

  // ── oatmeal ────────────────────────────────────────────────────────────────
  // Bowl geometry (ricebowl), cream oat surface, food-500 berry dots, herb garnish.
  oatmeal: (
    <>
      {/* steam */}
      <path d="M88 32 q-5 9 0 18 q5 9 0 16" stroke="#FFD8A8" strokeWidth="5" strokeLinecap="round" fill="none"/>
      <path d="M132 28 q-5 9 0 18 q5 9 0 16" stroke="#FFD8A8" strokeWidth="5" strokeLinecap="round" fill="none"/>
      {/* bowl body */}
      <path d="M35 102 a75 58 0 0 0 150 0 z" fill="#E8590C"/>
      {/* bowl rim */}
      <path d="M35 102 a75 18 0 0 1 150 0 a75 18 0 0 1 -150 0" fill="#D9480F"/>
      {/* oat surface */}
      <path d="M52 102 a58 30 0 0 0 116 0 z" fill="#FAFAF9"/>
      {/* berry dots */}
      <circle cx="85" cy="90" r="9" fill="#F76707"/>
      <circle cx="110" cy="86" r="8" fill="#F76707"/>
      <circle cx="136" cy="90" r="9" fill="#F76707"/>
      {/* herb garnish */}
      <circle cx="110" cy="98" r="5" fill="#2F9E44"/>
    </>
  ),

  // ── fish ───────────────────────────────────────────────────────────────────
  // Oval food-500 fillet on stone plate, two food-200 curved stripes, green fleck.
  fish: (
    <>
      {/* plate */}
      <ellipse cx="110" cy="150" rx="74" ry="11" fill="#F5F5F4"/>
      {/* fillet body */}
      <ellipse cx="108" cy="120" rx="68" ry="26" fill="#F76707"/>
      {/* stripe 1 */}
      <path d="M54 114 Q88 102 142 114 Q162 118 170 110" stroke="#FFD8A8" strokeWidth="6" strokeLinecap="round" fill="none"/>
      {/* stripe 2 */}
      <path d="M56 122 Q92 112 144 122 Q162 126 170 118" stroke="#FFE8CC" strokeWidth="5" strokeLinecap="round" fill="none"/>
      {/* stripe 3 */}
      <path d="M60 130 Q94 120 144 128" stroke="#FFD8A8" strokeWidth="4" strokeLinecap="round" fill="none"/>
      {/* green fleck */}
      <circle cx="76" cy="136" r="6" fill="#2B8A3E"/>
    </>
  ),

  // ── shrimp ─────────────────────────────────────────────────────────────────
  // 3 food-500/600 crescent strokes on plate, cream tail-tip ellipses.
  shrimp: (
    <>
      {/* plate */}
      <ellipse cx="110" cy="154" rx="72" ry="10" fill="#F5F5F4"/>
      {/* shrimp 1 */}
      <path d="M68 90 Q44 118 60 148" stroke="#F76707" strokeWidth="18" strokeLinecap="round" fill="none"/>
      {/* tail 1 */}
      <ellipse cx="60" cy="150" rx="10" ry="6" fill="#FAFAF9"/>
      {/* shrimp 2 */}
      <path d="M110 80 Q82 112 98 148" stroke="#E8590C" strokeWidth="18" strokeLinecap="round" fill="none"/>
      {/* tail 2 */}
      <ellipse cx="98" cy="150" rx="10" ry="6" fill="#FAFAF9"/>
      {/* shrimp 3 */}
      <path d="M152 90 Q176 116 162 148" stroke="#F76707" strokeWidth="18" strokeLinecap="round" fill="none"/>
      {/* tail 3 */}
      <ellipse cx="162" cy="150" rx="10" ry="6" fill="#FAFAF9"/>
    </>
  ),

  // ── chicken ────────────────────────────────────────────────────────────────
  // Drumstick: food-600 oval meat body + stone-300 bone stick + cream knob on plate.
  chicken: (
    <>
      {/* plate */}
      <ellipse cx="110" cy="156" rx="72" ry="10" fill="#F5F5F4"/>
      {/* bone stick */}
      <rect x="104" y="124" width="12" height="36" rx="6" fill="#D6D3D1"/>
      {/* cream bone end */}
      <ellipse cx="110" cy="158" rx="16" ry="8" fill="#FAFAF9"/>
      {/* meat body */}
      <ellipse cx="110" cy="102" rx="44" ry="36" fill="#E8590C"/>
      {/* highlight */}
      <ellipse cx="96" cy="90" rx="20" ry="14" fill="#F76707"/>
    </>
  ),

  // ── steak ──────────────────────────────────────────────────────────────────
  // food-700 rounded slab, one food-500 marbling stroke, plate, green fleck.
  steak: (
    <>
      {/* plate */}
      <ellipse cx="110" cy="154" rx="76" ry="11" fill="#F5F5F4"/>
      {/* slab */}
      <rect x="44" y="102" width="132" height="50" rx="18" fill="#D9480F"/>
      {/* marbling */}
      <path d="M64 118 Q90 108 120 120 Q148 130 168 118" stroke="#F76707" strokeWidth="5" strokeLinecap="round" fill="none"/>
      {/* green fleck */}
      <circle cx="166" cy="130" r="6" fill="#2B8A3E"/>
      <circle cx="178" cy="124" r="4" fill="#2F9E44"/>
    </>
  ),

  // ── ribs ───────────────────────────────────────────────────────────────────
  // 4 rounded food-600 rib verticals joined by a food-700 top bar, on plate.
  ribs: (
    <>
      {/* plate */}
      <ellipse cx="110" cy="158" rx="76" ry="11" fill="#F5F5F4"/>
      {/* top bar */}
      <rect x="44" y="88" width="132" height="30" rx="8" fill="#D9480F"/>
      {/* rib 1 */}
      <rect x="52" y="114" width="22" height="46" rx="10" fill="#E8590C"/>
      {/* rib 2 */}
      <rect x="83" y="114" width="22" height="46" rx="10" fill="#E8590C"/>
      {/* rib 3 */}
      <rect x="114" y="114" width="22" height="46" rx="10" fill="#E8590C"/>
      {/* rib 4 */}
      <rect x="145" y="114" width="22" height="46" rx="10" fill="#E8590C"/>
    </>
  ),

  // ── dumpling ───────────────────────────────────────────────────────────────
  // 3 cream/stone half-circle bodies with food-200 pleat lines, on plate.
  dumpling: (
    <>
      {/* plate */}
      <ellipse cx="110" cy="158" rx="72" ry="10" fill="#F5F5F4"/>
      {/* back-left dumpling */}
      <path d="M52 132 a30 22 0 0 1 60 0 Z" fill="#F5F5F4"/>
      <path d="M66 132 Q80 112 86 132" stroke="#FFD8A8" strokeWidth="3" fill="none"/>
      {/* back-right dumpling */}
      <path d="M108 130 a30 22 0 0 1 60 0 Z" fill="#F5F5F4"/>
      <path d="M122 130 Q136 110 142 130" stroke="#FFD8A8" strokeWidth="3" fill="none"/>
      {/* front-center dumpling */}
      <path d="M78 146 a32 24 0 0 1 64 0 Z" fill="#FAFAF9"/>
      <path d="M93 146 Q110 122 127 146" stroke="#FFD8A8" strokeWidth="3" fill="none"/>
    </>
  ),

  // ── sushi ──────────────────────────────────────────────────────────────────
  // 3 nigiri: cream rice body, food-500 fish top ellipse; center has fresh-600 band.
  sushi: (
    <>
      {/* piece 1 */}
      <rect x="28" y="100" width="48" height="56" rx="10" fill="#FAFAF9"/>
      <ellipse cx="52" cy="100" rx="24" ry="10" fill="#F76707"/>
      {/* piece 2 — seaweed band */}
      <rect x="86" y="96" width="48" height="60" rx="10" fill="#FAFAF9"/>
      <rect x="86" y="128" width="48" height="12" fill="#2F9E44"/>
      <ellipse cx="110" cy="96" rx="24" ry="10" fill="#E8590C"/>
      {/* piece 3 */}
      <rect x="144" y="100" width="48" height="56" rx="10" fill="#FAFAF9"/>
      <ellipse cx="168" cy="100" rx="24" ry="10" fill="#F76707"/>
    </>
  ),

  // ── fries ──────────────────────────────────────────────────────────────────
  // food-600 trapezoid carton, 5 cream/food-200 stick rects fanning out the top.
  fries: (
    <>
      {/* carton */}
      <path d="M72 164 L84 104 L136 104 L148 164 Z" fill="#E8590C"/>
      {/* carton crease */}
      <path d="M79 140 L84 104 L136 104 L141 140 Z" fill="#D9480F"/>
      {/* fry sticks — fan out from carton opening */}
      <rect x="80" y="56" width="10" height="52" rx="4" fill="#FFD8A8"/>
      <rect x="95" y="48" width="10" height="60" rx="4" fill="#FAFAF9"/>
      <rect x="110" y="44" width="10" height="64" rx="4" fill="#FFD8A8"/>
      <rect x="125" y="48" width="10" height="60" rx="4" fill="#FAFAF9"/>
      <rect x="140" y="54" width="10" height="52" rx="4" fill="#FFD8A8"/>
    </>
  ),

  // ── drink ──────────────────────────────────────────────────────────────────
  // Cream mug: rounded-rect body, stone-300 rim ellipse + handle, food-500 fill at top.
  drink: (
    <>
      {/* steam */}
      <path d="M88 30 q-5 9 0 18 q5 9 0 16" stroke="#FFD8A8" strokeWidth="5" strokeLinecap="round" fill="none"/>
      <path d="M120 24 q-5 9 0 18 q5 9 0 16" stroke="#FFD8A8" strokeWidth="5" strokeLinecap="round" fill="none"/>
      {/* mug body */}
      <rect x="60" y="68" width="90" height="88" rx="14" fill="#F5F5F4"/>
      {/* liquid fill at rim */}
      <rect x="64" y="72" width="82" height="28" rx="6" fill="#F76707"/>
      {/* rim ellipse */}
      <ellipse cx="105" cy="70" rx="45" ry="10" fill="#D6D3D1"/>
      {/* handle */}
      <path d="M150 90 Q184 90 184 118 Q184 148 150 148" stroke="#D6D3D1" strokeWidth="10" strokeLinecap="round" fill="none"/>
    </>
  ),

  // ── eggs ───────────────────────────────────────────────────────────────────
  // Fried egg: cream irregular egg-white ellipse + amber-400 yolk, on plate.
  eggs: (
    <>
      {/* plate */}
      <ellipse cx="110" cy="154" rx="74" ry="11" fill="#F5F5F4"/>
      {/* egg white base */}
      <ellipse cx="110" cy="120" rx="64" ry="28" fill="#FAFAF9"/>
      {/* extra lobe — gives irregular fried-egg silhouette */}
      <ellipse cx="76" cy="128" rx="24" ry="14" fill="#FAFAF9"/>
      {/* yolk */}
      <circle cx="110" cy="112" r="22" fill="#FBBF24"/>
      {/* yolk highlight */}
      <circle cx="102" cy="106" r="8" fill="#FFE8CC"/>
    </>
  ),

  // ── riceplate ──────────────────────────────────────────────────────────────
  // Stone plate, 3 overlapping food-100/cream mound ellipses, green fleck.
  riceplate: (
    <>
      {/* plate */}
      <ellipse cx="110" cy="152" rx="76" ry="12" fill="#F5F5F4"/>
      {/* mound left */}
      <ellipse cx="88" cy="130" rx="34" ry="22" fill="#FFE8CC"/>
      {/* mound right */}
      <ellipse cx="132" cy="130" rx="34" ry="22" fill="#FFE8CC"/>
      {/* mound center-peak */}
      <ellipse cx="110" cy="116" rx="38" ry="26" fill="#FAFAF9"/>
      {/* green fleck */}
      <circle cx="132" cy="110" r="6" fill="#2F9E44"/>
      <circle cx="148" cy="120" r="4" fill="#2B8A3E"/>
    </>
  ),

  // ── yogurtbowl ─────────────────────────────────────────────────────────────
  // Bowl geometry (ricebowl), cream yogurt surface, amber-400 drizzle, fresh-green dots.
  yogurtbowl: (
    <>
      {/* bowl body */}
      <path d="M35 102 a75 58 0 0 0 150 0 z" fill="#E8590C"/>
      {/* bowl rim */}
      <path d="M35 102 a75 18 0 0 1 150 0 a75 18 0 0 1 -150 0" fill="#D9480F"/>
      {/* yogurt surface */}
      <path d="M52 102 a58 30 0 0 0 116 0 z" fill="#FAFAF9"/>
      {/* honey drizzle */}
      <path d="M76 90 q18-16 34 0 q18 16 34 0" stroke="#FBBF24" strokeWidth="8" strokeLinecap="round" fill="none"/>
      {/* fruit / granola dots */}
      <circle cx="86" cy="88" r="8" fill="#2F9E44"/>
      <circle cx="136" cy="88" r="8" fill="#2F9E44"/>
      <circle cx="110" cy="84" r="7" fill="#2B8A3E"/>
    </>
  ),
}

const SIZES = {
  xs: { width: 40,  height: 33  },
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
