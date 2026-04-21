/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts,tsx,js}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef5ff',
          100: '#d9e7ff',
          200: '#b8d2ff',
          300: '#8cb4ff',
          400: '#5a8cff',
          500: '#3366ff',
          600: '#244aed',
          700: '#1e39c2',
          800: '#1b319a',
          900: '#1a2e7a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
