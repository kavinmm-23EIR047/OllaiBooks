import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/modules/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      xs: '420px',    // Small Mobile Phones
      sm: '640px',    // Large Mobile & Phablets
      md: '768px',    // Tablets
      lg: '1024px',   // Small Laptops & iPads
      xl: '1280px',   // Laptops & Desktops
      '2xl': '1536px',// Full HD Desktops
      '3xl': '1920px',// Ultra-Wide Displays
      tv: '2560px',   // 4K Displays & Conference TVs
    },
    extend: {
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
      fontSize: {
        xs: ['12px', { lineHeight: '16px' }],      // Minimum legible size
        sm: ['13px', { lineHeight: '18px' }],      // Subtitles & Badges
        base: ['14px', { lineHeight: '20px' }],    // Standard UI Text
        md: ['15px', { lineHeight: '22px' }],      // Enhanced Body
        lg: ['17px', { lineHeight: '24px' }],      // Card Titles
        xl: ['20px', { lineHeight: '28px' }],      // Subheadings
        '2xl': ['24px', { lineHeight: '32px' }],   // Section Titles
        '3xl': ['30px', { lineHeight: '38px' }],   // Main Headings
        '4xl': ['36px', { lineHeight: '44px' }],   // Display / KPI Metrics
        '5xl': ['44px', { lineHeight: '52px' }],   // TV / Presentation Metrics
      },
      colors: {
        // High-Vibrancy Solid Blue Palette
        blue: {
          50: '#EEF6FF',
          100: '#E0EFFF',
          200: '#BAE0FF',
          300: '#7CC1FF',
          400: '#389EFF',
          500: '#007FFF',
          600: '#0066FF', // Main Solid Brand Blue
          700: '#0052CC', // Hover Blue
          800: '#0040A8', // Active Blue
          900: '#002B7A',
        },
        // Bright Secondary Accent Palette (Luminous Sky / Azure)
        secondary: {
          DEFAULT: '#FFFFFF',
          foreground: '#0066FF',
          bright: '#0088FF',
          hover: '#0070E0',
          soft: '#E6F4FF',
          border: '#91CAFF',
          accent: '#0284C7',
        },
        // ollaiBooks CRM — Silver Gray neutrals (paired with brand blue)
        silver: {
          50: "#F7F8FA",
          100: "#EEF0F4",
          200: "#E2E5EB",
          300: "#CDD2DA",
          400: "#A7AEBA",
          500: "#808897",
          600: "#626A78",
          700: "#4A515D",
          800: "#323842",
          900: "#1D2129",
        },
        // ollaiBooks CRM — deep navy for chrome / headers
        navy: {
          700: "#163A78",
          800: "#0F2D63",
          900: "#0A214B",
        },
        // High-Contrast Neutral Palette (Highly Visible on all Displays)
        slate: {
          50: '#F8FAFC',  // Canvas Background
          100: '#F1F5F9', // Elevated Surfaces
          200: '#E2E8F0', // Card / Table Border
          300: '#CBD5E1', // Input Field Outline
          400: '#94A3B8', // Unfocused Icons
          500: '#64748B', // Metadata & Secondary Text
          600: '#475569', // Clearly Legible Descriptions
          700: '#334155', // Strong Secondary Text (9.2:1 contrast)
          800: '#1E293B', // Headings
          900: '#0F172A', // 100% Deep Ink Black
        },
        border: '#E2E8F0',
        input: '#CBD5E1',
        ring: '#0066FF',
        background: '#F8FAFC',
        foreground: '#0F172A',
        primary: {
          DEFAULT: '#0066FF',
          foreground: '#FFFFFF',
        },
        destructive: {
          DEFAULT: '#DC2626',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#F8FAFC',
          foreground: '#475569',
        },
        accent: {
          DEFAULT: '#E6F4FF',
          foreground: '#0066FF',
        },
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#0F172A',
        },
      },
      borderRadius: {
        none: '0px',
        xs: '2px',
        sm: '2px',
        DEFAULT: '3px',
        md: '3px',
        lg: '4px',
        xl: '4px',
        '2xl': '4px',
        full: '9999px',
      },
    },
  },
  plugins: [],
};

export default config;
