import React, { useMemo, useEffect, useState } from "react";
import PropTypes from "prop-types";

export default function FloatingBubbles({ data, height = 250 }) {
  const baseBubbles = useMemo(() => {
    return (Array.isArray(data) ? data : []).map((d, i) => {
      const size = 20 + Math.random() * 40; // px
      const left = 5 + Math.random() * 90;  // percent
      return { key: `${d.name}-${i}`, label: d.name, size, left };
    });
  }, [data]);

  const [items, setItems] = useState([]);

  useEffect(() => {
    setItems(baseBubbles);
  }, [baseBubbles]);

  const handlePop = (key) => {
    // mark popped -> animate via CSS-in-JS, then remove
    setItems(prev => prev.map(b => b.key === key ? { ...b, popped: true } : b));
    setTimeout(() => {
      setItems(prev => prev.filter(b => b.key !== key));
    }, 220);
  };

  return (
    <div
      className="bubble-container"
      style={{
        position: 'relative',
        width: '100%',
        height: `${height}px`,
        overflow: 'hidden',
        pointerEvents: 'auto',
      }}
    >
      {items.map(b => (
        <div
          key={b.key}
          className="bubble"
          onClick={() => handlePop(b.key)}
          style={{
            position: 'absolute',
            bottom: 8,
            borderRadius: '50%',
            background: 'rgba(78, 211, 66, 0.15)',
            border: '2px solid #4ED342',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 12,
            cursor: 'pointer',
            width: b.size,
            height: b.size,
            left: `${b.left}%`,
            transform: b.popped ? 'scale(1.5)' : 'scale(1)',
            opacity: b.popped ? 0 : 1,
            transition: 'transform 180ms ease, opacity 180ms ease',
          }}
        >
          <span style={{ userSelect: 'none', whiteSpace: 'nowrap' }}>${b.label}</span>
        </div>
      ))}
    </div>
  );
}

FloatingBubbles.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({ name: PropTypes.string.isRequired, value: PropTypes.number })
  ),
  height: PropTypes.number,
};
