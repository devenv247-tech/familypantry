import { useState, useEffect } from 'react'
import Icon from './Icon'

// ─── Shared cooking progress loader ───────────────────────────────────────────
// Used by both Recipes.jsx and MealPlan.jsx
//
// Props:
//   mode: 'recipes' | 'family' | 'weekplan'
//   visible: boolean
//   done: boolean  — signal that the API call succeeded; completes the final step
//   error: boolean — signal that the API call failed; stops animation
//
// For weekplan, the final step ("Finalising your week") is gated: it activates
// but never auto-completes. It only completes when done=true, so the bar
// never reaches 100% on a fake timer. Steps 0-5 pace over ~3 minutes.

const STEPS = {
  recipes: [
    { icon: 'pantry', label: 'Checking your pantry', duration: 4000 },
    { icon: 'health', label: 'Reading health goals', duration: 4000 },
    { icon: 'warning', label: 'Checking allergens', duration: 3000 },
    { icon: 'utensils', label: 'Crafting recipe ideas', duration: 6000 },
    { icon: 'sparkle', label: 'Finalising suggestions', duration: 4000 },
  ],
  family: [
    { icon: 'family', label: 'Reading all member profiles', duration: 4000 },
    { icon: 'health', label: 'Balancing health goals', duration: 4000 },
    { icon: 'warning', label: 'Checking everyone\'s allergens', duration: 3000 },
    { icon: 'utensils', label: 'Crafting the perfect family recipe', duration: 7000 },
    { icon: 'sparkle', label: 'Adding finishing touches', duration: 3000 },
  ],
  weekplan: [
    { icon: 'pantry', label: 'Scanning your pantry', duration: 25000 },
    { icon: 'health', label: 'Reading family health goals', duration: 25000 },
    { icon: 'sunrise', label: 'Planning breakfasts', duration: 30000 },
    { icon: 'sun', label: 'Planning lunches', duration: 30000 },
    { icon: 'moon', label: 'Planning dinners', duration: 35000 },
    { icon: 'leaf', label: 'Planning snacks', duration: 35000 },
    { icon: 'sparkle', label: 'Finalising your week', duration: 3000 }, // gated — only completes on done=true
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
  weekplan: 'AI is generating 28 personalized meals. This usually takes 2–4 minutes.',
}

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

export default function CookingLoader({ mode = 'recipes', visible, done = false, error = false }) {
  const steps = STEPS[mode] || STEPS.recipes
  const isWeekplan = mode === 'weekplan'

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

  // When API returns successfully: immediately complete all steps and show 100%
  useEffect(() => {
    if (!done || !visible || error) return
    setCurrentStep(steps.length)
    setProgress(100)
  }, [done, visible, error, steps.length])

  // Advance through steps
  useEffect(() => {
    if (!visible || error) return
    if (currentStep >= steps.length) return

    // weekplan final step is gated — it becomes active but never auto-advances
    const isGatedStep = isWeekplan && currentStep === steps.length - 1

    const step = steps[currentStep]
    const stepStartTime = Date.now()

    // Progress math:
    // weekplan:  steps 0-5 fill 0–90%; gated step (6) holds at 90%
    // others:    all steps fill 0–99%
    const progressSteps = isWeekplan ? steps.slice(0, -1) : steps
    const totalProgressDuration = progressSteps.reduce((a, s) => a + s.duration, 0)
    const progressableDoneUpTo = progressSteps
      .slice(0, Math.min(currentStep, progressSteps.length))
      .reduce((a, s) => a + s.duration, 0)
    const progressCap = isWeekplan ? 90 : 99

    const ticker = setInterval(() => {
      const elapsed = Date.now() - stepStartTime

      if (isGatedStep) {
        setStepProgress(0)
        setProgress(90)
      } else {
        const stepPct = Math.min(elapsed / step.duration, 1)
        setStepProgress(stepPct)
        const overallPct = ((progressableDoneUpTo + elapsed) / totalProgressDuration) * progressCap
        setProgress(Math.min(overallPct, progressCap))
      }
    }, 80)

    // Gated step never fires the advance timer — it waits for done=true
    let timer = null
    if (!isGatedStep) {
      timer = setTimeout(() => {
        clearInterval(ticker)
        setStepProgress(1)
        setCurrentStep(prev => prev + 1)
      }, step.duration)
    }

    return () => {
      clearInterval(ticker)
      if (timer) clearTimeout(timer)
    }
  }, [currentStep, visible, error, isWeekplan, steps])

  // Rotate tips every 6 seconds
  useEffect(() => {
    if (!visible) return
    const t = setInterval(() => {
      setTipIndex(prev => (prev + 1) % TIPS.length)
    }, 6000)
    return () => clearInterval(t)
  }, [visible])

  if (!visible) return null

  const isGatedActiveStep = isWeekplan && currentStep === steps.length - 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(8px)' }}
    >
      <div className="w-full max-w-sm mx-auto px-6 flex flex-col items-center text-center">

        {/* Animated pot / cooking icon */}
        <div className="relative mb-6">
          <div
            className="text-primary select-none"
            style={{ animation: 'gentleBob 2s ease-in-out infinite' }}
          >
            <Icon name={steps[Math.min(currentStep, steps.length - 1)]?.icon || 'utensils'} size={72} />
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

            return (
              <div
                key={i}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-500 ${
                  isActive
                    ? error ? 'bg-red-50 border border-red-100' : 'bg-blue-50 border border-blue-100'
                    : isDone
                    ? 'bg-green-50 border border-green-100'
                    : 'bg-gray-50 border border-transparent'
                }`}
              >
                {/* Status icon */}
                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                  {isDone ? (
                    <span className="text-success flex items-center"><Icon name="check" size={14} /></span>
                  ) : isActive ? (
                    error ? (
                      <span className="text-red-500 flex items-center"><Icon name="close" size={14} /></span>
                    ) : (
                      <svg className="animate-spin w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                    )
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
                  )}
                </div>

                {/* Step icon + label */}
                <span className="flex-shrink-0 text-stone-400"><Icon name={step.icon} size={16} /></span>
                <span className={`text-sm font-medium flex-1 text-left ${
                  isDone ? 'text-success' : isActive ? (error ? 'text-red-500' : 'text-primary') : 'text-textMuted'
                }`}>
                  {step.label}
                </span>

                {/* Per-step mini bar — only for non-gated active steps */}
                {isActive && !isGatedActiveStep && !error && (
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
            <span className={`text-xs font-semibold ${error ? 'text-red-500' : 'text-primary'}`}>
              {error ? 'Failed' : `${Math.round(progress)}%`}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-pill overflow-hidden">
            <div
              className={`h-full rounded-pill transition-all duration-300 ${error ? 'bg-red-400' : 'bg-primary'}`}
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
