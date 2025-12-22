import type { PaymentMethod } from '../types';

export interface CheckoutFormData {
  address: string;
  lat: number;
  lng: number;
  comments: string;
  phone: string;
  payment_method: PaymentMethod;
}

// Default Tashkent coordinates
export const TASHKENT_DEFAULT_LAT = 41.2995;
export const TASHKENT_DEFAULT_LNG = 69.2401;

/**
 * Determines if phone input is required based on customer's saved phone
 * Property 9: Phone Prompt Logic
 * Requirements: 2.1, 2.4
 * 
 * @param savedPhone - The customer's saved phone number (can be string, null, or undefined)
 * @returns true if phone input is required (no valid saved phone), false otherwise
 */
export function isPhoneInputRequired(savedPhone: string | undefined | null): boolean {
  return !savedPhone || savedPhone.trim() === '';
}

/**
 * Gets default checkout form data from customer's saved address
 * Property 10: Saved Address Default
 * Requirements: 4.5
 * 
 * @param customer - Customer object with optional saved address data
 * @returns CheckoutFormData pre-populated with saved values or defaults
 */
export function getDefaultFormData(customer: {
  saved_address?: string;
  saved_lat?: number;
  saved_lng?: number;
  saved_comments?: string;
  phone?: string;
} | null): CheckoutFormData {
  if (!customer) {
    return {
      address: '',
      lat: TASHKENT_DEFAULT_LAT,
      lng: TASHKENT_DEFAULT_LNG,
      comments: '',
      phone: '',
      payment_method: 'cash',
    };
  }

  return {
    address: customer.saved_address || '',
    lat: customer.saved_lat ?? TASHKENT_DEFAULT_LAT,
    lng: customer.saved_lng ?? TASHKENT_DEFAULT_LNG,
    comments: customer.saved_comments || '',
    phone: customer.phone || '',
    payment_method: 'cash',
  };
}
