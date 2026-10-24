/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      colors: {
        // Brand / design tokens
        cream: '#FFF8F1',
        chocolate: '#3B1D0F',

        // Legacy token aliases (used in existing components)
        primary: '#4338CA',
        surface: '#ffffff',
        background: '#FFF8F1',
        border: '#F1E4D6',
        textPrimary: '#1c1917',   // stone-900
        textMuted: '#78716c',     // stone-500

        // Semantic
        success: '#16a34a',       // green-600
        warning: '#d97706',       // amber-600
        danger: '#dc2626',        // red-600

        // Food palette (warm orange-red food CTA surface)
        food: {
          50: '#FFF4E6',
          100: '#FFE8CC',
          200: '#FFD8A8',
          500: '#F76707',
          600: '#C2410C',   // primary food CTA – AA contrast on white
          700: '#9A3412',
        },

        // Fresh/healthy palette
        fresh: {
          50: '#EBFBEE',
          100: '#D3F9D8',
          600: '#16a34a',
          700: '#15803d',
        },

        // Design token extras
        cardBorder: '#F1E4D6',
        chipBorder: '#E7D5C3',
      },
      borderRadius: {
        card: '24px',       // rounded-3xl
        btn: '999px',       // pill buttons
        pill: '999px',
        chip: '999px',
        input: '16px',      // rounded-2xl inputs
      },
      boxShadow: {
        card: '0 1px 2px rgba(59,29,15,0.04)',
        lift: '0 4px 16px rgba(59,29,15,0.10)',
        dropdown: '0 4px 16px rgba(0,0,0,0.10)',
      },
      fontSize: {
        hero: ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'hero-sm': ['2rem', { lineHeight: '1.15', letterSpacing: '-0.015em' }],
      },
    },
  },
  plugins: [],
}
