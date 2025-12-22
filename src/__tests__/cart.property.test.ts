import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateQuantity, calculateTotal, addItem, removeItem, updateQuantity, calculateCartTotal } from '../utils/cart';
import type { Supplier, CartItem } from '../types';

// Feature: tashkent-water-marketplace, Property 6: Quantity Validation
// Feature: tashkent-water-marketplace, Property 7: Price Calculation
// Validates: Requirements 5.1, 5.2

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

describe('Cart Property Tests', () => {
  // Property 6: Quantity Validation
  describe('Property 6: Quantity Validation', () => {
    it('For any quantity >= 1, validateQuantity should return true', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 10000 }), (quantity) => {
          expect(validateQuantity(quantity)).toBe(true);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('For any quantity < 1, validateQuantity should return false', () => {
      fc.assert(
        fc.property(fc.integer({ min: -10000, max: 0 }), (quantity) => {
          expect(validateQuantity(quantity)).toBe(false);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('For any non-integer value, validateQuantity should return false', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0.01), max: Math.fround(100), noNaN: true }).filter(n => !Number.isInteger(n)),
          (quantity) => {
            expect(validateQuantity(quantity)).toBe(false);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Property 7: Price Calculation
  describe('Property 7: Price Calculation', () => {
    it('For any quantity and price, calculateTotal should equal quantity * price', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
          (quantity, price) => {
            const result = calculateTotal(quantity, price);
            const expected = quantity * price;
            expect(result).toBeCloseTo(expected, 5);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('For any cart, calculateCartTotal should equal sum of (quantity * price) for all items', () => {
      fc.assert(
        fc.property(cartArbitrary, (cart) => {
          const result = calculateCartTotal(cart);
          const expected = cart.reduce((sum, item) => sum + item.quantity * item.supplier.price, 0);
          expect(result).toBeCloseTo(expected, 5);
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  // Additional cart operation properties
  describe('Cart Operations', () => {
    it('Adding an item with valid quantity increases cart length or updates existing item', () => {
      fc.assert(
        fc.property(
          cartArbitrary,
          supplierArbitrary,
          fc.integer({ min: 1, max: 100 }),
          (cart, supplier, quantity) => {
            const newCart = addItem(cart, supplier, quantity);
            const existingItem = cart.find(item => item.supplier.id === supplier.id);
            
            if (existingItem) {
              // Should update existing item quantity
              expect(newCart.length).toBe(cart.length);
              const updatedItem = newCart.find(item => item.supplier.id === supplier.id);
              expect(updatedItem?.quantity).toBe(existingItem.quantity + quantity);
            } else {
              // Should add new item
              expect(newCart.length).toBe(cart.length + 1);
              const addedItem = newCart.find(item => item.supplier.id === supplier.id);
              expect(addedItem?.quantity).toBe(quantity);
            }
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Adding an item with invalid quantity (< 1) returns original cart unchanged', () => {
      fc.assert(
        fc.property(
          cartArbitrary,
          supplierArbitrary,
          fc.integer({ min: -100, max: 0 }),
          (cart, supplier, invalidQuantity) => {
            const newCart = addItem(cart, supplier, invalidQuantity);
            expect(newCart).toEqual(cart);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Removing an item decreases cart length by 1 if item exists', () => {
      fc.assert(
        fc.property(
          cartArbitrary.filter(cart => cart.length > 0),
          (cart) => {
            const itemToRemove = cart[0];
            const newCart = removeItem(cart, itemToRemove.supplier.id);
            expect(newCart.length).toBe(cart.length - 1);
            expect(newCart.find(item => item.supplier.id === itemToRemove.supplier.id)).toBeUndefined();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Updating quantity with valid value changes the item quantity', () => {
      fc.assert(
        fc.property(
          cartArbitrary.filter(cart => cart.length > 0),
          fc.integer({ min: 1, max: 100 }),
          (cart, newQuantity) => {
            const itemToUpdate = cart[0];
            const newCart = updateQuantity(cart, itemToUpdate.supplier.id, newQuantity);
            const updatedItem = newCart.find(item => item.supplier.id === itemToUpdate.supplier.id);
            expect(updatedItem?.quantity).toBe(newQuantity);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Updating quantity with invalid value (< 1) returns original cart unchanged', () => {
      fc.assert(
        fc.property(
          cartArbitrary.filter(cart => cart.length > 0),
          fc.integer({ min: -100, max: 0 }),
          (cart, invalidQuantity) => {
            const itemToUpdate = cart[0];
            const newCart = updateQuantity(cart, itemToUpdate.supplier.id, invalidQuantity);
            expect(newCart).toEqual(cart);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
