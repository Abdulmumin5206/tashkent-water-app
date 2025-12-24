import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getActiveSuppliers } from '../services/suppliers';
import { SkeletonLoader } from '../components';
import type { Supplier } from '../types';

/**
 * SupplierCard component displays a single supplier's information
 * Shows: name, price, rating, delivery time
 * Requirements: 3.2, 9.1, 9.2, 9.3, 9.4, 9.5
 * - 9.1: Display supplier logo/image prominently
 * - 9.2: Show price, rating, delivery time in clear hierarchy
 * - 9.3: Use subtle shadows and rounded corners for depth
 * - 9.4: Handle unavailable suppliers with reduced opacity
 * - 9.5: Consistent height and alignment
 */
interface SupplierCardProps {
  supplier: Supplier;
  onClick: () => void;
}

export const SupplierCard: React.FC<SupplierCardProps> = ({ supplier, onClick }) => {
  const isAvailable = supplier.is_active;
  
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
      onClick={isAvailable ? onClick : undefined}
      className={`
        bg-white rounded-2xl p-4 min-h-[120px]
        shadow-[0_2px_8px_rgba(0,0,0,0.08)] 
        border border-gray-100/80
        transition-all duration-200 ease-out
        ${isAvailable 
          ? 'cursor-pointer hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 active:scale-[0.98]' 
          : 'opacity-60 cursor-not-allowed'
        }
      `}
    >
      <div className="flex items-start gap-4">
        {/* Supplier Image - Prominent display (Req 9.1) */}
        <div className="relative flex-shrink-0">
          {supplier.image_url ? (
            <img
              src={supplier.image_url}
              alt={supplier.name}
              className="w-20 h-20 rounded-xl object-cover shadow-sm"
            />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shadow-sm">
              <span className="text-3xl">💧</span>
            </div>
          )}
          {/* Unavailable badge (Req 9.4) */}
          {!isAvailable && (
            <div className="absolute -top-1 -right-1 bg-gray-500 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
              Недоступен
            </div>
          )}
        </div>
        
        {/* Content with clear visual hierarchy (Req 9.2) */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base text-gray-900 truncate">{supplier.name}</h3>
          
          {/* Rating row */}
          <div className="flex items-center gap-1 mt-1">
            {renderStars(supplier.rating)}
            <span className="text-sm text-gray-500 ml-1">({supplier.rating.toFixed(1)})</span>
          </div>
          
          {/* Price - Most prominent (Req 9.2) */}
          <div className="mt-2">
            <span className="text-blue-600 font-bold text-xl">
              {supplier.price.toLocaleString()} сум
            </span>
          </div>
          
          {/* Delivery time - Secondary info */}
          <div className="flex items-center mt-1 text-sm text-gray-500">
            <span className="mr-1">🚚</span>
            <span>{supplier.delivery_time_min}-{supplier.delivery_time_max} мин</span>
          </div>
        </div>
      </div>
    </div>
  );
};


/**
 * SupplierCardSkeleton - Skeleton loader matching SupplierCard dimensions
 * Requirements: 8.5 - Display loading states with skeleton screens
 */
const SupplierCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl p-4 min-h-[120px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-100/80 animate-pulse">
    <div className="flex items-start gap-4">
      {/* Image skeleton */}
      <div className="w-20 h-20 rounded-xl bg-gray-200 flex-shrink-0" />
      
      {/* Content skeleton */}
      <div className="flex-1 space-y-3">
        {/* Name */}
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        {/* Rating */}
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        {/* Price */}
        <div className="h-6 bg-gray-200 rounded w-2/3" />
        {/* Delivery time */}
        <div className="h-3 bg-gray-200 rounded w-1/3" />
      </div>
    </div>
  </div>
);

/**
 * MarketplacePage displays a list of active suppliers sorted by rating
 * Requirements: 3.1, 3.2, 3.4, 8.1, 8.2, 8.3, 8.5, 9.5
 * - 3.1: Display list of all active suppliers
 * - 3.2: Show supplier name, price, delivery time, rating
 * - 3.4: Sort by rating (highest first)
 * - 8.1: Consistent spacing and alignment
 * - 8.2: Cohesive color palette with blue as primary
 * - 8.3: Smooth transitions and animations
 * - 8.5: Skeleton screens for loading states
 * - 9.5: Consistent card height and alignment
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with consistent styling (Req 8.1, 8.2) */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">💧 Вода Ташкент</h1>
          <p className="text-sm text-gray-500">Доставка воды 19л</p>
        </div>
      </header>

      <main className="p-4 pb-24">
        {/* Loading state with skeleton screens (Req 8.5) */}
        {isLoading && (
          <div className="space-y-4 animate-fade-in">
            {[1, 2, 3, 4].map((i) => (
              <SupplierCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error state */}
        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
            <div className="text-5xl mb-4">😕</div>
            <p className="text-red-500 mb-4 text-center">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 active:scale-[0.98] transition-all min-h-[44px]"
            >
              Попробовать снова
            </button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && suppliers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-gray-500 text-center">Нет доступных поставщиков</p>
          </div>
        )}

        {/* Supplier list with consistent spacing (Req 8.1, 9.5) */}
        {!isLoading && !error && suppliers.length > 0 && (
          <div className="space-y-4 animate-fade-in">
            {suppliers.map((supplier, index) => (
              <div 
                key={supplier.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <SupplierCard
                  supplier={supplier}
                  onClick={() => handleSupplierClick(supplier.id)}
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MarketplacePage;
