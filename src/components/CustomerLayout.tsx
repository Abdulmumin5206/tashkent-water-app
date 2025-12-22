import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

/**
 * CustomerLayout wraps customer pages with the bottom navigation
 * 
 * This layout provides:
 * - Bottom navigation bar for customer pages
 * - Padding at the bottom to account for the fixed nav bar
 * 
 * Requirements: All - Provides consistent layout for customer pages
 */
const CustomerLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <Outlet />
      <BottomNav />
    </div>
  );
};

export default CustomerLayout;
