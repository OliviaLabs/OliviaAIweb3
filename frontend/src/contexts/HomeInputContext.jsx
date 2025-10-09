import React, { createContext, useContext, useState, useRef } from 'react';

const HomeInputContext = createContext();

export const HomeInputProvider = ({ children }) => {
  const [showInput, setShowInput] = useState(false);
  const [userInput, setUserInput] = useState('');
  const inputRef = useRef(null);
  const handleSendMessageRef = useRef(null);
  const [inlineBubbles, setInlineBubbles] = useState([]); // [{id, role: 'user'|'ai', text, ts}]
  const aiBubbleIdRef = useRef(null);

  const addInlineBubble = (bubble) => {
    const { role, text } = bubble || {};
    if (!text || !role) return;
    const newBubble = {
      id: Date.now() + Math.random(),
      role,
      text,
      ts: Date.now()
    };
    // Keep last 20 bubbles
    setInlineBubbles((prev) => [...prev, newBubble].slice(-20));
  };

  const clearInlineBubbles = () => setInlineBubbles([]);

  // Streaming AI bubble helpers
  const beginAIBubble = () => {
    const id = Date.now() + Math.random();
    aiBubbleIdRef.current = id;
    setInlineBubbles((prev) => [...prev, { id, role: 'ai', text: '', ts: Date.now() }].slice(-20));
    return id;
  };

  const appendToAIBubble = (text) => {
    if (!text) return;
    const id = aiBubbleIdRef.current;
    if (!id) return;
    setInlineBubbles((prev) => prev.map((b) => (b.id === id ? { ...b, text: (b.text || '') + text } : b)));
  };

  const setAIBubbleText = (text) => {
    const id = aiBubbleIdRef.current;
    if (!id) return;
    setInlineBubbles((prev) => prev.map((b) => (b.id === id ? { ...b, text } : b)));
  };

  const endAIBubble = () => {
    aiBubbleIdRef.current = null;
  };

  const value = {
    showInput,
    setShowInput,
    userInput,
    setUserInput,
    inputRef,
    handleSendMessageRef,
    inlineBubbles,
    addInlineBubble,
    clearInlineBubbles,
    beginAIBubble,
    appendToAIBubble,
    setAIBubbleText,
    endAIBubble
  };

  return (
    <HomeInputContext.Provider value={value}>
      {children}
    </HomeInputContext.Provider>
  );
};

export const useHomeInput = () => {
  const context = useContext(HomeInputContext);
  if (!context) {
    return {
      showInput: false,
      setShowInput: () => {},
      userInput: '',
      setUserInput: () => {},
      inputRef: { current: null },
      handleSendMessageRef: { current: null }
    };
  }
  return context;
};

