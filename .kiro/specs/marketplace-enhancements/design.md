# Design Document: Marketplace Enhancements

## Overview

This document describes the technical design for enhancing the Tashkent Water Marketplace with session persistence, order history, account management, supplier dashboard improvements, and UI/UX refinements. The enhancements build upon the existing React/Vite/Tailwind/Supabase architecture.

The design focuses on:
1. Local storage integration for session persistence
2. New pages and components for order history and account settings
3. Extended supplier dashboard with order tabs and analytics
4. Order cancellation workflow with extended status support
5. Modern minimalist UI patterns with improved navigation

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Enhanced App Structure                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   React Application                    │  │
│  │                                                        │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │              Enhanced Navigation                 │  │  │
│  │  │  [Home] [Orders] [Cart] [Profile]               │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │                                                        │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │  │
│  │  │  Customer    │ │   Order      │ │   Account    │  │  │
│  │  │  Pages       │ │   History    │ │   Settings   │  │  │
│  │  └──────────────┘ └──────────────┘ └──────────────┘  │  │
│  │                                                        │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │           Supplier Dashboard                     │  │  │
│  │  │  [New] [In Progress] [Completed] [Cancelled]    │  │  │
│  │  │  ┌─────────────────────────────────────────┐    │  │  │
│  │  │  │         Analytics Summary Card          │    │  │  │
│  │  │  └─────────────────────────────────────────┘    │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │                                                        │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │              State Management                    │  │  │
│  │  │  ┌────────────┐ ┌────────────┐ ┌────────────┐  │  │  │
│  │  │  │ AppContext │ │LocalStorage│ │  Supabase  │  │  │  │
│  │  │  │ (enhanced) │ │ Persistence│ │  Realtime  │  │  │  │
│  │  │  └────────────┘ └────────────┘ └────────────┘  │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### New Component Hierarchy

```
App (enhanced)
├── CustomerLayout (new)
│   ├── BottomNav (enhanced - 4 tabs)
│   └── Routes
│       ├── MarketplacePage (enhanced UI)
│       ├── OrderHistoryPage (new)
│       │   └── OrderHistoryCard
│       ├── AccountSettingsPage (new)
│       │   ├── ProfileSection
│       │   ├── AddressSection
│       │   └── PhoneSection
│       └── ... existing pages
│
├── SupplierDashboard (enhanced)
│   ├── AnalyticsSummaryCard (new)
│   ├── OrderTabs (new)
│   │   ├── NewOrdersTab
│   │   ├── InProgressTab
│   │   ├── CompletedTab
│   │   └── CancelledTab
│   └── OrderCard (enhanced)
│       └── CancelOrderModal (new)
│
└── SharedComponents
    ├── SkeletonLoader (new)
    ├── StatusBadge (new)
    └── EmptyState (new)
```

### Key Interfaces

```typescript
// Extended Order Status
export type OrderStatus = 'received' | 'on_the_way' | 'delivered' | 'cancelled';

// Extended Order type
export interface Order {
  id: string;
  customer_id: string;
  supplier_id: string;
  quantity: number;
  total_price: number;
  address: string;
  lat: number;
  lng: number;
  comments?: string;
  phone: string;
  payment_method: PaymentMethod;
  status: OrderStatus;
  cancellation_reason?: string;
  cancelled_at?: string;
  created_at?: string;
  updated_at?: string;
}

// Cart persistence
export interface PersistedCart {
  items: CartItem[];
  lastUpdated: string;
}

// Analytics summary
export interface DailySummary {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  date: string;
}

// Order filter tabs
export type OrderTab = 'new' | 'in_progress' | 'completed' | 'cancelled';

// Tab to status mapping
export const TAB_STATUS_MAP: Record<OrderTab, OrderStatus> = {
  new: 'received',
  in_progress: 'on_the_way',
  completed: 'delivered',
  cancelled: 'cancelled',
};
```

### Local Storage Schema

```typescript
// Keys for local storage
const STORAGE_KEYS = {
  CART: 'tashkent_water_cart',
  LAST_ORDER_ID: 'tashkent_water_last_order',
  WELCOME_SHOWN: 'tashkent_water_welcome_shown',
};

// Cart storage format
interface StoredCart {
  items: Array<{
    supplierId: string;
    supplierName: string;
    price: number;
    quantity: number;
  }>;
  timestamp: number;
}
```

## Data Models

### Database Schema Changes

```sql
-- Add cancellation fields to orders table
ALTER TABLE orders 
ADD COLUMN cancellation_reason TEXT,
ADD COLUMN cancelled_at TIMESTAMPTZ;

-- Update status check constraint
ALTER TABLE orders 
DROP CONSTRAINT orders_status_check,
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('received', 'on_the_way', 'delivered', 'cancelled'));

-- Index for order history queries
CREATE INDEX idx_orders_customer_created ON orders(customer_id, created_at DESC);
```

### Extended State Machine

