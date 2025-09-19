/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			// --- Unified Semantic Color System (Single Source of Truth) ---
  			// Dark theme colors (default)
			'theme-background': 'rgb(var(--theme-background-rgb) / <alpha-value>)', // Main background for app body and sidebars
			'theme-surface': 'rgb(var(--theme-surface-rgb) / <alpha-value>)',    // Panels and distinct content areas
			'theme-card': 'rgb(var(--theme-card-rgb) / <alpha-value>)',       // Interactive items: cards, inputs, modals
			'theme-border': 'rgb(var(--theme-border-rgb) / <alpha-value>)',     // Standard borders
  			
  			// Light theme colors
  			'light-background': '#ffffff',  // Light mode main background
  			'light-surface': '#f8fafc',     // Light mode panels and surfaces
  			'light-card': '#ffffff',        // Light mode cards and inputs
  			'light-border': '#e2e8f0',      // Light mode borders
  			'light-text': '#1e293b',        // Light mode primary text
  			'light-text-secondary': '#475569', // Light mode secondary text
  			
  			// Legacy colors (deprecated - use theme-* instead)
  			darkBg: '#1a1e23',  // Now matches theme-background
  			lightBg: '#22262b', // Now matches theme-card
  			border: 'hsl(var(--border))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				hover: '#2563eb',
  				light: '#60a5fa',
  				dark: '#1d4ed8',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				hover: '#0284c7',
  				light: '#38bdf8',
  				dark: '#0369a1',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				hover: '#d97706',
  				light: '#fbbf24',
  				dark: '#b45309',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			success: {
  				DEFAULT: '#3b82f6',
  				light: '#60a5fa',
  				dark: '#2563eb'
  			},
  			danger: {
  				DEFAULT: '#ef4444',
  				light: '#f87171',
  				dark: '#dc2626'
  			},
  			dark: {
  				DEFAULT: '#1e1e2e',
  				lighter: '#2a2a3c',
  				light: '#3f3f5a',
  				medium: '#6c7293'
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		spacing: {
  			'128': '32rem'
  		},
  		maxHeight: {
  			'128': '32rem'
  		},
  		minHeight: {
  			'16': '4rem',
  			'32': '8rem'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}