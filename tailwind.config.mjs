/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 晴空主题（明亮天空 + 云白 + 阳光金）
        sky: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',   // 主色：天空蓝
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        cloud: {
          50: '#fafcff',
          100: '#f5f8fc',
          200: '#eaf0f7',
          300: '#dce5ee',
        },
        sun: {
          100: '#fef3c7',
          300: '#fcd34d',
          500: '#f59e0b',   // 阳光金点缀
        },
        leaf: {
          400: '#4ade80',
          500: '#22c55e',   // 叶子绿点缀
        },
        ink: {
          900: '#0f172a',   // 主文字
          700: '#334155',
          500: '#64748b',
          400: '#94a3b8',
          300: '#cbd5e1',
        },
        paper: {
          DEFAULT: '#ffffff',
          subtle: '#fafcff',
          card: '#ffffff',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'PingFang SC',
          'Hiragino Sans GB',
          'Microsoft YaHei',
          'sans-serif',
        ],
        serif: [
          'Noto Serif SC',
          'Source Han Serif SC',
          'Georgia',
          'serif',
        ],
        display: [
          'Fraunces',
          'Source Han Serif SC',
          'Georgia',
          'serif',
        ],
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'Consolas',
          'Monaco',
          'monospace',
        ],
      },
      boxShadow: {
        // 柔和纸张阴影（替代赛博辉光）
        'paper': '0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.06)',
        'paper-md': '0 2px 4px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.08)',
        'paper-lg': '0 4px 8px rgba(15, 23, 42, 0.05), 0 16px 40px rgba(15, 23, 42, 0.10)',
        'paper-hover': '0 4px 12px rgba(14, 165, 233, 0.10), 0 12px 32px rgba(15, 23, 42, 0.10)',
      },
      animation: {
        'cloud-drift': 'cloud-drift 60s linear infinite',
        'cloud-drift-slow': 'cloud-drift 120s linear infinite',
        'float-soft': 'float-soft 6s ease-in-out infinite',
      },
      keyframes: {
        'cloud-drift': {
          '0%': { transform: 'translateX(-10%)' },
          '100%': { transform: 'translateX(110%)' },
        },
        'float-soft': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
