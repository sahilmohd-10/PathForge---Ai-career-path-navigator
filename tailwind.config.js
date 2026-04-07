/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Custom cyberpunk color palette
        'neon': {
          'cyan': '#66FCF1',
          'teal': '#45A29E',
          'dark': '#0B0C10',
          'gray': '#1F2833',
          'light': '#C5C6C7',
        },
        dark: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        },
        // Dark mode friendly color variants
        'stat-indigo-light': '#e0e7ff',
        'stat-indigo-dark': '#1e1b4b',
        'stat-amber-light': '#fbbf24',
        'stat-amber-dark': '#78350f',
        'stat-emerald-light': '#a7f3d0',
        'stat-emerald-dark': '#064e3b',
        'stat-blue-light': '#93c5fd',
        'stat-blue-dark': '#0c2340',
        'stat-red-light': '#fecaca',
        'stat-red-dark': '#5f1f1f',
      },
      transition: {
        all: 'all 300ms ease-in-out',
      },
      boxShadow: {
        'neon-cyan': '0 0 10px rgba(102, 252, 241, 0.5)',
        'neon-teal': '0 0 10px rgba(69, 162, 158, 0.5)',
      },
    },
  },
  plugins: [],
}
