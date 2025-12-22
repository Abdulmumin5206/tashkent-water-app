# Design Document: Tashkent Water Marketplace

## Overview

This document describes the technical design for the Tashkent Water Marketplace, a Telegram Mini App built with React, Vite, and Tailwind CSS. The application uses Supabase for backend services (database, authentication, real-time subscriptions) and Leaflet for map functionality.

The architecture follows a client-side React application pattern with Supabase handling all backend concerns. The app runs entirely within Telegram's WebApp container, leveraging Telegram's user identity system.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Telegram Client                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Telegram Mini App (WebApp)               │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │           React Application (Vite)              │  │  │
│  │  │                                                 │  │  │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐   │  │  │
│  │  │  │ Customer │ │  Cart &  │ │   Driver     │   │  │  │
│  │  │  │   Views  │ │ Checkout │ │  Dashboard   │   │  │  │
│  │  │  └────┬─────┘ └────┬─────┘ └──────┬───────┘   │  │  │
│  │  │       │            │              │           │  │  │
│  │  │  ┌────┴────────────┴──────────────┴────┐      │  │  │
│  │  │  │         React Context (State)       │      │  │  │
│  │  │  └────────────────┬────────────────────┘      │  │  │
│  │  │                   │                           │  │  │
│  │  │  ┌────────────────┴────────────────────┐      │  │  │
│  │  │  │         Supabase Client             │      │  │  │
│  │  │  └────────────────┬────────────────────┘      │  │  │
│  │  └───────────────────┼───────────────────────────┘  │  │
│  └──────────────────────┼───────────────────────────────┘  │
└─────────────────────────┼───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase                               │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐    │
│  │   Database   │ │   Realtime   │ │   Row Level      │    │
│  │  (Postgres)  │ │ Subscriptions│ │   Security       │    │
│  └──────────────┘ └──────────────┘ └──────────────────┘    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    External Services                        │
│  ┌──────────────┐ ┌──────────────┐                         │
│  │   Leaflet    │ │  Yandex Maps │                         │
│  │ (Map Tiles)  │ │ (Navigation) │                         │
│  └──────────────┘ └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Component Hierarchy

```
App
├── TelegramProvider (Context)
│   └── Handles Telegram WebApp SDK initialization
├── SupabaseProvider (Context)
│   └── Manages Supabase client and auth state
├── AppRouter
│   ├── CustomerRoutes
│   │   ├── MarketplacePage
│   │   │   └── SupplierCard (list item)
│   │   ├── SupplierDetailPage
│   │   │   ├── QuantitySelector
│   │   │   └── AddToCartButton
│   │   ├── CartPage
│   │   │   ├── CartItemList
│   │   │   └── CartSummary
│   │   ├── CheckoutPage
│   │   │   ├── LocationPicker (Leaflet map)
│   │   │   ├── AddressForm
│   │   │   ├── PhoneInput
│   │   │   └── PaymentMethodSelector
│   │   └── OrderTrackingPage
│   │       └── OrderStatusStepper
│   └── DriverRoutes (password protected)
│       ├── DriverLoginPage
│       ├── OrderDashboardPage
│       │   └── OrderCard (list item)
│       └── OrderDetailPage
│           ├── CustomerInfo
│           ├── NavigationButton
│           └── StatusActions
└── SharedComponents
    ├── Header
    ├── BottomNav
    ├── LoadingSpinner
    └── ErrorBoundary
```

### Key Interfaces

```typescript
// Telegram WebApp types
interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
  };
  ready(): void;
  expand(): void;
  MainButton: TelegramMainButton;
  requestContact(callback: (sent: boolean) => void): void;
}

// Domain types
interface Supplier {
  id: string;
  name: string;
  price: number;
  rating: number;
  delivery_time_min: number;
  delivery_time_max: number;
  image_url?: string;
  is_active: boolean;
}

interface Customer {
  id: string;
  telegram_id: number;
  name: string;
  phone?: string;
  saved_address?: string;
  saved_lat?: number;
  saved_lng?: number;
  saved_comments?: string;
  created_at: string;
}

interface Order {
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
  payment_method: 'cash' | 'card_transfer';
  status: 'received' | 'on_the_way' | 'delivered';
  created_at: string;
  updated_at: string;
}

interface CartItem {
  supplier: Supplier;
  quantity: number;
}

// Context interfaces
interface TelegramContextValue {
  user: TelegramUser | null;
  webApp: TelegramWebApp | null;
  isReady: boolean;
  requestContact: () => Promise<string | null>;
}

interface AppContextValue {
  customer: Customer | null;
  cart: CartItem[];
  currentOrder: Order | null;
  addToCart: (supplier: Supplier, quantity: number) => void;
  removeFromCart: (supplierId: string) => void;
  updateQuantity: (supplierId: string, quantity: number) => void;
  clearCart: () => void;
  placeOrder: (orderData: OrderInput) => Promise<Order>;
}
```

## Data Models

### Supabase Database Schema

```sql
-- Suppliers table
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  rating DECIMAL(2,1) DEFAULT 0,
  delivery_time_min INTEGER NOT NULL,
  delivery_time_max INTEGER NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  saved_address TEXT,
  saved_lat DECIMAL(10,8),
  saved_lng DECIMAL(11,8),
  saved_comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) NOT NULL,
  supplier_id UUID REFERENCES suppliers(id) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  total_price DECIMAL(10,2) NOT NULL,
  address TEXT NOT NULL,
  lat DECIMAL(10,8) NOT NULL,
  lng DECIMAL(11,8) NOT NULL,
  comments TEXT,
  phone TEXT NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card_transfer')),
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'on_the_way', 'delivered')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_customers_telegram ON customers(telegram_id);
```

### Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  Supplier   │       │    Order    │       │  Customer   │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │◄──────│ supplier_id │       │ id (PK)     │
│ name        │       │ customer_id │──────►│ telegram_id │
│ price       │       │ quantity    │       │ name        │
│ rating      │       │ total_price │       │ phone       │
│ delivery_*  │       │ address     │       │ saved_*     │
│ image_url   │       │ lat/lng     │       │ created_at  │
│ is_active   │       │ comments    │       │ updated_at  │
│ created_at  │       │ phone       │       └─────────────┘
└─────────────┘       │ payment_*   │
                      │ status      │
                      │ created_at  │
                      │ updated_at  │
                      └─────────────┘
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Customer Persistence Round-Trip

*For any* valid customer data (Telegram ID, name, phone, saved address, coordinates, comments), saving to the database and then retrieving by Telegram ID should return an equivalent customer object.

**Validates: Requirements 1.2, 1.3, 2.3, 4.4, 9.3**

### Property 2: Supplier Persistence Round-Trip

*For any* valid supplier data (name, price, rating, delivery times, active status), saving to the database and then retrieving by ID should return an equivalent supplier object.

**Validates: Requirements 9.1**

### Property 3: Order Persistence Round-Trip

*For any* valid order data (customer ID, supplier ID, quantity, total price, address, coordinates, comments, phone, payment method, status), saving to the database and then retrieving by ID should return an equivalent order object.

**Validates: Requirements 5.5, 9.2**

### Property 4: Active Suppliers Filter

*For any* set of suppliers in the database with varying active statuses, querying for marketplace suppliers should return only those where is_active is true.

**Validates: Requirements 3.1**

### Property 5: Supplier Sorting by Rating

*For any* list of active suppliers returned from the marketplace query, the list should be sorted by rating in descending order (highest rating first).

**Validates: Requirements 3.4**

### Property 6: Quantity Validation

*For any* quantity value provided during cart operations, values less than 1 should be rejected, and values of 1 or greater should be accepted.

**Validates: Requirements 5.1**

### Property 7: Price Calculation

*For any* supplier price and quantity, the calculated total price should equal quantity multiplied by supplier price.

**Validates: Requirements 5.2**

### Property 8: Order Status State Machine

*For any* order, status transitions must follow the valid sequence: "received" → "on_the_way" → "delivered". Invalid transitions (e.g., "received" → "delivered" directly, or backwards transitions) should be rejected.

**Validates: Requirements 5.4, 6.2, 8.2, 8.5**

### Property 9: Phone Prompt Logic

*For any* customer attempting to place an order, if the customer has no saved phone number, the checkout flow should require phone input. If the customer has a saved phone number, the checkout flow should use it without prompting.

**Validates: Requirements 2.1, 2.4**

### Property 10: Saved Address Default

*For any* customer with a saved address placing a new order, the checkout form should pre-populate with their saved address, coordinates, and comments.

**Validates: Requirements 4.5**

### Property 11: Driver Authentication

*For any* request to the driver dashboard, unauthenticated requests should be denied access, and only requests with valid driver credentials should be granted access.

**Validates: Requirements 7.1**

### Property 12: Received Orders Filter

*For any* set of orders in the database with varying statuses, the driver dashboard query should return only orders with status "received".

**Validates: Requirements 7.2**

## Error Handling

### Network Errors

- Display user-friendly error messages when Supabase connection fails
- Implement retry logic with exponential backoff for transient failures
- Cache critical data (suppliers list) for offline viewing
- Show loading states during data fetches

### Validation Errors

- Validate quantity is positive integer before cart operations
- Validate coordinates are within Tashkent bounds (approximately 41.2-41.4°N, 69.1-69.4°E)
- Validate phone number format before saving
- Display inline validation errors on form fields

### Telegram SDK Errors

- Gracefully handle missing Telegram WebApp context (for development/testing)
- Fallback to manual phone input if Telegram contact sharing fails
- Handle cases where initData is unavailable or malformed

### Order Flow Errors

- Prevent duplicate order submissions with loading states
- Handle concurrent order acceptance by multiple drivers
- Validate order exists before status updates

## Testing Strategy

### Unit Tests

Unit tests will verify specific examples and edge cases:

- Telegram initData parsing with various input formats
- Price calculation with edge cases (0 quantity, large quantities)
- Quantity validation boundary cases
- Order status transition validation
- Coordinate bounds validation
- Phone number format validation

### Property-Based Tests

Property-based tests will use **fast-check** library for JavaScript/TypeScript to verify universal properties across generated inputs. Each property test should run minimum 100 iterations.

Test file organization:
- `src/__tests__/customer.property.test.ts` - Customer persistence properties
- `src/__tests__/supplier.property.test.ts` - Supplier persistence and filtering properties
- `src/__tests__/order.property.test.ts` - Order persistence and status properties
- `src/__tests__/cart.property.test.ts` - Cart operations and price calculation properties
- `src/__tests__/checkout.property.test.ts` - Checkout flow logic properties

Each property test must be annotated with:
```javascript
// Feature: tashkent-water-marketplace, Property N: [Property Title]
// Validates: Requirements X.Y
```

### Integration Tests

Integration tests will verify:
- Supabase real-time subscriptions update UI correctly
- Telegram WebApp SDK integration works in Mini App context
- Map component correctly captures and displays coordinates
- End-to-end order flow from marketplace to delivery

### Manual Testing

- Test in actual Telegram Mini App environment
- Verify map pin dragging on mobile devices
- Test Yandex Maps navigation link on Android/iOS
- Verify real-time updates between customer and driver views

