# Requirements Document

## Introduction

Tashkent Water Marketplace is a Telegram Mini App that connects customers with water suppliers for ordering 19L water bottles. The platform enables users to browse multiple suppliers, place orders, track deliveries, and allows drivers to manage and fulfill orders through a simple admin interface.

## Glossary

- **Customer**: A Telegram user who orders water bottles through the Mini App
- **Supplier**: A water delivery company (e.g., Hydrolife, Nestle) listed on the marketplace
- **Driver**: A delivery person who fulfills water orders
- **Mini_App**: The Telegram WebApp that runs inside the Telegram client
- **Order**: A customer request for water bottle delivery containing quantity, address, and payment method
- **Cart**: A temporary collection of items before checkout
- **Order_Status**: The current state of an order (Received, On the Way, Delivered)

## Requirements

### Requirement 1: Telegram Auto-Login

**User Story:** As a customer, I want to be automatically recognized when I open the app, so that I don't need to create an account or remember passwords.

#### Acceptance Criteria

1. WHEN a user opens the Mini_App, THE System SHALL read the Telegram initData to extract user ID and name
2. WHEN a new Telegram user opens the Mini_App, THE System SHALL create a new customer record using their Telegram ID
3. WHEN a returning user opens the Mini_App, THE System SHALL retrieve their existing profile and saved data
4. THE System SHALL display the user's Telegram name in the interface

### Requirement 2: Phone Verification

**User Story:** As a customer, I want to provide my phone number only once, so that suppliers can contact me about my delivery.

#### Acceptance Criteria

1. WHEN a customer places their first order AND has no phone number saved, THE System SHALL prompt for phone number entry
2. WHEN requesting phone number, THE System SHALL use Telegram's native phone sharing button when available
3. WHEN a phone number is provided, THE System SHALL save it to the customer's profile
4. WHEN a returning customer places an order, THE System SHALL use their saved phone number without prompting

### Requirement 3: Marketplace Feed

**User Story:** As a customer, I want to browse available water suppliers, so that I can compare prices and ratings before ordering.

#### Acceptance Criteria

1. WHEN the customer opens the marketplace, THE System SHALL display a list of all active suppliers
2. FOR EACH supplier in the list, THE System SHALL display: supplier name, price per bottle, delivery time estimate, and star rating
3. WHEN a supplier's data changes in the database, THE System SHALL reflect the updated information
4. THE System SHALL sort suppliers by rating (highest first) by default

### Requirement 4: Location Selection

**User Story:** As a customer, I want to pinpoint my exact delivery location on a map, so that the driver can find my entrance easily.

#### Acceptance Criteria

1. WHEN a customer needs to set delivery location, THE System SHALL display an interactive map centered on Tashkent
2. THE System SHALL allow the customer to drag a pin to their exact location
3. THE System SHALL provide a text field for delivery comments (floor, door code, landmarks)
4. WHEN a location is selected, THE System SHALL save the latitude and longitude coordinates
5. WHEN a returning customer orders, THE System SHALL offer their previously saved address as default

### Requirement 5: Cart and Checkout

**User Story:** As a customer, I want to select how many bottles I need and choose my payment method, so that I can complete my order.

#### Acceptance Criteria

1. WHEN a customer selects a supplier, THE System SHALL allow quantity selection (minimum 1 bottle)
2. THE System SHALL display the total price based on quantity and supplier price
3. THE System SHALL offer payment method selection: Cash or Card Transfer (P2P)
4. WHEN the customer confirms checkout, THE System SHALL create an order with status "Received"
5. WHEN an order is created, THE System SHALL store: customer ID, supplier ID, quantity, total price, delivery address, coordinates, comments, payment method, and timestamp

### Requirement 6: Order Tracking

**User Story:** As a customer, I want to see the status of my order, so that I know when my water will arrive.

#### Acceptance Criteria

1. WHEN an order is placed, THE System SHALL display the order status screen
2. THE System SHALL show order progress through stages: "Order Received" → "Driver on the Way" → "Delivered"
3. WHEN the order status changes in the database, THE System SHALL update the customer's screen in real-time
4. THE System SHALL display the current order details (supplier, quantity, address) on the tracking screen

### Requirement 7: Supplier Order Dashboard

**User Story:** As a driver, I want to see incoming orders, so that I can accept and fulfill deliveries.

#### Acceptance Criteria

1. WHEN a driver accesses the admin panel, THE System SHALL require password authentication
2. WHEN authenticated, THE System SHALL display a list of orders with status "Received"
3. FOR EACH order in the dashboard, THE System SHALL display: customer name, phone, address, quantity, payment method, and timestamp
4. THE System SHALL update the order list in real-time as new orders arrive

### Requirement 8: Order Fulfillment

**User Story:** As a driver, I want to accept orders and navigate to customers, so that I can deliver their water efficiently.

#### Acceptance Criteria

1. WHEN a driver views an order, THE System SHALL provide an "Accept" button
2. WHEN a driver accepts an order, THE System SHALL update the order status to "Driver on the Way"
3. THE System SHALL provide a "Open in Yandex Maps" button that launches navigation to the customer's coordinates
4. WHEN a driver completes delivery, THE System SHALL provide a "Mark as Delivered" button
5. WHEN marked as delivered, THE System SHALL update the order status to "Delivered"

### Requirement 9: Data Persistence

**User Story:** As a system administrator, I want all data stored reliably, so that orders and user information are not lost.

#### Acceptance Criteria

1. THE System SHALL store supplier data in a database table containing: name, price, rating, delivery time estimate, and active status
2. THE System SHALL store order data in a database table containing: order ID, customer ID, supplier ID, quantity, total price, address text, coordinates, comments, payment method, status, and timestamps
3. THE System SHALL store customer data in a database table containing: Telegram ID, name, phone number, and saved address
4. WHEN data is modified, THE System SHALL persist changes immediately to the database
