import { useState, useCallback } from 'react';

/**
 * Custom hook for standardized bubble interactions
 * Provides single click (expand/shrink) and double click (pop/close) functionality
 */
export const useBubbleInteractions = (onClose) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [isPopping, setIsPopping] = useState(false);

  const handleClick = useCallback((e) => {
    // Don't trigger if clicking close button
    if (e.target.getAttribute('aria-label') === 'Close') return;
    
    const currentTime = Date.now();
    const timeDiff = currentTime - lastClickTime;
    
    if (timeDiff < 300) {
      // Double click - pop and close bubble
      setIsPopping(true);
      setTimeout(() => {
        onClose();
      }, 200);
    } else {
      // Single click - toggle expand/shrink
      setIsExpanded(prev => !prev);
    }
    
    setLastClickTime(currentTime);
  }, [lastClickTime, onClose]);

  return {
    isExpanded,
    isPopping,
    handleClick,
    setIsExpanded
  };
};

export default useBubbleInteractions;
