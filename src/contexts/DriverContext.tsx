import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

const DRIVER_SESSION_KEY = 'driver_authenticated';
const DRIVER_PASSWORD_ENV = import.meta.env.VITE_DRIVER_PASSWORD || 'driver123';

export interface DriverContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (password: string) => boolean;
  logout: () => void;
}

const defaultContextValue: DriverContextValue = {
  isAuthenticated: false,
  isLoading: true,
  login: () => false,
  logout: () => {},
};

const DriverContext = createContext<DriverContextValue>(defaultContextValue);

interface DriverProviderProps {
  children: ReactNode;
}

/**
 * Validates driver password against the configured password
 * @param password - The password to validate
 * @returns boolean - True if password is valid
 */
export function validateDriverPassword(password: string): boolean {
  return password === DRIVER_PASSWORD_ENV;
}

/**
 * Checks if driver is authenticated based on session storage
 * @returns boolean - True if authenticated
 */
export function isDriverAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(DRIVER_SESSION_KEY) === 'true';
}

/**
 * Sets driver authentication state in session storage
 * @param authenticated - Whether driver is authenticated
 */
export function setDriverAuthState(authenticated: boolean): void {
  if (typeof window === 'undefined') return;
  if (authenticated) {
    sessionStorage.setItem(DRIVER_SESSION_KEY, 'true');
  } else {
    sessionStorage.removeItem(DRIVER_SESSION_KEY);
  }
}

/**
 * DriverProvider manages driver authentication state:
 * - Password-based authentication
 * - Session storage persistence
 * - Route protection support
 * 
 * Requirements: 7.1
 */
export const DriverProvider: React.FC<DriverProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check session storage on mount
  useEffect(() => {
    const authenticated = isDriverAuthenticated();
    setIsAuthenticated(authenticated);
    setIsLoading(false);
  }, []);

  // Login with password validation
  const login = useCallback((password: string): boolean => {
    const isValid = validateDriverPassword(password);
    if (isValid) {
      setDriverAuthState(true);
      setIsAuthenticated(true);
    }
    return isValid;
  }, []);

  // Logout and clear session
  const logout = useCallback(() => {
    setDriverAuthState(false);
    setIsAuthenticated(false);
  }, []);

  const contextValue: DriverContextValue = {
    isAuthenticated,
    isLoading,
    login,
    logout,
  };

  return (
    <DriverContext.Provider value={contextValue}>
      {children}
    </DriverContext.Provider>
  );
};

/**
 * Custom hook to use Driver context
 * @throws Error if used outside of DriverProvider
 */
export const useDriver = (): DriverContextValue => {
  const context = useContext(DriverContext);
  if (!context) {
    throw new Error('useDriver must be used within a DriverProvider');
  }
  return context;
};

export default DriverContext;
