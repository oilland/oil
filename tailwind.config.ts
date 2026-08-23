import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eefaf4',
          100: '#d7f3e6',
          200: '#b2e6d1',
          300: '#7fd2b6',
          400: '#47b896',
          500: '#1e9e7d',
          600: '#0f8270',
          700: '#0c6b5e',
          800: '#0b554d',
          900: '#0a4740',
          950: '#062e2b'
        },
        accent: {
          50: '#f8fbea',
          100: '#eef6cc',
          200: '#deee9e',
          300: '#cbe566',
          400: '#b7d73a',
          500: '#9cc32a',
          600: '#7a9b1d',
          700: '#5d761a',
          800: '#4a5e1b',
          900: '#3f501b',
          950: '#202c0a'
        }
      },
      fontFamily: {
        sans: ['Vazirmatn', 'Tahoma', 'system-ui', '-apple-system', 'sans-serif']
      },
      boxShadow: {
        card: '0 1px 3px rgba(16,24,40,.06), 0 1px 2px rgba(16,24,40,.04)',
        'card-hover': '0 12px 32px -8px rgba(16,24,40,.18)',
        soft: '0 4px 20px -4px rgba(16,24,40,.08)'
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' }
        }
      },
      animation: {
        'fade-in': 'fade-in .3s ease-out',
        'slide-up': 'slide-up .4s ease-out both',
        shimmer: 'shimmer 1.4s infinite linear'
      }
    }
  },
  plugins: []
};

export default config;
