import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: { DEFAULT: '#2563EB', hover: '#1D4ED8', light: '#EFF6FF', dark: '#1E3A5F' },
        success: { DEFAULT: '#10B981', light: '#D1FAE5' },
        warning: { DEFAULT: '#F59E0B', light: '#FEF3C7' },
        danger:  { DEFAULT: '#EF4444', light: '#FEE2E2' },
        dark: {
          bg:       '#0A0A0A',
          card:     '#111111',
          surface:  '#1A1A1A',
          border:   '#2D2D2D',
          muted:    '#6B7280',
          text:     '#F9FAFB',
          'text-2': '#9CA3AF',
        },
        light: {
          bg:       '#F6F6F8',
          card:     '#FFFFFF',
          surface:  '#F8FAFC',
          border:   '#E2E8F0',
          muted:    '#94A3B8',
          text:     '#0F172A',
          'text-2': '#64748B',
        },
      },
      borderRadius: {
        card:  '12px',
        btn:   '8px',
        badge: '6px',
      },
      boxShadow: {
        card:      '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        'card-dark': '0 1px 3px rgba(0,0,0,0.4)',
      },
      keyframes: {
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to:   { transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in-up':     'fade-in-up 0.2s ease-out both',
        'scale-in':       'scale-in 0.15s ease-out both',
        'slide-in-right': 'slide-in-right 0.2s ease-out',
      },
    },
  },
  plugins: [],
} satisfies Config
