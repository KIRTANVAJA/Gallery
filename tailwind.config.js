/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        charcoal: {
          DEFAULT: '#0a0a0a',
          light: '#141414',
          mid: '#1a1a1a',
        },
        cream: {
          DEFAULT: '#f5f0e8',
          muted: '#c9c4bc',
        },
        gold: {
          DEFAULT: '#c9a962',
          soft: '#a88b4a',
          glow: 'rgba(201, 169, 98, 0.35)',
        },
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        heading: ['Cormorant Garamond', 'serif'],
        body: ['Manrope', 'sans-serif'],
        sans: ['Inter', 'Manrope', 'sans-serif'],
      },
      animation: {
        'slow-zoom': 'slowZoom 24s ease-in-out infinite alternate',
        float: 'float 8s ease-in-out infinite',
        shimmer: 'shimmer 3s ease-in-out infinite',
      },
      keyframes: {
        slowZoom: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.12)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      transitionTimingFunction: {
        cinematic: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}
