import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "app-bg":      "#000000",
        "app-surface": "#0a0000",
        "app-border":  "#280000",
        "app-text":    "#ffffff",
        "app-muted":   "#888888",
        "app-accent":  "#cc0000",
        "app-danger":  "#ff2222",
        "app-success": "#ff9090",
        "app-warning": "#ff6600",
      },
    },
  },
  plugins: [],
};

export default config;
