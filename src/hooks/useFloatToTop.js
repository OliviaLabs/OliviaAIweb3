import { useEffect, useRef } from 'react';

// DEAD SIMPLE: Just move bubbles to the top. That's it.
export default function useFloatToTop({ id, isOpen, isDragging, isExpanded, position, setPosition, topBarrier = 20 }) {
  const triggeredRef = useRef(false);

  useEffect(() => {
    if (!isOpen) triggeredRef.current = false;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || triggeredRef.current || isDragging || isExpanded) return;

    console.log(`🎈 Moving bubble ${id} to top`);
    
    // Just set it to the top immediately
    setPosition({ x: position.x, y: topBarrier });
    triggeredRef.current = true;
    
  }, [id, isOpen, isDragging, isExpanded, position.x, setPosition, topBarrier]);
}