```
                    ┌─────────────┐
                    │  received   │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            │            ▼
       ┌─────────────┐     │     ┌─────────────┐
       │  cancelled  │     │     │ on_the_way  │
       └─────────────┘     │     └──────┬──────┘
                           │            │
                           │            ▼
                           │     ┌─────────────┐
                           │     │  delivered  │
                           │     └─────────────┘
                           │
Valid transitions:
- received → on_the_way
- received → cancelled
- on_the_way → delivered
- cancelled → (none - terminal state)
- delivered → (none - terminal state)
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Cart Persistence Round-Trip

*For any* valid cart state (list of items with suppliers and quantities), saving to local storage and then restoring should produce an equivalent cart with the same items and quantities.

**Validates: Requirements 1.1, 1.2, 1.5**

### Property 2: Active Order Detection

*For any* order, the order is considered "active" if and only if its status is neither "delivered" nor "cancelled". The active order detection function should correctly identify active orders.

**Validates: Requirements 1.3**

### Property 3: Order History Sorting

*For any* list of orders returned from the order history query, the list should be sorted by created_at in descending order (newest first).

**Validates: Requirements 2.1**

### Property 4: Order Display Fields

*For any* order displayed in the history list, the rendered output should contain: order date, supplier name, quantity, total price, and status.

**Validates: Requirements 2.2**

### Property 5: Reorder Cart Equivalence

*For any* completed order, using the reorder function should produce a cart containing the same supplier and quantity as the original order.

**Validates: Requirements 2.4**

### Property 6: Status Badge Mapping

*For any* order status, the status badge function should return a consistent visual representation (color and label) that matches the status.

**Validates: Requirements 2.5**

### Property 7: Customer Update Round-Trip

*For any* valid customer profile update (phone, address, coordinates, comments), saving to the database and then retrieving should produce equivalent customer data.

**Validates: Requirements 3.4**

### Property 8: Cart Badge Count

*For any* cart state, the badge count should equal the sum of all item quantities in the cart.

**Validates: Requirements 4.3**

### Property 9: Active Order Badge

*For any* set of customer orders, the orders badge should be visible if and only if there exists at least one order with status "received" or "on_the_way".

**Validates: Requirements 4.4**

### Property 10: Order Status Filtering

*For any* set of orders and any status filter, the filtered result should contain only orders matching that exact status, and should contain all orders with that status.

**Validates: Requirements 5.2, 5.3, 5.4, 5.5**

### Property 11: Order Count by Status

*For any* set of orders, the count for each status tab should equal the number of orders with that status.

**Validates: Requirements 5.6**

### Property 12: Cancellation Availability

*For any* order, cancellation should be allowed if and only if the order status is "received". Orders with status "on_the_way", "delivered", or "cancelled" should not be cancellable.

**Validates: Requirements 6.1, 6.5**

### Property 13: Cancellation Data Persistence

*For any* order cancellation with a reason, after cancellation the order should have status "cancelled", a non-null cancellation_reason, and a non-null cancelled_at timestamp.

**Validates: Requirements 6.3, 10.2, 10.3**

### Property 14: Extended Order Status State Machine

*For any* order status transition, the transition is valid if and only if it follows the extended state machine rules:
- "received" can transition to "on_the_way" or "cancelled"
- "on_the_way" can transition to "delivered"
- "delivered" and "cancelled" are terminal states (no transitions allowed)

**Validates: Requirements 10.4, 10.5**

### Property 15: Daily Summary Calculations

*For any* set of orders for a given date, the daily summary should correctly calculate:
- totalOrders = count of all orders created on that date
- completedOrders = count of orders with status "delivered"
- totalRevenue = sum of total_price for delivered orders

**Validates: Requirements 7.2**

## Error Handling

### Local Storage Errors

- Handle localStorage quota exceeded by clearing old data
- Gracefully degrade if localStorage is unavailable (private browsing)
- Validate stored data structure before restoring cart

### Order Cancellation Errors

- Prevent race conditions with optimistic UI updates and server validation
- Handle concurrent cancellation attempts gracefully
- Show clear error messages if cancellation fails

### Network Errors

- Show skeleton loaders during data fetches
- Implement retry logic for failed requests
- Cache order history for offline viewing

## Testing Strategy

### Unit Tests

Unit tests will verify specific examples and edge cases:

- Cart serialization/deserialization edge cases
- Status badge color mapping for all statuses
- Daily summary calculation with empty data
- Order filtering with mixed statuses
- Cancellation validation for each status

### Property-Based Tests

Property-based tests will use **fast-check** library to verify universal properties across generated inputs. Each property test should run minimum 100 iterations.

Test file organization:
- `src/__tests__/cartPersistence.property.test.ts` - Cart storage properties
- `src/__tests__/orderHistory.property.test.ts` - Order history and filtering properties
- `src/__tests__/orderStatusExtended.property.test.ts` - Extended status state machine
- `src/__tests__/supplierAnalytics.property.test.ts` - Daily summary calculations

Each property test must be annotated with:
```javascript
// Feature: marketplace-enhancements, Property N: [Property Title]
// Validates: Requirements X.Y
```

### Integration Tests

- Test real-time order updates across customer and supplier views
- Test cart persistence across page reloads
- Test order cancellation flow end-to-end
