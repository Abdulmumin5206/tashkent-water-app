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

-- Insert a test customer (optional - for development testing)
-- This customer will be created automatically when a Telegram user opens the app
-- INSERT INTO customers (telegram_id, name, phone, saved_address, saved_lat, saved_lng, saved_comments)
-- VALUES 
--   (123456789, 'Test User', '+998901234567', 'ул. Навои 1, кв. 10', 41.2995, 69.2401, 'Подъезд 2, код 1234')
-- ON CONFLICT (telegram_id) DO NOTHING;
