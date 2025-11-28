import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // Background colors
        'ph-bg': '#0a0e27',
        'ph-card': '#141b2d',
        'ph-hover': '#1a2332',
        
        // Accent colors
        'ph-primary': '#3b82f6',
        'ph-secondary': '#8b5cf6',
        
        // Text colors
        'ph-text': '#f8fafc',
        'ph-text-secondary': '#94a3b8',
        'ph-text-muted': '#64748b',
        
        // Semantic colors
        'ph-profit': '#22c55e',
        'ph-loss': '#ef4444',
        'ph-warning': '#f59e0b',
        'ph-info': '#3b82f6',
        
        // Platform colors
        'polymarket': '#8b5cf6',
        'kalshi': '#3b82f6',
        'manifold': '#22c55e',
        'metaculus': '#f59e0b',
      },
      borderColor: {
        'subtle': 'rgba(255, 255, 255, 0.1)',
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.3)',
        'glow-purple': '0 0 20px rgba(139, 92, 246, 0.3)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-premium': 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
        'gradient-text': 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
      },
      animation: {
        'shimmer': 'shimmer 1.5s infinite',
        'fadeIn': 'fadeIn 0.3s ease-out forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}

export default config
