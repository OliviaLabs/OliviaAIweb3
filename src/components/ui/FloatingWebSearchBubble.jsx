import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import { createPortal } from 'react-dom';
import React, { useState, useEffect } from 'react';

const FloatingWebSearchBubble = ({ isOpen, onClose, title = 'Web Search', content = '', loading = false, addParticlesToSwarm }) => {
  const bubbleId = useState(() => `websearch-${Date.now()}-${Math.random()}`)[0]; // Unique ID for this bubble instance
  const [position, setPosition] = useState(() => {
    // Spread bubbles across the bottom third of screen
    const startX = Math.random() * (window.innerWidth - 300) + 100;
    const startY = window.innerHeight - Math.random() * 300 - 100; // Random between bottom 100-400px
    return { x: startX, y: startY };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);

  useEffect(() => {
    if (!isOpen || isDragging) return;

    const interval = setInterval(() => {
      setPosition(prev => {
        // Use same dynamic sizing as outside
        let bubbleSize = 128;
        if (isExpanded && typeof content === 'string') {
          const lines = content.split('\n').length;
          const avgLineLength = content.length / lines;
          const estimatedWidth = Math.max(300, Math.min(500, avgLineLength * 8 + 120));
          const estimatedHeight = Math.max(250, lines * 22 + 100);
          bubbleSize = Math.max(estimatedWidth, estimatedHeight);
        } else if (isExpanded) {
          bubbleSize = 350;
        }
        const margin = 20;
        
        // Simple upward floating - no hard stops
        let newY = prev.y;
        let newX = prev.x;
        
        // Gentle upward drift
        newY -= 0.5;
        
        // Gentle side-to-side sway
        newX += Math.sin(Date.now() * 0.001) * 0.3;
        
        // Keep within bounds
        newX = Math.max(margin, Math.min(window.innerWidth - bubbleSize - margin, newX));
        newY = Math.max(margin, Math.min(window.innerHeight - bubbleSize - margin, newY));
        
        return { x: newX, y: newY };
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isOpen, isDragging, isExpanded, content]);

  const handleMouseDown = (e) => {
    if (e.target.closest('.bubble-content')) return; // Don't drag when clicking on content
    
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    setPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = (e) => {
    if (e.target.closest('.bubble-content')) return; // Don't expand when clicking on content
    
    const now = Date.now();
    if (now - lastClickTime < 300) {
      // Double click - expand/collapse
      setIsExpanded(!isExpanded);
      setLastClickTime(0);
    } else {
      setLastClickTime(now);
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  if (!isOpen) return null;

  const bubbleSize = isExpanded ? 
    (typeof content === 'string' ? 
      Math.max(300, Math.min(500, content.length * 0.5 + 200)) : 
      350) : 
    128;

  const bubbleStyle = {
    position: 'fixed',
    left: `${position.x}px`,
    top: `${position.y}px`,
    width: `${bubbleSize}px`,
    height: `${bubbleSize}px`,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '50%',
    cursor: isDragging ? 'grabbing' : 'grab',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: isExpanded ? '14px' : '12px',
    fontWeight: 'bold',
    textAlign: 'center',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    transition: isDragging ? 'none' : 'all 0.3s ease',
    overflow: 'hidden',
    userSelect: 'none'
  };

  const contentStyle = {
    padding: isExpanded ? '20px' : '10px',
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  };

  const closeButtonStyle = {
    position: 'absolute',
    top: '5px',
    right: '5px',
    background: 'rgba(255, 255, 255, 0.2)',
    border: 'none',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="bubble-content" style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '10px' }}>🔍</div>
          <div>Searching...</div>
        </div>
      );
    }

    if (isExpanded) {
      return (
        <div className="bubble-content" style={{ 
          width: '100%', 
          height: '100%', 
          overflow: 'auto',
          padding: '10px',
          fontSize: '12px',
          lineHeight: '1.4'
        }}>
          <div style={{ marginBottom: '10px', fontWeight: 'bold', fontSize: '14px' }}>
            {title}
          </div>
          <div style={{ 
            whiteSpace: 'pre-wrap', 
            wordBreak: 'break-word',
            maxHeight: '200px',
            overflow: 'auto'
          }}>
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      );
    }

    return (
      <div className="bubble-content" style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: '5px' }}>🔍</div>
        <div style={{ fontSize: '10px' }}>Web Search</div>
      </div>
    );
  };

  return createPortal(
    <div
      style={bubbleStyle}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      <div style={contentStyle}>
        <button
          style={closeButtonStyle}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          title="Close"
        >
          ×
        </button>
        {renderContent()}
      </div>
    </div>,
    document.body
  );
};

FloatingWebSearchBubble.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  content: PropTypes.string,
  loading: PropTypes.bool,
  addParticlesToSwarm: PropTypes.func
};

export default FloatingWebSearchBubble;
