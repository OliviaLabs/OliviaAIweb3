import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { log } from '../utils/logger.js';

const AuthContext = createContext(null);

export function AuthProviderLogin({ children }) {
  // Initialize state from localStorage
  const [userAuthenticated, setUserAuthenticated] = useState(() => {
    try {
      const stored = localStorage.getItem('olivia_auth_authenticated');
      return stored === 'true';
    } catch {
      return false;
    }
  });
  
  const [userData, setUserData] = useState(() => {
    try {
      const stored = localStorage.getItem('olivia_auth_user_data');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  
  const [telegramUser, setTelegramUser] = useState(() => {
    try {
      const stored = localStorage.getItem('olivia_auth_telegram_user');
      return stored === 'true';
    } catch {
      return false;
    }
  });
  
  const [isGuestUser, setIsGuestUser] = useState(() => {
    try {
      const stored = localStorage.getItem('olivia_auth_is_guest');
      return stored === 'true';
    } catch {
      return false;
    }
  });


  // Persist auth state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('olivia_auth_authenticated', userAuthenticated.toString());
    } catch (err) {
      console.warn('Failed to save auth state to localStorage:', err);
    }
  }, [userAuthenticated]);

  useEffect(() => {
    try {
      if (userData) {
        localStorage.setItem('olivia_auth_user_data', JSON.stringify(userData));
      } else {
        localStorage.removeItem('olivia_auth_user_data');
      }
    } catch (err) {
      console.warn('Failed to save user data to localStorage:', err);
    }
  }, [userData]);

  useEffect(() => {
    try {
      localStorage.setItem('olivia_auth_telegram_user', telegramUser.toString());
    } catch (err) {
      console.warn('Failed to save telegram user state to localStorage:', err);
    }
  }, [telegramUser]);

  useEffect(() => {
    try {
      localStorage.setItem('olivia_auth_is_guest', isGuestUser.toString());
    } catch (err) {
      console.warn('Failed to save guest user state to localStorage:', err);
    }
  }, [isGuestUser]);

  // Log auth state changes for debugging
  useEffect(() => {
    log('🔐 AuthContext state changed:', { 
      userAuthenticated, 
      userData: userData?.user_id, 
      telegramUser, 
      isGuestUser 
    });
    
    // Debug localStorage
    console.log('🔐 localStorage check:', {
      authenticated: localStorage.getItem('olivia_auth_authenticated'),
      userData: localStorage.getItem('olivia_auth_user_data'),
      telegram: localStorage.getItem('olivia_auth_telegram_user'),
      guest: localStorage.getItem('olivia_auth_is_guest')
    });
  }, [userAuthenticated, userData, telegramUser, isGuestUser]);

  // Guest login function
  const loginAsGuest = () => {
    setIsGuestUser(true);
    setUserAuthenticated(false);
    setUserData({
      user_id: 'guest_user',
      first_name: 'Guest',
      last_name: 'User',
      email: 'guest@example.com',
      is_guest: true
    });
  };

  // Logout function
  const logout = () => {
    setUserAuthenticated(false);
    setUserData(null);
    setTelegramUser(false);
    setIsGuestUser(false);
    
    // Clear localStorage
    try {
      localStorage.removeItem('olivia_auth_authenticated');
      localStorage.removeItem('olivia_auth_user_data');
      localStorage.removeItem('olivia_auth_telegram_user');
      localStorage.removeItem('olivia_auth_is_guest');
      log('🔐 Cleared auth data from localStorage');
    } catch (err) {
      console.warn('Failed to clear auth data from localStorage:', err);
    }
  };

  const value = useMemo(() => ({
    userAuthenticated,
    setUserAuthenticated,
    userData,
    setUserData,
    telegramUser,
    setTelegramUser,
    isGuestUser,
    setIsGuestUser,
    loginAsGuest,
    logout
  }), [userAuthenticated, userData, telegramUser, isGuestUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProviderLogin.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    console.error('useAuth must be used within an AuthProviderLogin');
    // Return a fallback context to prevent crashes
    return {
      userAuthenticated: false,
      setUserAuthenticated: () => {},
      userData: null,
      setUserData: () => {},
      telegramUser: false,
      setTelegramUser: () => {},
      isGuestUser: false,
      setIsGuestUser: () => {},
      loginAsGuest: () => {},
      logout: () => {}
    };
  }
  return context;
};
