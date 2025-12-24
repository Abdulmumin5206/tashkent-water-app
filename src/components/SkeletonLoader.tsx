import React from 'react';

type SkeletonVariant = 'card' | 'list' | 'text';

interface SkeletonLoaderProps {
  variant: SkeletonVariant;
  count?: number;
  className?: string;
}

/**
 * SkeletonLoader displays loading placeholders with animation
 * 
 * Requirements: 8.5 - THE System SHALL display loading states with skeleton screens
 * instead of spinners where appropriate
 */
const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant,
  count = 1,
  className = '',
}) => {
  const baseClasses = 'animate-pulse bg-gray-200 rounded';

  const renderSkeleton = (index: number) => {
    switch (variant) {
      case 'card':
        return (
          <div
            key={index}
            className={`${baseClasses} p-4 space-y-3 ${className}`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-300 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-3/4" />
                <div className="h-3 bg-gray-300 rounded w-1/2" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-300 rounded" />
              <div className="h-3 bg-gray-300 rounded w-5/6" />
            </div>
          </div>
        );

      case 'list':
        return (
          <div
            key={index}
            className={`${baseClasses} flex items-center p-3 space-x-3 ${className}`}
          >
            <div className="w-10 h-10 bg-gray-300 rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-300 rounded w-2/3" />
              <div className="h-3 bg-gray-300 rounded w-1/3" />
            </div>
          </div>
        );

      case 'text':
        return (
          <div key={index} className={`space-y-2 ${className}`}>
            <div className={`${baseClasses} h-4 w-full`} />
            <div className={`${baseClasses} h-4 w-5/6`} />
            <div className={`${baseClasses} h-4 w-4/6`} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, index) => renderSkeleton(index))}
    </div>
  );
};

export default SkeletonLoader;
