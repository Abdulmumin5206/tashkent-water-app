import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { Order, OrderStatus, PaymentMethod } from '../types';
import { calculateDailySummary, getOrderCountByStatus } from '../utils/analytics';

// Feature: marketplace-enhancements, Property 15: Daily Summary Calculations
// Validates: Requirements 7.2

// Feature: marketplace-enhancements, Property 11: Order Count by Status
// Validates: Requirements 5.6

/**
 * Arbitrary for generating valid Order data
 */
const orderStatusArbitrary = fc.constantFrom<OrderStatus>('received', 'on_the_way', 'delivered', 'cancelled');
const paymentMethodArbitrary = fc.constantFrom<PaymentMethod>('cash', 'card_transfer');

// Tashkent coordinate bounds
const tashkentLatArbitrary = fc.float({ min: Math.fround(41.2), max: Math.fround(41.4), noNaN: true });
const tashkentLngArbitrary = fc.float({ min: Math.fround(69.1), max: Math.fround(69.4), noNaN: true });

/**
 * Creates an order arbitrary for a specific date
 */
function createOrderArbitraryForDate(targetDate: Date): fc.Arbitrary<Order> {
  // Create timestamps within the target date
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const dateArbitrary = fc.integer({
    min: startOfDay.getTime(),
    max: endOfDay.getTime(),
  }).map(timestamp => new Date(timestamp).toISOString());

  return fc.record({
    id: fc.uuid(),
    customer_id: fc.uuid(),
    supplier_id: fc.uuid(),
    quantity: fc.integer({ min: 1, max: 100 }),
    total_price: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
    address: fc.string({ minLength: 1, maxLength: 500 }),
    lat: tashkentLatArbitrary,
    lng: tashkentLngArbitrary,
    comments: fc.option(fc.string({ maxLength: 1000 }), { nil: undefined }),
    phone: fc.stringMatching(/^\+998[0-9]{9}$/),
    payment_method: paymentMethodArbitrary,
    status: orderStatusArbitrary,
    created_at: dateArbitrary,
    updated_at: fc.option(dateArbitrary, { nil: undefined }),
    cancellation_reason: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: undefined }),
    cancelled_at: fc.option(dateArbitrary, { nil: undefined }),
  });
}

/**
 * Creates an order arbitrary for a different date (not the target date)
 */
function createOrderArbitraryForDifferentDate(targetDate: Date): fc.Arbitrary<Order> {
  // Create timestamps outside the target date (either before or after)
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  // Use dates from a week before or after
  const beforeDate = new Date(startOfDay.getTime() - 7 * 24 * 60 * 60 * 1000);
  const afterDate = new Date(startOfDay.getTime() + 7 * 24 * 60 * 60 * 1000);

  const dateArbitrary = fc.oneof(
    fc.integer({
      min: beforeDate.getTime(),
      max: beforeDate.getTime() + 24 * 60 * 60 * 1000 - 1,
    }),
    fc.integer({
      min: afterDate.getTime(),
      max: afterDate.getTime() + 24 * 60 * 60 * 1000 - 1,
    })
  ).map(timestamp => new Date(timestamp).toISOString());

  return fc.record({
    id: fc.uuid(),
    customer_id: fc.uuid(),
    supplier_id: fc.uuid(),
    quantity: fc.integer({ min: 1, max: 100 }),
    total_price: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
    address: fc.string({ minLength: 1, maxLength: 500 }),
    lat: tashkentLatArbitrary,
    lng: tashkentLngArbitrary,
    comments: fc.option(fc.string({ maxLength: 1000 }), { nil: undefined }),
    phone: fc.stringMatching(/^\+998[0-9]{9}$/),
    payment_method: paymentMethodArbitrary,
    status: orderStatusArbitrary,
    created_at: dateArbitrary,
    updated_at: fc.option(dateArbitrary, { nil: undefined }),
    cancellation_reason: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: undefined }),
    cancelled_at: fc.option(dateArbitrary, { nil: undefined }),
  });
}

// General order arbitrary with any date
const validDateArbitrary = fc.integer({
  min: new Date('2020-01-01').getTime(),
  max: new Date('2030-12-31').getTime(),
}).map(timestamp => new Date(timestamp).toISOString());

