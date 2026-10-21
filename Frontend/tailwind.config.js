/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef4ff',
          100: '#d9e6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        navy: {
          50: '#f3f6fa',
          100: '#e4eaf2',
          600: '#1b3a5c',
          700: '#132c48',
          800: '#0d2036',
          900: '#091827',
          950: '#060f1a',
        },
        gold: {
          100: '#fbf3d9',
          200: '#f4e2a8',
          300: '#e8cb72',
          400: '#d9b145',
          500: '#c79a27',
          600: '#a87c1d',
        },
        // Harmonisation globale de l'interface historique (indigo/violet)
        indigo: {
          50: '#eef4fb',
          100: '#d9e6f5',
          200: '#b7d0ea',
          300: '#8cb3dc',
          400: '#5c8fc8',
          500: '#356fb0',
          600: '#1f5596',
          700: '#174477',
          800: '#12365f',
          900: '#0e2a4a',
          950: '#091d34',
        },
        violet: {
          50: '#fbf7ea',
          100: '#f7eccb',
          200: '#efd99a',
          300: '#e3c264',
          400: '#d3a937',
          500: '#bd8f22',
          600: '#9b721b',
          700: '#785716',
          800: '#5a4113',
          900: '#3f2e0e',
          950: '#2b1f09',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 12px 40px -18px rgba(9, 24, 39, 0.28)',
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 12px 28px -18px rgba(15, 23, 42, 0.18)',
      },
      animation: {
        'slide-in': 'slideIn 0.25s ease-out',
        'fade-up': 'fadeUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fadeIn 0.35s ease both',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
