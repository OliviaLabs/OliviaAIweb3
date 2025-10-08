import React, { useState, useEffect, useCallback } from 'react'
import BubbleMapSection from '../components/features/explore/BubbleMapSection'
import TradingInfluencersSection from '../components/features/explore/TradingInfluencersSection'
import { useHomeInput } from '../contexts/HomeInputContext'
import { startOliviaChat } from '../utils/olivia'

export default function Explore() {
  const [selectedToken, setSelectedToken] = useState(null);
  const [tokenTweets, setTokenTweets] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingToken, setLoadingToken] = useState(null);
  const { setShowInput, userInput, setUserInput, handleSendMessageRef } = useHomeInput();

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

  // Provide a send handler for BottomNavigation on Explore, mirroring Home
  const handleSendMessage = useCallback(() => {
    const text = (userInput || '').trim();
    if (!text) return;
    startOliviaChat({ action: 'quick_chat', message: text, sendMessage: true });
    setUserInput('');
  }, [userInput, setUserInput]);

  useEffect(() => {
    // Show the input on Explore and wire the send ref
    setShowInput(true);
    handleSendMessageRef.current = handleSendMessage;
    return () => {
      // leave input visibility decisions to routing; do not clear ref here to avoid race on nav
    };
  }, [setShowInput, handleSendMessageRef, handleSendMessage]);

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
