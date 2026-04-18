import type { Config } from 'tailwindcss';

export default {
  content: [
    './app/**/*.{ts,tsx,mdx}',
    './components/**/*.{ts,tsx}',
    './content/**/*.{md,mdx}',
  ],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#0B6E4F',
          fg: '#FFFFFF',
          50: '#E8F3EE',
          100: '#C5E1D1',
          600: '#0B6E4F',
          700: '#085A40',
          900: '#053A2A',
        },
        ink: '#0A0A0A',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      maxWidth: {
        prose: '68ch',
      },
      letterSpacing: {
        tightish: '-0.015em',
      },
    },
  },
  plugins: [],
} satisfies Config;
