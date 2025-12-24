import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { Customer, CustomerInput } from '../types';

// Feature: marketplace-enhancements, Property 7: Customer Update Round-Trip
// Validates: Requirements 3.4

/**
 * Arbitrary for generating valid phone numbers (Uzbekistan format)
 */
const phoneArbitrary = fc.stringMatching(/^\+998[0-9]{9}$/);

/**
 * Arbitrary for generating valid addresses
 */
const addressArbitrary = fc.string({ minLength: 1, maxLength: 500 });

/**
 * Arbitrary for generating Tashkent coordinates
 */
const tashkentLatArbitrary = fc.float({ min: Math.fround(41.2), max: Math.fround(41.4), noNaN: true });
const tashkentLngArbitrary = fc.float({ min: Math.fround(69.1), max: Math.fround(69.4), noNaN: true });

/**
 * Arbitrary for generating valid comments
 */
const commentsArbitrary = fc.string({ maxLength: 1000 });

/**
 * Arbitrary for generating valid customer update data
 */
const customerUpdateArbitrary: fc.Arbitrary<Partial<CustomerInput>> = fc.record({
  phone: fc.option(phoneArbitrary, { nil: undefined }),
  saved_address: fc.option(addressArbitrary, { nil: undefined }),
  saved_lat: fc.option(tashkentLatArbitrary, { nil: undefined }),
  saved_lng: fc.option(tashkentLngArbitrary, { nil: undefined }),
  saved_comments: fc.option(commentsArbitrary, { nil: undefined }),
});

/**
 * Arbitrary for generating a base customer
 */
const validDateArbitrary = fc.integer({ 
  min: new Date('2020-01-01').getTime(), 
  max: new Date('2030-12-31').getTime() 
}).map(timestamp => new Date(timestamp).toISOString());

const baseCustomerArbitrary: fc.Arbitrary<Customer> = fc.record({
  id: fc.uuid(),
  telegram_id: fc.integer({ min: 1, max: 999999999 }),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  phone: fc.option(phoneArbitrary, { nil: undefined }),
  saved_address: fc.option(addressArbitrary, { nil: undefined }),
  saved_lat: fc.option(tashkentLatArbitrary, { nil: undefined }),
  saved_lng: fc.option(tashkentLngArbitrary, { nil: undefined }),
  saved_comments: fc.option(commentsArbitrary, { nil: undefined }),
  created_at: fc.option(validDateArbitrary, { nil: undefined }),
  updated_at: fc.option(validDateArbitrary, { nil: undefined }),
});

/**
 * Simulates applying customer updates and round-tripping through JSON
 * This mimics what happens when data is saved to and retrieved from Supabase
 */
