import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useCustomerInit } from '../hooks/useCustomerInit';
import { createOrder, getCustomerOrderHistory } from '../services/orders';
import { getSupplierById } from '../services/suppliers';
import { addItem, removeItem, updateQuantity as updateCartQuantity, validateQuantity } from '../utils/cart';
import { saveCart, loadCart, clearPersistedCart } from '../utils/cartStorage';
import { createReorderCart } from '../utils/reorder';
import { isActiveOrder } from '../utils/orderStatus';
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
  
  // Active order tracking (Requirements 1.3)
  activeOrder: Order | null;
  hasActiveOrder: boolean;
  
  // Order history (Requirements 2.1, 2.4)
  orderHistory: Order[];
  isOrderHistoryLoading: boolean;
  fetchOrderHistory: () => Promise<void>;
  reorderFromHistory: (order: Order) => Promise<void>;
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
  activeOrder: null,
  hasActiveOrder: false,
  orderHistory: [],
  isOrderHistoryLoading: false,
  fetchOrderHistory: async () => {},
  reorderFromHistory: async () => {},
};

const AppContext = createContext<AppContextValue>(defaultContextValue);

interface AppProviderProps {
  children: ReactNode;
}

/**
 * AppProvider manages the global application state:
 * - Customer data (via useCustomerInit hook)
 * - Cart state with localStorage persistence (items, add, remove, update, clear)
 * - Current order for tracking
 * - Active order detection
 * - Order history with reorder functionality
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.5, 2.1, 2.4, 5.1, 5.2
 */
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // Customer state from initialization hook
  const { 
    customer, 
    isLoading: isCustomerLoading, 
    error: customerError,
    updateCustomerData 
  } = useCustomerInit();

  // Cart state - initialized from localStorage (Requirements 1.1, 1.2)
  const [cart, setCart] = useState<CartItem[]>(() => {
    const persistedCart = loadCart();
    return persistedCart ?? [];
  });
  
  // Current order for tracking
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  
  // Active order tracking (Requirements 1.3)
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  
  // Order history state (Requirements 2.1)
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [isOrderHistoryLoading, setIsOrderHistoryLoading] = useState(false);

  // Persist cart to localStorage on every change (Requirements 1.2)
  useEffect(() => {
    saveCart(cart);
  }, [cart]);

  // Fetch order history and detect active orders when customer is loaded
  useEffect(() => {
    if (customer?.id) {
      // Fetch order history to detect active orders
      getCustomerOrderHistory(customer.id)
        .then((orders) => {
          setOrderHistory(orders);
          // Find the most recent active order (Requirements 1.3)
          const active = orders.find((order) => isActiveOrder(order.status));
          setActiveOrder(active ?? null);
        })
        .catch((error) => {
          console.error('Failed to fetch order history:', error);
        });
    }
  }, [customer?.id]);

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

  // Place order and set as current order for tracking (Requirements 1.5)
  const placeOrder = useCallback(async (orderData: OrderInput): Promise<Order> => {
    const order = await createOrder(orderData);
    setCurrentOrder(order);
    setActiveOrder(order); // New order is active
    clearCart();
    clearPersistedCart(); // Clear persisted cart after successful order (Requirements 1.5)
    // Update order history with the new order
    setOrderHistory(prev => [order, ...prev]);
    return order;
  }, [clearCart]);

  // Fetch order history (Requirements 2.1)
  const fetchOrderHistory = useCallback(async () => {
    if (!customer?.id) {
      return;
    }
    setIsOrderHistoryLoading(true);
    try {
      const orders = await getCustomerOrderHistory(customer.id);
      setOrderHistory(orders);
      // Update active order detection
      const active = orders.find((order) => isActiveOrder(order.status));
      setActiveOrder(active ?? null);
    } catch (error) {
      console.error('Failed to fetch order history:', error);
    } finally {
      setIsOrderHistoryLoading(false);
    }
  }, [customer?.id]);

  // Reorder from history (Requirements 2.4)
  const reorderFromHistory = useCallback(async (order: Order) => {
    try {
      const supplier = await getSupplierById(order.supplier_id);
      if (!supplier) {
        console.error('Supplier not found for reorder:', order.supplier_id);
        return;
      }
      const reorderItems = createReorderCart(order, supplier);
      // Replace cart with reorder items
      setCart(reorderItems);
    } catch (error) {
      console.error('Failed to reorder:', error);
    }
  }, []);

  // Compute hasActiveOrder from activeOrder state
  const hasActiveOrder = activeOrder !== null;

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
    activeOrder,
    hasActiveOrder,
    orderHistory,
    isOrderHistoryLoading,
    fetchOrderHistory,
    reorderFromHistory,
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
