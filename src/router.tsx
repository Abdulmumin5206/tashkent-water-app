import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import {
  MarketplacePage,
  SupplierDetailPage,
  CartPage,
  CheckoutPage,
  OrderTrackingPage,
  OrderHistoryPage,
  AccountSettingsPage,
  DriverLoginPage,
  DriverDashboardPage,
  DriverOrderDetailPage,
} from './pages';
import { ProtectedDriverRoute, CustomerLayout } from './components';

/**
 * Router configuration for Tashkent Water Marketplace
 * 
 * Customer routes:
 * - / : Marketplace page (browse suppliers)
 * - /supplier/:id : Supplier detail page
 * - /cart : Shopping cart
 * - /orders : Order history
 * - /profile : Account settings
 * - /checkout : Checkout with location picker
 * - /order/:id : Order tracking
 * 
 * Driver routes (password protected):
 * - /driver : Driver dashboard (shows received orders)
 * - /driver/login : Driver login page
 * - /driver/order/:id : Order detail with actions
 * 
 * Requirements: All
 */

const router = createBrowserRouter([
  // Customer routes with bottom navigation
  {
    element: <CustomerLayout />,
    children: [
      {
        path: '/',
        element: <MarketplacePage />,
      },
      {
        path: '/supplier/:id',
        element: <SupplierDetailPage />,
      },
      {
        path: '/cart',
        element: <CartPage />,
      },
      {
        path: '/orders',
        element: <OrderHistoryPage />,
      },
      {
        path: '/profile',
        element: <AccountSettingsPage />,
      },
    ],
  },
  // Customer routes without bottom navigation
  {
    path: '/checkout',
    element: <CheckoutPage />,
  },
  {
    path: '/order/:id',
    element: <OrderTrackingPage />,
  },
  // Driver routes
  {
    path: '/driver/login',
    element: <DriverLoginPage />,
  },
  {
    path: '/driver',
    element: (
      <ProtectedDriverRoute>
        <DriverDashboardPage />
      </ProtectedDriverRoute>
    ),
  },
  {
    path: '/driver/order/:id',
    element: (
      <ProtectedDriverRoute>
        <DriverOrderDetailPage />
      </ProtectedDriverRoute>
    ),
  },
]);

export { router, RouterProvider };
