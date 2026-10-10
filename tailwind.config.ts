import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // A muted oxide palette on warm charcoal; the site should feel like a
        // small independent studio, not a glowing SaaS dashboard.
        brand: {
          50: '#f7eee8',
          100: '#efd8ca',
          200: '#e5bca7',
          300: '#d99877',
          400: '#ca7957',
          500: '#b96042',
          600: '#a14f37',
          700: '#82402f',
          800: '#63352a',
          900: '#45271f',
          950: '#271713',
        },
        ink: {
          900: '#151411',
          850: '#1c1b17',
          800: '#25241f',
          700: '#302f29',
          600: '#48463e',
          500: '#625e54',
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
