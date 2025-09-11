# 🚀 **Olivia AI Web3 - Plugin Development Guide**

## **Complete Guide to Building Plugins and Bubbles**

This guide shows you exactly how to build new plugins and bubbles for the Olivia AI Web3 app, using the **CoinGecko pattern** (direct API calls) as the standard approach.

---

## **📋 Table of Contents**

1. [Plugin Architecture Overview](#plugin-architecture-overview)
2. [Step-by-Step Plugin Creation](#step-by-step-plugin-creation)
3. [Bubble Component Development](#bubble-component-development)
4. [API Service Integration](#api-service-integration)
5. [Frontend Integration](#frontend-integration)
6. [Complete Examples](#complete-examples)
7. [Best Practices](#best-practices)

---

## **🏗️ Plugin Architecture Overview**

### **Two Integration Patterns:**

#### **Pattern 1: Direct API Calls (Recommended)**
- **Examples:** CoinGecko, Twitter
- **Use when:** API is free, has CORS support, no sensitive keys
- **Flow:** Frontend → External API → Bubble

#### **Pattern 2: Microservice Proxy**
- **Examples:** Lurky, CoinStats, ZeroX
- **Use when:** API requires keys, has CORS issues, needs authentication
- **Flow:** Frontend → Microservice → External API → Bubble

---

## **🛠️ Step-by-Step Plugin Creation**

### **Step 1: Create Plugin Definition**

Add to `src/utils/pluginManager.js`:

```javascript
// Add to AVAILABLE_PLUGINS object
yourPlugin: {
  id: 'yourPlugin',
  name: 'Your Plugin Name',
  description: 'Short description of what it does',
  detailedDescription: 'Detailed description for the plugins page',
  logo: '/your-icon.png', // Put icon in public/ folder
  category: 'Category', // e.g., 'Analytics', 'Social', 'Trading'
  color: 'blue' // CSS color for bubble gradient
}
```

### **Step 2: Create API Service**

Create `src/api/services/yourPlugin.service.js`:

```javascript
/**
 * Your Plugin API Service - Direct API calls (like CoinGecko)
 */

export const yourPluginService = {
  // Main function to get data
  async getData(query) {
    try {
      console.log(`🔍 Your Plugin search: "${query}"`);
      
      const response = await fetch(`https://api.example.com/search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add API key if needed
          'X-API-Key': 'your-api-key'
        }
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Process and format the data
      return {
        success: true,
        query,
        data: data,
        count: data.length || 0
      };

    } catch (error) {
      console.error('Your Plugin API error:', error);
      throw error;
    }
  }
};
```

### **Step 3: Create Bubble Component**

Create `src/components/ui/FloatingYourPluginBubble.jsx`:

```javascript
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import { createPortal } from 'react-dom';
import React, { useState, useEffect } from 'react';

const FloatingYourPluginBubble = ({ 
  isOpen, 
  onClose, 
  title = 'Your Plugin', 
  content = '', 
  loading = false, 
  addParticlesToSwarm 
}) => {
  const bubbleId = useState(() => `yourplugin-${Date.now()}-${Math.random()}`)[0];
  const [position, setPosition] = useState(() => {
    const startX = Math.random() * (window.innerWidth - 300) + 100;
    const startY = window.innerHeight - Math.random() * 300 - 100;
    return { x: startX, y: startY };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);

  // Floating animation
  useEffect(() => {
    if (!isOpen || isDragging) return;

    const interval = setInterval(() => {
      setPosition(prev => {
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
        
        let newY = prev.y;
        let newX = prev.x;
        
        newY -= 0.5;
        newX += Math.sin(Date.now() * 0.001) * 0.3;
        
        newX = Math.max(margin, Math.min(window.innerWidth - bubbleSize - margin, newX));
        newY = Math.max(margin, Math.min(window.innerHeight - bubbleSize - margin, newY));
        
        return { x: newX, y: newY };
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isOpen, isDragging, isExpanded, content]);

  // Drag handlers
  const handleMouseDown = (e) => {
    if (e.target.closest('.bubble-content')) return;
    
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
    if (e.target.closest('.bubble-content')) return;
    
    const now = Date.now();
    if (now - lastClickTime < 300) {
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
    background: 'linear-gradient(135deg, #your-color-1 0%, #your-color-2 100%)',
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
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
    border: '2px solid rgba(255, 255, 255, 0.1)',
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
          <div style={{ marginBottom: '10px' }}>🔄</div>
          <div>Loading...</div>
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
        <div style={{ marginBottom: '5px' }}>🔄</div>
        <div style={{ fontSize: '10px' }}>Your Plugin</div>
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

FloatingYourPluginBubble.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  content: PropTypes.string,
  loading: PropTypes.bool,
  addParticlesToSwarm: PropTypes.func
};

export default FloatingYourPluginBubble;
```

### **Step 4: Add Frontend Integration**

Add to `src/pages/Home.jsx`:

#### **4a. Import the Service and Component**
```javascript
import { yourPluginService } from '../api/services/yourPlugin.service.js';
import FloatingYourPluginBubble from '../components/ui/FloatingYourPluginBubble.jsx';
```

#### **4b. Add State**
```javascript
const [yourPluginBubbles, setYourPluginBubbles] = useState([])
```

#### **4c. Add Detection Logic**
```javascript
// Detect your plugin triggers
const mentionsYourPlugin = /\b(your keywords|trigger words|detection patterns)\b/i.test(message)
```

#### **4d. Add Bubble Logic**
```javascript
// Handle your plugin bubble logic
if (mentionsYourPlugin && isPluginEnabled('yourPlugin')) {
  const newBubble = {
    id: Date.now() + Math.random(),
    title: 'Your Plugin Title',
    content: 'Loading...',
    loading: true
  }
  
  setYourPluginBubbles(prev => [...prev, newBubble])
  ;(async () => {
    try {
      const data = await yourPluginService.getData(message);
      
      let contentText = `Your Plugin Results:\n\n`;
      
      if (data.success && data.data) {
        // Format your data here
        data.data.forEach((item, index) => {
          contentText += `${index + 1}. ${item.title}\n`;
          contentText += `   ${item.description}\n\n`;
        });
      } else {
        contentText += 'No data found.';
      }
      
      setYourPluginBubbles(prev => prev.map(bubble => 
        bubble.id === newBubble.id 
          ? { ...bubble, content: contentText, loading: false }
          : bubble
      ))
      
    } catch (error) {
      console.error('Your plugin error:', error);
      
      let errorContent = '❌ Error\n\n' + error.message;
      
      setYourPluginBubbles(prev => prev.map(bubble => 
        bubble.id === newBubble.id 
          ? { ...bubble, content: errorContent, loading: false }
          : bubble
      ))
    }
  })()
}
```

#### **4e. Render Bubbles**
```javascript
{isPluginEnabled('yourPlugin') && yourPluginBubbles.map(bubble => (
  <FloatingYourPluginBubble
    key={bubble.id}
    isOpen={true}
    onClose={() => setYourPluginBubbles(prev => prev.filter(b => b.id !== bubble.id))}
    title={bubble.title}
    content={bubble.content}
    loading={bubble.loading}
    addParticlesToSwarm={addParticlesToSwarm}
  />
))}
```

---

## **📚 Complete Examples**

### **Example 1: Twitter Plugin (Working)**

**Plugin Definition:**
```javascript
twitter: {
  id: 'twitter',
  name: 'Twitter/X',
  description: 'Search Twitter for real-time crypto discussions and trends',
  detailedDescription: 'Search Twitter (now X) for real-time cryptocurrency discussions, trending topics, and community sentiment.',
  logo: '/x-icon.avif',
  category: 'Social',
  color: 'black'
}
```

**Service:**
```javascript
export const twitterService = {
  async searchTweets(query, searchType = 'Top') {
    const response = await fetch(`https://twitter-api45.p.rapidapi.com/search.php?query=${encodeURIComponent(query)}&search_type=${searchType}`, {
      headers: {
        'x-rapidapi-host': 'twitter-api45.p.rapidapi.com',
        'x-rapidapi-key': 'your-api-key'
      }
    });
    return response.json();
  }
};
```

**Detection:**
```javascript
const mentionsTwitter = isPluginEnabled('twitter') && message.trim().length > 0
```

### **Example 2: News Plugin (Working)**

**Plugin Definition:**
```javascript
news: {
  id: 'news',
  name: 'Crypto News',
  description: 'Latest cryptocurrency news and market updates',
  detailedDescription: 'Stay informed with the latest cryptocurrency news, market analysis, and breaking updates.',
  logo: coingeckoIcon,
  category: 'News',
  color: 'red'
}
```

**Detection:**
```javascript
const mentionsNews = /\b(news|breaking|update|announcement|headlines|story|article)\b/i.test(message)
```

---

## **🎯 Best Practices**

### **1. Detection Patterns**
- Use specific keywords: `/\b(keyword1|keyword2|keyword3)\b/i.test(message)`
- Be conservative with triggers to avoid false positives
- Consider context: `mentionsPrice && mentionedCoin`

### **2. Error Handling**
- Always wrap API calls in try-catch
- Provide meaningful error messages
- Show loading states

### **3. Data Formatting**
- Use consistent formatting across bubbles
- Include relevant metrics (prices, percentages, counts)
- Keep text readable and scannable

### **4. Performance**
- Limit data to essential information
- Use pagination for large datasets
- Cache responses when possible

### **5. User Experience**
- Make bubbles draggable and expandable
- Provide clear loading states
- Include close buttons

---

## **🚀 Quick Start Checklist**

- [ ] Add plugin definition to `pluginManager.js`
- [ ] Create API service in `src/api/services/`
- [ ] Create bubble component in `src/components/ui/`
- [ ] Add state to `Home.jsx`
- [ ] Add detection logic
- [ ] Add bubble creation logic
- [ ] Add bubble rendering
- [ ] Test with different messages
- [ ] Handle errors gracefully

---

## **🔧 Troubleshooting**

### **Common Issues:**

1. **Bubble not appearing:** Check plugin is enabled and detection logic
2. **API errors:** Verify API key and endpoint URL
3. **CORS issues:** Use microservice pattern instead of direct calls
4. **Styling issues:** Check gradient colors and bubble size calculations

### **Debug Tips:**

1. Add console.log statements to track flow
2. Check browser network tab for API calls
3. Verify plugin state in localStorage
4. Test detection patterns with different messages

---

**🎉 You're ready to build amazing plugins and bubbles! Follow this guide and you'll have working integrations in no time.**
