import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCheckout } from '../hooks/useCheckout';
import { useApp } from '../contexts/AppContext';
import LocationPicker from '../components/LocationPicker';
import type { PaymentMethod } from '../types';

/**
 * CheckoutPage handles order checkout with location picker
 * Requirements: 4.1, 4.2, 4.3, 4.4, 5.3
 * - 4.1: Display interactive map centered on Tashkent
 * - 4.2: Allow dragging pin to exact location
 * - 4.3: Provide text field for delivery comments
 * - 4.4: Save latitude and longitude coordinates
 * - 5.3: Offer payment method selection (Cash / Card Transfer)
 */
const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart } = useApp();
  const {
    formData,
    setFormData,
    isPhoneRequired,
    cartTotal,
    submitOrder,
    isSubmitting,
    error,
  } = useCheckout();

  const [localError, setLocalError] = useState<string | null>(null);

  // Redirect if cart is empty
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Корзина пуста</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Выбрать воду
          </button>
        </div>
      </div>
    );
  }

  const handleLocationChange = (lat: number, lng: number) => {
    setFormData(prev => ({ ...prev, lat, lng }));
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, address: e.target.value }));
  };

  const handleCommentsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, comments: e.target.value }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, phone: e.target.value }));
  };

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setFormData(prev => ({ ...prev, payment_method: method }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    // Validate required fields
    if (!formData.address.trim()) {
      setLocalError('Пожалуйста, укажите адрес доставки');
      return;
    }

    if (isPhoneRequired && !formData.phone.trim()) {
      setLocalError('Пожалуйста, укажите номер телефона');
      return;
    }

    try {
      await submitOrder();
      // Navigate to order tracking after successful order
      navigate('/order/current');
    } catch (err) {
      console.error('Order submission failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full"
            aria-label="Назад"
          >
            ←
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Оформление заказа</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        {/* Location Section */}
        <section className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="font-semibold text-gray-900 mb-4">📍 Адрес доставки</h2>
          
          {/* Map - Req 4.1, 4.2 */}
          <LocationPicker
            lat={formData.lat}
            lng={formData.lng}
            onLocationChange={handleLocationChange}
          />

          {/* Address Input */}
          <div className="mt-4">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Адрес *
            </label>
            <input
              type="text"
              id="address"
              value={formData.address}
              onChange={handleAddressChange}
              placeholder="Улица, дом, квартира"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Comments - Req 4.3 */}
          <div className="mt-4">
            <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-1">
              Комментарий к адресу
            </label>
            <textarea
              id="comments"
              value={formData.comments}
              onChange={handleCommentsChange}
              placeholder="Подъезд, этаж, код домофона, ориентиры..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </section>

        {/* Phone Section - Conditional based on saved phone (Req 2.1, 2.4) */}
        {isPhoneRequired && (
          <section className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="font-semibold text-gray-900 mb-4">📞 Контактный телефон</h2>
            <input
              type="tel"
              value={formData.phone}
              onChange={handlePhoneChange}
              placeholder="+998 XX XXX XX XX"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-2">
              Номер будет сохранён для будущих заказов
            </p>
          </section>
        )}

        {/* Payment Method - Req 5.3 */}
        <section className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="font-semibold text-gray-900 mb-4">💳 Способ оплаты</h2>
          
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="payment_method"
                value="cash"
                checked={formData.payment_method === 'cash'}
                onChange={() => handlePaymentMethodChange('cash')}
                className="w-5 h-5 text-blue-500"
              />
              <div>
                <p className="font-medium text-gray-900">💵 Наличные</p>
                <p className="text-sm text-gray-500">Оплата при получении</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="payment_method"
                value="card_transfer"
                checked={formData.payment_method === 'card_transfer'}
                onChange={() => handlePaymentMethodChange('card_transfer')}
                className="w-5 h-5 text-blue-500"
              />
              <div>
                <p className="font-medium text-gray-900">💳 Перевод на карту</p>
                <p className="text-sm text-gray-500">P2P перевод</p>
              </div>
            </label>
          </div>
        </section>

        {/* Error Display */}
        {(error || localError) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-sm">{localError || error?.message}</p>
          </div>
        )}
      </form>

      {/* Bottom Summary & Submit */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-600">Итого к оплате:</span>
          <span className="text-xl font-bold text-gray-900">
            {cartTotal.toLocaleString()} сум
          </span>
        </div>
        
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-4 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Оформление...' : 'Подтвердить заказ'}
        </button>
      </div>
    </div>
  );
};

export default CheckoutPage;