const orderArbitrary = fc.record({
  id: fc.uuid(),
  customer_id: fc.uuid(),
  supplier_id: fc.uuid(),
  quantity: fc.integer({ min: 1, max: 100 }),
  total_price: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
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

describe('Daily Summary Calculations Properties', () => {
  // Feature: marketplace-enhancements, Property 15: Daily Summary Calculations
  // Validates: Requirements 7.2
  
  const targetDate = new Date('2024-06-15');

  it('Property 15: totalOrders equals count of all orders created on that date', () => {
    fc.assert(
      fc.property(
        fc.array(createOrderArbitraryForDate(targetDate), { minLength: 0, maxLength: 20 }),
        fc.array(createOrderArbitraryForDifferentDate(targetDate), { minLength: 0, maxLength: 10 }),
        (ordersOnDate, ordersOnOtherDates) => {
          const allOrders = [...ordersOnDate, ...ordersOnOtherDates];
          const summary = calculateDailySummary(allOrders, targetDate);

          // totalOrders should equal the count of orders on the target date
          expect(summary.totalOrders).toBe(ordersOnDate.length);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 15: completedOrders equals count of orders with status "delivered"', () => {
    fc.assert(
      fc.property(
        fc.array(createOrderArbitraryForDate(targetDate), { minLength: 0, maxLength: 20 }),
        (orders) => {
          const summary = calculateDailySummary(orders, targetDate);

          // Count delivered orders manually
          const expectedCompleted = orders.filter(o => o.status === 'delivered').length;

          expect(summary.completedOrders).toBe(expectedCompleted);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 15: totalRevenue equals sum of total_price for delivered orders', () => {
    fc.assert(
      fc.property(
        fc.array(createOrderArbitraryForDate(targetDate), { minLength: 0, maxLength: 20 }),
        (orders) => {
          const summary = calculateDailySummary(orders, targetDate);

          // Calculate expected revenue from delivered orders
          const expectedRevenue = orders
            .filter(o => o.status === 'delivered')
            .reduce((sum, o) => sum + o.total_price, 0);

          // Use approximate equality due to floating point
          expect(summary.totalRevenue).toBeCloseTo(expectedRevenue, 2);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 15: cancelledOrders equals count of orders with status "cancelled"', () => {
    fc.assert(
      fc.property(
        fc.array(createOrderArbitraryForDate(targetDate), { minLength: 0, maxLength: 20 }),
        (orders) => {
          const summary = calculateDailySummary(orders, targetDate);

          // Count cancelled orders manually
          const expectedCancelled = orders.filter(o => o.status === 'cancelled').length;

          expect(summary.cancelledOrders).toBe(expectedCancelled);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 15: Empty orders array produces zero counts and revenue', () => {
    fc.assert(
      fc.property(fc.constant([] as Order[]), (orders) => {
        const summary = calculateDailySummary(orders, targetDate);

        expect(summary.totalOrders).toBe(0);
        expect(summary.completedOrders).toBe(0);
        expect(summary.cancelledOrders).toBe(0);
        expect(summary.totalRevenue).toBe(0);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('Property 15: Orders from other dates are not counted', () => {
    fc.assert(
      fc.property(
        fc.array(createOrderArbitraryForDifferentDate(targetDate), { minLength: 1, maxLength: 20 }),
        (ordersOnOtherDates) => {
          const summary = calculateDailySummary(ordersOnOtherDates, targetDate);

          // No orders should be counted since they're all on different dates
          expect(summary.totalOrders).toBe(0);
          expect(summary.completedOrders).toBe(0);
          expect(summary.cancelledOrders).toBe(0);
          expect(summary.totalRevenue).toBe(0);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 15: Summary date matches the input date', () => {
    fc.assert(
      fc.property(
        fc.array(createOrderArbitraryForDate(targetDate), { minLength: 0, maxLength: 10 }),
        (orders) => {
          const summary = calculateDailySummary(orders, targetDate);

          // The date in summary should match the target date (YYYY-MM-DD format)
          const expectedDateStr = targetDate.toISOString().split('T')[0];
          expect(summary.date).toBe(expectedDateStr);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Order Count by Status Properties', () => {
  // Feature: marketplace-enhancements, Property 11: Order Count by Status
  // Validates: Requirements 5.6

  it('Property 11: Count for each status equals the number of orders with that status', () => {
    fc.assert(
      fc.property(
        fc.array(orderArbitrary, { minLength: 0, maxLength: 30 }),
        (orders) => {
          const counts = getOrderCountByStatus(orders);

          // Verify each status count
          const allStatuses: OrderStatus[] = ['received', 'on_the_way', 'delivered', 'cancelled'];
          for (const status of allStatuses) {
            const expectedCount = orders.filter(o => o.status === status).length;
            expect(counts[status]).toBe(expectedCount);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 11: Sum of all status counts equals total number of orders', () => {
    fc.assert(
      fc.property(
        fc.array(orderArbitrary, { minLength: 0, maxLength: 30 }),
        (orders) => {
          const counts = getOrderCountByStatus(orders);

          const totalCount = counts.received + counts.on_the_way + counts.delivered + counts.cancelled;
          expect(totalCount).toBe(orders.length);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 11: Empty orders array produces zero counts for all statuses', () => {
    fc.assert(
      fc.property(fc.constant([] as Order[]), (orders) => {
        const counts = getOrderCountByStatus(orders);

        expect(counts.received).toBe(0);
        expect(counts.on_the_way).toBe(0);
        expect(counts.delivered).toBe(0);
        expect(counts.cancelled).toBe(0);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('Property 11: All status keys are present in the result', () => {
    fc.assert(
      fc.property(
        fc.array(orderArbitrary, { minLength: 0, maxLength: 20 }),
        (orders) => {
          const counts = getOrderCountByStatus(orders);

          // All status keys should be present
          expect('received' in counts).toBe(true);
          expect('on_the_way' in counts).toBe(true);
          expect('delivered' in counts).toBe(true);
          expect('cancelled' in counts).toBe(true);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 11: Counts are non-negative integers', () => {
    fc.assert(
      fc.property(
        fc.array(orderArbitrary, { minLength: 0, maxLength: 20 }),
        (orders) => {
          const counts = getOrderCountByStatus(orders);

          const allStatuses: OrderStatus[] = ['received', 'on_the_way', 'delivered', 'cancelled'];
          for (const status of allStatuses) {
            expect(counts[status]).toBeGreaterThanOrEqual(0);
            expect(Number.isInteger(counts[status])).toBe(true);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
