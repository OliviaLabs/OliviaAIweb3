import { useEffect, useRef } from 'react';

// Global top-row slot registry on window
function getTopSlots() {
  if (typeof window === 'undefined') return [];
  if (!window.__bubbleTopSlots) window.__bubbleTopSlots = [];
  return window.__bubbleTopSlots;
}

export default function useFloatToTop({ id, isOpen, isDragging, isExpanded, position, setPosition, topBarrier = 20, delayMs = 80, bubbleWidth = 140, gap = 2, margin = 8 }) {
  const triggeredRef = useRef(false);

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
      // Compute target X to avoid overlaps along the top row
      const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
      const minX = margin;
      const maxX = Math.max(margin, vw - bubbleWidth - margin);
      const slots = getTopSlots();

      const intersects = (x) => {
        const a1 = x, a2 = x + bubbleWidth;
        for (const s of slots) {
          const b1 = s.x, b2 = s.x + s.w;
          if (Math.max(a1, b1) < Math.min(a2, b2)) return s; // overlap
        }
        return null;
      };

      // Start from current desired x (clamped)
      let x = Math.min(Math.max(position.x, minX), maxX);
      let guard = 0;
      let hit;
      while ((hit = intersects(x)) && guard++ < 50) {
        const shiftRight = hit.x + hit.w + gap;
        const shiftLeft = hit.x - bubbleWidth - gap;
        const distR = Math.abs(shiftRight - x);
        const distL = Math.abs(x - shiftLeft);
        // Prefer nearer direction that stays within bounds
        if (shiftRight <= maxX && (distR <= distL || shiftLeft < minX)) {
          x = shiftRight;
        } else if (shiftLeft >= minX) {
          x = shiftLeft;
        } else {
          // No room; clamp to nearest bound
          x = Math.min(Math.max(x, minX), maxX);
          break;
        }
      }

      // Register slot
      slots.push({ id, x, w: bubbleWidth });

      // Glide to top with updated x
      setPosition(prev => ({ x, y: topBarrier }));
      triggeredRef.current = true;
    }, delayMs + Math.random() * 80);

    return () => clearTimeout(to);
  }, [id, isOpen, isDragging, isExpanded, position.x, position.y, setPosition, topBarrier, delayMs, bubbleWidth, gap, margin]);
}


