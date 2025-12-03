# Polymarket Aggregator

A modern, dark-themed prediction markets dashboard built with Next.js 14, TypeScript, and Tailwind CSS. Track and discover prediction markets on Polymarket in real-time.

![Polymarket Aggregator](https://polymarket.com/og-image.png)

## Features

- 🌙 **Dark Mode** - Professional crypto-style design
- 📊 **Real-time Data** - Fetches live market data from Polymarket's API
- 🔍 **Search** - Filter markets by keyword
- 📱 **Responsive** - Works seamlessly on desktop and mobile
- ⚡ **Fast** - Built with Next.js 14 App Router
- 🎨 **Modern UI** - Clean table with smooth animations

## Tech Stack

- [Next.js 14](https://nextjs.org/) - React framework with App Router
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first styling
- [Geist Font](https://vercel.com/font) - Clean, modern typography

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
```bash
cd prediction-agg
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
prediction-agg/
├── src/
│   ├── app/
│   │   ├── globals.css      # Global styles and Tailwind
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Homepage
│   ├── components/
│   │   ├── ErrorState.tsx   # Error display component
│   │   ├── Header.tsx       # Page header
│   │   ├── LoadingSkeleton.tsx  # Loading state
│   │   ├── MarketTable.tsx  # Markets table
│   │   ├── SearchBar.tsx    # Search input
│   │   └── StatsBar.tsx     # Statistics display
│   └── types/
│       └── market.ts        # TypeScript types
├── tailwind.config.ts       # Tailwind configuration
├── package.json
└── README.md
```

## API

This app fetches data from the Polymarket Gamma API:
- Endpoint: `https://gamma-api.polymarket.com/markets`
- Documentation: [Polymarket API Docs](https://docs.polymarket.com/)

## License

MIT License - feel free to use this for your own projects!




