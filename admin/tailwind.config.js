/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--color-primary))',
          hover: 'rgb(var(--color-primary-hover))',
          muted: 'rgb(var(--color-primary-muted))',
          container: 'rgb(var(--color-primary-container))',
        },
        onPrimaryContainer: 'rgb(var(--color-on-primary-container))',
        secondary: {
          DEFAULT: 'rgb(var(--color-secondary))',
          hover: 'rgb(var(--color-secondary-hover))',
          muted: 'rgb(var(--color-secondary-muted))',
        },
        accent: {
          DEFAULT: 'rgb(var(--color-accent))',
          hover: 'rgb(var(--color-accent-hover))',
        },
        background: 'rgb(var(--color-background))',
        surface: 'rgb(var(--color-surface))',
        surfaceElevated: 'rgb(var(--color-surface-elevated))',
        text: {
          primary: 'rgb(var(--color-text-primary))',
          secondary: 'rgb(var(--color-text-secondary))',
          muted: 'rgb(var(--color-text-muted))',
        },
        border: 'rgb(var(--color-border))',
        borderFocus: 'rgb(var(--color-border-focus))',
        success: 'rgb(var(--color-success))',
        warning: 'rgb(var(--color-warning))',
        error: 'rgb(var(--color-error))',
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0.625rem',
        'liquid': '1rem',
        'liquid-lg': '1.5rem',
        'liquid-xl': '2rem',
      },
      boxShadow: {
        'liquid': 'var(--glass-shadow)',
        'liquid-lg': '0 8px 40px rgba(0, 0, 0, 0.12)',
        'liquid-xl': '0 16px 60px rgba(0, 0, 0, 0.15)',
        'glow-primary': '0 0 40px rgba(var(--color-primary), 0.3)',
        'glow-secondary': '0 0 40px rgba(var(--color-secondary), 0.3)',
      },
      backdropBlur: {
        'liquid': '20px',
        'liquid-strong': '40px',
      },
      animation: {
        'bounce-in': 'bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.6s ease-out forwards',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
      },
      keyframes: {
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(var(--color-error), 0.4)' },
          '50%': { boxShadow: '0 0 0 10px rgba(var(--color-error), 0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
      },
      transitionTimingFunction: {
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        '2000': '2000ms',
        '3000': '3000ms',
      },
      scale: {
        '102': '1.02',
        '103': '1.03',
      },
    },
  },
  plugins: [],
}