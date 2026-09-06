/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Times New Roman"', 'Times', 'serif'],
        display: ['"Times New Roman"', 'Times', 'serif'],
        mono: ['"Times New Roman"', 'Times', 'serif'],
        serif: ['"Times New Roman"', 'Times', 'serif'],
      },
      colors: {
        obsidian: {
          950: '#060505',
          900: '#0B0908',
          850: '#120F0E',
          800: '#191513',
          750: '#211C19',
          700: '#2B2420',
          600: '#3D342E',
          500: '#52463F',
        },
        magma: {
          DEFAULT: '#FF3815',
          crimson: '#E01E00',
          blaze: '#FF5722',
          glow: 'rgba(255, 56, 21, 0.25)',
        },
        ember: {
          amber: '#FF8A00',
          gold: '#FFB300',
          spark: '#FFE29A',
        },
        ash: {
          100: '#F7F4F0',
          200: '#E8E1D9',
          300: '#D5CAC0',
          400: '#B0A297',
          500: '#8E7F75',
          600: '#695D55',
          700: '#473E38',
          800: '#2A2420',
          900: '#171311',
        },
        brand: {
          50: '#fff4f0',
          100: '#ffe6de',
          200: '#ffcfc1',
          300: '#ffa894',
          400: '#ff7352',
          500: '#ff3815',
          600: '#e01e00',
          700: '#ba1400',
          800: '#941405',
          900: '#7a160a',
          950: '#430702',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-left': 'slideInLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'magma-pulse': 'magmaPulse 2.8s ease-in-out infinite',
        'heat-shimmer': 'heatShimmer 2s ease-in-out infinite',
        'spin-slow': 'spin 4s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        magmaPulse: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.02)' },
        },
        heatShimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'magma-glow': '0 0 24px -2px rgba(255, 56, 21, 0.38), 0 0 8px -1px rgba(255, 138, 0, 0.2)',
        'magma-sm': '0 0 12px -2px rgba(255, 56, 21, 0.3)',
        'ember-glow': '0 0 28px -4px rgba(255, 138, 0, 0.35)',
        'obsidian-card': '0 10px 30px -5px rgba(0,0,0,0.85), inset 0 1px 0 0 rgba(255, 120, 60, 0.08)',
        'obsidian-hover': '0 16px 36px -6px rgba(0,0,0,0.95), 0 0 20px -3px rgba(255, 56, 21, 0.22), inset 0 1px 0 0 rgba(255, 160, 80, 0.16)',
      },
    },
  },
  plugins: [],
}
