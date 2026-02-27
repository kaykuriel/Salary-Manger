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
        "app-surface": "#111111",
        "app-border":  "#333333",
        "app-text":    "#ffffff",
        "app-muted":   "#888888",
        "app-accent":  "#0070f3",
        "app-danger":  "#ff4444",
        "app-success": "#50e3c2",
        "app-warning": "#f5a623",
        "app-cyan":    "#0070f3",
      },
    },
  },
  plugins: [],
};

export default config;
