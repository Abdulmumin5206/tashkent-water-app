import type { OrderStatus } from '../types';

/**
 * Valid order status transitions
 * State machine: received → on_the_way → delivered
 */
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus | null> = {
  received: 'on_the_way',
  on_the_way: 'delivered',
  delivered: null, // Terminal state
};

/**
 * Checks if a status transition is valid
 * @param currentStatus - Current order status
 * @param newStatus - Proposed new status
 * @returns true if the transition is valid, false otherwise
 */
export function isValidTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
  return VALID_TRANSITIONS[currentStatus] === newStatus;
}

/**
 * Gets the next valid status in the order lifecycle
 * @param currentStatus - Current order status
 * @returns The next status, or null if at terminal state
 */
export function getNextStatus(currentStatus: OrderStatus): OrderStatus | null {
  return VALID_TRANSITIONS[currentStatus];
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
 * All valid order statuses
 */
export const ORDER_STATUSES: OrderStatus[] = ['received', 'on_the_way', 'delivered'];

/**
 * Human-readable labels for order statuses
 */
export const STATUS_LABELS: Record<OrderStatus, string> = {
  received: 'Order Received',
  on_the_way: 'Driver on the Way',
  delivered: 'Delivered',
};
