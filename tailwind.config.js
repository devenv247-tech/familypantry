/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: '#1a73e8',
        surface: '#ffffff',
        background: '#f8f9fa',
        border: '#e8eaed',
        textPrimary: '#202124',
        textMuted: '#5f6368',
        success: '#34a853',
        warning: '#fbbc04',
        danger: '#ea4335',
      },
      borderRadius: {
        card: '12px',
        btn: '8px',
        pill: '999px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        dropdown: '0 4px 16px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
}
