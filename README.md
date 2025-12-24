# 💧 Tashkent Water Marketplace

A Telegram Mini App for ordering 19L water bottles in Tashkent. Customers can browse suppliers, place orders, track deliveries, and view order history. Suppliers can manage orders, track analytics, and handle cancellations through a comprehensive dashboard.

## Features

### Customer Features
- 🔐 **Auto-login** via Telegram - no registration required
- 🏪 **Browse suppliers** - compare prices, ratings, and delivery times
- 🛒 **Shopping cart** - select quantities with persistent cart state
- 📍 **Location picker** - pinpoint delivery location on an interactive map
- 💳 **Payment options** - Cash or Card Transfer (P2P)
- 📦 **Order tracking** - real-time status updates
- 📜 **Order history** - view past orders and reorder with one tap
- 👤 **Account settings** - manage phone and delivery address
- � **Welscome back** - personalized greeting for returning users

### Supplier/Driver Features
- 🔑 **Password-protected dashboard**
- 📋 **Order management** - tabbed view (New, In Progress, Completed, Cancelled)
- 📊 **Daily analytics** - orders count, completed, and revenue summary
- ❌ **Order cancellation** - cancel orders with reason tracking
- 🗺️ **Navigation** - open delivery location in Yandex Maps
- ✅ **Status updates** - accept orders and mark as delivered

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Real-time subscriptions)
- **Maps**: Leaflet with OpenStreetMap tiles
- **Testing**: Vitest, fast-check (property-based testing)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- Telegram Bot (for Mini App deployment)

### 1. Clone and Install

```bash
git clone <repository-url>
cd water-marketplace
npm install
```

### 2. Supabase Setup

#### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be provisioned

#### Run Database Migrations

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the contents of `supabase/migrations/001_initial_schema.sql`
3. Paste and run the SQL to create tables

#### Seed Sample Data

1. In the **SQL Editor**, copy the contents of `supabase/seed.sql`
2. Paste and run to insert sample suppliers and test orders

#### Get API Credentials

1. Go to **Settings** → **API**
2. Copy the **Project URL** and **anon public** key

### 3. Environment Configuration

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_DRIVER_PASSWORD=your-secure-password
```

See `.env.example` for reference.

### 4. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 5. Run Tests

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
```

## Telegram Mini App Deployment

### Create a Telegram Bot

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot` and follow the prompts
3. Save the bot token

### Configure Mini App

1. Message [@BotFather](https://t.me/BotFather)
2. Send `/mybots` and select your bot
3. Go to **Bot Settings** → **Menu Button** → **Configure menu button**
4. Set the URL to your deployed app (e.g., `https://your-app.vercel.app`)

### Deploy

#### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

#### Netlify

```bash
npm run build
# Deploy the `dist` folder to Netlify
```

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── BottomNav.tsx    # 4-tab navigation (Home, Orders, Cart, Profile)
│   ├── EmptyState.tsx   # Empty state placeholder
│   ├── ErrorBoundary.tsx
│   ├── Header.tsx
│   ├── LoadingSpinner.tsx
│   ├── LocationPicker.tsx
│   ├── ProtectedDriverRoute.tsx
│   ├── QuantitySelector.tsx
│   ├── SkeletonLoader.tsx
│   ├── StatusBadge.tsx  # Order status badges
│   └── WelcomeToast.tsx # Welcome back message
├── contexts/            # React Context providers
│   ├── AppContext.tsx   # Cart, customer, order history state
│   ├── DriverContext.tsx
│   └── TelegramContext.tsx
├── hooks/               # Custom React hooks
│   ├── useCheckout.ts
│   └── useCustomerInit.ts
├── pages/               # Page components
│   ├── AccountSettingsPage.tsx  # Profile management
│   ├── CartPage.tsx
│   ├── CheckoutPage.tsx
│   ├── DriverDashboardPage.tsx  # Tabbed order management + analytics
│   ├── DriverLoginPage.tsx
│   ├── DriverOrderDetailPage.tsx
│   ├── MarketplacePage.tsx
│   ├── OrderHistoryPage.tsx     # Past orders with reorder
│   ├── OrderTrackingPage.tsx
│   └── SupplierDetailPage.tsx
├── services/            # Supabase API services
│   ├── customers.ts
│   ├── orders.ts        # Includes history, cancellation
│   ├── supabase.ts
│   └── suppliers.ts
├── types/               # TypeScript type definitions
│   └── index.ts
├── utils/               # Utility functions
│   ├── analytics.ts     # Daily summary calculations
│   ├── cart.ts
│   ├── cartStorage.ts   # LocalStorage persistence
│   ├── checkout.ts
│   ├── orderStatus.ts   # Status state machine
│   └── reorder.ts       # Reorder from history
└── __tests__/           # Property-based tests

supabase/
├── migrations/
│   └── 001_initial_schema.sql
└── seed.sql
```

## Database Schema

### Tables

- **suppliers** - Water delivery companies
- **customers** - Telegram users who order water
- **orders** - Customer orders with status tracking, cancellation support

### Order Status Flow

```
received → on_the_way → delivered
    ↓
cancelled (from received only)
```

## Customer Navigation

The app uses a bottom navigation bar with 4 tabs:
- **Home** - Browse suppliers
- **Orders** - View order history
- **Cart** - Current cart (shows item count badge)
- **Profile** - Account settings

## Development Notes

### Running Without Telegram

The app includes a development mode that works without Telegram:
- A mock user is created automatically
- Phone sharing returns a mock number
- All features work normally

### Cart Persistence

Cart state is automatically saved to localStorage and restored on app reload. The cart is cleared only after successful order placement.

### Real-time Updates

The app uses Supabase real-time subscriptions for:
- Order status updates (customer tracking page)
- New order notifications (supplier dashboard)
- Analytics updates (supplier dashboard)

### Map Configuration

The map is centered on Tashkent (41.2995°N, 69.2401°E) by default. Customers can drag the marker to set their exact delivery location.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `VITE_DRIVER_PASSWORD` | Password for supplier dashboard | Yes |

## License

MIT
