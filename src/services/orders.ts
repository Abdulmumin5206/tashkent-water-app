import { supabase } from './supabase';
import type { Order, OrderInput, OrderStatus } from '../types';

// Valid status transitions (extended to support cancellation)
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  received: ['on_the_way', 'cancelled'],
  on_the_way: ['delivered'],
  delivered: [],
  cancelled: [],
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


/**
 * Gets all orders for a specific customer, sorted by created_at DESC (newest first)
 * This is the order history function for customers
 * @param customerId - The customer's UUID
 * @returns Promise<Order[]> - Array of customer's orders sorted by date (newest first)
 */
export async function getCustomerOrderHistory(customerId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching customer order history:', error);
    throw error;
  }

  return data || [];
}

/**
 * Cancels an order with a reason
 * Only orders with status 'received' can be cancelled
 * @param orderId - The order's UUID
 * @param reason - The cancellation reason
 * @returns Promise<Order> - The cancelled order
 * @throws Error if the order cannot be cancelled
 */
export async function cancelOrder(orderId: string, reason: string): Promise<Order> {
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

  if (!validNextStatuses.includes('cancelled')) {
    throw new Error(
      `Cannot cancel order: current status is '${currentStatus}'. Only orders with status 'received' can be cancelled.`
    );
  }

  // Update the order with cancellation data
  const cancelledAt = new Date().toISOString();
  const { data, error } = await supabase
    .from('orders')
    .update({
      status: 'cancelled',
      cancellation_reason: reason,
      cancelled_at: cancelledAt,
      updated_at: cancelledAt,
    })
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    console.error('Error cancelling order:', error);
    throw error;
  }

  return data;
}

/**
 * Gets the count of orders grouped by status
 * Optionally filtered by supplier
 * @param supplierId - Optional supplier UUID to filter by
 * @returns Promise<Record<OrderStatus, number>> - Count of orders for each status
 */
export async function getOrderCountsByStatus(
  supplierId?: string
): Promise<Record<OrderStatus, number>> {
  let query = supabase.from('orders').select('status');

  if (supplierId) {
    query = query.eq('supplier_id', supplierId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching order counts:', error);
    throw error;
  }

  // Initialize counts for all statuses
  const counts: Record<OrderStatus, number> = {
    received: 0,
    on_the_way: 0,
    delivered: 0,
    cancelled: 0,
  };

  // Count orders by status
  if (data) {
    for (const order of data) {
      const status = order.status as OrderStatus;
      if (status in counts) {
        counts[status]++;
      }
    }
  }

  return counts;
}
