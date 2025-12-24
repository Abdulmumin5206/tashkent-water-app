import type { Order, Supplier, CartItem } from '../types';

/**
 * Creates a cart from a previous order for reordering
 * @param order - The order to reorder from
 * @param supplier - The supplier associated with the order
 * @returns CartItem array containing the same supplier and quantity as the original order
 */
export function createReorderCart(order: Order, supplier: Supplier): CartItem[] {
  return [
    {
      supplier,
      quantity: order.quantity,
    },
  ];
}
