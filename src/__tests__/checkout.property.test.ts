import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { isPhoneInputRequired, getDefaultFormData, TASHKENT_DEFAULT_LAT, TASHKENT_DEFAULT_LNG } from '../utils/checkout';

// Feature: tashkent-water-marketplace, Property 9: Phone Prompt Logic
// Feature: tashkent-water-marketplace, Property 10: Saved Address Default
// Validates: Requirements 2.1, 2.4, 4.5

/**
 * Arbitrary for generating valid phone numbers
 */
const validPhoneArbitrary: fc.Arbitrary<string> = fc.string({ minLength: 7, maxLength: 20 })
  .map(s => '+998' + s.replace(/[^0-9]/g, '').slice(0, 9))
  .filter(s => s.length >= 7);

/**
 * Arbitrary for generating empty or whitespace-only strings
 */
const emptyOrWhitespaceArbitrary: fc.Arbitrary<string | null | undefined> = fc.oneof(
  fc.constant(''),
  fc.constant(null as null),
  fc.constant(undefined as undefined),
  fc.constant('   '),
  fc.constant('\t\n')
);

/**
 * Arbitrary for generating valid latitude values (Tashkent area)
 */
const latArbitrary = fc.float({ min: 41.0, max: 41.5, noNaN: true });

/**
 * Arbitrary for generating valid longitude values (Tashkent area)
 */
const lngArbitrary = fc.float({ min: 69.0, max: 69.5, noNaN: true });

/**
 * Customer type for testing
 */
interface TestCustomer {
  saved_address?: string;
  saved_lat?: number;
  saved_lng?: number;
  saved_comments?: string;
  phone?: string;
}

/**
 * Arbitrary for generating customer data with saved address
 */
const customerWithSavedAddressArbitrary: fc.Arbitrary<TestCustomer> = fc.record({
  saved_address: fc.string({ minLength: 5, maxLength: 200 }),
  saved_lat: latArbitrary,
  saved_lng: lngArbitrary,
  saved_comments: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
  phone: fc.option(validPhoneArbitrary, { nil: undefined }),
});

/**
 * Arbitrary for generating customer data without saved address
 */
const customerWithoutSavedAddressArbitrary: fc.Arbitrary<TestCustomer> = fc.record({
  saved_address: fc.option(fc.constant(''), { nil: undefined }),
  saved_lat: fc.option(fc.constant(undefined as number | undefined), { nil: undefined }),
  saved_lng: fc.option(fc.constant(undefined as number | undefined), { nil: undefined }),
  saved_comments: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
  phone: fc.option(validPhoneArbitrary, { nil: undefined }),
});

describe('Checkout Property Tests', () => {
  // Property 9: Phone Prompt Logic
  // For any customer attempting to place an order, if the customer has no saved phone number,
  // the checkout flow should require phone input. If the customer has a saved phone number,
  // the checkout flow should use it without prompting.
  describe('Property 9: Phone Prompt Logic', () => {
    it('For any customer with no saved phone (empty, null, undefined, or whitespace), isPhoneInputRequired should return true', () => {
      fc.assert(
        fc.property(emptyOrWhitespaceArbitrary, (phone) => {
          const result = isPhoneInputRequired(phone as string | undefined | null);
          expect(result).toBe(true);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('For any customer with a valid saved phone number, isPhoneInputRequired should return false', () => {
      fc.assert(
        fc.property(validPhoneArbitrary, (phone) => {
          const result = isPhoneInputRequired(phone);
          expect(result).toBe(false);
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  // Property 10: Saved Address Default
  // For any customer with a saved address placing a new order, the checkout form should
  // pre-populate with their saved address, coordinates, and comments.
  describe('Property 10: Saved Address Default', () => {
    it('For any customer with saved address data, getDefaultFormData should return form pre-populated with saved values', () => {
      fc.assert(
        fc.property(customerWithSavedAddressArbitrary, (customer) => {
          const formData = getDefaultFormData(customer);
          
          // Address should be pre-populated
          expect(formData.address).toBe(customer.saved_address);
          
          // Coordinates should be pre-populated
          expect(formData.lat).toBe(customer.saved_lat);
          expect(formData.lng).toBe(customer.saved_lng);
          
          // Comments should be pre-populated (or empty string if undefined)
          expect(formData.comments).toBe(customer.saved_comments || '');
          
          // Phone should be pre-populated (or empty string if undefined)
          expect(formData.phone).toBe(customer.phone || '');
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('For any customer without saved address, getDefaultFormData should return Tashkent default coordinates', () => {
      fc.assert(
        fc.property(customerWithoutSavedAddressArbitrary, (customer) => {
          const formData = getDefaultFormData(customer);
          
          // Address should be empty or the saved value
          expect(formData.address).toBe(customer.saved_address || '');
          
          // Coordinates should default to Tashkent center when not saved
          if (!customer.saved_lat || !customer.saved_lng) {
            expect(formData.lat).toBe(TASHKENT_DEFAULT_LAT);
            expect(formData.lng).toBe(TASHKENT_DEFAULT_LNG);
          }
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('For null customer, getDefaultFormData should return default empty form with Tashkent coordinates', () => {
      const formData = getDefaultFormData(null);
      
      expect(formData.address).toBe('');
      expect(formData.lat).toBe(TASHKENT_DEFAULT_LAT);
      expect(formData.lng).toBe(TASHKENT_DEFAULT_LNG);
      expect(formData.comments).toBe('');
      expect(formData.phone).toBe('');
      expect(formData.payment_method).toBe('cash');
    });

    it('Default payment method should always be cash', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            customerWithSavedAddressArbitrary,
            customerWithoutSavedAddressArbitrary,
            fc.constant(null)
          ),
          (customer) => {
            const formData = getDefaultFormData(customer);
            expect(formData.payment_method).toBe('cash');
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
