import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { getOrderById, subscribeToOrder } from '../services/orders';
import { getSupplierById } from '../services/suppliers';
import type { Order, OrderStatus, Supplier } from '../types';

/**
 * Status labels in Russian
 */
const STATUS_LABELS: Record<OrderStatus, string> = {
  received: 'Заказ принят',
  on_the_way: 'Курьер в пути',
  delivered: 'Доставлено',
  cancelled: 'Отменён',
};

/**
 * Status icons
 */
const STATUS_ICONS: Record<OrderStatus, string> = {
  received: '📋',
  on_the_way: '🚚',
  delivered: '✅',
  cancelled: '❌',
};

/**
 * Order status steps for the stepper
 */
const STATUS_STEPS: OrderStatus[] = ['received', 'on_the_way', 'delivered'];

interface OrderStatusStepperProps {
  currentStatus: OrderStatus;
}

/**
 * OrderStatusStepper displays order progress through stages
 * Requirements: 6.2 - Show order progress through stages
 * Handles cancelled orders by showing a different visual state
 */
const OrderStatusStepper: React.FC<OrderStatusStepperProps> = ({ currentStatus }) => {
  // For cancelled orders, show a different view
  if (currentStatus === 'cancelled') {
    return (
      <div className="py-4">
        <div className="flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-2xl">
              ❌
            </div>
            <span className="mt-2 text-sm text-red-600 font-medium">
              Заказ отменён
            </span>
          </div>
        </div>
      </div>
    );
  }

  const currentIndex = STATUS_STEPS.indexOf(currentStatus);

  return (
    <div className="py-4">
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 mx-8">
          <div
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${(currentIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
          />
        </div>

        {/* Steps */}
        {STATUS_STEPS.map((status, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={status} className="flex flex-col items-center z-10">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-300 ${
                  isCompleted
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-400'
                } ${isCurrent ? 'ring-4 ring-blue-200' : ''}`}
              >
                {STATUS_ICONS[status]}
              </div>
              <span
                className={`mt-2 text-xs text-center max-w-[80px] ${
                  isCompleted ? 'text-blue-600 font-medium' : 'text-gray-400'
                }`}
              >
                {STATUS_LABELS[status]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};


/**
 * OrderTrackingPage displays order status and details
 * Requirements: 6.1, 6.2, 6.3, 6.4
 * - 6.1: Display order status screen when order is placed
 * - 6.2: Show order progress through stages
 * - 6.3: Update customer's screen in real-time when status changes
 * - 6.4: Display current order details (supplier, quantity, address)
 */
const OrderTrackingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentOrder, setCurrentOrder } = useApp();

  const [order, setOrder] = useState<Order | null>(currentOrder);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch order and supplier data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        let orderData = order;

        // If we have an ID param and it's not 'current', fetch that specific order
        if (id && id !== 'current') {
          orderData = await getOrderById(id);
          if (!orderData) {
            setError('Заказ не найден');
            setIsLoading(false);
            return;
          }
          setOrder(orderData);
        } else if (!orderData) {
          // No current order and no ID
          setError('Нет активного заказа');
          setIsLoading(false);
          return;
        }

        // Fetch supplier details
        if (orderData) {
          const supplierData = await getSupplierById(orderData.supplier_id);
          setSupplier(supplierData);
        }
      } catch (err) {
        console.error('Failed to fetch order data:', err);
        setError('Не удалось загрузить данные заказа');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, currentOrder]);

  // Subscribe to real-time updates (Req 6.3)
  useEffect(() => {
    if (!order?.id) return;

    const unsubscribe = subscribeToOrder(order.id, (updatedOrder) => {
      setOrder(updatedOrder);
      // Also update the context if this is the current order
      if (currentOrder?.id === updatedOrder.id) {
        setCurrentOrder(updatedOrder);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [order?.id, currentOrder?.id, setCurrentOrder]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Заказ не найден'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            На главную
          </button>
        </div>
      </div>
    );
  }


  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-full"
            aria-label="На главную"
          >
            ←
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Отслеживание заказа</h1>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* Status Card */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center mb-4">
            <span className="text-4xl">{STATUS_ICONS[order.status]}</span>
            <h2 className="text-xl font-bold text-gray-900 mt-2">
              {STATUS_LABELS[order.status]}
            </h2>
            {order.status === 'delivered' && (
              <p className="text-green-600 mt-1">Спасибо за заказ!</p>
            )}
            {order.status === 'cancelled' && order.cancellation_reason && (
              <p className="text-red-600 mt-2 text-sm">
                Причина: {order.cancellation_reason}
              </p>
            )}
          </div>

          {/* Status Stepper - Req 6.2 */}
          <OrderStatusStepper currentStatus={order.status} />
        </div>

        {/* Order Details - Req 6.4 */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="font-semibold text-gray-900 mb-4">📦 Детали заказа</h3>
          
          <div className="space-y-3">
            {/* Supplier */}
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Поставщик:</span>
              <span className="font-medium text-gray-900">
                {supplier?.name || 'Загрузка...'}
              </span>
            </div>

            {/* Quantity */}
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Количество:</span>
              <span className="font-medium text-gray-900">
                {order.quantity} {order.quantity === 1 ? 'бутылка' : order.quantity < 5 ? 'бутылки' : 'бутылок'}
              </span>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Сумма:</span>
              <span className="font-bold text-blue-600">
                {order.total_price.toLocaleString()} сум
              </span>
            </div>

            {/* Payment Method */}
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Оплата:</span>
              <span className="font-medium text-gray-900">
                {order.payment_method === 'cash' ? '💵 Наличные' : '💳 Перевод'}
              </span>
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="font-semibold text-gray-900 mb-4">📍 Адрес доставки</h3>
          
          <p className="text-gray-900">{order.address}</p>
          {order.comments && (
            <p className="text-gray-500 text-sm mt-2">
              Комментарий: {order.comments}
            </p>
          )}
        </div>

        {/* Order Time */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Заказ создан:</span>
            <span className="text-gray-900">{formatDate(order.created_at)}</span>
          </div>
        </div>

        {/* New Order Button (shown when delivered or cancelled) */}
        {(order.status === 'delivered' || order.status === 'cancelled') && (
          <button
            onClick={() => navigate('/')}
            className="w-full py-4 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
          >
            Заказать ещё
          </button>
        )}
      </main>
    </div>
  );
};

export default OrderTrackingPage;
