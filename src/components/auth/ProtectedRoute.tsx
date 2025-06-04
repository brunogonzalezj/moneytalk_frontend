import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import useOfflineDetection from '../../hooks/useOfflineDetection';

interface ProtectedRouteProps {
  children: JSX.Element;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated } = useAuthStore();
  const { isOnline } = useOfflineDetection();
  const location = useLocation();

  // If offline, redirect to offline page with return URL
  if (!isOnline) {
    return <Navigate to="/offline" state={{ from: location }} replace />;
  }

  // If not authenticated, redirect to login page with return URL
  if (!isAuthenticated) {
    return <Navigate to="/login\" state={{ from: location }} replace />;
  }

  // If authenticated and online, render the protected content
  return children;
};

export default ProtectedRoute;