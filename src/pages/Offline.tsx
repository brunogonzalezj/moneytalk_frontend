import { useEffect, useState } from 'react';
import { CloudOff, RefreshCw, Wifi } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTransactionStore } from '../stores/transactionStore';
import useOfflineDetection from '../hooks/useOfflineDetection';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const Offline = () => {
  const { isOnline } = useOfflineDetection();
  const pending = useTransactionStore((state) => state.outboxTransactions.length);
  const syncOutboxTransactions = useTransactionStore((state) => state.syncOutboxTransactions);
  const [isChecking, setIsChecking] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/dashboard';

  const goBack = async () => {
    await syncOutboxTransactions();
    navigate(from, { replace: true });
  };

  // Returns automatically as soon as the connection is back
  useEffect(() => {
    if (isOnline) void goBack();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  // A real request: navigator.onLine can say "online" on a network without internet
  const checkConnection = async () => {
    setIsChecking(true);
    try {
      await fetch('/', { method: 'HEAD', cache: 'no-store' });
      await goBack();
    } catch {
      // Still offline
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <div className="text-center p-6">
          <div className="bg-accent-100 dark:bg-accent-900/40 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CloudOff size={32} className="text-accent-600 dark:text-accent-300" />
          </div>

          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-50 mb-2">Sin conexión</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Parece que perdiste la conexión a internet. Puedes seguir registrando transacciones: se enviarán cuando vuelvas a
            estar en línea.
          </p>

          {pending > 0 && (
            <div className="bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-md p-4 mb-6 text-left">
              <div className="flex items-start">
                <Wifi size={20} className="text-primary-600 shrink-0" />
                <div className="ml-3">
                  <h3 className="text-sm font-semibold text-primary-800 dark:text-primary-200">Transacciones pendientes</h3>
                  <p className="mt-1 text-sm text-primary-700 dark:text-primary-300">
                    {pending === 1 ? 'Tienes 1 transacción guardada' : `Tienes ${pending} transacciones guardadas`} en este
                    dispositivo. Se sincronizarán al reconectar.
                  </p>
                </div>
              </div>
            </div>
          )}

          <Button
            variant="primary"
            fullWidth
            icon={<RefreshCw size={16} className={isChecking ? 'animate-spin' : ''} />}
            onClick={checkConnection}
            isLoading={isChecking}
          >
            {isChecking ? 'Comprobando conexión...' : 'Comprobar conexión'}
          </Button>

          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Si el problema continúa, revisa tu red Wi-Fi o tus datos móviles.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Offline;
