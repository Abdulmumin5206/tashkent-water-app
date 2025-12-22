import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { 
  isValidTransition, 
  getNextStatus, 
  canAcceptOrder, 
  canCompleteOrder,
  ORDER_STATUSES 
} from '../utils/orderStatus';
import type { OrderStatus } from '../types';

// Feature: tashkent-water-marketplace, Property 8: Order Status State Machine
// Validates: Requirements 5.4, 6.2, 8.2, 8.5

/**
 * Arbitrary for generating valid OrderStatus values
 */
const orderStatusArbitrary = fc.constantFrom<OrderStatus>('received', 'on_the_way', 'delivered');

describe('Order Status Property Tests', () => {
  // Property 8: Order Status State Machine
  describe('Property 8: Order Status State Machine', () => {
    it('For any order status, only the next status in sequence is a valid transition', () => {
      fc.assert(
        fc.property(orderStatusArbitrary, (currentStatus) => {
          const nextStatus = getNextStatus(currentStatus);
          
          // Check all possible transitions
          for (const targetStatus of ORDER_STATUSES) {
            const isValid = isValidTransition(currentStatus, targetStatus);
            
            if (nextStatus === targetStatus) {
              // Should be valid if it's the next status
              expect(isValid).toBe(true);
            } else {
              // Should be invalid for any other status
              expect(isValid).toBe(false);
            }
          }
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('For any order status, backward transitions are never valid', () => {
      fc.assert(
        fc.property(orderStatusArbitrary, (currentStatus) => {
          // Define backward transitions
          if (currentStatus === 'on_the_way') {
            expect(isValidTransition(currentStatus, 'received')).toBe(false);
          }
          if (currentStatus === 'delivered') {
            expect(isValidTransition(currentStatus, 'received')).toBe(false);
            expect(isValidTransition(currentStatus, 'on_the_way')).toBe(false);
          }
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('For any order status, skipping states is never valid', () => {
      fc.assert(
        fc.property(orderStatusArbitrary, (currentStatus) => {
          // received -> delivered (skipping on_the_way) should be invalid
          if (currentStatus === 'received') {
            expect(isValidTransition(currentStatus, 'delivered')).toBe(false);
          }
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('For any order status, transitioning to the same status is never valid', () => {
      fc.assert(
        fc.property(orderStatusArbitrary, (currentStatus) => {
          expect(isValidTransition(currentStatus, currentStatus)).toBe(false);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('The delivered status is a terminal state with no valid next status', () => {
      fc.assert(
        fc.property(fc.constant('delivered' as OrderStatus), (status) => {
          expect(getNextStatus(status)).toBeNull();
          
          // No transitions should be valid from delivered
          for (const targetStatus of ORDER_STATUSES) {
            expect(isValidTransition(status, targetStatus)).toBe(false);
          }
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('For any order, canAcceptOrder is true only when status is received', () => {
      fc.assert(
        fc.property(orderStatusArbitrary, (status) => {
          const canAccept = canAcceptOrder(status);
          
          if (status === 'received') {
            expect(canAccept).toBe(true);
          } else {
            expect(canAccept).toBe(false);
          }
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('For any order, canCompleteOrder is true only when status is on_the_way', () => {
      fc.assert(
        fc.property(orderStatusArbitrary, (status) => {
          const canComplete = canCompleteOrder(status);
          
          if (status === 'on_the_way') {
            expect(canComplete).toBe(true);
          } else {
            expect(canComplete).toBe(false);
          }
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('The state machine follows the exact sequence: received → on_the_way → delivered', () => {
      // This test verifies the complete state machine path
      fc.assert(
        fc.property(fc.constant(true), () => {
          // Start at received
          let status: OrderStatus = 'received';
          
          // Can accept order at received
          expect(canAcceptOrder(status)).toBe(true);
          expect(canCompleteOrder(status)).toBe(false);
          
          // Transition to on_the_way
          expect(isValidTransition(status, 'on_the_way')).toBe(true);
          status = 'on_the_way';
          
          // Can complete order at on_the_way
          expect(canAcceptOrder(status)).toBe(false);
          expect(canCompleteOrder(status)).toBe(true);
          
          // Transition to delivered
          expect(isValidTransition(status, 'delivered')).toBe(true);
          status = 'delivered';
          
          // Terminal state - no more actions
          expect(canAcceptOrder(status)).toBe(false);
          expect(canCompleteOrder(status)).toBe(false);
          expect(getNextStatus(status)).toBeNull();
          
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });
});
