/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bakery: {
          cream: '#FFF7E3',
          wheat: '#F5E6C8',
          dough: '#E9D8B4',
          brown: '#8B5E34',
          choco: '#5C3B21',
          berry: '#B23A48',
          pistachio: '#6BA368',
          accent: '#D97706',
        },
      },
    },
  },
  plugins: [],
}
