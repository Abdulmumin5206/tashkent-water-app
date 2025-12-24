import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { useTelegram } from '../contexts/TelegramContext';
import Header from '../components/Header';
import LocationPicker from '../components/LocationPicker';
import SkeletonLoader from '../components/SkeletonLoader';
import type { CustomerInput } from '../types';

// Tashkent center coordinates for default map position
const TASHKENT_CENTER = { lat: 41.2995, lng: 69.2401 };

/**
 * AccountSettingsPage displays and allows editing of customer profile
 * 
 * Requirements:
 * - 3.1: Display profile information (name, phone, saved address)
 * - 3.2: Allow customers to edit their saved delivery address
 * - 3.3: Allow customers to update their phone number
 * - 3.4: Persist changes to the database immediately
 * - 3.5: Display Telegram username as read-only information
 */
const AccountSettingsPage: React.FC = () => {
  const { customer, isCustomerLoading, updateCustomerData } = useApp();
  const { user } = useTelegram();

  // Form state
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState(TASHKENT_CENTER.lat);
  const [lng, setLng] = useState(TASHKENT_CENTER.lng);
  const [comments, setComments] = useState('');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form with customer data
  useEffect(() => {
    if (customer) {
      setPhone(customer.phone ?? '');
      setAddress(customer.saved_address ?? '');
      setLat(customer.saved_lat ?? TASHKENT_CENTER.lat);
      setLng(customer.saved_lng ?? TASHKENT_CENTER.lng);
      setComments(customer.saved_comments ?? '');
    }
  }, [customer]);

  // Track changes
  useEffect(() => {
    if (!customer) return;
    
    const phoneChanged = phone !== (customer.phone ?? '');
    const addressChanged = address !== (customer.saved_address ?? '');
    const latChanged = lat !== (customer.saved_lat ?? TASHKENT_CENTER.lat);
    const lngChanged = lng !== (customer.saved_lng ?? TASHKENT_CENTER.lng);
    const commentsChanged = comments !== (customer.saved_comments ?? '');
    
    setHasChanges(phoneChanged || addressChanged || latChanged || lngChanged || commentsChanged);
  }, [customer, phone, address, lat, lng, comments]);

  const handleLocationChange = useCallback((newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
  }, []);

  const handleSave = async () => {
    if (!hasChanges) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const updates: Partial<CustomerInput> = {
        phone: phone.trim() || undefined,
        saved_address: address.trim() || undefined,
        saved_lat: lat,
        saved_lng: lng,
        saved_comments: comments.trim() || undefined,
      };

      const result = await updateCustomerData(updates);
      
      if (result) {
        setSaveSuccess(true);
        setHasChanges(false);
        // Auto-hide success message after 3 seconds
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setSaveError('Не удалось сохранить изменения');
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      setSaveError('Произошла ошибка при сохранении');
    } finally {
      setIsSaving(false);
    }
  };

  // Build display name from customer or Telegram user
  const displayName = customer?.name ?? (user ? `${user.first_name}${user.last_name ? ` ${user.last_name}` : ''}` : '');
  const telegramUsername = user?.username ? `@${user.username}` : null;

  if (isCustomerLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Профиль" showBack={true} />
        <main className="p-4">
          <SkeletonLoader variant="card" count={3} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header title="Профиль" showBack={true} />

      <main className="p-4 space-y-4">
        {/* Profile Info Section - Req 3.1, 3.5 */}
        <section className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="font-semibold text-gray-900 mb-4">👤 Профиль</h2>
          
          {/* Name - Read only */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Имя
            </label>
            <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
              {displayName || 'Не указано'}
            </div>
          </div>

          {/* Telegram Username - Read only (Req 3.5) */}
          {telegramUsername && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telegram
              </label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-500">
                {telegramUsername}
              </div>
            </div>
          )}
        </section>

        {/* Phone Section - Req 3.3 */}
        <section className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="font-semibold text-gray-900 mb-4">📞 Контактный телефон</h2>
          
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+998 XX XXX XX XX"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-2">
            Номер для связи по заказам
          </p>
        </section>

        {/* Address Section - Req 3.2 */}
        <section className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="font-semibold text-gray-900 mb-4">📍 Адрес доставки</h2>
          
          {/* Map Picker */}
          <LocationPicker
            lat={lat}
            lng={lng}
            onLocationChange={handleLocationChange}
          />

          {/* Address Input */}
          <div className="mt-4">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Адрес
            </label>
            <input
              type="text"
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Улица, дом, квартира"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Comments */}
          <div className="mt-4">
            <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-1">
              Комментарий к адресу
            </label>
            <textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Подъезд, этаж, код домофона, ориентиры..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </section>

        {/* Success Message */}
        {saveSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-600 text-sm">✓ Изменения сохранены</p>
          </div>
        )}

        {/* Error Message */}
        {saveError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-sm">{saveError}</p>
          </div>
        )}
      </main>

      {/* Save Button - Fixed at bottom (Req 3.4) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className={`w-full py-4 font-semibold rounded-lg transition-colors ${
            hasChanges && !isSaving
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
        </button>
      </div>
    </div>
  );
};

export default AccountSettingsPage;
