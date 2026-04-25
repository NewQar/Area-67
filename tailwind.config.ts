import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        aida: {
          blue: '#2563eb',
          blueDark: '#1e40af',
          blueLight: '#dbeafe',
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
