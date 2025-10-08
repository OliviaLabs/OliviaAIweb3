import { coinstats_coinsBubble } from './coinstats_coinsBubble.js';
import { coinstats_coinBubble } from './coinstats_coinBubble.js';
import { coinstats_marketsBubble } from './coinstats_marketsBubble.js';
import { coinstats_searchBubble } from './coinstats_searchBubble.js';

export const bubbleDescriptors = [
  { id: 'coinstats_coins', title: 'CoinStats Coins', description: 'List of coins', type: 'list', formatter: coinstats_coinsBubble },
  { id: 'coinstats_coin', title: 'CoinStats Coin', description: 'Single coin details', type: 'detail', formatter: coinstats_coinBubble },
  { id: 'coinstats_markets', title: 'CoinStats Markets', description: 'Markets data', type: 'markets', formatter: coinstats_marketsBubble },
  { id: 'coinstats_search', title: 'CoinStats Search', description: 'Search results', type: 'search', formatter: coinstats_searchBubble }
];


