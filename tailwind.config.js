
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: 'rgb(var(--bg-primary) / <alpha-value>)',
        secondary: 'rgb(var(--bg-secondary) / <alpha-value>)',
        tertiary: 'rgb(var(--bg-tertiary) / <alpha-value>)',
        'text-primary': 'rgb(var(--text-primary) / <alpha-value>)',
        'text-secondary': 'rgb(var(--text-secondary) / <alpha-value>)',
        'text-muted': 'rgb(var(--text-muted) / <alpha-value>)',
        'border-primary': 'rgb(var(--border-primary) / <alpha-value>)',
        'border-secondary': 'rgb(var(--border-secondary) / <alpha-value>)',
        'accent-blue': 'rgb(var(--accent-blue) / <alpha-value>)',
        'accent-green': 'rgb(var(--accent-green) / <alpha-value>)',
        'accent-red': 'rgb(var(--accent-red) / <alpha-value>)',
        'accent-amber': 'rgb(var(--accent-amber) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      }
    },
  },
  plugins: [],
}
