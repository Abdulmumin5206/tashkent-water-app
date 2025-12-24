import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { getSupplierById } from '../services/suppliers';
import StatusBadge from '../components/StatusBadge';
import SkeletonLoader from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import type { Order } from '../types';

/**
 * Formats a date string for display
 */
const formatDate = (dateString?: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * OrderHistoryCard displays a single order in the history list
 * Shows: date, supplier name, quantity, price, status
 * Requirements: 2.2
 */
interface OrderHistoryCardProps {
  order: Order;
  supplierName: string;
  onTap: () => void;
  onReorder: () => void;
}

export const OrderHistoryCard: React.FC<OrderHistoryCardProps> = ({
  order,
  supplierName,
  onTap,
  onReorder,
}) => {
  const isCompleted = order.status === 'delivered';

  return (
    <div
      onClick={onTap}
      className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
          <h3 className="font-semibold text-gray-900 mt-1">{supplierName}</h3>
        </div>
        <StatusBadge status={order.status} size="sm" />
      </div>

      <div className="flex justify-between items-center text-sm text-gray-600 mb-3">
        <span>
          {order.quantity} {order.quantity === 1 ? 'бутылка' : order.quantity < 5 ? 'бутылки' : 'бутылок'}
        </span>
        <span className="font-semibold text-gray-900">
          {order.total_price.toLocaleString()} сум
        </span>
      </div>

      {isCompleted && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onReorder();
          }}
          className="w-full py-2 bg-blue-50 text-blue-600 font-medium rounded-lg hover:bg-blue-100 transition-colors text-sm"
        >
          Повторить заказ
        </button>
      )}
    </div>
  );
};


/**
 * Extracts display fields from an order for rendering
 * Used for property testing (Property 4)
 */
export interface OrderDisplayFields {
  date: string;
  supplierName: string;
  quantity: number;
  totalPrice: number;
  status: string;
}

export const extractOrderDisplayFields = (
  order: Order,
  supplierName: string
): OrderDisplayFields => {
  return {
    date: formatDate(order.created_at),
    supplierName,
    quantity: order.quantity,
    totalPrice: order.total_price,
    status: order.status,
  };
};

/**
 * OrderHistoryPage displays all customer orders sorted by date (newest first)
 * 
 * Requirements:
 * - 2.1: Display all orders sorted by date (newest first)
 * - 2.2: Show order date, supplier name, quantity, total price, status
 * - 2.3: Navigate to order detail on tap
 * - 2.4: Provide "Reorder" button for completed orders
 * - 2.5: Indicate order status with visual badges
 */
const OrderHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { orderHistory, isOrderHistoryLoading, fetchOrderHistory, reorderFromHistory } = useApp();
  const [supplierNames, setSupplierNames] = useState<Record<string, string>>({});
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);

  // Fetch order history on mount
  useEffect(() => {
    fetchOrderHistory();
  }, [fetchOrderHistory]);

  // Fetch supplier names for all orders
  useEffect(() => {
    const fetchSupplierNames = async () => {
      if (orderHistory.length === 0) return;

      setIsLoadingSuppliers(true);
      const uniqueSupplierIds = [...new Set(orderHistory.map((o) => o.supplier_id))];
      const names: Record<string, string> = {};

      await Promise.all(
        uniqueSupplierIds.map(async (supplierId) => {
          try {
            const supplier = await getSupplierById(supplierId);
            names[supplierId] = supplier?.name ?? 'Неизвестный поставщик';
          } catch {
            names[supplierId] = 'Неизвестный поставщик';
          }
        })
      );

      setSupplierNames(names);
      setIsLoadingSuppliers(false);
    };

    fetchSupplierNames();
  }, [orderHistory]);

  const handleOrderTap = (orderId: string) => {
    navigate(`/order/${orderId}`);
  };

  const handleReorder = async (order: Order) => {
    await reorderFromHistory(order);
    navigate('/cart');
  };

  const isLoading = isOrderHistoryLoading || isLoadingSuppliers;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">Мои заказы</h1>
          <p className="text-sm text-gray-500">История заказов</p>
        </div>
      </header>

      {/* Content */}
      <main className="p-4">
        {isLoading ? (
          <SkeletonLoader variant="card" count={3} />
        ) : orderHistory.length === 0 ? (
          <EmptyState
            icon={<span className="text-5xl">📦</span>}
            title="Нет заказов"
            description="Вы еще не сделали ни одного заказа. Выберите воду и оформите первый заказ!"
            actionLabel="Выбрать воду"
            onAction={() => navigate('/')}
          />
        ) : (
          <div className="space-y-4">
            {orderHistory.map((order) => (
              <OrderHistoryCard
                key={order.id}
                order={order}
                supplierName={supplierNames[order.supplier_id] ?? 'Загрузка...'}
                onTap={() => handleOrderTap(order.id)}
                onReorder={() => handleReorder(order)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default OrderHistoryPage;
