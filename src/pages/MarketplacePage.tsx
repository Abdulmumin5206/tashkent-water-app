import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getActiveSuppliers } from '../services/suppliers';
import type { Supplier } from '../types';

/**
 * SupplierCard component displays a single supplier's information
 * Shows: name, price, rating, delivery time
 * Requirements: 3.2
 */
interface SupplierCardProps {
  supplier: Supplier;
  onClick: () => void;
}

export const SupplierCard: React.FC<SupplierCardProps> = ({ supplier, onClick }) => {
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

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow border border-gray-100"
    >
      <div className="flex items-start gap-4">
        {supplier.image_url ? (
          <img
            src={supplier.image_url}
            alt={supplier.name}
            className="w-16 h-16 rounded-lg object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center">
            <span className="text-2xl">💧</span>
          </div>
        )}
        
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-900">{supplier.name}</h3>
          
          <div className="flex items-center gap-1 mt-1">
            {renderStars(supplier.rating)}
            <span className="text-sm text-gray-500 ml-1">({supplier.rating.toFixed(1)})</span>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-blue-600 font-bold text-lg">
              {supplier.price.toLocaleString()} сум
            </span>
            <span className="text-sm text-gray-500">
              🚚 {supplier.delivery_time_min}-{supplier.delivery_time_max} мин
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};


/**
 * MarketplacePage displays a list of active suppliers sorted by rating
 * Requirements: 3.1, 3.2, 3.4
 * - 3.1: Display list of all active suppliers
 * - 3.2: Show supplier name, price, delivery time, rating
 * - 3.4: Sort by rating (highest first)
 */
const MarketplacePage: React.FC = () => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // getActiveSuppliers returns only active suppliers sorted by rating (Req 3.1, 3.4)
        const data = await getActiveSuppliers();
        setSuppliers(data);
      } catch (err) {
        console.error('Failed to fetch suppliers:', err);
        setError('Не удалось загрузить поставщиков. Попробуйте позже.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

  const handleSupplierClick = (supplierId: string) => {
    navigate(`/supplier/${supplierId}`);
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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">💧 Вода Ташкент</h1>
          <p className="text-sm text-gray-500">Доставка воды 19л</p>
        </div>
      </header>

      <main className="p-4">
        {suppliers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Нет доступных поставщиков</p>
          </div>
        ) : (
          <div className="space-y-4">
            {suppliers.map((supplier) => (
              <SupplierCard
                key={supplier.id}
                supplier={supplier}
                onClick={() => handleSupplierClick(supplier.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MarketplacePage;
