import { RouterProvider } from 'react-router-dom';
import { TelegramProvider, AppProvider, DriverProvider } from './contexts';
import { ErrorBoundary } from './components';
import { router } from './router';
import './App.css';

/**
 * Main App component
 * 
 * Wraps the application with:
 * - ErrorBoundary: Catches JavaScript errors and displays fallback UI
 * - TelegramProvider: Handles Telegram WebApp SDK initialization
 * - AppProvider: Manages cart state and customer data
 * - DriverProvider: Manages driver authentication state
 * - RouterProvider: Handles client-side routing
 * 
 * Requirements: All
 */
function App() {
  return (
    <ErrorBoundary>
      <TelegramProvider>
        <AppProvider>
          <DriverProvider>
            <RouterProvider router={router} />
          </DriverProvider>
        </AppProvider>
      </TelegramProvider>
    </ErrorBoundary>
  );
}

export default App;
