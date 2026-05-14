// Fullscreen voice assistant overlay — shown during listening and parsing states

export default function VoiceOverlay({ state, onCancel }) {
  if (state === 'idle') return null

  const isListening = state === 'listening'

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">

      {/* Animated rings */}
      <div className="relative flex items-center justify-center mb-8">

        {/* Outer pulse rings — only when listening */}
        {isListening && (
          <>
            <span className="absolute w-48 h-48 rounded-full bg-primary/10 animate-ping" style={{ animationDuration: '1.8s' }} />
            <span className="absolute w-36 h-36 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: '1.4s', animationDelay: '0.2s' }} />
            <span className="absolute w-24 h-24 rounded-full bg-primary/30 animate-ping" style={{ animationDuration: '1s', animationDelay: '0.4s' }} />
          </>
        )}

        {/* Centre circle */}
        <div className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
          isListening ? 'bg-primary' : 'bg-blue-400'
        }`}>
          {isListening ? (
            /* Mic icon */
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          ) : (
            /* Spinner when parsing */
            <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="3"/>
              <path className="opacity-90" fill="white" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          )}
        </div>
      </div>

      {/* Sound wave bars — only when listening */}
      {isListening && (
        <div className="flex items-end gap-1 mb-6 h-10">
          {[0.4, 0.7, 1, 0.6, 0.9, 0.5, 0.8, 1, 0.4, 0.7, 0.5, 0.9].map((scale, i) => (
            <span
              key={i}
              className="w-1.5 rounded-full bg-white/80"
              style={{
                height: `${scale * 36}px`,
                animation: `voiceBar 0.8s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.07}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Label */}
      <p className="text-white text-lg font-semibold mb-1">
        {isListening ? 'Listening...' : 'Understanding...'}
      </p>
      <p className="text-white/60 text-sm mb-8">
        {isListening ? 'Say something like "2 litres of milk"' : 'AI is parsing your item'}
      </p>

      {/* Cancel — only during listening */}
      {isListening && (
        <button
          onClick={onCancel}
          className="px-6 py-2.5 rounded-pill bg-white/10 border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-all"
        >
          Cancel
        </button>
      )}

      {/* Keyframes injected inline */}
      <style>{`
        @keyframes voiceBar {
          from { transform: scaleY(0.4); opacity: 0.5; }
          to   { transform: scaleY(1);   opacity: 1;   }
        }
      `}</style>
    </div>
  )
}