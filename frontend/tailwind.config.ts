import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      // 1. KELUARGA FONT
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Outfit"', '"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Geist Mono"', 'ui-monospace', 'monospace'],
      },

      // 2. PALET WARNA VERCEL-DARK & SINEMUS BLUE (SOLID, FLAT, NO GLOW/GRADIENT)
      colors: {
        // Vercel Pitch Black & Neutral Foundations
        vercel: {
          black: '#000000', // Latar belakang root aplikasi
          canvas: '#0A0A0A', // Permukaan kanvas utama
          card: '#121212', // Kartu & panel form
          elevated: '#1A1A1A', // Modal, drawer, & dropdown
          overlay: '#222222', // Popover & hover state
          border: '#2E2E2E', // Garis batas 1px standar
          'border-subtle': '#1F1F1F',
        },

        // Sinemus Official Colors (Solid Flat)
        sinemus: {
          blue: {
            DEFAULT: '#0066FF', // Electric Royal Blue
            hover: '#0052D4',
            cobalt: '#0040C1', // Deep Cobalt
            dark: '#070D24', // Midnight Navy
            light: '#38BDF8', // Sky Cyan
          },
        },

        // Aksen Tambahan
        cinema: {
          amber: '#F59E0B', // Khusus bintang rating & badge presale
        },

        // Integrasi Shadcn Semantic CSS Variables
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },

      // 3. EFEK BAYANGAN STANDAR (TANPA BLUE GLOW)
      boxShadow: {
        'vercel-card': '0 4px 20px rgba(0, 0, 0, 0.8)',
      },

      // 4. BORDER RADIUS BERGAYA VERCEL
      borderRadius: {
        lg: '0.625rem', // 10px
        xl: '0.75rem', // 12px
        '2xl': '1rem', // 16px
      },
    },
  },
  plugins: [],
};

export default config;
