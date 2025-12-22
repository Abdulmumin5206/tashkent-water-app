import { supabase } from './supabase';
import type { Supplier } from '../types';

/**
 * Fetches all active suppliers sorted by rating (highest first)
 * @returns Promise<Supplier[]> - Array of active suppliers
 */
export async function getActiveSuppliers(): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('is_active', true)
    .order('rating', { ascending: false });

  if (error) {
    console.error('Error fetching suppliers:', error);
    throw error;
  }

  return data || [];
}

/**
 * Fetches a single supplier by ID
 * @param id - The supplier's UUID
 * @returns Promise<Supplier | null> - The supplier or null if not found
 */
export async function getSupplierById(id: string): Promise<Supplier | null> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    console.error('Error fetching supplier:', error);
    throw error;
  }

  return data;
}
