import type { Order, OrderStatus, DailySummary } from '../types';

/**
 * Formats a date to YYYY-MM-DD string in local timezone
 * @param date - The date to format
 * @returns Date string in YYYY-MM-DD format
 */
function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates daily summary statistics for a set of orders on a specific date
 * @param orders - Array of orders to analyze
 * @param date - The date to calculate summary for
 * @returns DailySummary with totalOrders, completedOrders, cancelledOrders, and totalRevenue
 */
export function calculateDailySummary(orders: Order[], date: Date): DailySummary {
  // Normalize the target date to start of day for comparison
  const targetDateStart = new Date(date);
  targetDateStart.setHours(0, 0, 0, 0);
  
  const targetDateEnd = new Date(date);
  targetDateEnd.setHours(23, 59, 59, 999);

  // Filter orders created on the target date
  const ordersOnDate = orders.filter((order) => {
    if (!order.created_at) return false;
    const orderDate = new Date(order.created_at);
    return orderDate >= targetDateStart && orderDate <= targetDateEnd;
  });

  // Count completed orders (delivered status)
  const completedOrders = ordersOnDate.filter(
    (order) => order.status === 'delivered'
  ).length;

  // Count cancelled orders
  const cancelledOrders = ordersOnDate.filter(
    (order) => order.status === 'cancelled'
  ).length;

  // Calculate total revenue from delivered orders only
  const totalRevenue = ordersOnDate
    .filter((order) => order.status === 'delivered')
    .reduce((sum, order) => sum + order.total_price, 0);

  return {
    totalOrders: ordersOnDate.length,
    completedOrders,
    cancelledOrders,
    totalRevenue,
    date: formatDateToYYYYMMDD(targetDateStart),
  };
}

/**
 * Gets the count of orders grouped by status
 * @param orders - Array of orders to count
 * @returns Record mapping each OrderStatus to its count
 */
export function getOrderCountByStatus(orders: Order[]): Record<OrderStatus, number> {
  // Initialize counts for all statuses
  const counts: Record<OrderStatus, number> = {
    received: 0,
    on_the_way: 0,
    delivered: 0,
    cancelled: 0,
  };

  // Count orders by status
  for (const order of orders) {
    if (order.status in counts) {
      counts[order.status]++;
    }
  }

  return counts;
}
