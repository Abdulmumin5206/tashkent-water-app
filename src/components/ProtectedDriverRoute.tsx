import React, { ReactNode } from 'react';
import { useDriver } from '../contexts/DriverContext';
import DriverLoginPage from '../pages/DriverLoginPage';

interface ProtectedDriverRouteProps {
  children: ReactNode;
}

/**
 * ProtectedDriverRoute - Wraps driver routes to require authentication
 * 
 * If not authenticated, shows the login page.
 * If authenticated, renders the children.
 * 
 * Requirements: 7.1 - Driver dashboard requires password authentication
 */
const ProtectedDriverRoute: React.FC<ProtectedDriverRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useDriver();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Загрузка...</div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <DriverLoginPage />;
  }

  // Render protected content
  return <>{children}</>;
};

export default ProtectedDriverRoute;
