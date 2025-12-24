import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDriver } from '../contexts/DriverContext';
import { getOrdersByStatus, subscribeToOrdersByStatus, cancelOrder } from '../services/orders';
import { getCustomerById } from '../services/customers';
import { getSupplierById } from '../services/suppliers';
import { calculateDailySummary, getOrderCountByStatus } from '../utils/analytics';
import { canCancelOrder } from '../utils/orderStatus';
import { StatusBadge, SkeletonLoader, EmptyState } from '../components';
import type { Order, Customer, Supplier, OrderStatus, OrderTab, DailySummary } from '../types';
import { TAB_STATUS_MAP } from '../types';

interface OrderWithDetails extends Order {
  customer?: Customer | null;
  supplier?: Supplier | null;
}

interface OrderCardProps {
  order: OrderWithDetails;
  onClick: (orderId: string) => void;
  onCancel?: (orderId: string) => void;
  showCancelButton?: boolean;
}

/**
 * OrderCard - Displays order summary for driver dashboard
 * Requirements: 7.3 - Display customer name, phone, address, quantity, payment method, timestamp
 * Requirements: 6.1 - Cancel button for received status only
 */
const OrderCard: React.FC<OrderCardProps> = ({ order, onClick, onCancel, showCancelButton }) => {
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

  const handleCancelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCancel) {
      onCancel(order.id);
    }
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
        <div className="flex items-center gap-2">
          <StatusBadge status={order.status} size="sm" />
          <span className="text-sm text-gray-500">
            {formatDate(order.created_at)}
          </span>
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
      
      {order.status === 'cancelled' && order.cancellation_reason && (
        <div className="text-sm text-red-600 mb-2 bg-red-50 p-2 rounded">
          Причина отмены: {order.cancellation_reason}
        </div>
      )}
      
      <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-4">
          <span className="text-sm">
            💧 {order.quantity} бут.
          </span>
          <span className="text-sm font-medium text-green-600">
            {order.total_price.toLocaleString()} сум
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
            {formatPaymentMethod(order.payment_method)}
          </span>
          {showCancelButton && canCancelOrder(order.status) && (
            <button
              onClick={handleCancelClick}
              className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors min-h-[28px]"
            >
              Отменить
            </button>
          )}
        </div>
      </div>
      
      {order.supplier && (
        <div className="text-xs text-gray-500 mt-2">
          Поставщик: {order.supplier.name}
        </div>
      )}
    </div>
  );
};


interface OrderTabsProps {
  activeTab: OrderTab;
  onTabChange: (tab: OrderTab) => void;
  counts: Record<OrderStatus, number>;
}

