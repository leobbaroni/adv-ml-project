import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Palette per .agents/knowledge-base/DESIGN-LANGUAGE.md
        bg: {
          DEFAULT: '#0A0A0B',
          surface: '#111114',
          border: '#1F1F23',
        },
        fg: {
          DEFAULT: '#F4F4F5',
          muted: '#A1A1AA',
        },
        accent: {
          DEFAULT: '#F59E0B',
        },
        ok: '#10B981',
        warn: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        card: '12px',
        btn: '8px',
      },
      letterSpacing: {
        tightish: '-0.02em',
      },
    },
  },
  plugins: [],
};

export default config;
