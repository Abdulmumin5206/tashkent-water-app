import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useCustomerInit } from '../hooks/useCustomerInit';
import { createOrder } from '../services/orders';
import { addItem, removeItem, updateQuantity as updateCartQuantity, validateQuantity } from '../utils/cart';
import type { Customer, CartItem, Order, OrderInput, Supplier, CustomerInput } from '../types';

export interface AppContextValue {
  // Customer state
  customer: Customer | null;
  isCustomerLoading: boolean;
  customerError: Error | null;
  updateCustomerData: (updates: Partial<CustomerInput>) => Promise<Customer | null>;
  
  // Cart state
  cart: CartItem[];
  addToCart: (supplier: Supplier, quantity: number) => void;
  removeFromCart: (supplierId: string) => void;
  updateQuantity: (supplierId: string, quantity: number) => void;
  clearCart: () => void;
  
  // Order state
  currentOrder: Order | null;
  setCurrentOrder: (order: Order | null) => void;
  placeOrder: (orderData: OrderInput) => Promise<Order>;
}

const defaultContextValue: AppContextValue = {
  customer: null,
  isCustomerLoading: true,
  customerError: null,
  updateCustomerData: async () => null,
  cart: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  currentOrder: null,
  setCurrentOrder: () => {},
  placeOrder: async () => { throw new Error('AppContext not initialized'); },
};

const AppContext = createContext<AppContextValue>(defaultContextValue);

interface AppProviderProps {
  children: ReactNode;
}

/**
 * AppProvider manages the global application state:
 * - Customer data (via useCustomerInit hook)
 * - Cart state (items, add, remove, update, clear)
 * - Current order for tracking
 * 
 * Requirements: 5.1, 5.2
 */
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // Customer state from initialization hook
  const { 
    customer, 
    isLoading: isCustomerLoading, 
    error: customerError,
    updateCustomerData 
  } = useCustomerInit();

  // Cart state - Requirements 5.1, 5.2
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Current order for tracking
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

  // Add item to cart (Req 5.1 - quantity selection)
  const addToCart = useCallback((supplier: Supplier, quantity: number) => {
    if (!validateQuantity(quantity)) {
      console.warn('Invalid quantity:', quantity);
      return;
    }
    setCart(prevCart => addItem(prevCart, supplier, quantity));
  }, []);

  // Remove item from cart
  const removeFromCart = useCallback((supplierId: string) => {
    setCart(prevCart => removeItem(prevCart, supplierId));
  }, []);

  // Update item quantity in cart (Req 5.1 - minimum 1 bottle)
  const updateQuantity = useCallback((supplierId: string, quantity: number) => {
    if (!validateQuantity(quantity)) {
      console.warn('Invalid quantity:', quantity);
      return;
    }
    setCart(prevCart => updateCartQuantity(prevCart, supplierId, quantity));
  }, []);

  // Clear entire cart
  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Place order and set as current order for tracking
  const placeOrder = useCallback(async (orderData: OrderInput): Promise<Order> => {
    const order = await createOrder(orderData);
    setCurrentOrder(order);
    clearCart();
    return order;
  }, [clearCart]);

  const contextValue: AppContextValue = {
    customer,
    isCustomerLoading,
    customerError,
    updateCustomerData,
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    currentOrder,
    setCurrentOrder,
    placeOrder,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

/**
 * Custom hook to use App context
 * @throws Error if used outside of AppProvider
 */
export const useApp = (): AppContextValue => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
