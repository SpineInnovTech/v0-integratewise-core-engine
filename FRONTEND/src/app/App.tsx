import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider } from './context/auth-context';

/**
 * IntegrateWise - Main Application Entry Point
 * Unified Intelligence Layer for B2B Revenue Teams
 */
export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
