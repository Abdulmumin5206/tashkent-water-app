import React from 'react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightElement?: React.ReactNode;
}

/**
 * Header component with back button and title
 * 
 * Used across customer and driver pages for consistent navigation.
 * 
 * Requirements: All - Provides consistent navigation across the app
 */
const Header: React.FC<HeaderProps> = ({ 
  title, 
  showBack = true, 
  onBack,
  rightElement 
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="px-4 py-3 flex items-center gap-3">
        {showBack && (
          <button
            onClick={handleBack}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Назад"
          >
            <svg 
              className="w-5 h-5 text-gray-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 19l-7-7 7-7" 
              />
            </svg>
          </button>
        )}
        <h1 className="text-lg font-semibold text-gray-900 flex-1 truncate">
          {title}
        </h1>
        {rightElement && (
          <div className="flex-shrink-0">
            {rightElement}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
