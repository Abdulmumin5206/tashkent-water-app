import { supabase } from './supabase';
import type { Customer, CustomerInput } from '../types';

/**
 * Gets an existing customer by Telegram ID or creates a new one
 * @param telegramId - The user's Telegram ID
 * @param name - The user's name from Telegram
 * @returns Promise<Customer> - The customer record
 */
export async function getOrCreateCustomer(
  telegramId: number,
  name: string
): Promise<Customer> {
  // First, try to find existing customer
  const { data: existing, error: fetchError } = await supabase
    .from('customers')
    .select('*')
    .eq('telegram_id', telegramId)
    .single();

  if (existing) {
    return existing;
  }

  // If not found (PGRST116 = no rows), create new customer
  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Error fetching customer:', fetchError);
    throw fetchError;
  }

  // Create new customer
  const { data: newCustomer, error: insertError } = await supabase
    .from('customers')
    .insert({
      telegram_id: telegramId,
      name: name,
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error creating customer:', insertError);
    throw insertError;
  }

  return newCustomer;
}

/**
 * Updates a customer's profile data
 * @param customerId - The customer's UUID
 * @param updates - Partial customer data to update
 * @returns Promise<Customer> - The updated customer record
 */
export async function updateCustomer(
  customerId: string,
  updates: Partial<CustomerInput>
): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', customerId)
    .select()
    .single();

  if (error) {
    console.error('Error updating customer:', error);
    throw error;
  }

  return data;
}

/**
 * Gets a customer by their UUID
 * @param customerId - The customer's UUID
 * @returns Promise<Customer | null> - The customer or null if not found
 */
export async function getCustomerById(customerId: string): Promise<Customer | null> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching customer:', error);
    throw error;
  }

  return data;
}
