import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDriver } from '../contexts/DriverContext';
import { getOrdersByStatus, subscribeToOrdersByStatus } from '../services/orders';
import { getCustomerById } from '../services/customers';
import { getSupplierById } from '../services/suppliers';
import type { Order, Customer, Supplier } from '../types';

interface OrderWithDetails extends Order {
  customer?: Customer | null;
  supplier?: Supplier | null;
}

interface OrderCardProps {
  order: OrderWithDetails;
  onClick: (orderId: string) => void;
}

/**
 * OrderCard - Displays order summary for driver dashboard
 * Requirements: 7.3 - Display customer name, phone, address, quantity, payment method, timestamp
 */
const OrderCard: React.FC<OrderCardProps> = ({ order, onClick }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPaymentMethod = (method: string) => {
    return method === 'cash' ? 'Наличные' : 'Перевод на карту';
  };

  return (
    <div
      className="bg-white rounded-lg shadow-md p-4 mb-3 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => onClick(order.id)}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="font-semibold text-gray-800">
          {order.customer?.name || 'Клиент'}
        </div>
        <div className="text-sm text-gray-500">
          {formatDate(order.created_at)}
        </div>
      </div>
      
      <div className="text-sm text-gray-600 mb-2">
        <a 
          href={`tel:${order.phone}`} 
          className="text-blue-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {order.phone}
        </a>
      </div>
      
      <div className="text-sm text-gray-600 mb-2 line-clamp-2">
        📍 {order.address}
        {order.comments && <span className="text-gray-500"> ({order.comments})</span>}
      </div>
      
      <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-4">
          <span className="text-sm">
            💧 {order.quantity} бут.
          </span>
          <span className="text-sm font-medium text-green-600">
            {order.total_price.toLocaleString()} сум
          </span>
        </div>
        <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
          {formatPaymentMethod(order.payment_method)}
        </span>
      </div>
      
      {order.supplier && (
        <div className="text-xs text-gray-500 mt-2">
          Поставщик: {order.supplier.name}
        </div>
      )}
    </div>
  );
};

interface DriverDashboardPageProps {
  onOrderClick?: (orderId: string) => void;
}

/**
 * DriverDashboardPage - Shows incoming orders with status "received"
 * 
 * Requirements: 7.2, 7.3, 7.4
 * - Display list of orders with status "received"
 * - Show customer info, address, quantity, payment method, timestamp
 * - Real-time updates for new orders
 */
const DriverDashboardPage: React.FC<DriverDashboardPageProps> = ({ onOrderClick }) => {
  const navigate = useNavigate();
  const { logout } = useDriver();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch customer and supplier details for an order
  const enrichOrderWithDetails = useCallback(async (order: Order): Promise<OrderWithDetails> => {
    try {
      const [customer, supplier] = await Promise.all([
        getCustomerById(order.customer_id),
        getSupplierById(order.supplier_id),
      ]);
      return { ...order, customer, supplier };
    } catch {
      return { ...order, customer: null, supplier: null };
    }
  }, []);

  // Load initial orders
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const receivedOrders = await getOrdersByStatus('received');
        
        // Enrich orders with customer and supplier details
        const enrichedOrders = await Promise.all(
          receivedOrders.map(enrichOrderWithDetails)
        );
        
        setOrders(enrichedOrders);
      } catch (err) {
        console.error('Error loading orders:', err);
        setError('Не удалось загрузить заказы');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, [enrichOrderWithDetails]);

  // Subscribe to real-time updates for new orders
  useEffect(() => {
    const unsubscribe = subscribeToOrdersByStatus('received', async (order, eventType) => {
      if (eventType === 'INSERT') {
        // New order received - add to list
        const enrichedOrder = await enrichOrderWithDetails(order);
        setOrders(prev => [enrichedOrder, ...prev]);
      } else if (eventType === 'UPDATE') {
        // Order updated - if status changed from 'received', remove it
        if (order.status !== 'received') {
          setOrders(prev => prev.filter(o => o.id !== order.id));
        } else {
          // Update the order in place
          const enrichedOrder = await enrichOrderWithDetails(order);
          setOrders(prev => prev.map(o => o.id === order.id ? enrichedOrder : o));
        }
      } else if (eventType === 'DELETE') {
        // Order deleted - remove from list
        setOrders(prev => prev.filter(o => o.id !== order.id));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [enrichOrderWithDetails]);

  const handleOrderClick = (orderId: string) => {
    if (onOrderClick) {
      onOrderClick(orderId);
    } else {
      navigate(`/driver/order/${orderId}`);
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Загрузка заказов...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">
            Новые заказы
          </h1>
          <button
            onClick={handleLogout}
            className="text-sm text-red-600 hover:text-red-700"
          >
            Выйти
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <div className="text-gray-600">Нет новых заказов</div>
            <div className="text-sm text-gray-500 mt-2">
              Новые заказы появятся здесь автоматически
            </div>
          </div>
        ) : (
          <div>
            <div className="text-sm text-gray-500 mb-3">
              {orders.length} {orders.length === 1 ? 'заказ' : 
                orders.length < 5 ? 'заказа' : 'заказов'}
            </div>
            {orders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onClick={handleOrderClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverDashboardPage;
