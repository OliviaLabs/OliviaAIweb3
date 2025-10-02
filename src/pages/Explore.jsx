import React, { useState } from 'react'
import BubbleMapSection from '../components/features/explore/BubbleMapSection'
import TradingInfluencersSection from '../components/features/explore/TradingInfluencersSection'

export default function Explore() {
  const [selectedToken, setSelectedToken] = useState(null);
  const [tokenTweets, setTokenTweets] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingToken, setLoadingToken] = useState(null);

  const handleTokenClick = (tokenSymbol, tweets) => {
    // Show loading immediately when bubble is clicked
    if (tweets === 'loading') {
      setLoadingToken(tokenSymbol);
      setSelectedToken(tokenSymbol);
      setIsSearching(true);
      setTokenTweets([]);
    } else {
      // Results are ready
      setLoadingToken(null);
      setSelectedToken(tokenSymbol);
      setTokenTweets(tweets);
      setIsSearching(false);
    }
    // No auto-scroll - user can freely scroll up or down
  };

  const handleClear = () => {
    setSelectedToken(null);
    setTokenTweets([]);
    setIsSearching(false);
    setLoadingToken(null);
  };

  return (
    <div className="flex flex-col gap-6 relative pb-10">
      <BubbleMapSection onTokenClick={handleTokenClick} loadingToken={loadingToken} />
      <TradingInfluencersSection 
        selectedToken={selectedToken}
        tokenTweets={tokenTweets}
        isSearching={isSearching}
        onClear={handleClear}
      />
    </div>
  )
}
