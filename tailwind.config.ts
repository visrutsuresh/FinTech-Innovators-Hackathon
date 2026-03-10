import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: '#DFD0B8',
          dim:     'rgba(223,208,184,0.12)',
          border:  'rgba(223,208,184,0.20)',
          glow:    'rgba(223,208,184,0.30)',
        },
        taupe: {
          DEFAULT: '#948979',
          dim:     'rgba(148,137,121,0.15)',
        },
        surface: {
          DEFAULT:  '#222831',
          card:     '#2C3140',
          elevated: '#393E46',
          modal:    '#1C2028',
        },
        emerald: {
          DEFAULT: '#2D6A4F',
          50:  '#F0FBF5',
          100: '#D4EEDF',
          200: '#A3D4BB',
          300: '#6EB897',
          400: '#40997A',
          500: '#2D6A4F',
          600: '#235640',
          700: '#1A4030',
          800: '#112B20',
          900: '#091610',
        },
      },
      fontFamily: {
        sans:   ['var(--font-alte)', 'system-ui', 'sans-serif'],
        ballet: ['var(--font-ballet)', 'cursive'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}

export default config
