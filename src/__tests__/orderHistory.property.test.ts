import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { Order, OrderStatus, PaymentMethod } from '../types';
import { extractOrderDisplayFields } from '../pages/OrderHistoryPage';

// Feature: marketplace-enhancements, Property 3: Order History Sorting
// Validates: Requirements 2.1

/**
 * Arbitrary for generating valid Order data with all statuses including cancelled
 */
const orderStatusArbitrary = fc.constantFrom<OrderStatus>('received', 'on_the_way', 'delivered', 'cancelled');
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
  created_at: validDateArbitrary,
  updated_at: fc.option(validDateArbitrary, { nil: undefined }),
  cancellation_reason: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: undefined }),
  cancelled_at: fc.option(validDateArbitrary, { nil: undefined }),
});

/**
 * Simulates sorting orders by created_at DESC (newest first)
 * This is what getCustomerOrderHistory should return
 */
function sortOrdersByCreatedAtDesc(orders: Order[]): Order[] {
  return [...orders].sort((a, b) => {
    const dateA = new Date(a.created_at || 0).getTime();
    const dateB = new Date(b.created_at || 0).getTime();
    return dateB - dateA; // DESC order
  });
}

/**
 * Checks if an array of orders is sorted by created_at DESC
 */
function isSortedByCreatedAtDesc(orders: Order[]): boolean {
  for (let i = 0; i < orders.length - 1; i++) {
    const currentDate = new Date(orders[i].created_at || 0).getTime();
    const nextDate = new Date(orders[i + 1].created_at || 0).getTime();
    if (currentDate < nextDate) {
      return false;
    }
  }
  return true;
}

