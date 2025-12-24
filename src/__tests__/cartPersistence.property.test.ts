/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { saveCart, loadCart, clearPersistedCart, getCartStorageKey } from '../utils/cartStorage';
import type { Supplier, CartItem } from '../types';

// Feature: marketplace-enhancements, Property 1: Cart Persistence Round-Trip
// Validates: Requirements 1.1, 1.2, 1.5

/**
 * Arbitrary for generating valid Supplier data
 */
const supplierArbitrary: fc.Arbitrary<Supplier> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  price: fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
  rating: fc.float({ min: 0, max: 5, noNaN: true }),
  delivery_time_min: fc.integer({ min: 1, max: 60 }),
  delivery_time_max: fc.integer({ min: 60, max: 180 }),
  image_url: fc.option(fc.webUrl(), { nil: undefined }),
  is_active: fc.boolean(),
});

/**
 * Arbitrary for generating valid CartItem data
 */
const cartItemArbitrary: fc.Arbitrary<CartItem> = fc.record({
  supplier: supplierArbitrary,
  quantity: fc.integer({ min: 1, max: 100 }),
});

/**
 * Arbitrary for generating a cart (array of CartItems with unique supplier IDs)
 */
const cartArbitrary: fc.Arbitrary<CartItem[]> = fc.array(cartItemArbitrary, { maxLength: 10 })
  .map(items => {
    // Ensure unique supplier IDs
    const seen = new Set<string>();
    return items.filter(item => {
      if (seen.has(item.supplier.id)) return false;
      seen.add(item.supplier.id);
      return true;
    });
  });

describe('Cart Persistence Property Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  // Property 1: Cart Persistence Round-Trip
  describe('Property 1: Cart Persistence Round-Trip', () => {
    it('For any valid cart, saving and then loading should produce an equivalent cart', () => {
      fc.assert(
        fc.property(cartArbitrary, (cart) => {
          // Save the cart
          saveCart(cart);
          
          // Load the cart
          const loadedCart = loadCart();
          
          // Verify round-trip equivalence
          expect(loadedCart).not.toBeNull();
          expect(loadedCart!.length).toBe(cart.length);
          
          // Check each item matches
          for (let i = 0; i < cart.length; i++) {
            const original = cart[i];
            const loaded = loadedCart!.find(item => item.supplier.id === original.supplier.id);
            
            expect(loaded).toBeDefined();
            expect(loaded!.quantity).toBe(original.quantity);
            expect(loaded!.supplier.id).toBe(original.supplier.id);
            expect(loaded!.supplier.name).toBe(original.supplier.name);
            expect(loaded!.supplier.price).toBeCloseTo(original.supplier.price, 5);
          }
          
          return true;
        }),
        { numRuns: 50 }
      );
    });

    it('For an empty cart, saving and loading should return an empty array', () => {
      const emptyCart: CartItem[] = [];
      saveCart(emptyCart);
      const loadedCart = loadCart();
      
      expect(loadedCart).not.toBeNull();
      expect(loadedCart!.length).toBe(0);
    });

    it('clearPersistedCart should remove the cart from storage', () => {
      fc.assert(
        fc.property(cartArbitrary.filter(cart => cart.length > 0), (cart) => {
          // Save the cart
          saveCart(cart);
          
          // Verify it was saved
          expect(loadCart()).not.toBeNull();
          
          // Clear the cart
          clearPersistedCart();
          
          // Verify it was cleared
          expect(loadCart()).toBeNull();
          
          return true;
        }),
        { numRuns: 50 }
      );
    });

    it('loadCart should return null when no cart is stored', () => {
      // Ensure localStorage is empty
      localStorage.removeItem(getCartStorageKey());
      
      const result = loadCart();
      expect(result).toBeNull();
    });

    it('loadCart should return null for invalid stored data', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.string(), // Random string
            fc.json().filter(j => typeof j !== 'object' || j === null), // Non-object JSON
          ),
          (invalidData) => {
            localStorage.setItem(getCartStorageKey(), 
              typeof invalidData === 'string' ? invalidData : JSON.stringify(invalidData)
            );
            
            const result = loadCart();
            expect(result).toBeNull();
            
            return true;
          }
        ),
        { numRuns: 25 }
      );
    });
  });
});
