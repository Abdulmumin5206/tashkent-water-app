import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import WelcomeToast from './WelcomeToast';

/**
 * CustomerLayout wraps customer pages with the bottom navigation
 * 
 * This layout provides:
 * - Bottom navigation bar for customer pages
 * - Padding at the bottom to account for the fixed nav bar
 * - Welcome back toast for returning users (Requirements 1.4)
 * 
 * Requirements: All - Provides consistent layout for customer pages
 */
const CustomerLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <WelcomeToast />
      <Outlet />
      <BottomNav />
    </div>
  );
};

export default CustomerLayout;
