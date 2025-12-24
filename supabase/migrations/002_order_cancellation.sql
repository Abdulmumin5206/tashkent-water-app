-- Migration: Add order cancellation support
-- This migration adds cancellation fields to the orders table and updates the status constraint

-- Add cancellation_reason column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Add cancelled_at timestamp column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- Drop existing status check constraint and add new one with 'cancelled' status
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('received', 'on_the_way', 'delivered', 'cancelled'));

-- Add index for order history queries (customer_id, created_at DESC)
-- This optimizes fetching customer order history sorted by date
CREATE INDEX IF NOT EXISTS idx_orders_customer_created 
  ON orders(customer_id, created_at DESC);
