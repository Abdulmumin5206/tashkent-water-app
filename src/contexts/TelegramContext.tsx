import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { TelegramUser, TelegramWebApp, TelegramContextValue } from '../types';

// Extend Window interface to include Telegram
declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

// Default context value
const defaultContextValue: TelegramContextValue = {
  user: null,
  webApp: null,
  isReady: false,
  requestContact: async () => null,
};

// Create context
const TelegramContext = createContext<TelegramContextValue>(defaultContextValue);

// Development mode mock user for testing without Telegram
const DEV_MOCK_USER: TelegramUser = {
  id: 123456789,
  first_name: 'Dev',
  last_name: 'User',
  username: 'devuser',
};

interface TelegramProviderProps {
  children: ReactNode;
}

export const TelegramProvider: React.FC<TelegramProviderProps> = ({ children }) => {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if running inside Telegram WebApp
    const tgWebApp = window.Telegram?.WebApp;

    if (tgWebApp) {
      // Initialize Telegram WebApp
      tgWebApp.ready();
      tgWebApp.expand();

      // Extract user data from initDataUnsafe
      const tgUser = tgWebApp.initDataUnsafe?.user;
      
      if (tgUser) {
        setUser(tgUser);
      }
      
      setWebApp(tgWebApp);
      setIsReady(true);
    } else {
      // Development mode - use mock user
      console.warn('Telegram WebApp not available. Running in development mode with mock user.');
      setUser(DEV_MOCK_USER);
      setIsReady(true);
    }
  }, []);

  // Wrapper for requestContact that returns a Promise
  const requestContact = useCallback(async (): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!webApp) {
        // In development mode, return a mock phone number
        console.warn('requestContact called in development mode. Returning mock phone.');
        resolve('+998901234567');
        return;
      }

      try {
        webApp.requestContact((sent: boolean) => {
          if (sent) {
            // Note: The actual phone number comes through a different mechanism
            // (bot receives it via message). Here we just confirm the request was sent.
            // The phone will be extracted from the bot's received contact message.
            resolve('contact_shared');
          } else {
            resolve(null);
          }
        });
      } catch (error) {
        console.error('Error requesting contact:', error);
        resolve(null);
      }
    });
  }, [webApp]);

  const contextValue: TelegramContextValue = {
    user,
    webApp,
    isReady,
    requestContact,
  };

  return (
    <TelegramContext.Provider value={contextValue}>
      {children}
    </TelegramContext.Provider>
  );
};

// Custom hook to use Telegram context
export const useTelegram = (): TelegramContextValue => {
  const context = useContext(TelegramContext);
  if (!context) {
    throw new Error('useTelegram must be used within a TelegramProvider');
  }
  return context;
};

export default TelegramContext;
