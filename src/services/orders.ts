import { supabase } from './supabase';
import type { Order, OrderInput, OrderStatus } from '../types';

// Valid status transitions
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  received: ['on_the_way'],
  on_the_way: ['delivered'],
  delivered: [],
};

/**
 * Creates a new order with status 'received'
 * @param orderData - The order input data
 * @returns Promise<Order> - The created order
 */
export async function createOrder(orderData: OrderInput): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .insert({
      ...orderData,
      status: 'received',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating order:', error);
    throw error;
  }

  return data;
}

/**
 * Updates an order's status following the valid state machine
 * @param orderId - The order's UUID
 * @param newStatus - The new status to set
 * @returns Promise<Order> - The updated order
 * @throws Error if the transition is invalid
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus
): Promise<Order> {
  // First, get the current order to validate the transition
  const { data: currentOrder, error: fetchError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (fetchError) {
    console.error('Error fetching order:', fetchError);
    throw fetchError;
  }

  // Validate the status transition
  const currentStatus = currentOrder.status as OrderStatus;
  const validNextStatuses = VALID_TRANSITIONS[currentStatus];

  if (!validNextStatuses.includes(newStatus)) {
    throw new Error(
      `Invalid status transition: ${currentStatus} -> ${newStatus}. Valid transitions: ${validNextStatuses.join(', ') || 'none'}`
    );
  }

  // Update the status
  const { data, error } = await supabase
    .from('orders')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    console.error('Error updating order status:', error);
    throw error;
  }

  return data;
}

/**
 * Gets all orders with a specific status
 * @param status - The status to filter by
 * @returns Promise<Order[]> - Array of orders with the given status
 */
export async function getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders by status:', error);
    throw error;
  }

  return data || [];
}

/**
 * Gets all orders for a specific customer
 * @param customerId - The customer's UUID
 * @returns Promise<Order[]> - Array of customer's orders
 */
export async function getCustomerOrders(customerId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching customer orders:', error);
    throw error;
  }

  return data || [];
}

/**
 * Gets a single order by ID
 * @param orderId - The order's UUID
 * @returns Promise<Order | null> - The order or null if not found
 */
export async function getOrderById(orderId: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching order:', error);
    throw error;
  }

  return data;
}

/**
 * Subscribes to real-time updates for a specific order
 * @param orderId - The order's UUID
 * @param callback - Function to call when order is updated
 * @returns Unsubscribe function
 */
export function subscribeToOrder(
  orderId: string,
  callback: (order: Order) => void
): () => void {
  const subscription = supabase
    .channel(`order-${orderId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`,
      },
      (payload) => {
        callback(payload.new as Order);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}

/**
 * Subscribes to real-time updates for orders with a specific status
 * @param status - The status to filter by
 * @param callback - Function to call when orders change
 * @returns Unsubscribe function
 */
export function subscribeToOrdersByStatus(
  status: OrderStatus,
  callback: (order: Order, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
): () => void {
  const subscription = supabase
    .channel(`orders-${status}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `status=eq.${status}`,
      },
      (payload) => {
        callback(payload.new as Order, payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE');
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}