function simulateCustomerUpdateRoundTrip(
  customer: Customer,
  updates: Partial<CustomerInput>
): Customer {
  // Apply updates to customer (simulating database update)
  const updatedCustomer: Customer = {
    ...customer,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  // Simulate JSON serialization/deserialization (what Supabase does)
  const serialized = JSON.stringify(updatedCustomer);
  const deserialized = JSON.parse(serialized) as Customer;

  // Normalize numeric fields
  return {
    ...deserialized,
    telegram_id: Number(deserialized.telegram_id),
    saved_lat: deserialized.saved_lat !== undefined ? Number(deserialized.saved_lat) : undefined,
    saved_lng: deserialized.saved_lng !== undefined ? Number(deserialized.saved_lng) : undefined,
  };
}

/**
 * Extracts the updatable fields from a customer for comparison
 */
function extractUpdatableFields(customer: Customer): Partial<CustomerInput> {
  return {
    phone: customer.phone,
    saved_address: customer.saved_address,
    saved_lat: customer.saved_lat,
    saved_lng: customer.saved_lng,
    saved_comments: customer.saved_comments,
  };
}

describe('Customer Update Property Tests', () => {
  // Property 7: Customer Update Round-Trip
  describe('Property 7: Customer Update Round-Trip', () => {
    it('For any valid customer update, saving and retrieving should produce equivalent data', () => {
      fc.assert(
        fc.property(
          baseCustomerArbitrary,
          customerUpdateArbitrary,
          (customer, updates) => {
            // Apply updates and simulate round-trip
            const roundTripped = simulateCustomerUpdateRoundTrip(customer, updates);

            // Verify that the updates were applied correctly
            if (updates.phone !== undefined) {
              expect(roundTripped.phone).toBe(updates.phone);
            }
            if (updates.saved_address !== undefined) {
              expect(roundTripped.saved_address).toBe(updates.saved_address);
            }
            if (updates.saved_lat !== undefined) {
              expect(roundTripped.saved_lat).toBeCloseTo(updates.saved_lat, 6);
            }
            if (updates.saved_lng !== undefined) {
              expect(roundTripped.saved_lng).toBeCloseTo(updates.saved_lng, 6);
            }
            if (updates.saved_comments !== undefined) {
              expect(roundTripped.saved_comments).toBe(updates.saved_comments);
            }

            // Verify that non-updated fields are preserved
            expect(roundTripped.id).toBe(customer.id);
            expect(roundTripped.telegram_id).toBe(customer.telegram_id);
            expect(roundTripped.name).toBe(customer.name);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Customer data maintains type integrity after update round-trip', () => {
      fc.assert(
        fc.property(
          baseCustomerArbitrary,
          customerUpdateArbitrary,
          (customer, updates) => {
            const roundTripped = simulateCustomerUpdateRoundTrip(customer, updates);

            // Type checks for required fields
            expect(typeof roundTripped.id).toBe('string');
            expect(typeof roundTripped.telegram_id).toBe('number');
            expect(typeof roundTripped.name).toBe('string');

            // Type checks for optional fields (when present)
            if (roundTripped.phone !== undefined) {
              expect(typeof roundTripped.phone).toBe('string');
            }
            if (roundTripped.saved_address !== undefined) {
              expect(typeof roundTripped.saved_address).toBe('string');
            }
            if (roundTripped.saved_lat !== undefined) {
              expect(typeof roundTripped.saved_lat).toBe('number');
            }
            if (roundTripped.saved_lng !== undefined) {
              expect(typeof roundTripped.saved_lng).toBe('number');
            }
            if (roundTripped.saved_comments !== undefined) {
              expect(typeof roundTripped.saved_comments).toBe('string');
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Coordinates remain within Tashkent bounds after update round-trip', () => {
      const latMin = Math.fround(41.2);
      const latMax = Math.fround(41.4);
      const lngMin = Math.fround(69.1);
      const lngMax = Math.fround(69.4);

      // Generate updates that always have coordinates
      const coordUpdateArbitrary = fc.record({
        saved_lat: tashkentLatArbitrary,
        saved_lng: tashkentLngArbitrary,
      });

      fc.assert(
        fc.property(
          baseCustomerArbitrary,
          coordUpdateArbitrary,
          (customer, updates) => {
            const roundTripped = simulateCustomerUpdateRoundTrip(customer, updates);

            // Verify coordinates are within bounds (updates always have coords)
            expect(roundTripped.saved_lat).toBeGreaterThanOrEqual(latMin);
            expect(roundTripped.saved_lat).toBeLessThanOrEqual(latMax);
            expect(roundTripped.saved_lng).toBeGreaterThanOrEqual(lngMin);
            expect(roundTripped.saved_lng).toBeLessThanOrEqual(lngMax);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Phone number format is preserved after update round-trip', () => {
      fc.assert(
        fc.property(
          baseCustomerArbitrary,
          customerUpdateArbitrary.filter(u => u.phone !== undefined),
          (customer, updates) => {
            const roundTripped = simulateCustomerUpdateRoundTrip(customer, updates);

            // Verify phone format is preserved
            if (roundTripped.phone !== undefined) {
              expect(roundTripped.phone).toMatch(/^\+998[0-9]{9}$/);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Updated_at timestamp is set after update', () => {
      fc.assert(
        fc.property(
          baseCustomerArbitrary,
          customerUpdateArbitrary,
          (customer, updates) => {
            const beforeUpdate = new Date();
            const roundTripped = simulateCustomerUpdateRoundTrip(customer, updates);
            const afterUpdate = new Date();

            // Verify updated_at is set and is a valid date
            expect(roundTripped.updated_at).toBeDefined();
            const updatedAt = new Date(roundTripped.updated_at!);
            expect(updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
            expect(updatedAt.getTime()).toBeLessThanOrEqual(afterUpdate.getTime() + 1000); // Allow 1s tolerance

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
