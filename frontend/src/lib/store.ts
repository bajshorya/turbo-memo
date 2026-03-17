import { create } from 'zustand'

export interface TweetSuggestion {
  id: string
  agent: string
  content: string
  timestamp: string
  status: 'pending' | 'approved' | 'rejected'
  agentType: string
  performance?: number
  exchange?: string
}

export interface FinancialMetric {
  label: string
  value: string
  change?: string
}

export interface AgentPerformance {
  name: string
  percentage: number
  type: string
}

interface DashboardState {
  tweetSuggestions: TweetSuggestion[]
  financialMetrics: FinancialMetric[]
  agentPerformance: AgentPerformance[]
  selectedExchange: string
  searchQuery: string
  approveTweet: (id: string) => void
  rejectTweet: (id: string) => void
  expandToThread: (id: string) => void
  setSelectedExchange: (exchange: string) => void
  setSearchQuery: (query: string) => void
}

export const useDashboardStore = create<DashboardState>((set) => ({
  selectedExchange: 'all-dex',
  searchQuery: '',
  tweetSuggestions: [
    {
      id: '1',
      agent: 'Super Agent',
      content: 'Designers: the next wave of DeFi isn\'t just about yield — it\'s about making yield legible. garden.finance is rethinking how financial data speaks to users. Less noise. More clarity.',
      timestamp: '2h ago',
      status: 'pending',
      agentType: 'Super Agent',
      performance: 20,
      exchange: 'all-dex'
    },
    {
      id: '2',
      agent: 'Volume Agent',
      content: 'While others plateau, garden.finance TVL is up 3.8% today. Clarity drives confidence. Confidence drives capital.',
      timestamp: '3h ago',
      status: 'pending',
      agentType: 'Volume Agent',
      performance: 67,
      exchange: 'garden'
    },
    {
      id: '3',
      agent: 'TVL Agent',
      content: 'Designers: $4.2B. That\'s what happens when you build a protocol people actually want to use.',
      timestamp: '4h ago',
      status: 'pending',
      agentType: 'TVL Agent',
      performance: 18,
      exchange: 'garden'
    },
    {
      id: '4',
      agent: 'Volume Agent',
      content: 'The future of finance is transparent, accessible, and user-focused. garden.finance is leading this transformation with clear, actionable insights.',
      timestamp: '5h ago',
      status: 'pending',
      agentType: 'Volume Agent',
      performance: 67,
      exchange: 'all-dex'
    },
    {
      id: '5',
      agent: 'Super Agent',
      content: 'Market update: $4.2B in total value locked, demonstrating strong confidence in our platform and vision for the future of DeFi.',
      timestamp: '6h ago',
      status: 'pending',
      agentType: 'Super Agent',
      performance: 20,
      exchange: 'garden'
    },
    {
      id: '6',
      agent: 'TVL Agent',
      content: 'Clean data visualization isn\'t just pretty — it\'s profitable. garden.finance users make better decisions because they see better data.',
      timestamp: '7h ago',
      status: 'pending',
      agentType: 'TVL Agent',
      performance: 18,
      exchange: 'all-dex'
    },
    {
      id: '7',
      agent: 'Volume Agent',
      content: 'Breaking: garden.finance crosses $3.1B in daily volume. When you make DeFi accessible, adoption follows.',
      timestamp: '8h ago',
      status: 'pending',
      agentType: 'Volume Agent',
      performance: 67,
      exchange: 'garden'
    },
    {
      id: '8',
      agent: 'Super Agent',
      content: 'The best protocols don\'t just move money — they move the industry forward. garden.finance is setting new standards for user experience in DeFi.',
      timestamp: '9h ago',
      status: 'pending',
      agentType: 'Super Agent',
      performance: 20,
      exchange: 'all-dex'
    }
  ],
  financialMetrics: [
    { label: 'Total Value', value: '$4.2 Billion' },
    { label: 'Volume', value: '$3.1 Billion' },
    { label: 'Market Cap', value: '$1.2 Billion' }
  ],
  agentPerformance: [
    { name: 'Volume Agent', percentage: 67, type: 'Volume Spike' },
    { name: 'TVL Agent', percentage: 18, type: 'TVL Agent' }
  ],
  approveTweet: (id) =>
    set((state) => ({
      tweetSuggestions: state.tweetSuggestions.map((tweet) =>
        tweet.id === id ? { ...tweet, status: 'approved' } : tweet
      ),
    })),
  rejectTweet: (id) =>
    set((state) => ({
      tweetSuggestions: state.tweetSuggestions.map((tweet) =>
        tweet.id === id ? { ...tweet, status: 'rejected' } : tweet
      ),
    })),
  expandToThread: (id) => {
    console.log('Expanding tweet to thread:', id)
    // Implementation for expanding to thread
  },
  setSelectedExchange: (exchange) =>
    set(() => ({ selectedExchange: exchange })),
  setSearchQuery: (query) =>
    set(() => ({ searchQuery: query })),
}))