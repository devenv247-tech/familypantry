import { useNavigate, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

// ─── Public API call (no auth needed) ────────────────────────────────────────
// Calls /admin/public/config which you added to the backend in Step 2
const getPublicConfig = async () => {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/public/config`)
  if (!res.ok) throw new Error('Failed to fetch config')
  return res.json()
}

// ─── Plan metadata (prices/badges never change — only features change) ────────
const PLAN_META = [
  {
    key: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    highlight: false,
    badge: null,
    cta: 'Get started free',
    // These are hardcoded free-tier items that don't come from feature flags
    // because they are always included and not flag-controlled
    baseFeatures: [
      'Pantry tracking',
      'Barcode scanner',
      'Manual grocery list',
      'Basic spending reports',
      'Manual meal planner',
      '5 AI recipes per week',
      'Up to 5 family members',
    ],
  },
  {
    key: 'family',
    name: 'Family',
    price: '$7',
    period: '/month',
    highlight: true,
    badge: 'Most popular',
    cta: 'Choose Family',
    baseFeatures: ['Everything in Free'],
  },
  {
    key: 'premium',
    name: 'Premium',
    price: '$15',
    period: '/month',
    highlight: false,
    badge: '⭐ Most features',
    cta: 'Choose Premium',
    baseFeatures: ['Everything in Family'],
  },
]

// ─── Dynamic Pricing Cards ────────────────────────────────────────────────────
function DynamicPricingCards() {
  const navigate = useNavigate()
  const [flags, setFlags] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPublicConfig()
      .then(data => setFlags(data.flags || []))
      .catch(() => setFlags([]))
      .finally(() => setLoading(false))
  }, [])

  // Build feature list for a plan: baseFeatures + any enabled flags for that plan
  const getFeatures = (plan) => {
    const flagFeatures = flags
      .filter(f => f.requiredPlan === plan.key)
      .map(f => f.description || f.name)
    return [...plan.baseFeatures, ...flagFeatures]
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-card p-8 border-2 border-border bg-surface animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-16 mb-4" />
            <div className="h-10 bg-gray-200 rounded w-24 mb-6" />
            <div className="space-y-3">
              {[1,2,3,4,5].map(j => <div key={j} className="h-3 bg-gray-100 rounded w-full" />)}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {PLAN_META.map((plan, i) => {
        const features = getFeatures(plan)
        return (
          <div
            key={i}
            className={`rounded-card p-8 border-2 transition-all flex flex-col ${
              plan.highlight
                ? 'border-primary shadow-dropdown bg-white'
                : 'border-border bg-surface'
            }`}
          >
            {plan.badge && (
              <div
                className={`inline-block text-xs font-semibold px-3 py-1 rounded-pill mb-4 border w-fit ${
                  plan.highlight
                    ? 'bg-blue-50 text-primary border-blue-100'
                    : 'bg-purple-50 text-purple-600 border-purple-100'
                }`}
              >
                {plan.badge}
              </div>
            )}
            <p className="text-textMuted text-sm font-medium mb-1">{plan.name}</p>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-bold text-textPrimary">{plan.price}</span>
              <span className="text-textMuted text-sm">{plan.period}</span>
            </div>
            <ul className="space-y-2.5 mb-8 flex-1">
              {features.map((f, j) => (
                <li key={j} className="flex items-start gap-2 text-sm text-textPrimary">
                  <span className="text-success font-bold flex-shrink-0 mt-0.5">✓</span>
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

// ─── Main Landing Page ────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Navbar */}
      <nav className="bg-surface border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">NK</span>
          </div>
          <span className="font-semibold text-textPrimary text-lg">Nooka</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/login')} className="btn-secondary">Log in</button>
          <button onClick={() => navigate('/register')} className="btn-primary">Get started free</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 py-24 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-primary text-xs font-medium px-4 py-1.5 rounded-pill mb-6 border border-blue-100">
          🇨🇦 Built for Canadian families
        </div>
        <h1 className="text-5xl font-bold text-textPrimary leading-tight mb-6">
          Less time planning,<br />
          <span className="text-primary">more time living.</span>
        </h1>
        <p className="text-xl text-textMuted max-w-2xl mb-10 leading-relaxed">
          Nooka tracks your pantry, suggests AI-powered recipes based on each member's health goals,
          plans your weekly meals, and alerts you to food recalls — all in one place.
        </p>
        <div className="flex items-center gap-4 flex-wrap justify-center">
          <button onClick={() => navigate('/register')} className="btn-primary text-base px-8 py-3">
            Start for free
          </button>
          <button
            onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
            className="btn-secondary text-base px-8 py-3"
          >
            See how it works
          </button>
        </div>
        <p className="text-xs text-textMuted mt-4">No credit card required · Free plan available</p>
      </section>

      {/* Stats bar */}
      <section className="bg-primary/5 border-y border-blue-100 py-8 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: '15+', label: 'Smart features' },
            { value: 'AI', label: 'Powered recipes' },
            { value: '🇨🇦', label: 'PIPEDA compliant' },
            { value: '$7', label: 'Starting per month' },
          ].map((s, i) => (
            <div key={i}>
              <p className="text-2xl font-bold text-primary">{s.value}</p>
              <p className="text-sm text-textMuted mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-24 max-w-6xl mx-auto w-full">
        <h2 className="text-3xl font-bold text-textPrimary text-center mb-4">Everything your family needs</h2>
        <p className="text-textMuted text-center mb-12 text-lg">One app. Every family member. Zero stress.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: '📸',
              title: 'AI photo scan',
              badge: '✨ New',
              badgeColor: 'bg-purple-50 text-purple-600 border-purple-100',
              desc: 'Take a photo of your fridge or pantry and AI automatically detects and adds all items instantly. Add 20 items in one photo!'
            },
            {
              icon: '🫧',
              title: 'AI recipe suggestions',
              badge: null,
              desc: "Get personalized meal ideas based on what you already have and each family member's health goals, allergens, and dietary preferences."
            },
            {
              icon: '📅',
              title: 'AI weekly meal planner',
              badge: '👑 Premium',
              badgeColor: 'bg-yellow-50 text-yellow-600 border-yellow-100',
              desc: 'Generate a full week of personalized meals with one click. Choose cuisines, filter by family member, and get detailed recipes with nutrition.'
            },
            {
              icon: '🧺',
              title: 'Smart pantry tracking',
              badge: null,
              desc: 'Track everything in your fridge, freezer, and cupboards. AI predicts expiry dates and alerts you before food goes to waste.'
            },
            {
              icon: '🗂️',
              title: 'Pantry templates',
              badge: '✨ New',
              badgeColor: 'bg-purple-50 text-purple-600 border-purple-100',
              desc: 'Get started instantly with 10+ global pantry templates — Indian, Mediterranean, Mexican, Japanese, Keto, Vegan and more.'
            },
            {
              icon: '🚨',
              title: 'Food recall alerts',
              badge: null,
              desc: 'Automatically matched against live Health Canada recalls. Get instant alerts if anything in your pantry is recalled. Your family stays safe.'
            },
            {
              icon: '👨‍👩‍👧‍👦',
              title: 'Multi-member profiles',
              badge: null,
              desc: 'Each family member gets their own health profile — age, weight, allergens, dietary needs, and goals. AI cooks for everyone.'
            },
            {
              icon: '📊',
              title: 'Spending reports',
              badge: null,
              desc: 'Track grocery spending with detailed monthly reports, budget forecasting, and Costco bulk buying optimizer to save money.'
            },
            {
              icon: '🌍',
              title: 'CO2 footprint tracking',
              badge: null,
              desc: "See the environmental impact of your pantry. Track your family's food carbon footprint and compare to Canadian averages."
            },
          ].map((f, i) => (
            <div key={i} className="card hover:shadow-md transition-shadow duration-200 relative">
              {f.badge && (
                <span className={`absolute top-4 right-4 text-xs px-2.5 py-1 rounded-pill border font-medium ${f.badgeColor}`}>
                  {f.badge}
                </span>
              )}
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-semibold text-textPrimary text-lg mb-2">{f.title}</h3>
              <p className="text-textMuted text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-surface border-t border-border px-6 py-24">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-textPrimary text-center mb-4">Get started in minutes</h2>
          <p className="text-textMuted text-center mb-12 text-lg">No setup required. Just sign up and go.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', icon: '📸', title: 'Scan or add your pantry', desc: 'Take a photo of your fridge or manually add items. Our AI handles the rest.' },
              { step: '2', icon: '👨‍👩‍👧‍👦', title: 'Add your family', desc: 'Set up health profiles for each family member — allergens, goals, dietary needs.' },
              { step: '3', icon: '🫧', title: 'Get personalized meals', desc: "AI suggests recipes using what you have, tailored to everyone's needs." },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
                  {s.step}
                </div>
                <div className="text-3xl mb-3">{s.icon}</div>
                <h3 className="font-semibold text-textPrimary mb-2">{s.title}</h3>
                <p className="text-textMuted text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing — fully dynamic from DB ──────────────────────────────────── */}
      <section className="px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-textPrimary text-center mb-4">Simple, transparent pricing</h2>
          <p className="text-textMuted text-center mb-12 text-lg">
            Start free. Upgrade when you're ready. Cancel anytime.
          </p>

          {/* DynamicPricingCards fetches flags from DB and builds cards live */}
          <DynamicPricingCards />

          <p className="text-center text-xs text-textMuted mt-6">
            All prices in CAD · No hidden fees · Cancel anytime · Powered by Stripe
          </p>
        </div>
      </section>

      {/* Trust section */}
      <section className="bg-surface border-t border-border px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-textPrimary mb-8">Built for Canadian families</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '🔒', title: 'PIPEDA compliant', desc: 'Your data stays in Canada. We follow BC PIPA and federal PIPEDA privacy laws.' },
              { icon: '🇨🇦', title: 'Canadian data storage', desc: "Database and servers hosted in Canada. Your family's data never leaves the country." },
              { icon: '🫧', title: 'Privacy-first AI', desc: 'We never send your name or personal details to AI. Only anonymous health preferences.' },
            ].map((t, i) => (
              <div key={i} className="flex flex-col items-center text-center p-6 rounded-card border border-border">
                <div className="text-3xl mb-3">{t.icon}</div>
                <h3 className="font-semibold text-textPrimary mb-2">{t.title}</h3>
                <p className="text-textMuted text-sm leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-textPrimary mb-4">Ready to simplify family meals?</h2>
          <p className="text-textMuted text-lg mb-8">
            Join Canadian families using Nooka to eat smarter, waste less, and stay safe.
          </p>
          <button onClick={() => navigate('/register')} className="btn-primary text-base px-10 py-3">
            Get started free — no credit card needed
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8 text-center text-sm text-textMuted">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
            <span className="text-white text-xs font-bold">NK</span>
          </div>
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
