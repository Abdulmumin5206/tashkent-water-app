import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';

const WELCOME_SHOWN_KEY = 'tashkent_water_welcome_shown';
const WELCOME_DURATION = 3000; // 3 seconds

/**
 * WelcomeToast displays a brief welcome back message for returning users
 * 
 * Requirements: 1.4
 * - WHEN a returning customer opens the app, THE System SHALL display 
 *   a brief welcome back message with their name
 * - Auto-dismiss after 3 seconds
 */
const WelcomeToast: React.FC = () => {
  const { customer, isCustomerLoading } = useApp();
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Don't show while loading
    if (isCustomerLoading) return;
    
    // Only show for returning users with a name
    if (!customer?.name) return;

    // Check if we've already shown the welcome message this session
    const sessionKey = `${WELCOME_SHOWN_KEY}_${Date.now().toString().slice(0, -5)}`; // Roughly per 100 seconds
    const alreadyShown = sessionStorage.getItem(WELCOME_SHOWN_KEY);
    
    if (alreadyShown) return;

    // Mark as shown for this session
    sessionStorage.setItem(WELCOME_SHOWN_KEY, 'true');
    
    // Show the toast
    setIsVisible(true);

    // Auto-dismiss after 3 seconds
    const dismissTimer = setTimeout(() => {
      setIsExiting(true);
      // Remove from DOM after animation completes
      setTimeout(() => {
        setIsVisible(false);
        setIsExiting(false);
      }, 200);
    }, WELCOME_DURATION);

    return () => {
      clearTimeout(dismissTimer);
    };
  }, [customer, isCustomerLoading]);

  if (!isVisible) return null;

  return (
    <div
      className={`
        fixed top-0 left-0 right-0 z-50 p-4 pt-safe
        ${isExiting ? 'toast-exit' : 'toast-enter'}
      `}
    >
      <div className="max-w-md mx-auto bg-blue-600 text-white rounded-xl shadow-lg px-4 py-3 flex items-center gap-3">
        <span className="text-2xl">👋</span>
        <div className="flex-1">
          <p className="font-medium">С возвращением, {customer?.name}!</p>
          <p className="text-sm text-blue-100">Рады видеть вас снова</p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeToast;
