import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  showBadge?: boolean;
}

/**
 * Calculates the total number of items in the cart
 * @param cart - Array of cart items with quantities
 * @returns Sum of all item quantities
 */
export function calculateCartBadgeCount(cart: { quantity: number }[]): number {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Determines if the active order badge should be shown
 * @param hasActiveOrder - Whether there is an active order
 * @returns true if badge should be visible
 */
export function shouldShowActiveOrderBadge(hasActiveOrder: boolean): boolean {
  return hasActiveOrder;
}

/**
 * BottomNav component for customer navigation
 * 
 * Provides navigation between main customer pages:
 * - Home (Marketplace)
 * - Orders (Order History) - with badge for active orders
 * - Cart - with item count badge
 * - Profile (Account Settings)
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */
const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, hasActiveOrder } = useApp();

  // Calculate total items in cart (Requirements 4.3)
  const cartItemCount = calculateCartBadgeCount(cart);

  const navItems: NavItem[] = [
    {
      path: '/',
      label: 'Главная',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
          />
        </svg>
      ),
    },
    {
      path: '/orders',
      label: 'Заказы',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" 
          />
        </svg>
      ),
      // Show badge when there's an active order (Requirements 4.4)
      showBadge: shouldShowActiveOrderBadge(hasActiveOrder),
    },
    {
      path: '/cart',
      label: 'Корзина',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" 
          />
        </svg>
      ),
      // Show cart item count badge (Requirements 4.3)
      badge: cartItemCount > 0 ? cartItemCount : undefined,
    },
    {
      path: '/profile',
      label: 'Профиль',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
          />
        </svg>
      ),
    },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname.startsWith('/supplier');
    }
    return location.pathname.startsWith(path);
  };

  // Don't show bottom nav on checkout, order tracking, or driver pages (Requirements 4.5)
  const hiddenPaths = ['/checkout', '/order', '/driver'];
  const shouldHide = hiddenPaths.some(path => location.pathname.startsWith(path));
  
  // Hide on cart page when there are items (to show checkout button)
  const isCartWithItems = location.pathname === '/cart' && cartItemCount > 0;
  
  if (shouldHide || isCartWithItems) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full relative transition-colors ${
                active ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="relative">
                {item.icon}
                {/* Numeric badge for cart count (Requirements 4.3) */}
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
                {/* Dot badge for active orders (Requirements 4.4) */}
                {item.showBadge && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 rounded-full w-3 h-3" />
                )}
              </div>
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
