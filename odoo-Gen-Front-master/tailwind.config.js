/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: '#000000',
          50: '#0a0a0a',
          100: '#111111',
          200: '#1a1a1a',
          300: '#242424',
          400: '#2e2e2e',
          500: '#383838',
          600: '#454545',
          700: '#525252',
          800: '#5f5f5f',
          900: '#6c6c6c',
        },
        cyber: {
          primary: '#ffffff',
          secondary: '#a0a0a0',
          accent: '#808080',
          success: '#404040',
          warning: '#606060',
          error: '#505050',
          glow: '#ffffff',
        },
        glass: {
          DEFAULT: 'rgba(255, 255, 255, 0.02)',
          border: 'rgba(255, 255, 255, 0.06)',
          hover: 'rgba(255, 255, 255, 0.04)',
        },
        module: {
          core: {
            DEFAULT: 'rgba(255, 255, 255, 0.08)',
            border: 'rgba(255, 255, 255, 0.15)',
            badge: 'rgba(255, 255, 255, 0.9)',
          },
          shop: {
            DEFAULT: 'rgba(200, 200, 200, 0.08)',
            border: 'rgba(200, 200, 200, 0.15)',
            badge: 'rgba(200, 200, 200, 0.9)',
          },
          api: {
            DEFAULT: 'rgba(150, 150, 150, 0.08)',
            border: 'rgba(150, 150, 150, 0.15)',
            badge: 'rgba(150, 150, 150, 0.9)',
          },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'cyber-grid': 'linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)',
      },
      boxShadow: {
        'glow-sm': '0 0 10px rgba(255, 255, 255, 0.08)',
        'glow-md': '0 0 20px rgba(255, 255, 255, 0.1)',
        'glow-lg': '0 0 30px rgba(255, 255, 255, 0.12)',
        'glow-accent': '0 0 20px rgba(128, 128, 128, 0.15)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
        'glass-inset': 'inset 0 0 20px rgba(255, 255, 255, 0.02)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
        'particle': 'particle 20s linear infinite',
        'grid-move': 'gridMove 20s linear infinite',
        'skeleton': 'skeleton 1.5s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 10px rgba(255, 255, 255, 0.1)' },
          '100%': { boxShadow: '0 0 20px rgba(255, 255, 255, 0.2)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        particle: {
          '0%': { transform: 'translateY(0) translateX(0)', opacity: '0' },
          '10%': { opacity: '0.5' },
          '90%': { opacity: '0.5' },
          '100%': { transform: 'translateY(-1000px) translateX(100px)', opacity: '0' },
        },
        gridMove: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '50px 50px' },
        },
        skeleton: {
          '0%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
          '100%': { opacity: '0.4' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
