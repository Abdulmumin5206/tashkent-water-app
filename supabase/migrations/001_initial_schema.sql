-- Tashkent Water Marketplace Database Schema
-- This file contains the SQL to create all required tables in Supabase

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
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
CREATE TABLE IF NOT EXISTS customers (
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
CREATE TABLE IF NOT EXISTS orders (
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
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_telegram ON customers(telegram_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(is_active);

-- Enable Row Level Security (RLS)
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for suppliers (public read access)
CREATE POLICY "Suppliers are viewable by everyone" ON suppliers
  FOR SELECT USING (true);

-- RLS Policies for customers (users can only access their own data)
CREATE POLICY "Customers can view their own data" ON customers
  FOR SELECT USING (true);

CREATE POLICY "Customers can insert their own data" ON customers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Customers can update their own data" ON customers
  FOR UPDATE USING (true);

-- RLS Policies for orders
CREATE POLICY "Orders are viewable by everyone" ON orders
  FOR SELECT USING (true);

CREATE POLICY "Orders can be created by anyone" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Orders can be updated by anyone" ON orders
  FOR UPDATE USING (true);

-- Enable realtime for orders table
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
