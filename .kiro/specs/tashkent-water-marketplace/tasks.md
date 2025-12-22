# Implementation Plan: Tashkent Water Marketplace

## Overview

This plan implements the Tashkent Water Marketplace as a Telegram Mini App using React, Vite, Tailwind CSS, Supabase, and Leaflet. Tasks are organized to build incrementally, starting with core infrastructure, then data layer, then UI components, and finally integration.

## Tasks

- [x] 1. Set up project infrastructure and dependencies
  - Install required packages: @supabase/supabase-js, react-router-dom, react-leaflet, leaflet, fast-check (dev)
  - Configure Supabase client with environment variables
  - Set up TypeScript types for domain models (Supplier, Customer, Order, CartItem)
  - Configure Vitest for testing
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 2. Implement Supabase database schema and client
  - [x] 2.1 Create Supabase project and configure tables
    - Create suppliers table with columns: id, name, price, rating, delivery_time_min, delivery_time_max, image_url, is_active, created_at
    - Create customers table with columns: id, telegram_id, name, phone, saved_address, saved_lat, saved_lng, saved_comments, created_at, updated_at
    - Create orders table with columns: id, customer_id, supplier_id, quantity, total_price, address, lat, lng, comments, phone, payment_method, status, created_at, updated_at
    - Add indexes for common queries
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 2.2 Implement Supabase client service layer
    - Create src/services/supabase.ts with client initialization
    - Create src/services/suppliers.ts with getActiveSuppliers(), getSupplierById()
    - Create src/services/customers.ts with getOrCreateCustomer(), updateCustomer()
    - Create src/services/orders.ts with createOrder(), updateOrderStatus(), getOrdersByStatus(), getCustomerOrders()
    - _Requirements: 1.2, 1.3, 3.1, 5.4, 7.2, 8.2, 8.5_

  - [x] 2.3 Write property tests for data persistence
    - **Property 2: Supplier Persistence Round-Trip**
    - **Property 3: Order Persistence Round-Trip**
    - **Validates: Requirements 9.1, 9.2**

- [x] 3. Implement core business logic utilities
  - [x] 3.1 Create cart utilities
    - Create src/utils/cart.ts with calculateTotal(), validateQuantity(), addItem(), removeItem(), updateQuantity()
    - Implement quantity validation (minimum 1)
    - Implement price calculation (quantity * price)
    - _Requirements: 5.1, 5.2_

  - [x] 3.2 Write property tests for cart logic
    - **Property 6: Quantity Validation**
    - **Property 7: Price Calculation**
    - **Validates: Requirements 5.1, 5.2**

  - [x] 3.3 Create order status utilities
    - Create src/utils/orderStatus.ts with isValidTransition(), getNextStatus(), canAcceptOrder(), canCompleteOrder()
    - Implement state machine: received → on_the_way → delivered
    - _Requirements: 5.4, 6.2, 8.2, 8.5_

  - [x] 3.4 Write property tests for order status
    - **Property 8: Order Status State Machine**
    - **Validates: Requirements 5.4, 6.2, 8.2, 8.5**

- [x] 4. Checkpoint - Core logic complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement Telegram WebApp integration
  - [x] 5.1 Create Telegram context and provider
    - Create src/contexts/TelegramContext.tsx
    - Initialize Telegram WebApp SDK (window.Telegram.WebApp)
    - Extract user data from initDataUnsafe
    - Implement requestContact() wrapper for phone sharing
    - Handle development mode without Telegram context
    - _Requirements: 1.1, 1.4, 2.2_

  - [x] 5.2 Create customer initialization hook
    - Create src/hooks/useCustomerInit.ts
    - On app load, get or create customer from Telegram ID
    - Load saved address and phone if available
    - _Requirements: 1.2, 1.3, 2.4, 4.5_

- [x] 6. Implement React Context for app state
  - [x] 6.1 Create AppContext provider
    - Create src/contexts/AppContext.tsx
    - Manage cart state (items, add, remove, update, clear)
    - Manage current customer state
    - Manage current order state for tracking
    - _Requirements: 5.1, 5.2_

  - [x] 6.2 Implement checkout flow logic
    - Create src/hooks/useCheckout.ts
    - Check if phone is required (no saved phone)
    - Pre-populate saved address if available
    - Handle order creation and status updates
    - _Requirements: 2.1, 2.4, 4.5, 5.4_

  - [x] 6.3 Write property tests for checkout logic
    - **Property 9: Phone Prompt Logic**
    - **Property 10: Saved Address Default**
    - **Validates: Requirements 2.1, 2.4, 4.5**

