import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ['class', '.tw-dark'],
  theme: {
    extend: {
      colors: {
        primary: '#0A0A0A',
        accent: '#7A1020',
        'accent-dark': '#5a0b17',
        secondary: '#F5F5F5',
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
