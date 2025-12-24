-- Seed data for Tashkent Water Marketplace
-- Run this after the migration to populate sample suppliers
-- Usage: psql -d your_database -f seed.sql
-- Or run via Supabase SQL Editor

-- Clear existing seed data (optional - uncomment if needed)
-- DELETE FROM orders;
-- DELETE FROM customers;
-- DELETE FROM suppliers;

-- Insert sample suppliers for testing
-- Prices are in Uzbek Som (UZS)
INSERT INTO suppliers (name, price, rating, delivery_time_min, delivery_time_max, image_url, is_active)
VALUES 
  ('Hydrolife', 25000, 4.8, 30, 60, NULL, true),
  ('Nestle Pure Life', 28000, 4.6, 45, 90, NULL, true),
  ('Aquafresh', 22000, 4.4, 30, 75, NULL, true),
  ('Crystal Water', 20000, 4.2, 60, 120, NULL, true),
  ('Oasis', 24000, 4.5, 40, 80, NULL, true),
  ('Inactive Supplier', 15000, 3.0, 60, 120, NULL, false)
ON CONFLICT DO NOTHING;

-- Insert a test customer for development testing
-- This customer will be created automatically when a Telegram user opens the app
INSERT INTO customers (telegram_id, name, phone, saved_address, saved_lat, saved_lng, saved_comments)
VALUES 
  (123456789, 'Test User', '+998901234567', 'ул. Навои 1, кв. 10', 41.2995, 69.2401, 'Подъезд 2, код 1234')
ON CONFLICT (telegram_id) DO NOTHING;

-- Insert sample orders with various statuses for testing
-- Note: These orders reference the test customer and suppliers created above
-- You may need to adjust the UUIDs based on your actual data

-- First, let's create a function to insert sample orders
-- This uses a DO block to handle the dynamic supplier/customer IDs
DO $$
DECLARE
  test_customer_id UUID;
  hydrolife_id UUID;
  nestle_id UUID;
  aquafresh_id UUID;
  crystal_id UUID;
  oasis_id UUID;
BEGIN
  -- Get the test customer ID
  SELECT id INTO test_customer_id FROM customers WHERE telegram_id = 123456789;
  
  -- Get supplier IDs
  SELECT id INTO hydrolife_id FROM suppliers WHERE name = 'Hydrolife';
  SELECT id INTO nestle_id FROM suppliers WHERE name = 'Nestle Pure Life';
  SELECT id INTO aquafresh_id FROM suppliers WHERE name = 'Aquafresh';
  SELECT id INTO crystal_id FROM suppliers WHERE name = 'Crystal Water';
  SELECT id INTO oasis_id FROM suppliers WHERE name = 'Oasis';
  
  -- Only insert if we have the required IDs
  IF test_customer_id IS NOT NULL AND hydrolife_id IS NOT NULL THEN
    
    -- Order 1: Delivered order (completed)
    INSERT INTO orders (
      customer_id, supplier_id, quantity, total_price, address, lat, lng, 
      comments, phone, payment_method, status, created_at, updated_at
    ) VALUES (
      test_customer_id, hydrolife_id, 3, 75000, 
      'ул. Навои 1, кв. 10', 41.2995, 69.2401,
      'Подъезд 2, код 1234', '+998901234567', 'cash', 'delivered',
      NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
    ) ON CONFLICT DO NOTHING;
    
    -- Order 2: Delivered order (completed, different supplier)
    INSERT INTO orders (
      customer_id, supplier_id, quantity, total_price, address, lat, lng, 
      comments, phone, payment_method, status, created_at, updated_at
    ) VALUES (
      test_customer_id, nestle_id, 2, 56000, 
      'ул. Навои 1, кв. 10', 41.2995, 69.2401,
      'Подъезд 2, код 1234', '+998901234567', 'card_transfer', 'delivered',
      NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'
    ) ON CONFLICT DO NOTHING;
    
    -- Order 3: On the way (in progress)
    INSERT INTO orders (
      customer_id, supplier_id, quantity, total_price, address, lat, lng, 
      comments, phone, payment_method, status, created_at, updated_at
    ) VALUES (
      test_customer_id, aquafresh_id, 4, 88000, 
      'ул. Навои 1, кв. 10', 41.2995, 69.2401,
      'Позвоните перед приездом', '+998901234567', 'cash', 'on_the_way',
      NOW() - INTERVAL '1 hour', NOW() - INTERVAL '30 minutes'
    ) ON CONFLICT DO NOTHING;
    
    -- Order 4: Received (new order)
    INSERT INTO orders (
      customer_id, supplier_id, quantity, total_price, address, lat, lng, 
      comments, phone, payment_method, status, created_at, updated_at
    ) VALUES (
      test_customer_id, crystal_id, 2, 40000, 
      'ул. Навои 1, кв. 10', 41.2995, 69.2401,
      NULL, '+998901234567', 'card_transfer', 'received',
      NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '10 minutes'
    ) ON CONFLICT DO NOTHING;
    
    -- Order 5: Cancelled order (with reason - out of stock)
    INSERT INTO orders (
      customer_id, supplier_id, quantity, total_price, address, lat, lng, 
      comments, phone, payment_method, status, 
      cancellation_reason, cancelled_at, created_at, updated_at
    ) VALUES (
      test_customer_id, oasis_id, 5, 120000, 
      'ул. Навои 1, кв. 10', 41.2995, 69.2401,
      'Срочная доставка', '+998901234567', 'cash', 'cancelled',
      'Товар временно отсутствует на складе', NOW() - INTERVAL '1 day',
      NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'
    ) ON CONFLICT DO NOTHING;
    
    -- Order 6: Cancelled order (with reason - customer unreachable)
    INSERT INTO orders (
      customer_id, supplier_id, quantity, total_price, address, lat, lng, 
      comments, phone, payment_method, status, 
      cancellation_reason, cancelled_at, created_at, updated_at
    ) VALUES (
      test_customer_id, hydrolife_id, 1, 25000, 
      'ул. Амира Темура 50', 41.3100, 69.2500,
      NULL, '+998901234567', 'cash', 'cancelled',
      'Не удалось связаться с клиентом', NOW() - INTERVAL '4 days',
      NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'
    ) ON CONFLICT DO NOTHING;
    
    -- Order 7: Delivered order (older, for history)
    INSERT INTO orders (
      customer_id, supplier_id, quantity, total_price, address, lat, lng, 
      comments, phone, payment_method, status, created_at, updated_at
    ) VALUES (
      test_customer_id, nestle_id, 6, 168000, 
      'ул. Навои 1, кв. 10', 41.2995, 69.2401,
      'Офис, 3 этаж', '+998901234567', 'card_transfer', 'delivered',
      NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'
    ) ON CONFLICT DO NOTHING;
    
    -- Order 8: Cancelled order (with reason - address issue)
    INSERT INTO orders (
      customer_id, supplier_id, quantity, total_price, address, lat, lng, 
      comments, phone, payment_method, status, 
      cancellation_reason, cancelled_at, created_at, updated_at
    ) VALUES (
      test_customer_id, aquafresh_id, 2, 44000, 
      'Неверный адрес', 41.2800, 69.2200,
      NULL, '+998901234567', 'cash', 'cancelled',
      'Указан неверный адрес доставки', NOW() - INTERVAL '7 days',
      NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'
    ) ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Sample orders inserted successfully';
  ELSE
    RAISE NOTICE 'Could not find test customer or suppliers. Make sure suppliers are inserted first.';
  END IF;
END $$;
