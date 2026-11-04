import type { Config } from 'tailwindcss';

// Tokens de design baseados nos mockups (secção 10 do prompt frontend).
// Modo escuro por classe (.dark no <html>).
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1f9d5a',
          hover: '#15804a',
        },
        sidebar: {
          DEFAULT: '#101c2c',
          dark: '#0a121d',
        },
        surface: {
          DEFAULT: '#f3f5f2',
          dark: '#0d1520',
        },
        card: {
          DEFAULT: '#ffffff',
          dark: '#162233',
        },
        border: {
          DEFAULT: '#e4e7ea',
          dark: '#223246',
        },
        text: {
          DEFAULT: '#15202b',
          dark: '#e6ecf3',
        },
        muted: {
          DEFAULT: '#6b7785',
          dark: '#8695a8',
        },
        state: {
          ok: '#1f9d5a',
          warn: '#c98a2c',
          error: '#c0443f',
          info: '#3b7fc4',
        },
      },
      borderRadius: {
        card: '10px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;