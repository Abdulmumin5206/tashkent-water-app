import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getStatusBadgeConfig, StatusBadgeConfig } from '../components/StatusBadge';
import type { OrderStatus } from '../types';

// Feature: marketplace-enhancements, Property 6: Status Badge Mapping
// Validates: Requirements 2.5

/**
 * Arbitrary for generating valid OrderStatus values
 */
const orderStatusArbitrary = fc.constantFrom<OrderStatus>('received', 'on_the_way', 'delivered', 'cancelled');

describe('Property 6: Status Badge Mapping', () => {
  it('For any order status, the status badge function returns a consistent visual representation with label, color, and bgColor', () => {
    fc.assert(
      fc.property(orderStatusArbitrary, (status) => {
        const config = getStatusBadgeConfig(status);
        
        // Config should have all required properties
        expect(config).toHaveProperty('label');
        expect(config).toHaveProperty('color');
        expect(config).toHaveProperty('bgColor');
        
        // All properties should be non-empty strings
        expect(typeof config.label).toBe('string');
        expect(config.label.length).toBeGreaterThan(0);
        expect(typeof config.color).toBe('string');
        expect(config.color.length).toBeGreaterThan(0);
        expect(typeof config.bgColor).toBe('string');
        expect(config.bgColor.length).toBeGreaterThan(0);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('For any order status, calling getStatusBadgeConfig multiple times returns the same result (deterministic)', () => {
    fc.assert(
      fc.property(orderStatusArbitrary, (status) => {
        const config1 = getStatusBadgeConfig(status);
        const config2 = getStatusBadgeConfig(status);
        
        expect(config1.label).toBe(config2.label);
        expect(config1.color).toBe(config2.color);
        expect(config1.bgColor).toBe(config2.bgColor);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('For any two different order statuses, the status badge returns different labels', () => {
    fc.assert(
      fc.property(
        orderStatusArbitrary,
        orderStatusArbitrary,
        (status1, status2) => {
          fc.pre(status1 !== status2);
          
          const config1 = getStatusBadgeConfig(status1);
          const config2 = getStatusBadgeConfig(status2);
          
          // Different statuses should have different labels
          expect(config1.label).not.toBe(config2.label);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('All four statuses have distinct visual representations', () => {
    fc.assert(
      fc.property(fc.constant(true), () => {
        const statuses: OrderStatus[] = ['received', 'on_the_way', 'delivered', 'cancelled'];
        const configs = statuses.map(s => getStatusBadgeConfig(s));
        
        // All labels should be unique
        const labels = configs.map(c => c.label);
        expect(new Set(labels).size).toBe(4);
        
        // All color combinations should be unique
        const colorCombos = configs.map(c => `${c.color}-${c.bgColor}`);
        expect(new Set(colorCombos).size).toBe(4);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('Status badge labels match expected human-readable values', () => {
    fc.assert(
      fc.property(orderStatusArbitrary, (status) => {
        const config = getStatusBadgeConfig(status);
        
        const expectedLabels: Record<OrderStatus, string> = {
          received: 'Received',
          on_the_way: 'On the Way',
          delivered: 'Delivered',
          cancelled: 'Cancelled',
        };
        
        expect(config.label).toBe(expectedLabels[status]);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('Status badge colors use appropriate semantic colors (yellow for pending, blue for in-progress, green for success, red for cancelled)', () => {
    fc.assert(
      fc.property(orderStatusArbitrary, (status) => {
        const config = getStatusBadgeConfig(status);
        
        // Verify semantic color usage
        switch (status) {
          case 'received':
            expect(config.color).toContain('yellow');
            expect(config.bgColor).toContain('yellow');
            break;
          case 'on_the_way':
            expect(config.color).toContain('blue');
            expect(config.bgColor).toContain('blue');
            break;
          case 'delivered':
            expect(config.color).toContain('green');
            expect(config.bgColor).toContain('green');
            break;
          case 'cancelled':
            expect(config.color).toContain('red');
            expect(config.bgColor).toContain('red');
            break;
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });
});
