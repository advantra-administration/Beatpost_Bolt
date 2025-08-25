/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'serif': ['Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
        'mono': ['Courier New', 'Courier', 'monospace'],
      },
      colors: {
        'newspaper': {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
        },
        'beat': {
          50: '#f7f7f6',
          100: '#e3e3e0',
          200: '#c6c6c0',
          300: '#a4a49a',
          400: '#88887a',
          500: '#737366',
          600: '#5c5c52',
          700: '#4b4b43',
          800: '#404039',
          900: '#373732',
        }
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: '#374151',
            fontFamily: 'Georgia, Cambria, Times New Roman, Times, serif',
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}