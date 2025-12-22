import { useState, useEffect, useCallback } from 'react';
import { useTelegram } from '../contexts/TelegramContext';
import { getOrCreateCustomer, updateCustomer } from '../services/customers';
import type { Customer, CustomerInput } from '../types';

interface UseCustomerInitResult {
  customer: Customer | null;
  isLoading: boolean;
  error: Error | null;
  updateCustomerData: (updates: Partial<CustomerInput>) => Promise<Customer | null>;
  refetch: () => Promise<void>;
}

/**
 * Hook to initialize and manage customer data based on Telegram user
 * - On app load, gets or creates customer from Telegram ID
 * - Loads saved address and phone if available
 * - Provides methods to update customer data
 * 
 * Requirements: 1.2, 1.3, 2.4, 4.5
 */
export function useCustomerInit(): UseCustomerInitResult {
  const { user, isReady } = useTelegram();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Initialize customer on app load
  const initializeCustomer = useCallback(async () => {
    if (!isReady || !user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Build full name from Telegram user data
      const fullName = user.last_name 
        ? `${user.first_name} ${user.last_name}` 
        : user.first_name;

      // Get existing customer or create new one (Req 1.2, 1.3)
      const customerData = await getOrCreateCustomer(user.id, fullName);
      
      // Customer data includes saved address and phone if available (Req 2.4, 4.5)
      setCustomer(customerData);
    } catch (err) {
      console.error('Failed to initialize customer:', err);
      setError(err instanceof Error ? err : new Error('Failed to initialize customer'));
    } finally {
      setIsLoading(false);
    }
  }, [user, isReady]);

  // Run initialization when Telegram context is ready
  useEffect(() => {
    initializeCustomer();
  }, [initializeCustomer]);

  // Update customer data (phone, address, etc.)
  const updateCustomerData = useCallback(async (
    updates: Partial<CustomerInput>
  ): Promise<Customer | null> => {
    if (!customer) {
      console.error('Cannot update customer: no customer loaded');
      return null;
    }

    try {
      const updatedCustomer = await updateCustomer(customer.id, updates);
      setCustomer(updatedCustomer);
      return updatedCustomer;
    } catch (err) {
      console.error('Failed to update customer:', err);
      setError(err instanceof Error ? err : new Error('Failed to update customer'));
      return null;
    }
  }, [customer]);

  // Refetch customer data
  const refetch = useCallback(async () => {
    await initializeCustomer();
  }, [initializeCustomer]);

  return {
    customer,
    isLoading,
    error,
    updateCustomerData,
    refetch,
  };
}

export default useCustomerInit;
