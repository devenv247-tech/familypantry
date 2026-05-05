import { useState, useEffect } from 'react'

// ─── Shared cooking progress loader ───────────────────────────────────────────
// Used by both Recipes.jsx and MealPlan.jsx
//
// Props:
//   mode: 'recipes' | 'family' | 'weekplan'
//   visible: boolean
//
// Usage in Recipes.jsx:
//   import CookingLoader from '../components/ui/CookingLoader'
//   <CookingLoader mode="recipes" visible={loading} />
//   <CookingLoader mode="family" visible={familyLoading} />
//
// Usage in MealPlan.jsx:
//   import CookingLoader from '../components/ui/CookingLoader'
//   <CookingLoader mode="weekplan" visible={generatingWeek} />

const STEPS = {
  recipes: [
    { icon: '🧺', label: 'Checking your pantry', duration: 4000 },
    { icon: '💪', label: 'Reading health goals', duration: 4000 },
    { icon: '⚠️', label: 'Checking allergens', duration: 3000 },
    { icon: '🍽️', label: 'Crafting recipe ideas', duration: 6000 },
    { icon: '✨', label: 'Finalising suggestions', duration: 4000 },
  ],
  family: [
    { icon: '👨‍👩‍👧‍👦', label: 'Reading all member profiles', duration: 4000 },
    { icon: '⚖️', label: 'Balancing health goals', duration: 4000 },
    { icon: '⚠️', label: 'Checking everyone\'s allergens', duration: 3000 },
    { icon: '🍳', label: 'Crafting the perfect family recipe', duration: 7000 },
    { icon: '✨', label: 'Adding finishing touches', duration: 3000 },
  ],
  weekplan: [
    { icon: '🧺', label: 'Scanning your pantry', duration: 4000 },
    { icon: '💪', label: 'Reading family health goals', duration: 4000 },
    { icon: '🌅', label: 'Planning breakfasts', duration: 5000 },
    { icon: '☀️', label: 'Planning lunches', duration: 5000 },
    { icon: '🌙', label: 'Planning dinners', duration: 5000 },
    { icon: '🍎', label: 'Planning snacks', duration: 4000 },
    { icon: '✨', label: 'Finalising your week', duration: 3000 },
  ],
}

const TITLES = {
  recipes: 'Finding the best recipes...',
  family: 'Creating your family recipe...',
  weekplan: 'Planning your week...',
}

const SUBTITLES = {
  recipes: 'AI is matching pantry items to each member\'s health goals.',
  family: 'AI is crafting one perfect recipe that works for everyone.',
  weekplan: 'AI is generating 28 personalized meals. This takes about 20–30 seconds.',
}

// Fun cooking tips shown while waiting
const TIPS = [
  '🧂 Tip: Salt pasta water until it tastes like the sea.',
  '🔪 Tip: Let meat rest 5 minutes after cooking — juicier every time.',
  '🧄 Tip: Crush garlic before mincing to release more flavour.',
  '🫙 Tip: Store fresh herbs like flowers — in a glass of water.',
  '🥚 Tip: Room temperature eggs whip up fluffier than cold ones.',
  '🍋 Tip: A squeeze of lemon brightens almost any savoury dish.',
  '🫕 Tip: Taste and adjust seasoning at the very end, not the start.',
  '🧊 Tip: Chill your bowl before whipping cream — it doubles faster.',
  '🌿 Tip: Add delicate herbs like basil at the end to keep flavour.',
  '🍳 Tip: A hot pan before adding oil prevents sticking.',
]

