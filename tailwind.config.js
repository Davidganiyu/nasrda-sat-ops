/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'hud-bg': 'rgba(6, 11, 25, 0.78)',
        'hud-card': 'rgba(10, 22, 45, 0.75)',
        'hud-border': 'rgba(0, 240, 255, 0.25)',
        'hud-border-bright': 'rgba(0, 240, 255, 0.7)',
        'hud-cyan': '#00f0ff',
        'hud-emerald': '#10b981',
        'hud-amber': '#f59e0b',
        'hud-crimson': '#ef4444',
        'hud-violet': '#8b5cf6',
        'hud-dark': '#030712'
      },
      fontFamily: {
        mono: ['"Share Tech Mono"', '"JetBrains Mono"', 'Consolas', 'monospace'],
        display: ['"Orbitron"', '"Share Tech Mono"', 'sans-serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        'glow-cyan': '0 0 15px rgba(0, 240, 255, 0.35)',
        'glow-emerald': '0 0 15px rgba(16, 185, 129, 0.35)',
        'glow-amber': '0 0 15px rgba(245, 158, 11, 0.35)',
        'glow-crimson': '0 0 15px rgba(239, 68, 68, 0.35)',
        'hud-panel': '0 8px 32px 0 rgba(0, 0, 0, 0.6), inset 0 0 0 1px rgba(0, 240, 255, 0.2)'
      },
      animation: {
        'pulse-fast': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-sweep': 'spin 4s linear infinite',
        'scanline': 'scanline 8s linear infinite'
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' }
        }
      }
    },
  },
  plugins: [],
}
