import type { CartItem, PersistedCart } from '../types';

const CART_STORAGE_KEY = 'tashkent_water_cart';

/**
 * Saves the cart to localStorage
 * @param cart - Array of cart items to persist
 */
export function saveCart(cart: CartItem[]): void {
  try {
    const persistedCart: PersistedCart = {
      items: cart,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(persistedCart));
  } catch (error) {
    // Handle localStorage errors gracefully (quota exceeded, private browsing, etc.)
    console.warn('Failed to save cart to localStorage:', error);
  }
}

/**
 * Loads the cart from localStorage
 * @returns Array of cart items if found and valid, null otherwise
 */
export function loadCart(): CartItem[] | null {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored) as PersistedCart;
    
    // Validate the structure
    if (!parsed || !Array.isArray(parsed.items)) {
      return null;
    }

    // Validate each cart item has required fields
    const isValid = parsed.items.every(
      (item) =>
        item &&
        typeof item === 'object' &&
        item.supplier &&
        typeof item.supplier.id === 'string' &&
        typeof item.supplier.name === 'string' &&
        typeof item.supplier.price === 'number' &&
        typeof item.quantity === 'number' &&
        item.quantity >= 1
    );

    if (!isValid) {
      return null;
    }

    return parsed.items;
  } catch (error) {
    // Handle JSON parse errors or localStorage access errors
    console.warn('Failed to load cart from localStorage:', error);
    return null;
  }
}

/**
 * Clears the persisted cart from localStorage
 */
export function clearPersistedCart(): void {
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
  } catch (error) {
    // Handle localStorage errors gracefully
    console.warn('Failed to clear cart from localStorage:', error);
  }
}

/**
 * Gets the storage key used for cart persistence (for testing purposes)
 */
export function getCartStorageKey(): string {
  return CART_STORAGE_KEY;
}
