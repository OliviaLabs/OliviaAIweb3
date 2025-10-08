import { coingecko_overviewBubble } from './coingecko_overviewBubble.js';

export const bubbleDescriptors = [
  {
    id: 'coingecko_overview',
    title: 'CoinGecko Overview',
    description: 'Top market snapshot from CoinGecko',
    type: 'market_overview',
    formatter: coingecko_overviewBubble
  }
];


