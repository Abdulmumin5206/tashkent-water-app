# Implementation Plan: Marketplace Enhancements

## Overview

This plan implements session persistence, order history, account settings, enhanced supplier dashboard, and UI/UX improvements for the Tashkent Water Marketplace. Tasks are organized to build incrementally, starting with data layer changes, then core utilities, then UI components.

## Tasks

- [x] 1. Extend database schema and types
  - [x] 1.1 Update database schema for order cancellation
    - Add cancellation_reason TEXT column to orders table
    - Add cancelled_at TIMESTAMPTZ column to orders table
    - Update status check constraint to include 'cancelled'
    - Add index for order history queries (customer_id, created_at DESC)
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 1.2 Update TypeScript types
    - Extend OrderStatus type to include 'cancelled'
    - Add cancellation_reason and cancelled_at to Order interface
    - Add PersistedCart, DailySummary, OrderTab interfaces
    - _Requirements: 10.1_

- [x] 2. Implement cart persistence utilities
  - [x] 2.1 Create cart storage utilities
    - Create src/utils/cartStorage.ts
    - Implement saveCart(cart: CartItem[]): void
    - Implement loadCart(): CartItem[] | null
    - Implement clearPersistedCart(): void
    - Handle localStorage errors gracefully
    - _Requirements: 1.1, 1.2, 1.5_

  - [x] 2.2 Write property test for cart persistence
    - **Property 1: Cart Persistence Round-Trip**
    - **Validates: Requirements 1.1, 1.2, 1.5**

- [x] 3. Extend order status utilities
  - [x] 3.1 Update order status state machine
    - Update src/utils/orderStatus.ts to support 'cancelled' status
    - Add isValidTransition() support for received → cancelled
    - Add canCancelOrder(status: OrderStatus): boolean
    - Add isActiveOrder(status: OrderStatus): boolean
    - Add isTerminalStatus(status: OrderStatus): boolean
    - _Requirements: 10.4, 10.5, 1.3_

  - [x] 3.2 Write property test for extended status state machine
    - **Property 14: Extended Order Status State Machine**
    - **Validates: Requirements 10.4, 10.5**

  - [x] 3.3 Write property test for active order detection
    - **Property 2: Active Order Detection**
    - **Validates: Requirements 1.3**

- [x] 4. Implement order service extensions
  - [x] 4.1 Add order history and cancellation services
    - Add getCustomerOrderHistory(customerId: string): Promise<Order[]> to orders.ts
    - Add cancelOrder(orderId: string, reason: string): Promise<Order> to orders.ts
    - Add getOrderCountsByStatus(supplierId?: string): Promise<Record<OrderStatus, number>>
    - Ensure order history returns sorted by created_at DESC
    - _Requirements: 2.1, 6.3, 5.6_

  - [x] 4.2 Write property test for order history sorting
    - **Property 3: Order History Sorting**
    - **Validates: Requirements 2.1**

  - [x] 4.3 Write property test for order status filtering
    - **Property 10: Order Status Filtering**
    - **Validates: Requirements 5.2, 5.3, 5.4, 5.5**

  - [x] 4.4 Write property test for cancellation data persistence
    - **Property 13: Cancellation Data Persistence**
    - **Validates: Requirements 6.3, 10.2, 10.3**

- [x] 5. Checkpoint - Core utilities complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement supplier analytics utilities
  - [x] 6.1 Create analytics calculation utilities
    - Create src/utils/analytics.ts
    - Implement calculateDailySummary(orders: Order[], date: Date): DailySummary
    - Implement getOrderCountByStatus(orders: Order[]): Record<OrderStatus, number>
    - _Requirements: 7.2, 5.6_

  - [x] 6.2 Write property test for daily summary calculations
    - **Property 15: Daily Summary Calculations**
    - **Validates: Requirements 7.2**

  - [x] 6.3 Write property test for order count by status
    - **Property 11: Order Count by Status**
    - **Validates: Requirements 5.6**

- [x] 7. Implement reorder functionality
  - [x] 7.1 Create reorder utility
    - Create src/utils/reorder.ts
    - Implement createReorderCart(order: Order, supplier: Supplier): CartItem[]
    - _Requirements: 2.4_

  - [x] 7.2 Write property test for reorder cart equivalence
    - **Property 5: Reorder Cart Equivalence**
    - **Validates: Requirements 2.4**

- [x] 8. Enhance AppContext with persistence
  - [x] 8.1 Update AppContext for cart persistence
    - Load cart from localStorage on initialization
    - Save cart to localStorage on every cart change
    - Clear persisted cart after successful order placement
    - Add activeOrder state tracking
    - _Requirements: 1.1, 1.2, 1.5, 1.3_

  - [x] 8.2 Add order history to context
    - Add orderHistory state
    - Add fetchOrderHistory() function
    - Add reorderFromHistory(order: Order) function
    - _Requirements: 2.1, 2.4_

