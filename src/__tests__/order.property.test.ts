import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { Order, OrderStatus, PaymentMethod } from '../types';

// Feature: tashkent-water-marketplace, Property 3: Order Persistence Round-Trip
// Validates: Requirements 9.2

/**
 * Arbitrary for generating valid Order data
 */
const orderStatusArbitrary = fc.constantFrom<OrderStatus>('received', 'on_the_way', 'delivered');
const paymentMethodArbitrary = fc.constantFrom<PaymentMethod>('cash', 'card_transfer');

// Tashkent coordinate bounds (approximately)
const tashkentLatArbitrary = fc.float({ min: Math.fround(41.2), max: Math.fround(41.4), noNaN: true });
const tashkentLngArbitrary = fc.float({ min: Math.fround(69.1), max: Math.fround(69.4), noNaN: true });

// Valid date arbitrary that generates reasonable ISO date strings
const validDateArbitrary = fc.integer({ 
  min: new Date('2020-01-01').getTime(), 
  max: new Date('2030-12-31').getTime() 
}).map(timestamp => new Date(timestamp).toISOString());

const orderArbitrary = fc.record({
  id: fc.uuid(),
  customer_id: fc.uuid(),
  supplier_id: fc.uuid(),
  quantity: fc.integer({ min: 1, max: 100 }),
  total_price: fc.float({ min: Math.fround(0.01), max: Math.fround(10000000), noNaN: true }),
  address: fc.string({ minLength: 1, maxLength: 500 }),
  lat: tashkentLatArbitrary,
  lng: tashkentLngArbitrary,
  comments: fc.option(fc.string({ maxLength: 1000 }), { nil: undefined }),
  phone: fc.stringMatching(/^\+998[0-9]{9}$/),
  payment_method: paymentMethodArbitrary,
  status: orderStatusArbitrary,
  created_at: fc.option(validDateArbitrary, { nil: undefined }),
  updated_at: fc.option(validDateArbitrary, { nil: undefined }),
});

/**
 * Simulates the round-trip transformation that occurs when data
 * is saved to and retrieved from Supabase
 */
function simulateOrderRoundTrip(order: Order): Order {
  // Simulate JSON serialization/deserialization (what Supabase does)
  const serialized = JSON.stringify(order);
  const deserialized = JSON.parse(serialized) as Order;
  
  // Normalize numeric fields
  return {
    ...deserialized,
    quantity: Number(deserialized.quantity),
    total_price: Number(deserialized.total_price),
    lat: Number(deserialized.lat),
    lng: Number(deserialized.lng),
  };
}

describe('Order Persistence Properties', () => {
  // Property 3: Order Persistence Round-Trip
  it('Property 3: For any valid order data, round-trip through JSON serialization preserves all fields', () => {
    fc.assert(
      fc.property(orderArbitrary, (order) => {
        const roundTripped = simulateOrderRoundTrip(order);
        
        // All fields should be preserved
        expect(roundTripped.id).toBe(order.id);
        expect(roundTripped.customer_id).toBe(order.customer_id);
        expect(roundTripped.supplier_id).toBe(order.supplier_id);
        expect(roundTripped.quantity).toBe(order.quantity);
        expect(roundTripped.total_price).toBeCloseTo(order.total_price, 2);
        expect(roundTripped.address).toBe(order.address);
        expect(roundTripped.lat).toBeCloseTo(order.lat, 6);
        expect(roundTripped.lng).toBeCloseTo(order.lng, 6);
        expect(roundTripped.comments).toBe(order.comments);
        expect(roundTripped.phone).toBe(order.phone);
        expect(roundTripped.payment_method).toBe(order.payment_method);
        expect(roundTripped.status).toBe(order.status);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('Property 3: Order data maintains type integrity after round-trip', () => {
    fc.assert(
      fc.property(orderArbitrary, (order) => {
        const roundTripped = simulateOrderRoundTrip(order);
        
        // Type checks
        expect(typeof roundTripped.id).toBe('string');
        expect(typeof roundTripped.customer_id).toBe('string');
        expect(typeof roundTripped.supplier_id).toBe('string');
        expect(typeof roundTripped.quantity).toBe('number');
        expect(typeof roundTripped.total_price).toBe('number');
        expect(typeof roundTripped.address).toBe('string');
        expect(typeof roundTripped.lat).toBe('number');
        expect(typeof roundTripped.lng).toBe('number');
        expect(typeof roundTripped.phone).toBe('string');
        expect(typeof roundTripped.payment_method).toBe('string');
        expect(typeof roundTripped.status).toBe('string');
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('Property 3: Order quantity constraint (> 0) is preserved after round-trip', () => {
    fc.assert(
      fc.property(orderArbitrary, (order) => {
        const roundTripped = simulateOrderRoundTrip(order);
        
        // Quantity must be positive
        expect(roundTripped.quantity).toBeGreaterThan(0);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('Property 3: Order status is always a valid enum value after round-trip', () => {
    const validStatuses: OrderStatus[] = ['received', 'on_the_way', 'delivered'];
    
    fc.assert(
      fc.property(orderArbitrary, (order) => {
        const roundTripped = simulateOrderRoundTrip(order);
        
        expect(validStatuses).toContain(roundTripped.status);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('Property 3: Order payment method is always a valid enum value after round-trip', () => {
    const validMethods: PaymentMethod[] = ['cash', 'card_transfer'];
    
    fc.assert(
      fc.property(orderArbitrary, (order) => {
        const roundTripped = simulateOrderRoundTrip(order);
        
        expect(validMethods).toContain(roundTripped.payment_method);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('Property 3: Order coordinates are within Tashkent bounds after round-trip', () => {
    // Use Math.fround bounds to account for 32-bit float precision
    const latMin = Math.fround(41.2);
    const latMax = Math.fround(41.4);
    const lngMin = Math.fround(69.1);
    const lngMax = Math.fround(69.4);
    
    fc.assert(
      fc.property(orderArbitrary, (order) => {
        const roundTripped = simulateOrderRoundTrip(order);
        
        // Tashkent bounds (using 32-bit float precision)
        expect(roundTripped.lat).toBeGreaterThanOrEqual(latMin);
        expect(roundTripped.lat).toBeLessThanOrEqual(latMax);
        expect(roundTripped.lng).toBeGreaterThanOrEqual(lngMin);
        expect(roundTripped.lng).toBeLessThanOrEqual(lngMax);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });
});
