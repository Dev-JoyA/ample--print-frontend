/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "#EF4444", // Red accent
          dark: "#DC2626",
          light: "#F87171",
        },
        dark: {
          DEFAULT: "#1F2937",
          light: "#374151",
          lighter: "#4B5563",
        },
        status: {
          blue: "#3B82F6",
          yellow: "#FBBF24",
          green: "#10B981",
          red: "#EF4444",
        },
      },
      fontFamily: {
        carlito: ["Carlito", "sans-serif"],
        inter: ["Inter", "sans-serif"],
      },
      spacing: {
        'sidebar': '280px',
      },
    },
  },
  plugins: [],
};
