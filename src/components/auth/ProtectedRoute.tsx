import { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { WifiOff } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useTransactionStore } from '../../stores/transactionStore';
import useOfflineDetection from '../../hooks/useOfflineDetection';

interface ProtectedRouteProps {
  children: ReactElement;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const pending = useTransactionStore((state) => state.outboxTransactions.length);
  const { isOnline } = useOfflineDetection();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Offline the app stays usable: new transactions wait in the outbox until reconnecting
  return (
    <>
      {!isOnline && (
        <div
          role="status"
          className="fixed top-0 inset-x-0 z-[60] flex items-center justify-center gap-2 bg-amber-500 text-amber-950 text-sm font-semibold px-4 py-2 shadow"
        >
          <WifiOff size={16} />
          Sin conexión. Lo que registres se enviará al reconectar
          {pending > 0 && ` (${pending} pendiente${pending === 1 ? '' : 's'})`}.
        </div>
      )}
      {children}
    </>
  );
};

export default ProtectedRoute;
