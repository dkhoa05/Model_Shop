/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        apple: {
          blue: '#0066cc',
          blueDark: '#2997ff',
          ink: '#1d1d1f',
          muted: '#6e6e73',
          parchment: '#f5f5f7',
          hairline: '#e0e0e0',
          tile: '#272729'
        },
        cyber: {
          dark: '#09090b',
          card: '#18181b',
          border: '#27272a',
          red: '#ef4444',
          cyan: '#06b6d4',
          neonGlowRed: 'rgba(239, 68, 68, 0.15)',
          neonGlowCyan: 'rgba(6, 182, 212, 0.15)'
        }
      },
      boxShadow: {
        'product': 'rgba(0, 0, 0, 0.22) 3px 5px 30px 0',
        'neon-red': '0 0 15px rgba(239, 68, 68, 0.25)',
        'neon-cyan': '0 0 15px rgba(6, 182, 212, 0.25)',
        'neon-double': '0 0 10px rgba(239, 68, 68, 0.15), 0 0 20px rgba(6, 182, 212, 0.15)'
      },
      backgroundImage: {
        'grid-pattern': "radial-gradient(circle, rgba(239, 68, 68, 0.05) 1px, transparent 1px), radial-gradient(circle, rgba(6, 182, 212, 0.05) 1px, transparent 1px)",
        'cyber-gradient': 'linear-gradient(135deg, rgba(24, 24, 27, 0.95) 0%, rgba(9, 9, 11, 0.98) 100%)'
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s infinite ease-in-out',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
        'cyber-scan': 'cyberScan 4s linear infinite'
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: 0.6, transform: 'scale(1)' },
          '50%': { opacity: 1, transform: 'scale(1.02)' }
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 }
        },
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
        },
        cyberScan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' }
        }
      }
    },
  },
  plugins: [],
}