export default function CookingLoader({ mode = 'recipes', visible }) {
  const steps = STEPS[mode] || STEPS.recipes
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [tipIndex, setTipIndex] = useState(0)
  const [stepProgress, setStepProgress] = useState(0)

  // Reset when shown
  useEffect(() => {
    if (visible) {
      setCurrentStep(0)
      setProgress(0)
      setStepProgress(0)
      setTipIndex(Math.floor(Math.random() * TIPS.length))
    }
  }, [visible])

  // Advance through steps
  useEffect(() => {
    if (!visible) return
    if (currentStep >= steps.length) return

    const step = steps[currentStep]
    const stepStartTime = Date.now()
    const totalDuration = steps.reduce((a, s) => a + s.duration, 0)
    const doneUpTo = steps.slice(0, currentStep).reduce((a, s) => a + s.duration, 0)

    // Tick every 80ms for smooth progress
    const ticker = setInterval(() => {
      const elapsed = Date.now() - stepStartTime
      const stepPct = Math.min(elapsed / step.duration, 1)
      setStepProgress(stepPct)

      const overallPct = ((doneUpTo + elapsed) / totalDuration) * 100
      setProgress(Math.min(overallPct, 99)) // never show 100 until actually done
    }, 80)

    // Move to next step after duration
    const timer = setTimeout(() => {
      clearInterval(ticker)
      setStepProgress(1)
      setCurrentStep(prev => prev + 1)
    }, step.duration)

    return () => {
      clearInterval(ticker)
      clearTimeout(timer)
    }
  }, [currentStep, visible])

  // Rotate tips every 6 seconds
  useEffect(() => {
    if (!visible) return
    const t = setInterval(() => {
      setTipIndex(prev => (prev + 1) % TIPS.length)
    }, 6000)
    return () => clearInterval(t)
  }, [visible])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(8px)' }}
    >
      <div className="w-full max-w-sm mx-auto px-6 flex flex-col items-center text-center">

        {/* Animated pot / cooking icon */}
        <div className="relative mb-6">
          <div
            className="text-7xl select-none"
            style={{ animation: 'gentleBob 2s ease-in-out infinite' }}
          >
            {steps[Math.min(currentStep, steps.length - 1)]?.icon || '🍳'}
          </div>
          {/* Steam lines */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex gap-2">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-0.5 rounded-full bg-gray-300"
                style={{
                  height: '20px',
                  animation: `steam 1.5s ease-in-out infinite`,
                  animationDelay: `${i * 0.3}s`,
                  opacity: 0.6,
                }}
              />
            ))}
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-textPrimary mb-1">
          {TITLES[mode]}
        </h2>
        <p className="text-sm text-textMuted mb-8 leading-relaxed">
          {SUBTITLES[mode]}
        </p>

        {/* Steps checklist */}
        <div className="w-full space-y-2.5 mb-8">
          {steps.map((step, i) => {
            const isDone = i < currentStep
            const isActive = i === currentStep
            const isPending = i > currentStep

            return (
              <div
                key={i}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-500 ${
                  isActive
                    ? 'bg-blue-50 border border-blue-100'
                    : isDone
                    ? 'bg-green-50 border border-green-100'
                    : 'bg-gray-50 border border-transparent'
                }`}
              >
                {/* Status icon */}
                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                  {isDone ? (
                    <span className="text-success text-base">✓</span>
                  ) : isActive ? (
                    <svg className="animate-spin w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
                  )}
                </div>

                {/* Step icon + label */}
                <span className="text-base">{step.icon}</span>
                <span className={`text-sm font-medium flex-1 text-left ${
                  isDone ? 'text-success' : isActive ? 'text-primary' : 'text-textMuted'
                }`}>
                  {step.label}
                </span>

                {/* Per-step progress bar for active step */}
                {isActive && (
                  <div className="w-12 h-1 bg-blue-100 rounded-pill overflow-hidden flex-shrink-0">
                    <div
                      className="h-full bg-primary rounded-pill transition-all"
                      style={{ width: `${stepProgress * 100}%` }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Overall progress bar */}
        <div className="w-full mb-6">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-textMuted">Overall progress</span>
            <span className="text-xs font-semibold text-primary">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-pill overflow-hidden">
            <div
              className="h-full bg-primary rounded-pill transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Rotating cooking tip */}
        <div
          className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 w-full"
          key={tipIndex}
          style={{ animation: 'fadeIn 0.5s ease' }}
        >
          <p className="text-xs text-amber-700 leading-relaxed">{TIPS[tipIndex]}</p>
        </div>

        <p className="text-xs text-textMuted mt-4">Please stay on this page</p>
      </div>

      {/* CSS animations injected inline */}
      <style>{`
        @keyframes gentleBob {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes steam {
          0% { transform: translateY(0px); opacity: 0; }
          50% { opacity: 0.6; }
          100% { transform: translateY(-16px); opacity: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
