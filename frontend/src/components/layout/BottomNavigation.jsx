// src/components/BottomNavigation.jsx
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../ui/Button';
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useHomeInput } from '../../contexts/HomeInputContext';
import { useWebSocket } from '../../contexts/WebSocketContext';
import ConnectWalletModalComponent from '../ui/ConnectWalletModalComponent';
// import { startOliviaChat } from '../../utils/olivia';
import { Home, Puzzle, Search, User, Monitor } from 'lucide-react';
import { getPluginCounts } from '../../utils/pluginManager';

export default function BottomNavigation({ 
  showInput = false, 
  userInput = '', 
  onInputChange = () => {}, 
  onSendMessage = () => {},
  inputRef = null
}) {
  const { telegramUser } = useAuth();
  const { addInlineBubble, inlineBubbles, beginAIBubble, appendToAIBubble, setAIBubbleText, endAIBubble } = useHomeInput();
  const { subscribe, isStreamingResponse, currentAction, actionStatus, isLoading, loadingText } = useWebSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false); // Collapse global chat (bubbles + input)
  const [pluginCounts, setPluginCounts] = useState(getPluginCounts());
  // Deprecated local state; use shared context so bubbles persist across routes
  const sentPreviewTimeoutRef = useRef(null);

  // Refresh plugin counts periodically
  useEffect(() => {
    const refreshCounts = () => setPluginCounts(getPluginCounts());
    const interval = setInterval(refreshCounts, 3000);
    return () => clearInterval(interval);
  }, []);

  // No timers anymore; keep bubbles persistent across pages

  // Mirror AI stream globally for all routes — keep one bubble per stream
  const beginRef = useRef(beginAIBubble);
  const appendRef = useRef(appendToAIBubble);
  const setTextRef = useRef(setAIBubbleText);
  const endRef = useRef(endAIBubble);
  const hasActiveStreamRef = useRef(false);
  const currentReqRef = useRef(null);
  useEffect(() => { beginRef.current = beginAIBubble; }, [beginAIBubble]);
  useEffect(() => { appendRef.current = appendToAIBubble; }, [appendToAIBubble]);
  useEffect(() => { setTextRef.current = setAIBubbleText; }, [setAIBubbleText]);
  useEffect(() => { endRef.current = endAIBubble; }, [endAIBubble]);

  useEffect(() => {
    const unsubscribe = subscribe((data) => {
      if (!data) return;
      if (data.type === 'stream_chunk') {
        if (!hasActiveStreamRef.current || currentReqRef.current !== data.requestId) {
          beginRef.current();
          hasActiveStreamRef.current = true;
          currentReqRef.current = data.requestId || 'unknown';
        }
        const chunkText = data.data?.text || data.data?.content || data.content || '';
        if (chunkText) appendRef.current(chunkText);
      } else if (data.type === 'stream_complete') {
        const finalText = data.data?.fullResponse || data.data?.text || '';
        if (finalText) setTextRef.current(finalText);
        if (hasActiveStreamRef.current) {
          endRef.current();
          hasActiveStreamRef.current = false;
          currentReqRef.current = null;
        }
      } else if (data.type === 'response' || data.type === 'text') {
        const text = data.data?.text || data.content || data.message || '';
        if (text) {
          beginRef.current();
          setTextRef.current(text);
          endRef.current();
        }
      }
    });

    return () => { try { unsubscribe && unsubscribe(); } catch (_) {} };
  }, [subscribe]);

  // One-time inline welcome bubble across the app (per page load, runtime-only flag)
  useEffect(() => {
    if (window.__inlineWelcomeShown) return;
    let attempts = 0;
    const maxAttempts = 60; // wait up to ~30s for trending text
    const interval = setInterval(() => {
      // If another part of the app already showed the welcome, stop polling
      if (window.__inlineWelcomeShown) {
        clearInterval(interval);
        return;
      }
      attempts += 1;
      const trendingWelcome = sessionStorage.getItem('inline_welcome_text');
      if (trendingWelcome) {
        // Double-check runtime flag before adding to avoid duplicates
        if (!window.__inlineWelcomeShown) {
          addInlineBubble({ role: 'ai', text: trendingWelcome });
          window.__inlineWelcomeShown = true;
        }
        clearInterval(interval);
      } else if (attempts >= maxAttempts) {
        // If trending text isn't set yet, synthesize a welcome from the active token
        try {
          const ctx = window.contextAwarenessData || {};
          const t = ctx.active_token || ctx.proactive_token;
          if (!window.__inlineWelcomeShown && t && (t.name || t.symbol)) {
            const name = t.name || t.symbol || 'this token';
            const rank = t.rank || t.market_cap_rank;
            const change = (t.priceChange !== undefined ? t.priceChange : (t.data?.price_change_percentage_24h?.usd));
            const changeNum = Number(change);
            const sign = isFinite(changeNum) ? (changeNum >= 0 ? 'up' : 'down') : null;
            const pct = isFinite(changeNum) ? Math.abs(changeNum).toFixed(2) : null;
            const parts = [];
            parts.push(`Interesting action on ${name}${t.symbol ? ` (${String(t.symbol).toUpperCase()})` : ''} right now.`);
            if (rank) parts.push(`It's sitting at #${rank}`);
            if (pct && sign) parts.push(`and ${sign} ${pct}% in the last 24 hours.`);
            const msg = parts.join(' ') + (parts.length ? ' ' : '') + 'Want to dig into what\'s driving it?';
            addInlineBubble({ role: 'ai', text: msg });
            window.__inlineWelcomeShown = true;
          }
        } catch (_) {}
        clearInterval(interval);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [addInlineBubble]);

  // This function handles navigation clicks.
  // If the user is a Telegram user (i.e. hasn't connected a wallet), we show the modal.
  const handleNavigation = (route) => {
    if (telegramUser) {
      setIsConnectModalOpen(true);
    } else {
      navigate(route);
    }
  };

  // Navigation items
  const navItems = [
    {
      id: 'home',
      label: 'Home',
      route: '/home',
      icon: Home,
      isActive: location.pathname === '/home'
    },
    {
      id: 'explore',
      label: 'Explore',
      route: '/explore',
      icon: Search,
      isActive: location.pathname === '/explore'
    },
    {
      id: 'plugins',
      label: 'Plugins',
      route: '/plugins',
      icon: Puzzle,
      isActive: location.pathname === '/plugins'
    },
    {
      id: 'profile',
      label: 'Profile',
      route: '/profile',
      icon: User,
      isActive: location.pathname === '/profile'
    },
    {
      id: 'desktop',
      label: 'Desktop',
      route: '/desktop',
      icon: Monitor,
      isActive: location.pathname === '/desktop'
    }
  ];

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && userInput.trim()) {
      handleSendWithPreview();
    }
  };

  // Wrapper to show a sent preview bubble then trigger the provided onSendMessage
  const handleSendWithPreview = () => {
    const text = (userInput || '').trim();
    if (!text) return;
    addInlineBubble({ role: 'user', text });
    onSendMessage();
    // Always clear input after sending (works on all pages)
    try { onInputChange(''); } catch (_) {}
  };

  return (
    <>
      {/* The Connect Wallet Modal */}
      <ConnectWalletModalComponent
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
      />

      <div className="relative bottom-0 z-40" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
        {/* Unified Module: AI Input + Navigation Bar */}
        <div className="bg-black/50 backdrop-blur-md border-t border-white/20 relative" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
          {/* Collapse/expand handle */}
          <button
            type="button"
            aria-label={isCollapsed ? 'Expand chat' : 'Collapse chat'}
            onClick={() => setIsCollapsed(prev => !prev)}
            className="absolute -top-3 right-4 w-6 h-6 rounded-full bg-black/70 border border-white/30 flex items-center justify-center"
            style={{ zIndex: 1 }}
          >
            {/* White triangle: down when expanded (to hide), up when collapsed (to show) */}
            {isCollapsed ? (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8l6 8H6l6-8z" />
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 16L6 8h12l-6 8z" />
              </svg>
            )}
          </button>
          {/* Sent bubbles stack (newest at bottom, push older up) */}
          {showInput && !isCollapsed && inlineBubbles.length > 0 && (
            <div className="px-4 pt-3 pb-2 space-y-2" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
              {[...inlineBubbles].slice(-6).map(b => (
                <div key={b.id} className={`flex ${b.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] text-sm px-3.5 py-2.5 rounded-2xl border shadow-lg backdrop-blur-sm ${
                    b.role === 'user'
                      ? 'bg-black/45 text-white border-white/10'
                      : 'bg-green-500/12 text-white border-green-300/25'
                  }`}>
                    {b.text}
                  </div>
                </div>
              ))}
              {/* Thinking indicator while AI is preparing the first chunk */}
              {(isStreamingResponse || isLoading) && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] px-3.5 py-2.5 rounded-2xl border border-green-300/25 bg-green-500/8 shadow-lg backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <img src="/thinking .gif" alt="Thinking" className="h-4 opacity-90" />
                      {isLoading && (
                        <div className="text-white/80 text-xs">
                          {loadingText}...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Searching indicator shown in global chat (instead of center) */}
              {currentAction === 'web_search' && actionStatus === 'in_progress' && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] px-3.5 py-2.5 rounded-2xl border border-blue-300/25 bg-blue-500/10 text-white shadow-lg backdrop-blur-sm text-sm">
                    Searching...
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Show thinking.gif even when there are no bubbles yet */}
          {showInput && !isCollapsed && inlineBubbles.length === 0 && (isStreamingResponse || isLoading) && (
            <div className="px-4 pt-3 pb-2">
              <div className="flex justify-start">
                <div className="max-w-[85%] px-3.5 py-2.5 rounded-2xl border border-green-300/25 bg-green-500/8 shadow-lg backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <img src="/thinking .gif" alt="Thinking" className="h-4 opacity-90" />
                    {isLoading && (
                      <div className="text-white/80 text-xs">
                        {loadingText}...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Removed decorative accent line above input per request */}
          
          {/* AI Input Section */}
          {showInput && !isCollapsed && (
            <div className="px-4 pt-2 pb-3" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={userInput}
                  onChange={(e) => onInputChange(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg text-white text-sm pl-3 pr-12 py-2 focus:outline-none focus:border-white/20"
                  style={{
                    caretColor: 'white'
                  }}
                  placeholder="Ask me anything..."
                />
                {/* Olivia Logo Submit Button */}
                <button
                  onClick={handleSendWithPreview}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/50 hover:bg-green-900/30 transition-colors duration-200 flex items-center justify-center border border-green-300/50 hover:border-green-400"
                  disabled={!userInput.trim()}
                >
                  <img
                    src="/Olivia-ai-LOGO.png"
                    alt="Send"
                    className={`w-4 h-4 ${!userInput.trim() ? 'opacity-50' : 'opacity-100'}`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Thin white line separator */}
          {showInput && !['/', '/home', '/explore', '/plugins', '/profile'].includes(location.pathname) && (
            <div className="border-t border-white/20 mx-4"></div>
          )}
          
          {/* Navigation Bar - Hide on Home, Explore, Plugins, Profile pages */}
          {!['/', '/home', '/explore', '/plugins', '/profile'].includes(location.pathname) && (
            <nav className="safe-bottom" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
              <div className="px-3 py-2" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
                <div className="flex justify-between items-center">
                  {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigation(item.route)}
                      className={`group relative flex flex-col items-center justify-center px-2.5 py-1 transition-all duration-200 active:scale-[0.98] ${
                        item.isActive
                          ? 'text-white'
                          : 'text-white/70 hover:text-white'
                      }`}
                      aria-current={item.isActive ? 'page' : undefined}
                    >
                      <Icon
                        className={`w-5 h-5 mb-0.5 transition-all duration-200 ${
                          item.isActive
                            ? 'text-white drop-shadow-[0_0_6px_rgba(34,197,94,0.6)]'
                            : 'text-white/80 group-hover:text-white'
                        }`}
                      />
                      <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
                      {/* Active underline indicator (keeps height consistent when inactive) */}
                      <span
                        className={`mt-1 h-0.5 w-7 rounded-full transition-colors duration-200 ${
                          item.isActive
                            ? 'bg-gradient-to-r from-green-400 to-blue-400'
                            : 'bg-transparent'
                        }`}
                      />

                      {/* Plugins badge showing enabled plugin count */}
                      {item.id === 'plugins' && (
                        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-green-500 text-black text-[10px] leading-4 text-center font-bold border border-white/30">
                          {pluginCounts.enabled}
                        </span>
                      )}
                    </button>
                  );
                })}
                </div>
              </div>
            </nav>
          )}
        </div>
      </div>
    </>
  );
}
