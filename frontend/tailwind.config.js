/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        osint: {
          bg: '#0a0e17',
          panel: '#0f172a',
          border: '#1e3a5f',
          cyan: '#06b6d4',
          blue: '#3b82f6',
          amber: '#f59e0b',
          red: '#ef4444',
          green: '#10b981',
        }
      },
      fontFamily: {
        mono: ['SF Mono', 'Monaco', 'Cascadia Code', 'monospace'],
      }
    },
  },
  plugins: [],
}