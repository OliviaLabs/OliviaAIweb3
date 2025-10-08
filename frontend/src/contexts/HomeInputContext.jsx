import React, { createContext, useContext, useState, useRef } from 'react';

const HomeInputContext = createContext();

export const HomeInputProvider = ({ children }) => {
  const [showInput, setShowInput] = useState(false);
  const [userInput, setUserInput] = useState('');
  const inputRef = useRef(null);
  const handleSendMessageRef = useRef(null);

  const value = {
    showInput,
    setShowInput,
    userInput,
    setUserInput,
    inputRef,
    handleSendMessageRef
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