/**
 * OrderTabs - Tab navigation for filtering orders by status
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */
const OrderTabs: React.FC<OrderTabsProps> = ({ activeTab, onTabChange, counts }) => {
  const tabs: { key: OrderTab; label: string; status: OrderStatus }[] = [
    { key: 'new', label: 'Новые', status: 'received' },
    { key: 'in_progress', label: 'В пути', status: 'on_the_way' },
    { key: 'completed', label: 'Завершены', status: 'delivered' },
    { key: 'cancelled', label: 'Отменены', status: 'cancelled' },
  ];

  return (
    <div className="flex overflow-x-auto bg-white border-b border-gray-200 -mx-4 px-4">
      {tabs.map((tab) => {
        const count = counts[tab.status];
        const isActive = activeTab === tab.key;
        
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors min-h-[44px] ${
              isActive
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {count > 0 && (
              <span
                className={`px-1.5 py-0.5 text-xs rounded-full ${
                  isActive
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

interface AnalyticsSummaryCardProps {
  summary: DailySummary;
  isLoading?: boolean;
}

/**
 * AnalyticsSummaryCard - Displays today's statistics
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */
const AnalyticsSummaryCard: React.FC<AnalyticsSummaryCardProps> = ({ summary, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white mb-4">
        <div className="animate-pulse">
          <div className="h-4 bg-blue-400 rounded w-24 mb-3" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="h-6 bg-blue-400 rounded w-12 mb-1" />
                <div className="h-3 bg-blue-400 rounded w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white mb-4">
      <h3 className="text-sm font-medium opacity-90 mb-3">Сегодня</h3>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <div className="text-2xl font-bold">{summary.totalOrders}</div>
          <div className="text-xs opacity-80">Всего заказов</div>
        </div>
        <div>
          <div className="text-2xl font-bold">{summary.completedOrders}</div>
          <div className="text-xs opacity-80">Выполнено</div>
        </div>
        <div>
          <div className="text-2xl font-bold">
            {summary.totalRevenue > 0 
              ? `${(summary.totalRevenue / 1000).toFixed(0)}K` 
              : '0'}
          </div>
          <div className="text-xs opacity-80">Выручка (сум)</div>
        </div>
      </div>
    </div>
  );
};


interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isLoading?: boolean;
}

/**
 * CancelOrderModal - Modal for entering cancellation reason
 * Requirements: 6.2, 6.3
 */
const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}) => {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (reason.trim()) {
      onConfirm(reason.trim());
      setReason('');
    }
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Отменить заказ
        </h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Причина отмены
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Укажите причину отмены заказа..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={3}
            disabled={isLoading}
          />
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors min-h-[44px] disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            onClick={handleConfirm}
            disabled={!reason.trim() || isLoading}
            className="flex-1 px-4 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Отмена...' : 'Подтвердить'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface DriverDashboardPageProps {
  onOrderClick?: (orderId: string) => void;
}

/**
 * DriverDashboardPage - Enhanced supplier dashboard with tabs and analytics
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6 - Order tabs
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5 - Order cancellation
 * Requirements: 7.1, 7.2, 7.3, 7.4 - Analytics summary
 */
const DriverDashboardPage: React.FC<DriverDashboardPageProps> = ({ onOrderClick }) => {
  const navigate = useNavigate();
  const { logout } = useDriver();
  const [activeTab, setActiveTab] = useState<OrderTab>('new');
  const [allOrders, setAllOrders] = useState<OrderWithDetails[]>([]);
  const [orderCounts, setOrderCounts] = useState<Record<OrderStatus, number>>({
    received: 0,
    on_the_way: 0,
    delivered: 0,
    cancelled: 0,
  });
  const [dailySummary, setDailySummary] = useState<DailySummary>({
    totalOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    date: new Date().toISOString().split('T')[0],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

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

  // Load all orders for all statuses
  const loadAllOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const statuses: OrderStatus[] = ['received', 'on_the_way', 'delivered', 'cancelled'];
      const ordersByStatus = await Promise.all(
        statuses.map(status => getOrdersByStatus(status))
      );
      
      const allOrdersFlat = ordersByStatus.flat();
      const enrichedOrders = await Promise.all(
        allOrdersFlat.map(enrichOrderWithDetails)
      );
      
      setAllOrders(enrichedOrders);
      
      // Calculate counts
      const counts = getOrderCountByStatus(enrichedOrders);
      setOrderCounts(counts);
      
      // Calculate daily summary
      const summary = calculateDailySummary(enrichedOrders, new Date());
      setDailySummary(summary);
    } catch (err) {
      console.error('Error loading orders:', err);
      setError('Не удалось загрузить заказы');
    } finally {
      setIsLoading(false);
    }
  }, [enrichOrderWithDetails]);

  // Load initial orders
  useEffect(() => {
    loadAllOrders();
  }, [loadAllOrders]);


  // Subscribe to real-time updates for all statuses
  useEffect(() => {
    const statuses: OrderStatus[] = ['received', 'on_the_way', 'delivered', 'cancelled'];
    const unsubscribes: (() => void)[] = [];

    statuses.forEach(status => {
      const unsubscribe = subscribeToOrdersByStatus(status, async (order, eventType) => {
        if (eventType === 'INSERT') {
          const enrichedOrder = await enrichOrderWithDetails(order);
          setAllOrders(prev => {
            const updated = [enrichedOrder, ...prev.filter(o => o.id !== order.id)];
            // Recalculate counts and summary
            setOrderCounts(getOrderCountByStatus(updated));
            setDailySummary(calculateDailySummary(updated, new Date()));
            return updated;
          });
        } else if (eventType === 'UPDATE') {
          const enrichedOrder = await enrichOrderWithDetails(order);
          setAllOrders(prev => {
            const updated = prev.map(o => o.id === order.id ? enrichedOrder : o);
            // Recalculate counts and summary
            setOrderCounts(getOrderCountByStatus(updated));
            setDailySummary(calculateDailySummary(updated, new Date()));
            return updated;
          });
        } else if (eventType === 'DELETE') {
          setAllOrders(prev => {
            const updated = prev.filter(o => o.id !== order.id);
            // Recalculate counts and summary
            setOrderCounts(getOrderCountByStatus(updated));
            setDailySummary(calculateDailySummary(updated, new Date()));
            return updated;
          });
        }
      });
      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [enrichOrderWithDetails]);

  // Filter orders by active tab
  const filteredOrders = allOrders.filter(
    order => order.status === TAB_STATUS_MAP[activeTab]
  );

  const handleOrderClick = (orderId: string) => {
    if (onOrderClick) {
      onOrderClick(orderId);
    } else {
      navigate(`/driver/order/${orderId}`);
    }
  };

  const handleCancelClick = (orderId: string) => {
    setOrderToCancel(orderId);
    setCancelModalOpen(true);
  };

  const handleCancelConfirm = async (reason: string) => {
    if (!orderToCancel) return;
    
    try {
      setIsCancelling(true);
      
      // Optimistic update
      setAllOrders(prev => {
        const updated = prev.map(o => 
          o.id === orderToCancel 
            ? { ...o, status: 'cancelled' as OrderStatus, cancellation_reason: reason, cancelled_at: new Date().toISOString() }
            : o
        );
        setOrderCounts(getOrderCountByStatus(updated));
        setDailySummary(calculateDailySummary(updated, new Date()));
        return updated;
      });
      
      // Call API
      await cancelOrder(orderToCancel, reason);
      
      setCancelModalOpen(false);
      setOrderToCancel(null);
    } catch (err) {
      console.error('Error cancelling order:', err);
      // Revert optimistic update
      loadAllOrders();
      setError('Не удалось отменить заказ');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const getEmptyStateMessage = () => {
    switch (activeTab) {
      case 'new':
        return { title: 'Нет новых заказов', description: 'Новые заказы появятся здесь автоматически' };
      case 'in_progress':
        return { title: 'Нет заказов в пути', description: 'Заказы в процессе доставки появятся здесь' };
      case 'completed':
        return { title: 'Нет завершенных заказов', description: 'Выполненные заказы появятся здесь' };
      case 'cancelled':
        return { title: 'Нет отмененных заказов', description: 'Отмененные заказы появятся здесь' };
      default:
        return { title: 'Нет заказов', description: '' };
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">
            Панель управления
          </h1>
          <button
            onClick={handleLogout}
            className="text-sm text-red-600 hover:text-red-700 min-h-[44px] px-2"
          >
            Выйти
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Analytics Summary Card */}
        <AnalyticsSummaryCard summary={dailySummary} isLoading={isLoading} />

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Order Tabs */}
        <OrderTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          counts={orderCounts}
        />

        {/* Orders List */}
        <div className="mt-4">
          {isLoading ? (
            <SkeletonLoader variant="card" count={3} />
          ) : filteredOrders.length === 0 ? (
            <EmptyState
              icon={<span className="text-6xl">📭</span>}
              title={getEmptyStateMessage().title}
              description={getEmptyStateMessage().description}
            />
          ) : (
            <div>
              <div className="text-sm text-gray-500 mb-3">
                {filteredOrders.length} {filteredOrders.length === 1 ? 'заказ' : 
                  filteredOrders.length < 5 ? 'заказа' : 'заказов'}
              </div>
              {filteredOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onClick={handleOrderClick}
                  onCancel={handleCancelClick}
                  showCancelButton={activeTab === 'new'}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cancel Order Modal */}
      <CancelOrderModal
        isOpen={cancelModalOpen}
        onClose={() => {
          setCancelModalOpen(false);
          setOrderToCancel(null);
        }}
        onConfirm={handleCancelConfirm}
        isLoading={isCancelling}
      />
    </div>
  );
};

export default DriverDashboardPage;
