import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { 
  isValidTransition, 
  getNextStatus, 
  canAcceptOrder, 
  canCompleteOrder,
  canCancelOrder,
  isActiveOrder,
  isTerminalStatus,
  ORDER_STATUSES 
} from '../utils/orderStatus';
import type { OrderStatus } from '../types';

// Feature: tashkent-water-marketplace, Property 8: Order Status State Machine
// Validates: Requirements 5.4, 6.2, 8.2, 8.5

/**
 * Arbitrary for generating valid OrderStatus values (including cancelled)
 */
const orderStatusArbitrary = fc.constantFrom<OrderStatus>('received', 'on_the_way', 'delivered', 'cancelled');

describe('Order Status Property Tests', () => {
  // Property 8: Order Status State Machine
  describe('Property 8: Order Status State Machine', () => {
    it('For any order status, only valid transitions are allowed per the state machine', () => {
      fc.assert(
        fc.property(orderStatusArbitrary, (currentStatus) => {
          // Define expected valid transitions for each status
          const expectedTransitions: Record<OrderStatus, OrderStatus[]> = {
            received: ['on_the_way', 'cancelled'],
            on_the_way: ['delivered'],
            delivered: [],
            cancelled: [],
          };
          
          // Check all possible transitions
          for (const targetStatus of ORDER_STATUSES) {
            const isValid = isValidTransition(currentStatus, targetStatus);
            const shouldBeValid = expectedTransitions[currentStatus].includes(targetStatus);
            
            expect(isValid).toBe(shouldBeValid);
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
          if (currentStatus === 'cancelled') {
            expect(isValidTransition(currentStatus, 'received')).toBe(false);
            expect(isValidTransition(currentStatus, 'on_the_way')).toBe(false);
            expect(isValidTransition(currentStatus, 'delivered')).toBe(false);
          }
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('For any order status, skipping states is never valid (except cancellation)', () => {
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

    it('Terminal statuses (delivered, cancelled) have no valid next status', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<OrderStatus>('delivered', 'cancelled'),
          (status) => {
            expect(getNextStatus(status)).toBeNull();
            
            // No transitions should be valid from terminal states
            for (const targetStatus of ORDER_STATUSES) {
              expect(isValidTransition(status, targetStatus)).toBe(false);
            }
            return true;
          }
        ),
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

  // Feature: marketplace-enhancements, Property 14: Extended Order Status State Machine
  // Validates: Requirements 10.4, 10.5
  describe('Property 14: Extended Order Status State Machine', () => {
    it('For any order status transition, the transition is valid if and only if it follows the extended state machine rules', () => {
      fc.assert(
        fc.property(
          orderStatusArbitrary,
          orderStatusArbitrary,
          (currentStatus, targetStatus) => {
            const isValid = isValidTransition(currentStatus, targetStatus);
            
            // Define the expected validity based on state machine rules
            let expectedValid = false;
            
            if (currentStatus === 'received') {
              expectedValid = targetStatus === 'on_the_way' || targetStatus === 'cancelled';
            } else if (currentStatus === 'on_the_way') {
              expectedValid = targetStatus === 'delivered';
            }
            // delivered and cancelled are terminal - no valid transitions
            
            expect(isValid).toBe(expectedValid);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('For any order, cancellation is only allowed from received status', () => {
      fc.assert(
        fc.property(orderStatusArbitrary, (status) => {
          const canCancel = canCancelOrder(status);
          const transitionValid = isValidTransition(status, 'cancelled');
          
          // canCancelOrder should match whether transition to cancelled is valid
          expect(canCancel).toBe(transitionValid);
          
          // Only received status should allow cancellation
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

    it('Terminal statuses (delivered, cancelled) do not allow any transitions', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<OrderStatus>('delivered', 'cancelled'),
          orderStatusArbitrary,
          (terminalStatus, targetStatus) => {
            expect(isValidTransition(terminalStatus, targetStatus)).toBe(false);
            expect(isTerminalStatus(terminalStatus)).toBe(true);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Non-terminal statuses (received, on_the_way) are not terminal', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<OrderStatus>('received', 'on_the_way'),
          (activeStatus) => {
            expect(isTerminalStatus(activeStatus)).toBe(false);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


// Feature: marketplace-enhancements, Property 2: Active Order Detection
// Validates: Requirements 1.3
describe('Property 2: Active Order Detection', () => {
  it('For any order, the order is active if and only if its status is neither delivered nor cancelled', () => {
    fc.assert(
      fc.property(orderStatusArbitrary, (status) => {
        const isActive = isActiveOrder(status);
        const isTerminal = isTerminalStatus(status);
        
        // Active and terminal should be mutually exclusive
        expect(isActive).toBe(!isTerminal);
        
        // Specific status checks
        if (status === 'received' || status === 'on_the_way') {
          expect(isActive).toBe(true);
          expect(isTerminal).toBe(false);
        } else {
          // delivered or cancelled
          expect(isActive).toBe(false);
          expect(isTerminal).toBe(true);
        }
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('For any order with active status, there exists at least one valid transition', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<OrderStatus>('received', 'on_the_way'),
        (activeStatus) => {
          expect(isActiveOrder(activeStatus)).toBe(true);
          
          // Active orders should have at least one valid transition
          const hasValidTransition = ORDER_STATUSES.some(
            target => isValidTransition(activeStatus, target)
          );
          expect(hasValidTransition).toBe(true);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('For any order with terminal status, there are no valid transitions', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<OrderStatus>('delivered', 'cancelled'),
        (terminalStatus) => {
          expect(isActiveOrder(terminalStatus)).toBe(false);
          expect(isTerminalStatus(terminalStatus)).toBe(true);
          
          // Terminal orders should have no valid transitions
          const hasValidTransition = ORDER_STATUSES.some(
            target => isValidTransition(terminalStatus, target)
          );
          expect(hasValidTransition).toBe(false);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
