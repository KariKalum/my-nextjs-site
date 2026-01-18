import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef7ed',
          100: '#fdedd3',
          200: '#fbd8a5',
          300: '#f8bc6d',
          400: '#f59e33',
          500: '#f2820b',
          600: '#e36706',
          700: '#bc4c09',
          800: '#953c0f',
          900: '#78330f',
        },
      },
    },
  },
  plugins: [],
}
export default config
