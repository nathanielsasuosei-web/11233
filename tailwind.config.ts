import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Signature red palette
        brand: {
          50: '#fff1f1',
          100: '#ffdedd',
          200: '#ffc4c4',
          300: '#ff9d9d',
          400: '#ff6467',
          500: '#ff2d3a',
          600: '#f5122a',
          700: '#d10821',
          800: '#ad0c20',
          900: '#8f1020',
          950: '#4d040d',
        },
        ink: {
          900: '#000000',
          850: '#0d0d10',
          800: '#121216',
          700: '#1a1a20',
          600: '#26262e',
          500: '#3a3a45',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Impact', 'sans-serif'],
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '70%': { transform: 'scale(1.5)', opacity: '0' },
          '100%': { transform: 'scale(1.5)', opacity: '0' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        'glow-sweep': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up .7s cubic-bezier(.16,1,.3,1) both',
        'fade-in': 'fade-in .8s ease both',
        marquee: 'marquee 28s linear infinite',
        'pulse-ring': 'pulse-ring 2.6s cubic-bezier(.24,.6,.35,1) infinite',
        float: 'float 6s ease-in-out infinite',
        'glow-sweep': 'glow-sweep 8s linear infinite',
        shimmer: 'shimmer 2s infinite',
      },
    },
  },
  plugins: [],
};

export default config;
