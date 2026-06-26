/** @type {import('tailwindcss').Config} */
export default {
  corePlugins: {
    preflight: false,
  },
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg)',
        foreground: 'var(--text)',
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted)',
        },
        border: 'var(--line)',
        input: 'var(--line)',
        ring: 'var(--accent)',
        'brand-pink': 'var(--accent)',
        'brand-purple': 'var(--accent)',
        'brand-blue': '#6de8ff',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      maxWidth: {
        '7xl': '77.5rem',
      },
      boxShadow: {
        'brand-purple/30': '0 0 30px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.3)',
      },
    },
  },
  plugins: [],
}
