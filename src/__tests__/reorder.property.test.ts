import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { createReorderCart } from '../utils/reorder';
import type { Order, Supplier, OrderStatus, PaymentMethod } from '../types';

// Feature: marketplace-enhancements, Property 5: Reorder Cart Equivalence
// Validates: Requirements 2.4

/**
 * Arbitrary for generating valid Supplier data
 */
const supplierArbitrary: fc.Arbitrary<Supplier> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  price: fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
  rating: fc.float({ min: 0, max: 5, noNaN: true }),
  delivery_time_min: fc.integer({ min: 1, max: 60 }),
  delivery_time_max: fc.integer({ min: 60, max: 180 }),
  image_url: fc.option(fc.webUrl(), { nil: undefined }),
  is_active: fc.boolean(),
});

/**
 * Arbitrary for generating valid Order data
 */
const orderStatusArbitrary = fc.constantFrom<OrderStatus>('received', 'on_the_way', 'delivered', 'cancelled');
const paymentMethodArbitrary = fc.constantFrom<PaymentMethod>('cash', 'card_transfer');

const tashkentLatArbitrary = fc.float({ min: Math.fround(41.2), max: Math.fround(41.4), noNaN: true });
const tashkentLngArbitrary = fc.float({ min: Math.fround(69.1), max: Math.fround(69.4), noNaN: true });

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
  cancellation_reason: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
  cancelled_at: fc.option(validDateArbitrary, { nil: undefined }),
  created_at: fc.option(validDateArbitrary, { nil: undefined }),
  updated_at: fc.option(validDateArbitrary, { nil: undefined }),
});

describe('Reorder Property Tests', () => {
  // Property 5: Reorder Cart Equivalence
  describe('Property 5: Reorder Cart Equivalence', () => {
    it('For any completed order, reorder cart contains same supplier and quantity as original order', () => {
      fc.assert(
        fc.property(orderArbitrary, supplierArbitrary, (order, supplier) => {
          // Ensure supplier ID matches order's supplier_id for realistic scenario
          const matchedSupplier = { ...supplier, id: order.supplier_id };
          
          const cart = createReorderCart(order, matchedSupplier);
          
          // Cart should have exactly one item
          expect(cart.length).toBe(1);
          
          // Cart item should have the same supplier
          expect(cart[0].supplier.id).toBe(order.supplier_id);
          
          // Cart item should have the same quantity as the original order
          expect(cart[0].quantity).toBe(order.quantity);
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('For any order, reorder cart supplier matches the provided supplier exactly', () => {
      fc.assert(
        fc.property(orderArbitrary, supplierArbitrary, (order, supplier) => {
          const cart = createReorderCart(order, supplier);
          
          // The supplier in the cart should be the exact supplier passed in
          expect(cart[0].supplier).toEqual(supplier);
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('For any order with quantity N, reorder cart item has quantity N', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          supplierArbitrary,
          (quantity, supplier) => {
            const order: Order = {
              id: 'test-order-id',
              customer_id: 'test-customer-id',
              supplier_id: supplier.id,
              quantity,
              total_price: quantity * supplier.price,
              address: 'Test Address',
              lat: 41.3,
              lng: 69.2,
              phone: '+998901234567',
              payment_method: 'cash',
              status: 'delivered',
            };
            
            const cart = createReorderCart(order, supplier);
            
            expect(cart[0].quantity).toBe(quantity);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
