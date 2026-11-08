/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          light: '#ffffff',
          dark: '#000000',
        },
        surface: {
          soft: '#f4f4f5',
          'soft-dark': '#141416',
          card: '#ffffff',
          'card-dark': '#161618',
        },
        accent: {
          rose: '#ffffff',
          'rose-hover': '#e4e4e7',
          'rose-dark': '#ffffff',
          pink: '#a1a1aa',
        },
        ink: {
          light: '#111113',
          dark: '#ffffff',
          muted: '#6e6e73',
          'muted-dark': '#71717a',
        },
        border: {
          soft: '#e4e4e7',
          'soft-dark': '#27272a',
        }
      },
      borderRadius: {
        '28': '28px',
        '32': '32px',
      },
      spacing: {
        '13': '3.25rem',
      },
      fontFamily: {
        sans: ['Unbounded', 'system-ui', 'sans-serif'],
        unbounded: ['Unbounded', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 4px 24px -2px rgba(196, 69, 123, 0.07)',
        'card': '0 2px 12px rgba(0, 0, 0, 0.04)',
        'glass': '0 8px 32px 0 rgba(196, 69, 123, 0.12)',
      }
    },
  },
  plugins: [],
}
