# Salary Manager

A personal finance manager built with Next.js 14, Tailwind CSS, and Recharts.

## Tech Stack
- Next.js 14 (App Router, TypeScript)
- Tailwind CSS for styling
- Recharts for pie chart visualization
- localStorage for client-side persistence (no backend)

## Development
```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
```

## Architecture
- All state lives in `components/SalaryManager.tsx`
- Data stored under localStorage key: `salary-manager-data`
- Month keys format: `YYYY-MM` (e.g. `2026-02`)
- Color palette cycles through 12 preset colors for categories

## Color Palette
- Background: `#000000`
- Surface/card: `#111111`
- Border: `#333333`
- Text primary: `#ffffff`
- Text muted: `#888888`
- Accent blue: `#0070f3`
- Danger: `#ff4444`
- Success: `#50e3c2`
