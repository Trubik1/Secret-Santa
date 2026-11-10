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
          dark: '#0d0d0f',
        },
        surface: {
          soft: '#f8eff3',
          'soft-dark': '#241920',
          card: '#f4f4f6',
          'card-dark': '#17171a',
        },
        accent: {
          rose: '#c4457b',
          'rose-hover': '#b03b6d',
          'rose-dark': '#e26197',
          pink: '#d98aab',
        },
        ink: {
          light: '#111113',
          dark: '#f5f5f7',
          muted: '#6e6e73',
          'muted-dark': '#8e8e93',
        },
        border: {
          soft: '#f1e2ea',
          'soft-dark': '#34252f',
        }
      },
      borderRadius: {
        '28': '28px',
        '32': '32px',
      },
      fontFamily: {
        inter: ['Inter', 'system-ui', 'sans-serif'],
        editorial: ['"Playfair Display"', 'Georgia', 'serif'],
        space: ['"Space Grotesk"', 'monospace', 'sans-serif'],
        jakarta: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        system: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"SF Pro Display"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        manrope: ['Manrope', 'system-ui', 'sans-serif'],
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
