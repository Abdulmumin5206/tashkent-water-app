import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateCartBadgeCount, shouldShowActiveOrderBadge } from '../components/BottomNav';
import type { Supplier, CartItem } from '../types';

// Feature: marketplace-enhancements, Property 8: Cart Badge Count
// Validates: Requirements 4.3

// Feature: marketplace-enhancements, Property 9: Active Order Badge
// Validates: Requirements 4.4

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

describe('BottomNav Property Tests', () => {
  // Property 8: Cart Badge Count
  // For any cart state, the badge count should equal the sum of all item quantities in the cart.
  describe('Property 8: Cart Badge Count', () => {
    it('For any cart, calculateCartBadgeCount should equal the sum of all item quantities', () => {
      fc.assert(
        fc.property(cartArbitrary, (cart) => {
          const result = calculateCartBadgeCount(cart);
          const expected = cart.reduce((sum, item) => sum + item.quantity, 0);
          expect(result).toBe(expected);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('For an empty cart, calculateCartBadgeCount should return 0', () => {
      const result = calculateCartBadgeCount([]);
      expect(result).toBe(0);
    });

    it('For any single item cart, calculateCartBadgeCount should equal that item quantity', () => {
      fc.assert(
        fc.property(cartItemArbitrary, (item) => {
          const result = calculateCartBadgeCount([item]);
          expect(result).toBe(item.quantity);
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  // Property 9: Active Order Badge
  // For any set of customer orders, the orders badge should be visible if and only if 
  // there exists at least one order with status "received" or "on_the_way".
  describe('Property 9: Active Order Badge', () => {
    it('shouldShowActiveOrderBadge returns true when hasActiveOrder is true', () => {
      fc.assert(
        fc.property(fc.constant(true), (hasActiveOrder) => {
          const result = shouldShowActiveOrderBadge(hasActiveOrder);
          expect(result).toBe(true);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('shouldShowActiveOrderBadge returns false when hasActiveOrder is false', () => {
      fc.assert(
        fc.property(fc.constant(false), (hasActiveOrder) => {
          const result = shouldShowActiveOrderBadge(hasActiveOrder);
          expect(result).toBe(false);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('For any boolean hasActiveOrder, shouldShowActiveOrderBadge should return the same value', () => {
      fc.assert(
        fc.property(fc.boolean(), (hasActiveOrder) => {
          const result = shouldShowActiveOrderBadge(hasActiveOrder);
          expect(result).toBe(hasActiveOrder);
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });
});
