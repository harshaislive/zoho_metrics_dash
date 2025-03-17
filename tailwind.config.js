/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#344736', // Forest Green
          50: '#f0fdfa',
          100: '#ccfbf1',
          500: '#344736',
          600: '#2b3a2d'
        },
        secondary: {
          DEFAULT: '#86312b', // Rich Red
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#86312b',
          600: '#6b2823'
        },
        accent: {
          earth: '#342e29', // Dark Earth
          orange: '#ff774a' // Coral Orange
        },
        neutral: {
          50: '#fdfbf7', // Off White
          100: '#e7e4df', // Soft Gray
          800: '#51514d', // Charcoal Gray
          900: '#000000', // Black
        }
      },
      fontFamily: {
        serif: ['ABC Arizona Flare Serif', 'serif'],
        sans: ['ABC Arizona Flare Sans', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
} 