import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
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
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        sovereign: {
          DEFAULT: "hsl(var(--sovereign))",
          foreground: "hsl(var(--sovereign-foreground))",
        },
        // Direct national color references
        navy: {
          DEFAULT: "#003057",
          50: "#E6EEF5",
          100: "#B3CCE0",
          200: "#6699C0",
          300: "#1A66A1",
          400: "#004B7F",
          500: "#003057",
          600: "#002644",
          700: "#001D33",
          800: "#001322",
          900: "#000A11",
        },
        gold: {
          DEFAULT: "#F7B718",
          50: "#FEF7E6",
          100: "#FDEAB3",
          200: "#FBD566",
          300: "#F9C433",
          400: "#F7B718",
          500: "#D99E0E",
          600: "#B5830B",
          700: "#8A6409",
          800: "#604506",
          900: "#352603",
        },
        teal: {
          DEFAULT: "#005F56",
          50: "#E6F3F2",
          100: "#B3DBD8",
          200: "#66B8B0",
          300: "#339A8F",
          400: "#007D72",
          500: "#005F56",
          600: "#004C44",
          700: "#003A34",
          800: "#002824",
          900: "#001614",
        },
        maroon: {
          DEFAULT: "#941E32",
          50: "#F5E8EB",
          100: "#E0B8BF",
          200: "#C77180",
          300: "#AD3A50",
          400: "#941E32",
          500: "#7A1929",
          600: "#611421",
          700: "#490F19",
          800: "#300A10",
          900: "#180508",
        },
        saffron: {
          DEFAULT: "#DF7500",
          50: "#FDF1E6",
          100: "#F8D5B3",
          200: "#F1AB66",
          300: "#EA8F33",
          400: "#DF7500",
          500: "#B86100",
          600: "#924D00",
          700: "#6B3900",
          800: "#452500",
          900: "#231200",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
