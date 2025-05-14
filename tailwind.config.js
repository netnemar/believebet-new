/* eslint-disable global-require */
const { fontFamily } = require('tailwindcss/defaultTheme');

module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'bg-deep': '#6C2BD7',
        'bg-panel': '#7C3AED',
        'bg-glass': '#A78BFA80',
        accent: '#FFFFFF',
        'accent-soft': '#F3F4F6',
        'txt-main': '#FFFFFF',
        'txt-dim': '#E5E7EB',
      },
      boxShadow: {
        accent: '0 0 8px 0 #FFFFFF40',
      },
      fontFamily: {
        sora: ['Sora', ...fontFamily.sans],
        inter: ['Inter', ...fontFamily.sans],
      },
    },
  },
  plugins: [
    function ({ addComponents }) {
      addComponents({
        '.glass': {
          '@apply bg-bg-glass backdrop-blur-md border border-white/5 rounded-2xl': {},
        },
      });
    },
  ],
}; 