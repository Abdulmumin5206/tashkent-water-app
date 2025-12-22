import type { Supplier, CartItem } from '../types';

/**
 * Validates that a quantity is valid (minimum 1)
 * @param quantity - The quantity to validate
 * @returns true if quantity is valid (>= 1), false otherwise
 */
export function validateQuantity(quantity: number): boolean {
  return Number.isInteger(quantity) && quantity >= 1;
}

/**
 * Calculates the total price for a given quantity and price per unit
 * @param quantity - Number of items
 * @param pricePerUnit - Price per single item
 * @returns Total price (quantity * pricePerUnit)
 */
export function calculateTotal(quantity: number, pricePerUnit: number): number {
  return quantity * pricePerUnit;
}

/**
 * Adds an item to the cart or updates quantity if supplier already exists
 * @param cart - Current cart items
 * @param supplier - Supplier to add
 * @param quantity - Quantity to add
 * @returns New cart array with the item added/updated, or original cart if quantity invalid
 */
export function addItem(cart: CartItem[], supplier: Supplier, quantity: number): CartItem[] {
  if (!validateQuantity(quantity)) {
    return cart;
  }

  const existingIndex = cart.findIndex(item => item.supplier.id === supplier.id);
  
  if (existingIndex >= 0) {
    // Update existing item
    const newCart = [...cart];
    newCart[existingIndex] = {
      ...newCart[existingIndex],
      quantity: newCart[existingIndex].quantity + quantity
    };
    return newCart;
  }
  
  // Add new item
  return [...cart, { supplier, quantity }];
}

/**
 * Removes an item from the cart by supplier ID
 * @param cart - Current cart items
 * @param supplierId - ID of supplier to remove
 * @returns New cart array without the specified item
 */
export function removeItem(cart: CartItem[], supplierId: string): CartItem[] {
  return cart.filter(item => item.supplier.id !== supplierId);
}

/**
 * Updates the quantity of an item in the cart
 * @param cart - Current cart items
 * @param supplierId - ID of supplier to update
 * @param quantity - New quantity
 * @returns New cart array with updated quantity, or original cart if quantity invalid
 */
export function updateQuantity(cart: CartItem[], supplierId: string, quantity: number): CartItem[] {
  if (!validateQuantity(quantity)) {
    return cart;
  }

  return cart.map(item => 
    item.supplier.id === supplierId 
      ? { ...item, quantity } 
      : item
  );
}

/**
 * Calculates the total price for all items in the cart
 * @param cart - Cart items
 * @returns Total price of all items
 */
export function calculateCartTotal(cart: CartItem[]): number {
  return cart.reduce((total, item) => 
    total + calculateTotal(item.quantity, item.supplier.price), 
    0
  );
}
