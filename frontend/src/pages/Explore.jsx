import React, { useState, useEffect, useCallback, useRef } from 'react'
import BubbleMapSection from '../components/features/explore/BubbleMapSection'
import TradingInfluencersSection from '../components/features/explore/TradingInfluencersSection'
import { useHomeInput } from '../contexts/HomeInputContext'
import { useWebSocket } from '../contexts/WebSocketContext'

export default function Explore() {
  const [selectedToken, setSelectedToken] = useState(null);
  const [tokenTweets, setTokenTweets] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingToken, setLoadingToken] = useState(null);
  
  // Get what we need from context - DON'T get userInput to avoid re-renders!
  const { setShowInput, setUserInput, handleSendMessageRef, inputRef } = useHomeInput();
  const { sendMessage } = useWebSocket();

  // Stable function - won't recreate on re-renders
  const handleTokenClick = useCallback((tokenSymbol, tweets) => {
    if (tweets === 'loading') {
      setLoadingToken(tokenSymbol);
      setSelectedToken(tokenSymbol);
      setIsSearching(true);
      setTokenTweets([]);
    } else {
      setLoadingToken(null);
      setSelectedToken(tokenSymbol);
      setTokenTweets(tweets);
      setIsSearching(false);
    }
  }, []);

  const handleClear = useCallback(() => {
    setSelectedToken(null);
    setTokenTweets([]);
    setIsSearching(false);
    setLoadingToken(null);
  }, []);

  // Provide a send handler for BottomNavigation on Explore that sends via global AI
  const handleSendMessage = useCallback(async () => {
    const text = (inputRef?.current?.value || '').trim();
    if (!text) return;
    // Send through global multi-agent service; inline bubbles are mirrored by BottomNavigation
    try {
      await sendMessage(text, [], false, false);
    } catch (err) {
      console.error('Explore sendMessage failed:', err);
    }
    setUserInput('');
  }, [inputRef, setUserInput, sendMessage]); // Stable - inputRef is stable!

  useEffect(() => {
    // Show the input on Explore and wire the send ref
    setShowInput(true);
    handleSendMessageRef.current = handleSendMessage;
    return () => {
      // leave input visibility decisions to routing; do not clear ref here to avoid race on nav
    };
  }, [setShowInput, handleSendMessageRef, handleSendMessage]); // handleSendMessage is now stable (uses ref for input)

  return (
    <div className="flex flex-col gap-6 relative pb-10 h-full w-full overflow-hidden">
      <BubbleMapSection 
        onTokenClick={handleTokenClick} 
        loadingToken={loadingToken}
        setUserInput={setUserInput}
        handleSendMessageRef={handleSendMessageRef}
        sendMessage={sendMessage}
      />
      <TradingInfluencersSection 
        selectedToken={selectedToken}
        tokenTweets={tokenTweets}
        isSearching={isSearching}
        onClear={handleClear}
      />
    </div>
  )
}
