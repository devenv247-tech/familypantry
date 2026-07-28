import NookaIcon from '../components/ui/NookaIcon'
import Icon from '../components/ui/Icon'
import { useNavigate, Link } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import axios from 'axios'

// ─── Public API call (no auth needed) ────────────────────────────────────────
const getPublicConfig = () =>
  axios.get(`${import.meta.env.VITE_API_URL}/app/config/public`)
    .then(r => r.data)

const cleanDescription = (flag) => {
  if (!flag.description) return flag.name
  if (flag.description.startsWith('{')) return 'AI recipe generation'
  return flag.description
}

// ─── Plan metadata ────────────────────────────────────────────────────────────
const PLAN_META = [
  {
    key: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    highlight: false,
    badge: null,
    cta: 'Get started free',
    baseFeatures: [
      'Pantry tracking',
      'Barcode scanner',
      'Manual grocery list',
      'Basic spending reports',
      'Manual meal planner',
      '5 smart recipes per week',
      'Up to 5 family members',
      'Weekly pantry digest email',
    ],
  },
  {
    key: 'family',
    name: 'Family',
    price: '$9.99',
    period: '/month',
    highlight: true,
    badge: 'Most popular',
    cta: 'Choose Family',
    baseFeatures: [
      'Everything in Free',
      'Expiry alerts + recipe ideas in digest',
    ],
  },
  {
    key: 'premium',
    name: 'Premium',
    price: '$17.99',
    period: '/month',
    highlight: false,
    badge: 'Most features',
    cta: 'Choose Premium',
    baseFeatures: [
      'Everything in Family',
      'Full weekly digest — meal plan + nutrition tips',
    ],
  },
]

