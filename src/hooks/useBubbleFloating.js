import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for balloon-like floating behavior
 * Bubbles float up and settle at the top, clustering together like balloons
 */
export const useBubbleFloating = (isOpen, isDragging, isExpanded, bubbleId) => {
  const [position, setPosition] = useState(() => {
    // Start from bottom with some randomness
    const startX = Math.random() * (window.innerWidth - 200) + 100;
    const startY = window.innerHeight - Math.random() * 100 - 50;
    return { x: startX, y: startY };
  });
  
  const [isSettled, setIsSettled] = useState(false);
  const animationFrameRef = useRef();
  const settledBubblesRef = useRef(new Set());

  useEffect(() => {
    if (!isOpen || isDragging) return;

    const animate = () => {
      setPosition(prev => {
        let bubbleSize = 140;
        if (isExpanded) {
          bubbleSize = 380;
        }
        
        let newY = prev.y;
        let newX = prev.x;
        
        // If not settled, float up like a balloon
        if (!isSettled) {
          const floatForce = -1.8; // Balloon-like floating speed
          newY += floatForce;
          
          // Add slight horizontal drift like a real balloon
          newX += (Math.random() - 0.5) * 0.3;
          
          // When reaching the top, settle there
          const topMargin = 20;
          if (newY <= topMargin) {
            newY = topMargin;
            setIsSettled(true);
            
            // Add this bubble to settled bubbles
            settledBubblesRef.current.add(bubbleId);
            
            // Calculate position to cluster with other settled bubbles
            const settledCount = settledBubblesRef.current.size;
            const clusterWidth = Math.min(settledCount * 160, window.innerWidth - 100);
            const startX = (window.innerWidth - clusterWidth) / 2;
            newX = startX + (settledCount - 1) * 160 + Math.random() * 20 - 10;
          }
        } else {
          // If settled, add gentle swaying motion like balloons touching
          newY = 20 + Math.sin(Date.now() * 0.001 + bubbleId.charCodeAt(0)) * 2;
          newX += Math.sin(Date.now() * 0.0008 + bubbleId.charCodeAt(1)) * 0.5;
        }
        
        // Keep X within bounds
        const maxX = window.innerWidth - bubbleSize - 20;
        const minX = 20;
        newX = Math.max(minX, Math.min(maxX, newX));
        
        return { x: newX, y: newY };
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen, isDragging, isExpanded, bubbleId]);

  // Reset settled state when bubble closes
  useEffect(() => {
    if (!isOpen) {
      setIsSettled(false);
      settledBubblesRef.current.delete(bubbleId);
    }
  }, [isOpen, bubbleId]);

  return position;
};

export default useBubbleFloating;
