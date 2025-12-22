import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { calculateTotal, calculateCartTotal } from '../utils/cart';
import QuantitySelector from '../components/QuantitySelector';
import type { CartItem } from '../types';

/**
 * CartItemCard displays a single cart item with quantity controls
 */
interface CartItemCardProps {
  item: CartItem;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}

const CartItemCard: React.FC<CartItemCardProps> = ({ item, onQuantityChange, onRemove }) => {
  const itemTotal = calculateTotal(item.quantity, item.supplier.price);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
      <div className="flex items-start gap-4">
        {/* Supplier Image */}
        {item.supplier.image_url ? (
          <img
            src={item.supplier.image_url}
            alt={item.supplier.name}
            className="w-16 h-16 rounded-lg object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">💧</span>
          </div>
        )}

        {/* Item Details */}
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-gray-900">{item.supplier.name}</h3>
            <button
              onClick={onRemove}
              className="text-gray-400 hover:text-red-500 p-1"
              aria-label="Удалить"
            >
              ✕
            </button>
          </div>
          
          <p className="text-sm text-gray-500 mt-1">
            {item.supplier.price.toLocaleString()} сум × {item.quantity}
          </p>

          <div className="flex items-center justify-between mt-3">
            <QuantitySelector
              quantity={item.quantity}
              onQuantityChange={onQuantityChange}
              min={1}
              max={20}
            />
            <span className="font-bold text-gray-900">
              {itemTotal.toLocaleString()} сум
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};


/**
 * CartPage displays cart items, quantities, and totals
 * Requirements: 5.1, 5.2
 * - 5.1: Allow quantity selection (minimum 1 bottle)
 * - 5.2: Display total price based on quantity and supplier price
 */
const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, clearCart } = useApp();

  const cartTotal = calculateCartTotal(cart);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleQuantityChange = (supplierId: string, quantity: number) => {
    updateQuantity(supplierId, quantity);
  };

  const handleRemove = (supplierId: string) => {
    removeFromCart(supplierId);
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full"
            aria-label="Назад"
          >
            ←
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Корзина</h1>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="ml-auto text-sm text-red-500 hover:text-red-600"
            >
              Очистить
            </button>
          )}
        </div>
      </header>

      {/* Cart Content */}
      <main className="p-4">
        {cart.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🛒</div>
            <p className="text-gray-500 mb-4">Корзина пуста</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Выбрать воду
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {cart.map((item) => (
              <CartItemCard
                key={item.supplier.id}
                item={item}
                onQuantityChange={(qty) => handleQuantityChange(item.supplier.id, qty)}
                onRemove={() => handleRemove(item.supplier.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Bottom Summary & Checkout */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-sm text-gray-500">
                {totalItems} {totalItems === 1 ? 'бутылка' : totalItems < 5 ? 'бутылки' : 'бутылок'}
              </p>
              <p className="text-xl font-bold text-gray-900">
                {cartTotal.toLocaleString()} сум
              </p>
            </div>
          </div>
          
          <button
            onClick={handleCheckout}
            className="w-full py-4 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
          >
            Оформить заказ
          </button>
        </div>
      )}
    </div>
  );
};

export default CartPage;
