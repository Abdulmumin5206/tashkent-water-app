import type { OrderStatus } from '../types';

/**
 * Valid order status transitions
 * Extended state machine:
 * - received → on_the_way (driver accepts)
 * - received → cancelled (supplier cancels)
 * - on_the_way → delivered (driver completes)
 * - delivered → (terminal state)
 * - cancelled → (terminal state)
 */
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  received: ['on_the_way', 'cancelled'],
  on_the_way: ['delivered'],
  delivered: [], // Terminal state
  cancelled: [], // Terminal state
};

/**
 * Terminal statuses - no further transitions allowed
 */
const TERMINAL_STATUSES: OrderStatus[] = ['delivered', 'cancelled'];

/**
 * Active statuses - orders that are still in progress
 */
const ACTIVE_STATUSES: OrderStatus[] = ['received', 'on_the_way'];

/**
 * Checks if a status transition is valid
 * @param currentStatus - Current order status
 * @param newStatus - Proposed new status
 * @returns true if the transition is valid, false otherwise
 */
export function isValidTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
  return VALID_TRANSITIONS[currentStatus].includes(newStatus);
}

/**
 * Gets the next valid status in the order lifecycle (for normal flow)
 * @param currentStatus - Current order status
 * @returns The next status in normal flow, or null if at terminal state
 */
export function getNextStatus(currentStatus: OrderStatus): OrderStatus | null {
  // For normal flow, return the first valid transition (not cancelled)
  const transitions = VALID_TRANSITIONS[currentStatus];
  const normalTransition = transitions.find(s => s !== 'cancelled');
  return normalTransition ?? null;
}

/**
 * Checks if an order can be accepted by a driver
 * Orders can only be accepted when in "received" status
 * @param status - Current order status
 * @returns true if the order can be accepted
 */
export function canAcceptOrder(status: OrderStatus): boolean {
  return status === 'received';
}

/**
 * Checks if an order can be marked as delivered
 * Orders can only be completed when in "on_the_way" status
 * @param status - Current order status
 * @returns true if the order can be marked as delivered
 */
export function canCompleteOrder(status: OrderStatus): boolean {
  return status === 'on_the_way';
}

/**
 * Checks if an order can be cancelled
 * Orders can only be cancelled when in "received" status
 * @param status - Current order status
 * @returns true if the order can be cancelled
 */
export function canCancelOrder(status: OrderStatus): boolean {
  return status === 'received';
}

/**
 * Checks if an order is active (not in a terminal state)
 * Active orders are those with status "received" or "on_the_way"
 * @param status - Current order status
 * @returns true if the order is active
 */
export function isActiveOrder(status: OrderStatus): boolean {
  return ACTIVE_STATUSES.includes(status);
}

/**
 * Checks if a status is terminal (no further transitions allowed)
 * Terminal statuses are "delivered" and "cancelled"
 * @param status - Current order status
 * @returns true if the status is terminal
 */
export function isTerminalStatus(status: OrderStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/**
 * All valid order statuses
 */
export const ORDER_STATUSES: OrderStatus[] = ['received', 'on_the_way', 'delivered', 'cancelled'];

/**
 * Human-readable labels for order statuses
 */
export const STATUS_LABELS: Record<OrderStatus, string> = {
  received: 'Order Received',
  on_the_way: 'Driver on the Way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};