- [x] 7. Build customer UI components
  - [x] 7.1 Create marketplace page
    - Create src/pages/MarketplacePage.tsx
    - Fetch and display active suppliers sorted by rating
    - Create SupplierCard component showing name, price, rating, delivery time
    - Navigate to supplier detail on card click
    - _Requirements: 3.1, 3.2, 3.4_

  - [x] 7.2 Write property tests for supplier display
    - **Property 4: Active Suppliers Filter**
    - **Property 5: Supplier Sorting by Rating**
    - **Validates: Requirements 3.1, 3.4**

  - [x] 7.3 Create supplier detail and cart pages
    - Create src/pages/SupplierDetailPage.tsx with quantity selector and add to cart
    - Create src/pages/CartPage.tsx showing cart items, quantities, totals
    - Create src/components/QuantitySelector.tsx
    - _Requirements: 5.1, 5.2_

  - [x] 7.4 Create checkout page with location picker
    - Create src/pages/CheckoutPage.tsx
    - Create src/components/LocationPicker.tsx using react-leaflet
    - Map centered on Tashkent (41.2995, 69.2401)
    - Draggable marker for location selection
    - Address comment field
    - Phone input (conditional based on saved phone)
    - Payment method selector (Cash / Card Transfer)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.3_

  - [x] 7.5 Create order tracking page
    - Create src/pages/OrderTrackingPage.tsx
    - Display order status stepper (Received → On the Way → Delivered)
    - Show order details (supplier, quantity, address)
    - Subscribe to real-time status updates
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 8. Checkpoint - Customer UI complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Build driver dashboard
  - [x] 9.1 Create driver authentication
    - Create src/pages/DriverLoginPage.tsx with password input
    - Create src/contexts/DriverContext.tsx for auth state
    - Store auth state in session storage
    - Protect driver routes with auth check
    - _Requirements: 7.1_

  - [x] 9.2 Write property tests for driver auth
    - **Property 11: Driver Authentication**
    - **Validates: Requirements 7.1**

  - [x] 9.3 Create order dashboard page
    - Create src/pages/DriverDashboardPage.tsx
    - Fetch orders with status "received"
    - Display order cards with customer info, address, quantity, payment method
    - Subscribe to real-time updates for new orders
    - _Requirements: 7.2, 7.3, 7.4_

  - [x] 9.4 Write property tests for order filtering
    - **Property 12: Received Orders Filter**
    - **Validates: Requirements 7.2**

  - [x] 9.5 Create order detail and actions
    - Create src/pages/DriverOrderDetailPage.tsx
    - Accept button → updates status to "on_the_way"
    - "Open in Yandex Maps" button with coordinates link
    - "Mark as Delivered" button → updates status to "delivered"
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 10. Set up routing and navigation
  - [x] 10.1 Configure React Router
    - Create src/router.tsx with route definitions
    - Customer routes: /, /supplier/:id, /cart, /checkout, /order/:id
    - Driver routes: /driver, /driver/login, /driver/order/:id
    - _Requirements: All_

  - [x] 10.2 Create navigation components
    - Create src/components/Header.tsx with back button and title
    - Create src/components/BottomNav.tsx for customer navigation
    - _Requirements: All_

- [x] 11. Implement real-time subscriptions
  - [x] 11.1 Add Supabase real-time for order tracking
    - Subscribe to order status changes in OrderTrackingPage
    - Subscribe to new orders in DriverDashboardPage
    - Handle subscription cleanup on unmount
    - _Requirements: 6.3, 7.4_

- [x] 12. Final integration and polish
  - [x] 12.1 Wire all components together
    - Wrap App with TelegramProvider, SupabaseProvider, AppProvider
    - Add error boundaries and loading states
    - Add Tailwind styling for Telegram Mini App look
    - _Requirements: All_

  - [x] 12.2 Add seed data for testing
    - Create seed script for sample suppliers (Hydrolife, Nestle, Aquafresh)
    - Document Supabase setup steps in README
    - _Requirements: 3.1_

- [x] 13. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Supabase project setup (task 2.1) requires manual steps in Supabase dashboard
- Telegram Mini App testing requires deployment and bot configuration
- Leaflet CSS must be imported for map to display correctly
- Driver password should be configured via environment variable
