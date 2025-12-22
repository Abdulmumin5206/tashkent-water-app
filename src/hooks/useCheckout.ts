import { useState, useCallback, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { useTelegram } from '../contexts/TelegramContext';
import { calculateCartTotal } from '../utils/cart';
import { 
  isPhoneInputRequired, 
  getDefaultFormData, 
  type CheckoutFormData,
} from '../utils/checkout';
import type { OrderInput, CustomerInput } from '../types';

// Re-export from utils for backwards compatibility
export { isPhoneInputRequired, getDefaultFormData } from '../utils/checkout';
export type { CheckoutFormData } from '../utils/checkout';

export interface UseCheckoutResult {
  // Form state
  formData: CheckoutFormData;
  setFormData: React.Dispatch<React.SetStateAction<CheckoutFormData>>;
  
  // Derived state
  isPhoneRequired: boolean;
  hasSavedAddress: boolean;
  cartTotal: number;
  
  // Actions
  submitOrder: () => Promise<void>;
  updatePhone: (phone: string) => Promise<void>;
  
  // Status
  isSubmitting: boolean;
  error: Error | null;
}

/**
 * Hook to manage checkout flow logic
 * - Checks if phone is required (no saved phone) - Req 2.1, 2.4
 * - Pre-populates saved address if available - Req 4.5
 * - Handles order creation and status updates - Req 5.4
 */
export function useCheckout(): UseCheckoutResult {
  const { customer, cart, placeOrder, updateCustomerData } = useApp();
  const { requestContact } = useTelegram();
  
  // Initialize form with saved customer data (Req 4.5)
  const [formData, setFormData] = useState<CheckoutFormData>(() => 
    getDefaultFormData(customer)
  );
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Check if phone is required (Req 2.1, 2.4)
  const isPhoneRequired = useMemo(() => 
    isPhoneInputRequired(customer?.phone),
    [customer?.phone]
  );

  // Check if customer has saved address (Req 4.5)
  const hasSavedAddress = useMemo(() => 
    Boolean(customer?.saved_address && customer.saved_lat && customer.saved_lng),
    [customer?.saved_address, customer?.saved_lat, customer?.saved_lng]
  );

  // Calculate cart total (Req 5.2)
  const cartTotal = useMemo(() => 
    calculateCartTotal(cart),
    [cart]
  );

  // Update phone number and save to customer profile (Req 2.3)
  const updatePhone = useCallback(async (phone: string) => {
    setFormData(prev => ({ ...prev, phone }));
    
    if (customer) {
      await updateCustomerData({ phone });
    }
  }, [customer, updateCustomerData]);

  // Submit order (Req 5.4)
  const submitOrder = useCallback(async () => {
    if (!customer || cart.length === 0) {
      setError(new Error('Cannot place order: missing customer or empty cart'));
      return;
    }

    // Validate phone is provided
    const phoneToUse = formData.phone || customer.phone;
    if (!phoneToUse) {
      setError(new Error('Phone number is required'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Save address to customer profile for future orders (Req 4.4, 4.5)
      const addressUpdates: Partial<CustomerInput> = {
        saved_address: formData.address,
        saved_lat: formData.lat,
        saved_lng: formData.lng,
        saved_comments: formData.comments,
      };
      
      // Also save phone if it was newly provided
      if (formData.phone && formData.phone !== customer.phone) {
        addressUpdates.phone = formData.phone;
      }
      
      await updateCustomerData(addressUpdates);

      // Create order for each cart item (simplified: one order per supplier)
      // In a real app, you might want to handle multiple suppliers differently
      for (const item of cart) {
        const orderData: OrderInput = {
          customer_id: customer.id,
          supplier_id: item.supplier.id,
          quantity: item.quantity,
          total_price: item.quantity * item.supplier.price,
          address: formData.address,
          lat: formData.lat,
          lng: formData.lng,
          comments: formData.comments || undefined,
          phone: phoneToUse,
          payment_method: formData.payment_method,
        };

        // Creates order with status 'received' (Req 5.4)
        await placeOrder(orderData);
      }
    } catch (err) {
      console.error('Failed to place order:', err);
      setError(err instanceof Error ? err : new Error('Failed to place order'));
    } finally {
      setIsSubmitting(false);
    }
  }, [customer, cart, formData, placeOrder, updateCustomerData]);

  return {
    formData,
    setFormData,
    isPhoneRequired,
    hasSavedAddress,
    cartTotal,
    submitOrder,
    updatePhone,
    isSubmitting,
    error,
  };
}

export default useCheckout;
