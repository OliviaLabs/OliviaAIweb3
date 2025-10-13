import { useEffect, useRef } from 'react';

// Global top-row slot registry on window
function getTopSlots() {
  if (typeof window === 'undefined') return [];
  if (!window.__bubbleTopSlots) window.__bubbleTopSlots = [];
  return window.__bubbleTopSlots;
}

export default function useFloatToTop({ id, isOpen, isDragging, isExpanded, position, setPosition, topBarrier = 20, delayMs = 80, bubbleWidth = 140, gap = 2, margin = 8 }) {
  const triggeredRef = useRef(false);
  const bubbleHeight = 140; // Same as bubbleWidth for collision detection

  useEffect(() => {
    // Reset when closed
    if (!isOpen) triggeredRef.current = false;
  }, [isOpen]);

  // Remove slot on close/unmount
  useEffect(() => {
    return () => {
      if (typeof window === 'undefined') return;
      const slots = getTopSlots();
      const idx = slots.findIndex(s => s.id === id);
      if (idx !== -1) slots.splice(idx, 1);
    };
  }, [id]);

  useEffect(() => {
    if (!isOpen || triggeredRef.current) return;
    if (isDragging || isExpanded) return;
    if (position.y <= topBarrier) return;

    const to = setTimeout(() => {
      // Use container bounds if available (HARD WALL for desktop columns)
      const bounds = window.bubbleContainerBounds || { width: window.innerWidth };
      const vw = bounds.width || 1024;
      const minX = margin;
      const maxX = Math.max(margin, vw - bubbleWidth - margin);
      const slots = getTopSlots();

      // Check if position (x, y) collides with any existing bubble - HARD BORDERS
      const intersects = (x, y) => {
        const a1 = x, a2 = x + bubbleWidth;
        const b1 = y, b2 = y + bubbleHeight;
        for (const s of slots) {
          const c1 = s.x, c2 = s.x + s.w;
          const d1 = s.y, d2 = s.y + s.h;
          // Check both X and Y overlap - true hard collision
          if (Math.max(a1, c1) < Math.min(a2, c2) && 
              Math.max(b1, d1) < Math.min(b2, d2)) {
            return s;
          }
        }
        return null;
      };

      let x = Math.min(Math.max(position.x, minX), maxX);
      let y = topBarrier;
      let foundSpot = false;

      // Try up to 5 rows - stack bubbles vertically if horizontal space runs out
      for (let row = 0; row < 5 && !foundSpot; row++) {
        y = topBarrier + (row * (bubbleHeight + gap));
        x = minX; // Start from left edge for each row
        
        let guard = 0;
        while (guard++ < 100) {
          if (!intersects(x, y)) {
            foundSpot = true;
            break;
          }
          
          // Move right by one bubble width + gap
          x += bubbleWidth + gap;
          
          // If we've gone past the right edge, try next row
          if (x > maxX) {
            break;
          }
        }
        
        if (foundSpot) break;
      }

      // If still no spot found (unlikely), stack at end
      if (!foundSpot) {
        x = minX;
        y = topBarrier + (5 * (bubbleHeight + gap));
      }

      // Register slot with both X and Y - HARD BORDER TRACKING
      slots.push({ id, x, y, w: bubbleWidth, h: bubbleHeight });

      // Glide to found position
      setPosition({ x, y });
      triggeredRef.current = true;
    }, delayMs); // No random delay - all bubbles move in sync

    return () => clearTimeout(to);
  }, [id, isOpen, isDragging, isExpanded, position.x, position.y, setPosition, topBarrier, delayMs, bubbleWidth, gap, margin]);
}


