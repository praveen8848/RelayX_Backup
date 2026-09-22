/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0F19', // Deep charcoal/navy
        surface: '#111827',
        surfaceHover: '#1F2937',
        primary: '#3B82F6', // Electric blue
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        muted: '#9CA3AF',
        border: '#1F2937'
      }
    },
  },
  plugins: [],
}