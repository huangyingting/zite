import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        zite: {
          cream: "#FAF9F5",
          surface: "#F3F1EC",
          ink: "#141413",
          muted: "#5E5D59",
          border: "#E6E4DD",
          blue: "#2563EB",
          emerald: "#059669",
          amber: "#D97706",
          violet: "#7C3AED",
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
        mono: ["JetBrains Mono", "monospace"],
      }
    },
  },
  plugins: [],
};
export default config;
