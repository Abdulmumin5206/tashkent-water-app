import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrderById, updateOrderStatus, subscribeToOrder } from '../services/orders';
import { getCustomerById } from '../services/customers';
import { getSupplierById } from '../services/suppliers';
import { canAcceptOrder, canCompleteOrder } from '../utils/orderStatus';
import type { Order, Customer, Supplier } from '../types';

/**
 * DriverOrderDetailPage - Shows order details with action buttons
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 * - Accept button → updates status to "on_the_way"
 * - "Open in Yandex Maps" button with coordinates link
 * - "Mark as Delivered" button → updates status to "delivered"
 */
const DriverOrderDetailPage: React.FC = () => {
  const { id: orderId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load order and related data
  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) {
        setError('ID заказа не указан');
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        const orderData = await getOrderById(orderId);
        if (!orderData) {
          setError('Заказ не найден');
          return;
        }
        
        setOrder(orderData);
        
        // Load customer and supplier details
        const [customerData, supplierData] = await Promise.all([
          getCustomerById(orderData.customer_id),
          getSupplierById(orderData.supplier_id),
        ]);
        
        setCustomer(customerData);
        setSupplier(supplierData);
      } catch (err) {
        console.error('Error loading order:', err);
        setError('Не удалось загрузить заказ');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  // Subscribe to real-time order updates
  useEffect(() => {
    if (!orderId) return;

    const unsubscribe = subscribeToOrder(orderId, (updatedOrder) => {
      setOrder(updatedOrder);
    });

    return () => {
      unsubscribe();
    };
  }, [orderId]);

  // Accept order - update status to "on_the_way"
  const handleAcceptOrder = async () => {
    if (!order || !canAcceptOrder(order.status)) return;
    
    try {
      setIsUpdating(true);
      setError(null);
      const updatedOrder = await updateOrderStatus(order.id, 'on_the_way');
      setOrder(updatedOrder);
    } catch (err) {
      console.error('Error accepting order:', err);
      setError('Не удалось принять заказ');
    } finally {
      setIsUpdating(false);
    }
  };

  // Mark as delivered - update status to "delivered"
  const handleMarkDelivered = async () => {
    if (!order || !canCompleteOrder(order.status)) return;
    
    try {
      setIsUpdating(true);
      setError(null);
      const updatedOrder = await updateOrderStatus(order.id, 'delivered');
      setOrder(updatedOrder);
    } catch (err) {
      console.error('Error completing order:', err);
      setError('Не удалось завершить заказ');
    } finally {
      setIsUpdating(false);
    }
  };

  // Navigate back to dashboard
  const handleBack = () => {
    navigate('/driver');
  };

  // Open Yandex Maps with coordinates
  const handleOpenMaps = () => {
    if (!order) return;
    const yandexMapsUrl = `https://yandex.ru/maps/?pt=${order.lng},${order.lat}&z=17&l=map`;
    window.open(yandexMapsUrl, '_blank');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPaymentMethod = (method: string) => {
    return method === 'cash' ? 'Наличные' : 'Перевод на карту';
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'received': return 'Новый заказ';
      case 'on_the_way': return 'В пути';
      case 'delivered': return 'Доставлен';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return 'bg-yellow-100 text-yellow-800';
      case 'on_the_way': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Загрузка заказа...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error || 'Заказ не найден'}</div>
          <button
            onClick={handleBack}
            className="text-blue-600 hover:underline"
          >
            Вернуться к списку
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={handleBack}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Назад
          </button>
          <h1 className="text-xl font-bold text-gray-800 flex-1">
            Заказ #{order.id.slice(0, 8)}
          </h1>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
            {getStatusLabel(order.status)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Customer Info */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="font-semibold text-gray-800 mb-3">Клиент</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Имя:</span>
              <span className="font-medium">{customer?.name || 'Не указано'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Телефон:</span>
              <a 
                href={`tel:${order.phone}`}
                className="font-medium text-blue-600 hover:underline"
              >
                {order.phone}
              </a>
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="font-semibold text-gray-800 mb-3">Адрес доставки</h2>
          <p className="text-gray-700 mb-2">{order.address}</p>
          {order.comments && (
            <p className="text-gray-500 text-sm mb-3">
              Комментарий: {order.comments}
            </p>
          )}
          <button
            onClick={handleOpenMaps}
            className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
          >
            🗺️ Открыть в Яндекс Картах
          </button>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="font-semibold text-gray-800 mb-3">Детали заказа</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Поставщик:</span>
              <span className="font-medium">{supplier?.name || 'Не указан'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Количество:</span>
              <span className="font-medium">{order.quantity} бут.</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Сумма:</span>
              <span className="font-medium text-green-600">
                {order.total_price.toLocaleString()} сум
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Оплата:</span>
              <span className="font-medium">{formatPaymentMethod(order.payment_method)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Создан:</span>
              <span className="text-sm text-gray-500">{formatDate(order.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Accept Order Button - Requirements 8.1, 8.2 */}
          {canAcceptOrder(order.status) && (
            <button
              onClick={handleAcceptOrder}
              disabled={isUpdating}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isUpdating ? 'Обработка...' : '✓ Принять заказ'}
            </button>
          )}

          {/* Mark as Delivered Button - Requirements 8.4, 8.5 */}
          {canCompleteOrder(order.status) && (
            <button
              onClick={handleMarkDelivered}
              disabled={isUpdating}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isUpdating ? 'Обработка...' : '✓ Отметить как доставлен'}
            </button>
          )}

          {/* Order completed message */}
          {order.status === 'delivered' && (
            <div className="text-center py-4">
              <div className="text-4xl mb-2">✅</div>
              <div className="text-green-600 font-medium">Заказ доставлен</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverOrderDetailPage;
