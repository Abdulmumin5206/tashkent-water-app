import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { canCancelOrder } from '../utils/orderStatus';
import type { OrderStatus } from '../types';

// Feature: marketplace-enhancements, Property 12: Cancellation Availability
// Validates: Requirements 6.1, 6.5

/**
 * Arbitrary for generating valid OrderStatus values
 */
const orderStatusArbitrary = fc.constantFrom<OrderStatus>('received', 'on_the_way', 'delivered', 'cancelled');

describe('Property 12: Cancellation Availability', () => {
  it('For any order, cancellation should be allowed if and only if the order status is "received"', () => {
    fc.assert(
      fc.property(orderStatusArbitrary, (status) => {
        const canCancel = canCancelOrder(status);
        
        // Cancellation should only be allowed for 'received' status
        if (status === 'received') {
          expect(canCancel).toBe(true);
        } else {
          expect(canCancel).toBe(false);
        }
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('Orders with status "on_the_way" should not be cancellable (Requirement 6.5)', () => {
    fc.assert(
      fc.property(fc.constant('on_the_way' as OrderStatus), (status) => {
        expect(canCancelOrder(status)).toBe(false);
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('Orders with status "delivered" should not be cancellable (Requirement 6.5)', () => {
    fc.assert(
      fc.property(fc.constant('delivered' as OrderStatus), (status) => {
        expect(canCancelOrder(status)).toBe(false);
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('Orders with status "cancelled" should not be cancellable again', () => {
    fc.assert(
      fc.property(fc.constant('cancelled' as OrderStatus), (status) => {
        expect(canCancelOrder(status)).toBe(false);
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('For any non-received status, cancellation is not allowed', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<OrderStatus>('on_the_way', 'delivered', 'cancelled'),
        (status) => {
          expect(canCancelOrder(status)).toBe(false);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
