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
  			'theme-background': '#1a1e23', // Main background for app body and sidebars
  			'theme-surface': '#1C1C1F',    // Panels and distinct content areas
  			'theme-card': '#22262b',       // Interactive items: cards, inputs, modals
  			'theme-border': '#374151',     // Standard borders
  			
  			// Legacy colors (deprecated - use theme-* instead)
  			darkBg: '#1a1e23',  // Now matches theme-background
  			lightBg: '#22262b', // Now matches theme-card
  			border: 'hsl(var(--border))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				hover: '#059669',
  				light: '#34d399',
  				dark: '#047857',
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
  				DEFAULT: '#10b981',
  				light: '#34d399',
  				dark: '#059669'
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