// ─── Dynamic Pricing Cards ────────────────────────────────────────────────────
function DynamicPricingCards() {
  const navigate = useNavigate()
  const [flags, setFlags] = useState([])
  const [loading, setLoading] = useState(true)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          getPublicConfig()
            .then(data => setFlags(data.flags || []))
            .catch(() => setFlags([]))
            .finally(() => setLoading(false))
          observer.disconnect()
        }
      },
      { rootMargin: '200px' }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const getFeatures = (plan) => {
    const flagFeatures = flags
      .filter(f => f.requiredPlan === plan.key)
      .map(f => cleanDescription(f))
    return [...plan.baseFeatures, ...flagFeatures]
  }

  if (loading) {
    return (
      <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-xl p-8 border-2 border-stone-200 bg-white animate-pulse">
            <div className="h-4 bg-stone-200 rounded w-16 mb-4" />
            <div className="h-10 bg-stone-200 rounded w-24 mb-6" />
            <div className="space-y-3">
              {[1,2,3,4,5].map(j => <div key={j} className="h-3 bg-stone-100 rounded w-full" />)}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {PLAN_META.map((plan, i) => {
        const features = getFeatures(plan)
        return (
          <div
            key={i}
            className={`rounded-xl p-8 border-2 transition-all flex flex-col ${
              plan.highlight
                ? 'border-indigo-200 shadow-lg bg-white'
                : 'border-stone-200 bg-white'
            }`}
          >
            {plan.badge && (
              <div className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4 border w-fit ${
                plan.highlight
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                  : 'bg-food-50 text-food-700 border-food-100'
              }`}>
                {plan.badge}
              </div>
            )}
            <p className="text-stone-500 text-sm font-medium mb-1">{plan.name}</p>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-bold text-stone-900">{plan.price}</span>
              <span className="text-stone-500 text-sm">{plan.period}</span>
            </div>
            <ul className="space-y-2.5 mb-8 flex-1">
              {features.map((f, j) => (
                <li key={j} className="flex items-start gap-2 text-sm text-stone-700">
                  <Icon name="check" size={14} className="text-fresh-600 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate('/register')}
              className={`w-full text-center py-3 rounded-btn font-medium transition-all ${
                plan.highlight ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              {plan.cta}
            </button>
          </div>
        )
      })}
    </div>
  )
}

// ─── FAQ Item ─────────────────────────────────────────────────────────────────
function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-stone-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left bg-white hover:bg-stone-50 transition-colors"
      >
        <span className="font-medium text-stone-900 text-base">{question}</span>
        <span className={`text-primary text-xl transition-transform duration-200 flex-shrink-0 ml-4 ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      {open && (
        <div className="px-6 py-4 bg-white border-t border-stone-200">
          <p className="text-stone-600 text-sm leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  )
}

// ─── Main Landing Page ────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Nooka — Family meal planning built for Canada'
    let meta = document.querySelector('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'description'
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', 'Nooka is AI-powered meal planning, pantry tracking, and Health Canada recall alerts built for Canadian families. Free plan available. Data stored in Canada.')
  }, [])

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Navbar */}
      <nav className="bg-surface border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <NookaIcon size={32} />
          <span className="font-semibold text-textPrimary text-lg">Nooka</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/login')} className="btn-secondary">Log in</button>
          <button onClick={() => navigate('/register')} className="btn-primary">Get started free</button>
        </div>
      </nav>

      <main>

        {/* ── 1. HERO ───────────────────────────────────────────────────────── */}
        <section className="bg-white px-6 pt-16 sm:pt-24 pb-0">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-food-50 text-food-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 border border-food-100">
              <Icon name="canada" size={14} className="text-red-600" />
              Built for Canadian families
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 leading-tight mb-6">
              Less time planning,<br />
              <span className="text-primary">more time living.</span>
            </h1>
            <p className="text-lg sm:text-xl text-stone-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              Nooka plans your family's meals around your pantry, your health goals, and Health Canada recalls — all in one place.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
              <button
                onClick={() => navigate('/register')}
                className="btn-primary text-base px-8 py-3 w-full sm:w-auto"
              >
                Start for free
              </button>
              <button
                onClick={() => document.getElementById('planner-showcase')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn-secondary text-base px-8 py-3 w-full sm:w-auto"
              >
                See how it works
              </button>
            </div>
            <p className="text-xs text-stone-400">
              No credit card required · Free plan available · Data stored in Canada
            </p>
          </div>

          {/* Dashboard in browser chrome — overlaps into next section on desktop */}
          <div className="relative z-10 mt-12 sm:mt-16 sm:-mb-20 max-w-5xl mx-auto">
            <div className="rounded-xl border border-stone-200 shadow-xl overflow-hidden">
              <div className="bg-stone-100 h-9 flex items-center px-4 gap-3 flex-shrink-0">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-stone-300 block flex-shrink-0" />
                  <span className="w-2.5 h-2.5 rounded-full bg-stone-300 block flex-shrink-0" />
                  <span className="w-2.5 h-2.5 rounded-full bg-stone-300 block flex-shrink-0" />
                </div>
                <div className="bg-stone-200 rounded h-4 flex-1 max-w-[200px] flex-shrink-0" />
              </div>
              <img
                src="/landing/dashboard.png"
                alt="Nooka dashboard showing meal plan and pantry overview"
                className="w-full block"
                loading="eager"
              />
            </div>
          </div>
        </section>

        {/* ── 2. DIFFERENTIATOR STRIP ──────────────────────────────────────── */}
        <section className="bg-food-50/40 pt-12 sm:pt-40 pb-20 px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 text-center mb-12">
              Why Canadian families choose Nooka
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

              {/* Recall alerts */}
              <div className="bg-white rounded-xl border border-stone-200 overflow-hidden flex flex-col">
                <div className="bg-food-50 overflow-hidden">
                  <img
                    src="/landing/recalls.png"
                    alt="Health Canada recall alerts matched to your pantry"
                    className="w-full block h-[180px] object-cover object-top"
                    loading="lazy"
                  />
                </div>
                <div className="p-6 flex-1">
                  <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-2">Health Canada recalls</p>
                  <h3 className="font-semibold text-stone-900 mb-2">Know before dinner</h3>
                  <p className="text-stone-600 text-sm leading-relaxed">
                    Live recall monitoring, matched against your actual pantry. If something you own is recalled, you know.
                  </p>
                </div>
              </div>

              {/* Baby & toddler */}
              <div className="bg-white rounded-xl border border-stone-200 overflow-hidden flex flex-col">
                <div className="bg-fresh-50 overflow-hidden">
                  <img
                    src="/landing/baby.png"
                    alt="Baby profile allergen tracking following Health Canada guidance"
                    className="w-full block h-[180px] object-cover object-top"
                    loading="lazy"
                  />
                </div>
                <div className="p-6 flex-1">
                  <p className="text-xs font-bold text-fresh-600 uppercase tracking-wide mb-2">Baby &amp; toddler nutrition</p>
                  <h3 className="font-semibold text-stone-900 mb-2">Allergen intros, done right</h3>
                  <p className="text-stone-600 text-sm leading-relaxed">
                    Track allergen introductions and growth stages, following Health Canada guidance. Export reports for your pediatrician.
                  </p>
                </div>
              </div>

              {/* Privacy */}
              <div className="bg-white rounded-xl border border-stone-200 overflow-hidden flex flex-col">
                <div className="bg-indigo-50 flex items-center justify-center" style={{ minHeight: '196px' }}>
                  <div className="text-center px-6">
                    <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                      <Icon name="lock" size={24} className="text-primary" />
                    </div>
                    <div className="flex items-center justify-center gap-1.5">
                      <Icon name="canada" size={16} className="text-red-600" />
                      <span className="text-sm font-semibold text-stone-700">Canadian-hosted</span>
                    </div>
                  </div>
                </div>
                <div className="p-6 flex-1">
                  <p className="text-xs font-bold text-primary uppercase tracking-wide mb-2">Privacy, Canadian-style</p>
                  <h3 className="font-semibold text-stone-900 mb-2">Your data stays here</h3>
                  <p className="text-stone-600 text-sm leading-relaxed">
                    PIPEDA compliant. Your family's data lives on Canadian servers and is never sold.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── 3. PLANNER SHOWCASE ──────────────────────────────────────────── */}
        <section id="planner-showcase" className="bg-white px-6 py-20">
          <div className="max-w-5xl mx-auto">
            <p className="text-xs font-bold text-food-700 uppercase tracking-widest text-center mb-3">Meal planning</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 text-center mb-4">
              Your whole week, planned in minutes
            </h2>
            <p className="text-stone-600 text-center max-w-2xl mx-auto mb-10 leading-relaxed">
              Tell Nooka your family's preferences and health goals once. It builds a full week of meals around your actual pantry — then generates your grocery list automatically.
            </p>
            <div className="rounded-xl border border-stone-200 shadow-lg overflow-hidden mb-10">
              <img
                src="/landing/planner.png"
                alt="Nooka weekly meal planner with per-member nutrition targets"
                className="w-full block"
                loading="lazy"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              {[
                { value: '28', label: 'meals planned in one tap' },
                { value: 'Per-member', label: 'calorie & nutrition targets' },
                { value: 'Auto', label: 'generates your grocery list' },
              ].map((s, i) => (
                <div key={i} className="py-4 border-t border-stone-100">
                  <p className="text-2xl font-bold text-food-600 mb-1">{s.value}</p>
                  <p className="text-sm text-stone-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4. RECIPES SECTION ───────────────────────────────────────────── */}
        <section className="bg-food-50/40 px-6 py-20">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 text-center mb-4">
              Recipes your family will actually eat
            </h2>
            <p className="text-stone-600 text-center max-w-2xl mx-auto mb-10 leading-relaxed">
              AI suggestions based on what's already in your pantry. Allergen warnings built in for every family member — nothing slips through.
            </p>
            <div className="rounded-xl border border-stone-200 shadow-lg overflow-hidden">
              {/* Desktop: cookbook grid view */}
              <img
                src="/landing/cookbook.png"
                alt="Nooka recipe suggestions based on your pantry"
                className="w-full block hidden sm:block"
                loading="lazy"
              />
              {/* Mobile: portrait recipe detail fits better */}
              <img
                src="/landing/recipe-detail.png"
                alt="Nooka recipe detail with allergen warnings"
                className="w-full block sm:hidden"
                loading="lazy"
              />
            </div>
          </div>
        </section>

        {/* ── 5. MOBILE SECTION ────────────────────────────────────────────── */}
        <section className="bg-white px-6 py-20">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col-reverse sm:flex-row items-center gap-12">

              {/* Text */}
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-4">
                  In your pocket at the grocery store
                </h2>
                <p className="text-stone-600 leading-relaxed mb-8">
                  Check what's in your pantry while you shop, tick off your grocery list as you go, and get instant recall alerts if anything on the shelf is flagged by Health Canada.
                </p>
                <ul className="space-y-4">
                  {[
                    { icon: 'pantry', text: 'Live pantry lookup in the aisle' },
                    { icon: 'grocery', text: 'Tap-to-check grocery list' },
                    { icon: 'recalls', text: 'Real-time recall alerts' },
                    { icon: 'barcode', text: 'Barcode scan to add items instantly' },
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 justify-center sm:justify-start">
                      <div className="w-9 h-9 rounded-full bg-food-50 flex items-center justify-center flex-shrink-0">
                        <Icon name={item.icon} size={16} className="text-food-600" />
                      </div>
                      <span className="text-stone-700 text-sm">{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CSS-only phone frame */}
              <div className="flex-shrink-0 mx-auto sm:mx-0">
                <div className="w-[220px] sm:w-[260px]">
                  <div className="rounded-[2rem] border-[6px] border-stone-900 overflow-hidden shadow-2xl">
                    <img
                      src="/landing/mobile-dashboard.png"
                      alt="Nooka mobile app at the grocery store"
                      className="w-full block"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── 6. PRICING ───────────────────────────────────────────────────── */}
        <section className="bg-food-50/40 px-6 py-20">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 text-center mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-stone-600 text-center mb-12">
              Start free. Upgrade when you're ready. Cancel anytime.
            </p>
            <DynamicPricingCards />
            <p className="text-center text-xs text-stone-400 mt-6">
              All prices in CAD · No hidden fees · Cancel anytime · Powered by Stripe
            </p>
          </div>
        </section>

        {/* ── 7. FAQ ───────────────────────────────────────────────────────── */}
        <section className="bg-white px-6 py-20">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 text-center mb-12">
              Frequently asked questions
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: 'Is Nooka free to use?',
                  a: "Yes! Nooka has a free plan that never expires. You get pantry tracking, a barcode scanner, manual grocery lists, and 5 smart recipe suggestions per week — no credit card needed. Paid plans start at $9.99/month when you're ready for more."
                },
                {
                  q: "Is my family's data stored in Canada?",
                  a: "Always. Your data lives on Canadian servers and never crosses the border. We follow federal PIPEDA and BC PIPA privacy laws — because your family's information should stay where you are."
                },
                {
                  q: 'How does the recipe suggestion work?',
                  a: "Nooka looks at what's already in your pantry, checks each family member's dietary needs and health goals, and suggests meals you can actually make tonight. No random recipes you don't have ingredients for."
                },
                {
                  q: 'Can I track allergens for my kids?',
                  a: "Yes — each family member gets their own profile where you can set allergens, dietary restrictions, and health goals. Nooka filters every recipe suggestion around those automatically. Nothing slips through."
                },
                {
                  q: 'Does Nooka work for the whole family?',
                  a: "Yep. You can add up to 5 family members on the free plan. Each person gets their own health profile, and Nooka balances everyone's needs when suggesting meals — picky eaters, allergies, and all."
                },
                {
                  q: 'How do food recall alerts work?',
                  a: "Nooka checks your pantry against live Health Canada recall notices automatically. If something you have gets recalled, you'll get an alert right away. No more finding out from the news three days later."
                },
                {
                  q: 'Can I cancel my subscription anytime?',
                  a: "Absolutely — no contracts, no cancellation fees. Cancel from your account settings in seconds. You keep access until the end of your billing period and your data stays safe either way."
                },
                {
                  q: "What's the difference between Family and Premium?",
                  a: 'Family adds smart grocery lists, predictive shopping, pantry pattern insights, and photo scanning (5 scans/month) on top of the free plan. Premium goes further with unlimited photo scans, a full weekly meal planner, voice input, kids nutrition tracking, and more. Both are month-to-month with no commitment.'
                },
              ].map((item, i) => (
                <FAQItem key={i} question={item.q} answer={item.a} />
              ))}
            </div>
          </div>
        </section>

        {/* ── 8. FINAL CTA ─────────────────────────────────────────────────── */}
        <section className="bg-white px-6 py-20 text-center border-t border-stone-100">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-4">Dinner, decided.</h2>
            <p className="text-stone-600 text-lg mb-8">
              Join Canadian families using Nooka to eat smarter, waste less, and stay safe.
            </p>
            <button
              onClick={() => navigate('/register')}
              className="btn-primary text-base px-10 py-3"
            >
              Start for free
            </button>
            <p className="text-xs text-stone-400 mt-4">
              No credit card required · Free plan available · Data stored in Canada
            </p>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8 text-center text-sm text-gray-500">
        <div className="flex items-center justify-center gap-2 mb-3">
          <NookaIcon size={24} />
          <span className="font-semibold text-textPrimary">Nooka</span>
        </div>
        <p>
          © 2026 Nooka · Built for Canadian families ·{' '}
          <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
          {' · '}
          <Link to="/terms" className="hover:underline">Terms of Service</Link>
        </p>
      </footer>

    </div>
  )
}
