# Garden Finance - Agent Dashboard

A modern, responsive dashboard for managing AI agent activities and social media suggestions built with Next.js, shadcn/ui, and Zustand.

## Features

- **Social Feed Layout**: Clean, Twitter-like interface for browsing agent activities
- **Tweet Management**: Approve, reject, or expand suggested tweets to threads
- **Real-time Metrics**: Display financial statistics and agent performance
- **Purple/Pink Theme**: Beautiful gradient design matching garden.finance branding
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **State Management**: Efficient state handling with Zustand

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: Zustand
- **Package Manager**: Bun
- **TypeScript**: Full type safety
- **Icons**: Lucide React

## Getting Started

1. Install dependencies:
   ```bash
   bun install
   ```

2. Run the development server:
   ```bash
   bun run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/                 # Next.js app router
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── header.tsx      # Main navigation header
│   ├── sidebar.tsx     # Left sidebar with suggestions
│   ├── tweet-card.tsx  # Individual tweet suggestion cards
│   └── stats-panel.tsx # Right panel with metrics
├── lib/
│   ├── store.ts        # Zustand state management
│   └── utils.ts        # Utility functions
```

## Components

### TweetCard
Displays individual tweet suggestions with:
- Agent identification and performance metrics
- Content preview with smart formatting
- Action buttons (approve, reject, expand to thread)
- Status indicators

### StatsPanel
Shows key metrics including:
- Financial statistics ($4.2B, $3.1B, $1.2B)
- Agent performance percentages
- Visual progress indicators

### Header
Navigation bar featuring:
- Garden Finance branding
- Search functionality
- Filter controls
- Feed type toggles

## State Management

The app uses Zustand for lightweight state management:

```typescript
interface DashboardState {
  tweetSuggestions: TweetSuggestion[]
  financialMetrics: FinancialMetric[]
  agentPerformance: AgentPerformance[]
  approveTweet: (id: string) => void
  rejectTweet: (id: string) => void
  expandToThread: (id: string) => void
}
```

## Design System

The dashboard implements garden.finance's brand colors:
- **Primary Purple**: `oklch(0.488 0.243 264.376)`
- **Light Pink**: `oklch(0.97 0.02 320)`
- **Gradients**: Purple to pink backgrounds
- **Interactive Elements**: Hover states and smooth transitions

## Development

- **Linting**: Biome for fast, modern linting
- **Formatting**: Biome for consistent code style
- **Type Checking**: TypeScript with strict mode
- **Hot Reload**: Fast refresh during development

## Build

```bash
bun run build
```

## License

Private - Garden Finance
