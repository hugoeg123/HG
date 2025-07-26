/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#111827', // gray-900
        lightBg: '#1f2937', // gray-800
        border: '#374151', // gray-700
        primary: {
          DEFAULT: '#10b981', // emerald-500
          hover: '#059669', // emerald-600
          light: '#34d399', // emerald-400
          dark: '#047857', // emerald-700
        },
        secondary: {
          DEFAULT: '#0ea5e9', // sky-500
          hover: '#0284c7', // sky-600
          light: '#38bdf8', // sky-400
          dark: '#0369a1', // sky-700
        },
        accent: {
          DEFAULT: '#f59e0b', // amber-500
          hover: '#d97706', // amber-600
          light: '#fbbf24', // amber-400
          dark: '#b45309', // amber-700
        },
        success: {
          DEFAULT: '#10b981', // emerald-500
          light: '#34d399', // emerald-400
          dark: '#059669', // emerald-600
        },
        danger: {
          DEFAULT: '#ef4444', // red-500
          light: '#f87171', // red-400
          dark: '#dc2626', // red-600
        },
        dark: {
          DEFAULT: '#1e1e2e',
          lighter: '#2a2a3c',
          light: '#3f3f5a',
          medium: '#6c7293',
        },
      },
      spacing: {
        '128': '32rem',
      },
      maxHeight: {
        '128': '32rem',
      },
      minHeight: {
        '16': '4rem',
        '32': '8rem',
      },
    },
  },
  plugins: [],
}