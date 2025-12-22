// Telegram WebApp types
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

export interface TelegramMainButton {
  text: string;
  color: string;
  textColor: string;
  isVisible: boolean;
  isActive: boolean;
  isProgressVisible: boolean;
  setText(text: string): void;
  onClick(callback: () => void): void;
  offClick(callback: () => void): void;
  show(): void;
  hide(): void;
  enable(): void;
  disable(): void;
  showProgress(leaveActive?: boolean): void;
  hideProgress(): void;
}

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
  };
  ready(): void;
  expand(): void;
  MainButton: TelegramMainButton;
  requestContact(callback: (sent: boolean) => void): void;
}

// Domain types
export interface Supplier {
  id: string;
  name: string;
  price: number;
  rating: number;
  delivery_time_min: number;
  delivery_time_max: number;
  image_url?: string;
  is_active: boolean;
  created_at?: string;
}

export interface Customer {
  id: string;
  telegram_id: number;
  name: string;
  phone?: string;
  saved_address?: string;
  saved_lat?: number;
  saved_lng?: number;
  saved_comments?: string;
  created_at?: string;
  updated_at?: string;
}

export type OrderStatus = 'received' | 'on_the_way' | 'delivered';
export type PaymentMethod = 'cash' | 'card_transfer';

export interface Order {
  id: string;
  customer_id: string;
  supplier_id: string;
  quantity: number;
  total_price: number;
  address: string;
  lat: number;
  lng: number;
  comments?: string;
  phone: string;
  payment_method: PaymentMethod;
  status: OrderStatus;
  created_at?: string;
  updated_at?: string;
}

export interface CartItem {
  supplier: Supplier;
  quantity: number;
}

// Input types for creating/updating
export interface OrderInput {
  customer_id: string;
  supplier_id: string;
  quantity: number;
  total_price: number;
  address: string;
  lat: number;
  lng: number;
  comments?: string;
  phone: string;
  payment_method: PaymentMethod;
}

export interface CustomerInput {
  telegram_id: number;
  name: string;
  phone?: string;
  saved_address?: string;
  saved_lat?: number;
  saved_lng?: number;
  saved_comments?: string;
}

// Context interfaces
export interface TelegramContextValue {
  user: TelegramUser | null;
  webApp: TelegramWebApp | null;
  isReady: boolean;
  requestContact: () => Promise<string | null>;
}

export interface AppContextValue {
  customer: Customer | null;
  cart: CartItem[];
  currentOrder: Order | null;
  addToCart: (supplier: Supplier, quantity: number) => void;
  removeFromCart: (supplierId: string) => void;
  updateQuantity: (supplierId: string, quantity: number) => void;
  clearCart: () => void;
  placeOrder: (orderData: OrderInput) => Promise<Order>;
}
