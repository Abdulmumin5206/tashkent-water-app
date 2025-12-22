import React, { useState, FormEvent } from 'react';
import { useDriver } from '../contexts/DriverContext';

interface DriverLoginPageProps {
  onLoginSuccess?: () => void;
}

/**
 * DriverLoginPage - Password authentication for driver dashboard access
 * 
 * Requirements: 7.1 - Driver dashboard requires password authentication
 */
const DriverLoginPage: React.FC<DriverLoginPageProps> = ({ onLoginSuccess }) => {
  const { login } = useDriver();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // Small delay to prevent brute force
    await new Promise(resolve => setTimeout(resolve, 300));

    const success = login(password);
    
    if (success) {
      onLoginSuccess?.();
    } else {
      setError('Неверный пароль');
      setPassword('');
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Вход для водителя
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Пароль
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Введите пароль"
              required
              disabled={isSubmitting}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !password}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Проверка...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DriverLoginPage;
