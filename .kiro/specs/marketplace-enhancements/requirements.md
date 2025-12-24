# Requirements Document

## Introduction

This document specifies enhancements to the Tashkent Water Marketplace to improve user experience, add essential mobile app features, and provide suppliers with better order management capabilities. The enhancements focus on session persistence, order history, account management, supplier dashboard improvements, and UI/UX refinements for a modern minimalist mobile experience.

## Glossary

- **Customer**: A Telegram user who orders water bottles through the Mini App
- **Supplier**: A water delivery company listed on the marketplace
- **Driver**: A delivery person who fulfills water orders (same as supplier in current context)
- **Session**: The user's application state that persists across app restarts
- **Order_History**: A chronological list of all orders placed by a customer
- **Order_Status**: The current state of an order (Received, On the Way, Delivered, Cancelled)
- **Supplier_Dashboard**: The admin interface for suppliers to manage orders and view analytics

## Requirements

### Requirement 1: Session Persistence

**User Story:** As a customer, I want the app to remember my session when I reopen it, so that I don't lose my cart and can continue where I left off.

#### Acceptance Criteria

1. WHEN a customer opens the Mini_App, THE System SHALL restore their previous cart state from local storage
2. WHEN a customer adds items to cart, THE System SHALL persist the cart to local storage immediately
3. WHEN a customer has an active order (not delivered), THE System SHALL show the order tracking screen on app open
4. WHEN a returning customer opens the app, THE System SHALL display a brief welcome back message with their name
5. THE System SHALL clear persisted cart data only after successful order placement

### Requirement 2: Order History

**User Story:** As a customer, I want to view my past orders, so that I can track my order history and reorder easily.

#### Acceptance Criteria

1. WHEN a customer navigates to order history, THE System SHALL display all their orders sorted by date (newest first)
2. FOR EACH order in history, THE System SHALL display: order date, supplier name, quantity, total price, and status
3. WHEN a customer taps an order, THE System SHALL show full order details including delivery address
4. WHEN viewing a completed order, THE System SHALL provide a "Reorder" button that adds the same items to cart
5. THE System SHALL indicate order status with visual badges (Received, On the Way, Delivered, Cancelled)

### Requirement 3: Account Settings

**User Story:** As a customer, I want to manage my account settings, so that I can update my delivery preferences and contact information.

#### Acceptance Criteria

1. WHEN a customer opens account settings, THE System SHALL display their profile information (name, phone, saved address)
2. THE System SHALL allow customers to edit their saved delivery address
3. THE System SHALL allow customers to update their phone number
4. WHEN a customer updates their information, THE System SHALL persist changes to the database immediately
5. THE System SHALL display the customer's Telegram username as read-only information

### Requirement 4: Enhanced Bottom Navigation

**User Story:** As a customer, I want easy access to all main features, so that I can navigate the app efficiently.

#### Acceptance Criteria

1. THE System SHALL display a bottom navigation bar with: Home, Orders, Cart, and Profile tabs
2. WHEN a tab is active, THE System SHALL highlight it with a distinct visual indicator
3. THE System SHALL show a badge on the Cart tab indicating the number of items
4. THE System SHALL show a badge on the Orders tab when there is an active (non-delivered) order
5. THE Bottom_Navigation SHALL remain visible on all main customer screens except checkout and order tracking detail

### Requirement 5: Supplier Order Management

**User Story:** As a supplier, I want to see all my orders including completed and cancelled ones, so that I can track my business performance.

#### Acceptance Criteria

1. THE Supplier_Dashboard SHALL display orders in tabs: New, In Progress, Completed, Cancelled
2. WHEN viewing the New tab, THE System SHALL show orders with status "received"
3. WHEN viewing the In Progress tab, THE System SHALL show orders with status "on_the_way"
4. WHEN viewing the Completed tab, THE System SHALL show orders with status "delivered"
5. WHEN viewing the Cancelled tab, THE System SHALL show orders with status "cancelled"
6. FOR EACH tab, THE System SHALL display the count of orders in that category

### Requirement 6: Order Cancellation

**User Story:** As a supplier, I want to cancel orders when necessary, so that I can handle situations where delivery is not possible.

#### Acceptance Criteria

1. WHEN viewing an order with status "received", THE Supplier_Dashboard SHALL provide a "Cancel Order" option
2. WHEN a supplier cancels an order, THE System SHALL prompt for a cancellation reason
3. WHEN an order is cancelled, THE System SHALL update the order status to "cancelled" and store the reason
4. WHEN an order is cancelled, THE System SHALL notify the customer's order tracking screen in real-time
5. IF an order status is "on_the_way" or "delivered", THEN THE System SHALL NOT allow cancellation

### Requirement 7: Supplier Analytics Summary

**User Story:** As a supplier, I want to see a summary of my orders, so that I can understand my daily performance at a glance.

#### Acceptance Criteria

1. THE Supplier_Dashboard SHALL display a summary card showing today's statistics
2. THE Summary SHALL include: total orders today, completed orders, total revenue today
3. THE Summary SHALL update in real-time as orders are completed
4. WHEN no orders exist for today, THE System SHALL display zeros with appropriate messaging

### Requirement 8: Modern Minimalist UI

**User Story:** As a user, I want a clean and modern interface, so that the app feels professional and is easy to use.

#### Acceptance Criteria

1. THE System SHALL use consistent spacing and alignment across all screens
2. THE System SHALL use a cohesive color palette with blue as primary and appropriate accent colors
3. THE System SHALL use smooth transitions and animations for state changes
4. THE System SHALL ensure all interactive elements have appropriate touch targets (minimum 44px)
5. THE System SHALL display loading states with skeleton screens instead of spinners where appropriate
6. THE System SHALL ensure text is readable with appropriate font sizes and contrast ratios

### Requirement 9: Improved Supplier Cards

**User Story:** As a customer, I want supplier cards to be visually appealing and informative, so that I can quickly compare options.

#### Acceptance Criteria

1. THE Supplier_Card SHALL display supplier logo/image prominently
2. THE Supplier_Card SHALL show price, rating, and delivery time in a clear hierarchy
3. THE Supplier_Card SHALL use subtle shadows and rounded corners for depth
4. WHEN a supplier is unavailable, THE System SHALL display the card with reduced opacity and "Unavailable" badge
5. THE Supplier_Card SHALL have consistent height and alignment in the list

### Requirement 10: Order Status Extended

**User Story:** As a system administrator, I want to support order cancellation status, so that the system can track cancelled orders properly.

#### Acceptance Criteria

1. THE System SHALL support a new order status: "cancelled"
2. WHEN an order is cancelled, THE System SHALL store the cancellation timestamp
3. WHEN an order is cancelled, THE System SHALL store the cancellation reason
4. THE Order_Status state machine SHALL allow transition from "received" to "cancelled" only
5. THE System SHALL NOT allow any transitions from "cancelled" status

