import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Navbar */}
      <nav className="bg-surface border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">FP</span>
          </div>
          <span className="font-semibold text-textPrimary text-lg">FamilyPantry</span>
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
          Smarter groceries.<br />
          <span className="text-primary">Healthier families.</span>
        </h1>
        <p className="text-xl text-textMuted max-w-2xl mb-10 leading-relaxed">
          FamilyPantry tracks your pantry, suggests AI-powered recipes based on each member's health goals, plans your weekly grocery list, and alerts you to food recalls — all in one place.
        </p>
        <div className="flex items-center gap-4 flex-wrap justify-center">
          <button onClick={() => navigate('/register')} className="btn-primary text-base px-8 py-3">Start for free</button>
          <button className="btn-secondary text-base px-8 py-3">See how it works</button>
        </div>
        <p className="text-xs text-textMuted mt-4">No credit card required · Free plan available</p>
      </section>

      {/* Features */}
      <section className="px-6 pb-24 max-w-6xl mx-auto w-full">
        <h2 className="text-3xl font-bold text-textPrimary text-center mb-4">Everything your family needs</h2>
        <p className="text-textMuted text-center mb-12 text-lg">One app. Every family member. Zero stress.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: '🧺', title: 'Pantry tracking', desc: 'Track everything in your fridge, freezer, and cupboards. Know exactly what you have before you shop.' },
            { icon: '🤖', title: 'AI recipe suggestions', desc: 'Get meal ideas based on what you already have and each family member\'s health goals and preferences.' },
            { icon: '🛒', title: 'Smart grocery lists', desc: 'Auto-generated weekend shopping lists with price comparisons across local stores.' },
            { icon: '👨‍👩‍👧‍👦', title: 'Multi-member profiles', desc: 'Each family member gets their own health profile — age, weight, dietary needs, and goals.' },
            { icon: '📊', title: 'Expense reports', desc: 'See exactly how much you spend on groceries each month and where you can cut back.' },
            { icon: '🚨', title: 'Food recall alerts', desc: 'Instantly notified if anything in your pantry is recalled by Health Canada. Your family stays safe.' },
          ].map((f, i) => (
            <div key={i} className="card hover:shadow-md transition-shadow duration-200">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-semibold text-textPrimary text-lg mb-2">{f.title}</h3>
              <p className="text-textMuted text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-surface border-t border-border px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-textPrimary text-center mb-4">Simple pricing</h2>
          <p className="text-textMuted text-center mb-12 text-lg">Start free. Upgrade when you're ready.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Free', price: '$0', period: 'forever', features: ['1 family account', 'Up to 3 members', 'Basic pantry tracking', '5 AI recipes / week'], highlight: false },
              { name: 'Family', price: '$7', period: '/month', features: ['1 family account', 'Up to 8 members', 'Unlimited AI recipes', 'Weekly grocery planner', 'Expense reports'], highlight: true },
              { name: 'Premium', price: '$15', period: '/month', features: ['Multiple families', 'Unlimited members', 'Store price comparison', 'Nutrition analysis', 'Food recall alerts', 'Priority support'], highlight: false },
            ].map((plan, i) => (
              <div key={i} className={`rounded-card p-8 border-2 transition-all ${plan.highlight ? 'border-primary shadow-dropdown' : 'border-border bg-surface'}`}>
                {plan.highlight && (
                  <div className="inline-block bg-blue-50 text-primary text-xs font-semibold px-3 py-1 rounded-pill mb-4 border border-blue-100">
                    Most popular
                  </div>
                )}
                <p className="text-textMuted text-sm font-medium mb-1">{plan.name}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold text-textPrimary">{plan.price}</span>
                  <span className="text-textMuted text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-textPrimary">
                      <span className="text-success font-bold">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => navigate('/register')} className={plan.highlight ? 'btn-primary w-full text-center' : 'btn-secondary w-full text-center'}>
                  {plan.name === 'Free' ? 'Get started free' : `Choose ${plan.name}`}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8 text-center text-sm text-textMuted">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
            <span className="text-white text-xs font-bold">FP</span>
          </div>
          <span className="font-semibold text-textPrimary">FamilyPantry</span>
        </div>
        <p>© 2026 FamilyPantry · Built for Canadian families · Privacy Policy · Terms of Service</p>
      </footer>

    </div>
  )
}