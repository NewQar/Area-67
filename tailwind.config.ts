import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        aida: {
          green: '#0a7c4a',
          greenDark: '#085f3a',
          greenLight: '#e7f5ee',
          ink: '#0e1116',
          muted: '#5b6470',
          bg: '#fafaf7',
        },
      },
      fontSize: {
        body: ['18px', '28px'],
        lead: ['20px', '30px'],
        amount: ['28px', '36px'],
      },
      minHeight: {
        tap: '48px',
      },
    },
  },
  plugins: [],
};

export default config;