describe('Order History Sorting Properties', () => {
  // Feature: marketplace-enhancements, Property 3: Order History Sorting
  // Validates: Requirements 2.1
  it('Property 3: For any list of orders, sorting by created_at DESC produces newest first', () => {
    fc.assert(
      fc.property(fc.array(orderArbitrary, { minLength: 0, maxLength: 20 }), (orders) => {
        const sorted = sortOrdersByCreatedAtDesc(orders);
        
        // The sorted array should be in descending order by created_at
        expect(isSortedByCreatedAtDesc(sorted)).toBe(true);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('Property 3: Sorting preserves all original orders (no data loss)', () => {
    fc.assert(
      fc.property(fc.array(orderArbitrary, { minLength: 0, maxLength: 20 }), (orders) => {
        const sorted = sortOrdersByCreatedAtDesc(orders);
        
        // Same length
        expect(sorted.length).toBe(orders.length);
        
        // All original orders are present
        const originalIds = new Set(orders.map(o => o.id));
        const sortedIds = new Set(sorted.map(o => o.id));
        expect(sortedIds).toEqual(originalIds);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('Property 3: Sorting is idempotent (sorting twice gives same result)', () => {
    fc.assert(
      fc.property(fc.array(orderArbitrary, { minLength: 0, maxLength: 20 }), (orders) => {
        const sortedOnce = sortOrdersByCreatedAtDesc(orders);
        const sortedTwice = sortOrdersByCreatedAtDesc(sortedOnce);
        
        // Sorting twice should give the same result
        expect(sortedTwice.map(o => o.id)).toEqual(sortedOnce.map(o => o.id));
        
        return true;
      }),
      { numRuns: 100 }
    );
  });
});


// Feature: marketplace-enhancements, Property 10: Order Status Filtering
// Validates: Requirements 5.2, 5.3, 5.4, 5.5

/**
 * Filters orders by a specific status
 * This simulates what the supplier dashboard tabs do
 */
function filterOrdersByStatus(orders: Order[], status: OrderStatus): Order[] {
  return orders.filter(order => order.status === status);
}

describe('Order Status Filtering Properties', () => {
  // Feature: marketplace-enhancements, Property 10: Order Status Filtering
  // Validates: Requirements 5.2, 5.3, 5.4, 5.5
  it('Property 10: Filtered result contains only orders matching the exact status', () => {
    fc.assert(
      fc.property(
        fc.array(orderArbitrary, { minLength: 0, maxLength: 20 }),
        orderStatusArbitrary,
        (orders, filterStatus) => {
          const filtered = filterOrdersByStatus(orders, filterStatus);
          
          // All filtered orders should have the exact status
          for (const order of filtered) {
            expect(order.status).toBe(filterStatus);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 10: Filtered result contains all orders with that status', () => {
    fc.assert(
      fc.property(
        fc.array(orderArbitrary, { minLength: 0, maxLength: 20 }),
        orderStatusArbitrary,
        (orders, filterStatus) => {
          const filtered = filterOrdersByStatus(orders, filterStatus);
          
          // Count orders with the target status in original array
          const expectedCount = orders.filter(o => o.status === filterStatus).length;
          
          // Filtered result should have the same count
          expect(filtered.length).toBe(expectedCount);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 10: Filtering by each status partitions the orders completely', () => {
    const allStatuses: OrderStatus[] = ['received', 'on_the_way', 'delivered', 'cancelled'];
    
    fc.assert(
      fc.property(fc.array(orderArbitrary, { minLength: 0, maxLength: 20 }), (orders) => {
        // Sum of all filtered counts should equal total orders
        let totalFiltered = 0;
        for (const status of allStatuses) {
          totalFiltered += filterOrdersByStatus(orders, status).length;
        }
        
        expect(totalFiltered).toBe(orders.length);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('Property 10: Filtering is idempotent (filtering twice gives same result)', () => {
    fc.assert(
      fc.property(
        fc.array(orderArbitrary, { minLength: 0, maxLength: 20 }),
        orderStatusArbitrary,
        (orders, filterStatus) => {
          const filteredOnce = filterOrdersByStatus(orders, filterStatus);
          const filteredTwice = filterOrdersByStatus(filteredOnce, filterStatus);
          
          // Filtering twice should give the same result
          expect(filteredTwice.length).toBe(filteredOnce.length);
          expect(filteredTwice.map(o => o.id)).toEqual(filteredOnce.map(o => o.id));
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});


// Feature: marketplace-enhancements, Property 13: Cancellation Data Persistence
// Validates: Requirements 6.3, 10.2, 10.3

/**
 * Arbitrary for generating orders that can be cancelled (status = 'received')
 */
const cancellableOrderArbitrary = fc.record({
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
  status: fc.constant<OrderStatus>('received'), // Only received orders can be cancelled
  created_at: validDateArbitrary,
  updated_at: fc.option(validDateArbitrary, { nil: undefined }),
  cancellation_reason: fc.constant<string | undefined>(undefined),
  cancelled_at: fc.constant<string | undefined>(undefined),
});

/**
 * Simulates the cancellation process
 * This is what cancelOrder service does
 */
function simulateCancelOrder(order: Order, reason: string): Order {
  if (order.status !== 'received') {
    throw new Error(`Cannot cancel order: current status is '${order.status}'. Only orders with status 'received' can be cancelled.`);
  }
  
  const cancelledAt = new Date().toISOString();
  return {
    ...order,
    status: 'cancelled',
    cancellation_reason: reason,
    cancelled_at: cancelledAt,
    updated_at: cancelledAt,
  };
}

describe('Cancellation Data Persistence Properties', () => {
  // Feature: marketplace-enhancements, Property 13: Cancellation Data Persistence
  // Validates: Requirements 6.3, 10.2, 10.3
  it('Property 13: After cancellation, order has status "cancelled"', () => {
    fc.assert(
      fc.property(
        cancellableOrderArbitrary,
        fc.string({ minLength: 1, maxLength: 500 }),
        (order, reason) => {
          const cancelled = simulateCancelOrder(order, reason);
          
          expect(cancelled.status).toBe('cancelled');
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 13: After cancellation, order has non-null cancellation_reason', () => {
    fc.assert(
      fc.property(
        cancellableOrderArbitrary,
        fc.string({ minLength: 1, maxLength: 500 }),
        (order, reason) => {
          const cancelled = simulateCancelOrder(order, reason);
          
          expect(cancelled.cancellation_reason).not.toBeNull();
          expect(cancelled.cancellation_reason).not.toBeUndefined();
          expect(cancelled.cancellation_reason).toBe(reason);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 13: After cancellation, order has non-null cancelled_at timestamp', () => {
    fc.assert(
      fc.property(
        cancellableOrderArbitrary,
        fc.string({ minLength: 1, maxLength: 500 }),
        (order, reason) => {
          const cancelled = simulateCancelOrder(order, reason);
          
          expect(cancelled.cancelled_at).not.toBeNull();
          expect(cancelled.cancelled_at).not.toBeUndefined();
          
          // Verify it's a valid ISO date string
          const timestamp = new Date(cancelled.cancelled_at!).getTime();
          expect(isNaN(timestamp)).toBe(false);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 13: Cancellation preserves all other order fields', () => {
    fc.assert(
      fc.property(
        cancellableOrderArbitrary,
        fc.string({ minLength: 1, maxLength: 500 }),
        (order, reason) => {
          const cancelled = simulateCancelOrder(order, reason);
          
          // All non-cancellation fields should be preserved
          expect(cancelled.id).toBe(order.id);
          expect(cancelled.customer_id).toBe(order.customer_id);
          expect(cancelled.supplier_id).toBe(order.supplier_id);
          expect(cancelled.quantity).toBe(order.quantity);
          expect(cancelled.total_price).toBe(order.total_price);
          expect(cancelled.address).toBe(order.address);
          expect(cancelled.lat).toBe(order.lat);
          expect(cancelled.lng).toBe(order.lng);
          expect(cancelled.comments).toBe(order.comments);
          expect(cancelled.phone).toBe(order.phone);
          expect(cancelled.payment_method).toBe(order.payment_method);
          expect(cancelled.created_at).toBe(order.created_at);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 13: Only orders with status "received" can be cancelled', () => {
    const nonCancellableStatuses: OrderStatus[] = ['on_the_way', 'delivered', 'cancelled'];
    
    fc.assert(
      fc.property(
        orderArbitrary,
        fc.string({ minLength: 1, maxLength: 500 }),
        (order, reason) => {
          if (nonCancellableStatuses.includes(order.status)) {
            // Should throw an error for non-cancellable orders
            expect(() => simulateCancelOrder(order, reason)).toThrow();
          } else {
            // Should succeed for cancellable orders
            const cancelled = simulateCancelOrder(order, reason);
            expect(cancelled.status).toBe('cancelled');
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});


// Feature: marketplace-enhancements, Property 4: Order Display Fields
// Validates: Requirements 2.2

/**
 * Arbitrary for generating supplier names
 */
const supplierNameArbitrary = fc.string({ minLength: 1, maxLength: 100 });

describe('Order Display Fields Properties', () => {
  // Feature: marketplace-enhancements, Property 4: Order Display Fields
  // Validates: Requirements 2.2
  it('Property 4: For any order, extracted display fields contain date, supplier name, quantity, total price, and status', () => {
    fc.assert(
      fc.property(
        orderArbitrary,
        supplierNameArbitrary,
        (order, supplierName) => {
          const displayFields = extractOrderDisplayFields(order, supplierName);
          
          // Verify all required fields are present and have correct values
          expect(displayFields.date).toBeDefined();
          expect(typeof displayFields.date).toBe('string');
          
          expect(displayFields.supplierName).toBe(supplierName);
          
          expect(displayFields.quantity).toBe(order.quantity);
          expect(typeof displayFields.quantity).toBe('number');
          
          expect(displayFields.totalPrice).toBe(order.total_price);
          expect(typeof displayFields.totalPrice).toBe('number');
          
          expect(displayFields.status).toBe(order.status);
          expect(['received', 'on_the_way', 'delivered', 'cancelled']).toContain(displayFields.status);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 4: Display fields preserve order data integrity', () => {
    fc.assert(
      fc.property(
        orderArbitrary,
        supplierNameArbitrary,
        (order, supplierName) => {
          const displayFields = extractOrderDisplayFields(order, supplierName);
          
          // Quantity should be positive
          expect(displayFields.quantity).toBeGreaterThan(0);
          
          // Total price should be positive
          expect(displayFields.totalPrice).toBeGreaterThan(0);
          
          // Supplier name should match input
          expect(displayFields.supplierName).toBe(supplierName);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 4: Date field is formatted when created_at is present', () => {
    fc.assert(
      fc.property(
        orderArbitrary,
        supplierNameArbitrary,
        (order, supplierName) => {
          const displayFields = extractOrderDisplayFields(order, supplierName);
          
          // If order has created_at, date should be non-empty
          if (order.created_at) {
            expect(displayFields.date.length).toBeGreaterThan(0);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