- [x] 9. Create shared UI components
  - [x] 9.1 Create StatusBadge component
    - Create src/components/StatusBadge.tsx
    - Map each status to color and label
    - Support all 4 statuses: received, on_the_way, delivered, cancelled
    - _Requirements: 2.5_

  - [x] 9.2 Write property test for status badge mapping
    - **Property 6: Status Badge Mapping**
    - **Validates: Requirements 2.5**

  - [x] 9.3 Create SkeletonLoader component
    - Create src/components/SkeletonLoader.tsx
    - Support card, list, and text variants
    - _Requirements: 8.5_

  - [x] 9.4 Create EmptyState component
    - Create src/components/EmptyState.tsx
    - Support icon, title, description, and action button
    - _Requirements: 8.1_

- [x] 10. Checkpoint - Utilities and shared components complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Build enhanced bottom navigation
  - [x] 11.1 Update BottomNav component
    - Add 4 tabs: Home, Orders, Cart, Profile
    - Add badge for cart item count
    - Add badge for active orders
    - Highlight active tab
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 11.2 Write property test for cart badge count
    - **Property 8: Cart Badge Count**
    - **Validates: Requirements 4.3**

  - [x] 11.3 Write property test for active order badge
    - **Property 9: Active Order Badge**
    - **Validates: Requirements 4.4**

- [x] 12. Build order history page
  - [x] 12.1 Create OrderHistoryPage
    - Create src/pages/OrderHistoryPage.tsx
    - Fetch and display customer order history
    - Show order cards with date, supplier, quantity, price, status
    - Navigate to order detail on tap
    - Add reorder button for completed orders
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 12.2 Write property test for order display fields
    - **Property 4: Order Display Fields**
    - **Validates: Requirements 2.2**

- [x] 13. Build account settings page
  - [x] 13.1 Create AccountSettingsPage
    - Create src/pages/AccountSettingsPage.tsx
    - Display profile info (name, Telegram username)
    - Editable phone number field
    - Editable saved address with map picker
    - Save changes to database
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 13.2 Write property test for customer update round-trip
    - **Property 7: Customer Update Round-Trip**
    - **Validates: Requirements 3.4**

- [x] 14. Enhance supplier dashboard
  - [x] 14.1 Add order tabs to supplier dashboard
    - Update src/pages/DriverDashboardPage.tsx
    - Add tab navigation: New, In Progress, Completed, Cancelled
    - Filter orders by selected tab status
    - Show order count badges on each tab
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 14.2 Add analytics summary card
    - Create AnalyticsSummaryCard component
    - Display today's total orders, completed, revenue
    - Subscribe to real-time updates
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 14.3 Add order cancellation functionality
    - Add cancel button to order cards (received status only)
    - Create CancelOrderModal with reason input
    - Call cancelOrder service on confirm
    - Update UI optimistically
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 14.4 Write property test for cancellation availability
    - **Property 12: Cancellation Availability**
    - **Validates: Requirements 6.1, 6.5**

- [x] 15. Checkpoint - New pages complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. UI/UX improvements
  - [x] 16.1 Enhance MarketplacePage UI
    - Improve supplier card design with better shadows and spacing
    - Add skeleton loaders during fetch
    - Ensure consistent card heights
    - _Requirements: 8.1, 8.2, 8.3, 9.1, 9.2, 9.3, 9.5_

  - [x] 16.2 Enhance SupplierCard component
    - Improve visual hierarchy (price, rating, delivery time)
    - Add subtle animations on hover/tap
    - Handle unavailable suppliers with reduced opacity
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 16.3 Update global styles
    - Ensure consistent spacing (8px grid)
    - Update color palette for cohesion
    - Add smooth transitions for state changes
    - Ensure minimum 44px touch targets
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 16.4 Add welcome back message
    - Show brief toast/banner on app open for returning users
    - Display customer name in welcome message
    - Auto-dismiss after 3 seconds
    - _Requirements: 1.4_

- [x] 17. Update routing
  - [x] 17.1 Add new routes
    - Add /orders route for OrderHistoryPage
    - Add /profile route for AccountSettingsPage
    - Update CustomerLayout to include new pages
    - _Requirements: All_

- [x] 18. Final integration and testing
  - [x] 18.1 Wire all components together
    - Ensure cart persistence works across page reloads
    - Test order cancellation flow end-to-end
    - Verify real-time updates in supplier dashboard
    - Test reorder functionality
    - _Requirements: All_

  - [x] 18.2 Update seed data
    - Add sample orders with various statuses for testing
    - Include cancelled orders with reasons
    - _Requirements: All_

- [x] 19. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Database migration (task 1.1) requires running SQL against Supabase
- Cart persistence uses localStorage which may not be available in all contexts
- All property tests are required for comprehensive correctness validation
- UI improvements should maintain the existing minimalist aesthetic while enhancing usability
