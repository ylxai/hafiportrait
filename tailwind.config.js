/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.css", // Penting: Ini memastikan Tailwind memindai globals.css
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "xs": "475px",
        "2xl": "1400px",
      },
    },
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        // Shadcn UI Colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        
        // === HAFIPORTRAIT 2025 BRAND COLORS ===
        // Primary Colors (Cyan Deep)
        'brand-primary': 'var(--color-primary)',
        'brand-primary-light': 'var(--color-primary-light)',
        'brand-primary-lighter': 'var(--color-primary-lighter)',
        
        // Secondary Colors (Soft Pink)
        'brand-secondary': 'var(--color-secondary)',
        'brand-secondary-light': 'var(--color-secondary-light)',
        'brand-secondary-lighter': 'var(--color-secondary-lighter)',
        
        // Accent Colors (Purple)
        'brand-accent': 'var(--color-accent)',
        'brand-accent-light': 'var(--color-accent-light)',
        
        // Supporting Colors
        'brand-sage': 'var(--color-sage)',
        'brand-lavender': 'var(--color-lavender)',
        'brand-coral': 'var(--color-coral)',
        
        // Neutral Colors
        'brand-bg-primary': 'var(--color-bg-primary)',
        'brand-bg-secondary': 'var(--color-bg-secondary)',
        'brand-bg-tertiary': 'var(--color-bg-tertiary)',
        'brand-bg-dark': 'var(--color-bg-dark)',
        
        // Text Colors
        'brand-text-primary': 'var(--color-text-primary)',
        'brand-text-secondary': 'var(--color-text-secondary)',
        'brand-text-muted': 'var(--color-text-muted)',
        'brand-text-light': 'var(--color-text-light)',
        
        // Border Colors
        'brand-border': 'var(--color-border)',
        'brand-border-light': 'var(--color-border-light)',
        
        // ReactBits Compatible Colors
        'reactbits-cyan': '#0E7490',
        'reactbits-pink': '#FF8CC8',
        'reactbits-purple': '#A855F7',
        'reactbits-gradient-1': '#0E7490',
        'reactbits-gradient-2': '#FF8CC8',
        'reactbits-gradient-3': '#A855F7',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-secondary': 'var(--gradient-secondary)',
        'gradient-accent': 'var(--gradient-accent)',
        'gradient-soft': 'var(--gradient-soft)',
      },
      boxShadow: {
        'brand-sm': 'var(--shadow-sm)',
        'brand': 'var(--shadow)',
        'brand-md': 'var(--shadow-md)',
        'brand-lg': 'var(--shadow-lg)',
        'brand-xl': 'var(--shadow-xl)',
        'brand-cyan': 'var(--shadow-cyan)',
        'brand-pink': 'var(--shadow-pink)',
        'brand-gradient': 'var(--shadow-gradient)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "gradient": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "gradient": "gradient 8s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

