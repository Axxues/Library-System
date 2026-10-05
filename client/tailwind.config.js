const plugin = require('tailwindcss/plugin');

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        surface: {
          DEFAULT: "hsl(var(--surface))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        "sidebar-bg": "hsl(var(--sidebar-bg))",
        "sidebar-hover": "hsl(var(--sidebar-hover))",
        "sidebar-active": "hsl(var(--sidebar-active))",
        "sidebar-foreground": "hsl(var(--sidebar-foreground))",
        "card-hover": "hsl(var(--card-hover))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
        "radius-sm": "var(--radius-sm)",
        "radius-md": "var(--radius-md)",
        "radius-lg": "var(--radius-lg)",
        "radius-xl": "var(--radius-xl)",
        "radius-2xl": "var(--radius-2xl)",
      },
      boxShadow: {
        "soft": "0 1px 2px 0 rgb(0 0 0 / 0.04)",
        "subtle": "0 2px 4px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)",
        "card": "0 4px 6px -1px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.06)",
        "lifted": "0 10px 15px -3px rgb(0 0 0 / 0.07), 0 4px 6px -4px rgb(0 0 0 / 0.07)",
        "elevated": "0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.08)",
        "float": "0 25px 50px -12px rgb(0 0 0 / 0.15)",
        "inner-soft": "inset 0 2px 4px 0 rgb(0 0 0 / 0.04)",
        "inner-subtle": "inset 0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "glow-sm": "0 0 0 3px hsl(var(--primary) / 0.15)",
        "glow": "0 0 0 4px hsl(var(--primary) / 0.2)",
        "glow-lg": "0 0 0 6px hsl(var(--primary) / 0.25)",
        "primary-sm": "0 1px 2px 0 rgb(59 130 246 / 0.2), 0 0 0 1px rgb(59 130 246 / 0.05)",
        "primary": "0 4px 6px -1px rgb(59 130 246 / 0.25), 0 2px 4px -2px rgb(59 130 246 / 0.2), 0 0 0 1px rgb(59 130 246 / 0.1)",
        "primary-md": "0 8px 16px -4px rgb(59 130 246 / 0.3), 0 4px 6px -2px rgb(59 130 246 / 0.2), 0 0 0 1px rgb(59 130 246 / 0.1)",
        "primary-lg": "0 20px 25px -5px rgb(59 130 246 / 0.3), 0 8px 10px -6px rgb(59 130 246 / 0.2), 0 0 0 1px rgb(59 130 246 / 0.1)",
        "success": "0 4px 6px -1px rgb(34 197 94 / 0.25), 0 2px 4px -2px rgb(34 197 94 / 0.2), 0 0 0 1px rgb(34 197 94 / 0.1)",
        "warning": "0 4px 6px -1px rgb(234 179 8 / 0.25), 0 2px 4px -2px rgb(234 179 8 / 0.2), 0 0 0 1px rgb(234 179 8 / 0.1)",
        "destructive": "0 4px 6px -1px rgb(239 68 68 / 0.25), 0 2px 4px -2px rgb(239 68 68 / 0.2), 0 0 0 1px rgb(239 68 68 / 0.1)",
      },
      animation: {
        'bounce-in': 'bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'shimmer': 'shimmer 2s infinite linear',
        'fade-in-up': 'fadeInUp 0.4s ease-out forwards',
        'fade-in-down': 'fadeInDown 0.4s ease-out forwards',
        'slide-in-right': 'slideInRight 0.3s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.3s ease-out forwards',
        'pulse-soft': 'pulseSoft 2s infinite ease-in-out',
        'pulse-ring': 'pulseRing 1.5s infinite ease-out',
        'progress-loading': 'progress 2s infinite linear',
        'slow-fade': 'fade 3s infinite ease-in-out',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          from: { opacity: '0', transform: 'translateY(-16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(-16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        pulseRing: {
          '0%': { transform: 'scale(0.8)', opacity: '0.8' },
          '80%, 100%': { transform: 'scale(1.8)', opacity: '0' },
        },
        progress: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        fade: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '1' },
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    plugin(({ addUtilities }) => {
      addUtilities({
        '.text-balance': { 'text-wrap': 'balance' },
        '.text-pretty': { 'text-wrap': 'pretty' },
        '.animate-delay-100': { 'animation-delay': '100ms' },
        '.animate-delay-200': { 'animation-delay': '200ms' },
        '.animate-delay-300': { 'animation-delay': '300ms' },
        '.animate-delay-500': { 'animation-delay': '500ms' },
        '.animate-duration-300': { 'animation-duration': '300ms' },
        '.animate-duration-500': { 'animation-duration': '500ms' },
        '.animate-duration-700': { 'animation-duration': '700ms' },
      });
    }),
  ],
}
