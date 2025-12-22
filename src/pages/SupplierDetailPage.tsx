import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSupplierById } from '../services/suppliers';
import { useApp } from '../contexts/AppContext';
import { calculateTotal } from '../utils/cart';
import QuantitySelector from '../components/QuantitySelector';
import type { Supplier } from '../types';

/**
 * SupplierDetailPage displays supplier details with quantity selector and add to cart
 * Requirements: 5.1, 5.2
 * - 5.1: Allow quantity selection (minimum 1 bottle)
 * - 5.2: Display total price based on quantity and supplier price
 */
const SupplierDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useApp();
  
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const fetchSupplier = async () => {
      if (!id) {
        setError('ID поставщика не указан');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await getSupplierById(id);
        if (!data) {
          setError('Поставщик не найден');
        } else {
          setSupplier(data);
        }
      } catch (err) {
        console.error('Failed to fetch supplier:', err);
        setError('Не удалось загрузить данные поставщика');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSupplier();
  }, [id]);

  const handleAddToCart = () => {
    if (!supplier) return;
    
    setIsAdding(true);
    addToCart(supplier, quantity);
    
    // Brief feedback before navigating
    setTimeout(() => {
      navigate('/cart');
    }, 300);
  };

  const totalPrice = supplier ? calculateTotal(quantity, supplier.price) : 0;

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars: React.ReactNode[] = [];
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<span key={i} className="text-yellow-400">★</span>);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<span key={i} className="text-yellow-400">☆</span>);
      } else {
        stars.push(<span key={i} className="text-gray-300">☆</span>);
      }
    }
    return stars;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Поставщик не найден'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Вернуться к списку
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
          <h1 className="text-lg font-semibold text-gray-900">{supplier.name}</h1>
        </div>
      </header>

      {/* Supplier Info */}
      <main className="p-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Image */}
          <div className="flex justify-center mb-6">
            {supplier.image_url ? (
              <img
                src={supplier.image_url}
                alt={supplier.name}
                className="w-32 h-32 rounded-lg object-cover"
              />
            ) : (
              <div className="w-32 h-32 rounded-lg bg-blue-100 flex items-center justify-center">
                <span className="text-5xl">💧</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{supplier.name}</h2>
            <div className="flex items-center justify-center gap-1 mt-2">
              {renderStars(supplier.rating)}
              <span className="text-sm text-gray-500 ml-1">({supplier.rating.toFixed(1)})</span>
            </div>
            <p className="text-gray-500 mt-2">
              🚚 Доставка: {supplier.delivery_time_min}-{supplier.delivery_time_max} мин
            </p>
          </div>

          {/* Price per bottle */}
          <div className="text-center mb-6">
            <p className="text-gray-500">Цена за бутылку (19л)</p>
            <p className="text-2xl font-bold text-blue-600">
              {supplier.price.toLocaleString()} сум
            </p>
          </div>

          {/* Quantity Selector */}
          <div className="flex flex-col items-center gap-4 mb-6">
            <p className="text-gray-700 font-medium">Количество бутылок:</p>
            <QuantitySelector
              quantity={quantity}
              onQuantityChange={setQuantity}
              min={1}
              max={20}
            />
          </div>

          {/* Total Price */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Итого:</span>
              <span className="text-2xl font-bold text-gray-900">
                {totalPrice.toLocaleString()} сум
              </span>
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={isAdding}
            className="w-full py-4 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isAdding ? 'Добавление...' : 'Добавить в корзину'}
          </button>
        </div>
      </main>
    </div>
  );
};

export default SupplierDetailPage;
