import { useEffect, useState } from 'react';
import { CloudOff, RefreshCw, Wifi } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTransactionStore } from '../stores/transactionStore';
import useOfflineDetection from '../hooks/useOfflineDetection';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const Offline = () => {
  const { isOnline, wasOffline, setWasOffline } = useOfflineDetection();
  const { outboxTransactions, syncOutboxTransactions } = useTransactionStore();
  const [isChecking, setIsChecking] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the return URL from location state
  const from = (location.state as any)?.from?.pathname || '/dashboard';
  
  // Check for connection and redirect if online
  useEffect(() => {
    if (isOnline && !wasOffline) {
      navigate(from, { replace: true });
    }
  }, [isOnline, wasOffline, navigate, from]);
  
  // Handle manual connection check
  const checkConnection = () => {
    setIsChecking(true);
    
    // Simulate a network check
    setTimeout(() => {
      setIsChecking(false);
      
      if (navigator.onLine) {
        // If back online and there are offline transactions, sync them
        if (outboxTransactions.length > 0) {
          syncOutboxTransactions().then(() => {
            setWasOffline(false);
            navigate(from, { replace: true });
          });
        } else {
          setWasOffline(false);
          navigate(from, { replace: true });
        }
      }
    }, 1500);
  };
  
  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <div className="text-center p-6">
          <div className="bg-accent-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CloudOff size={32} className="text-accent-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-2">You're Offline</h1>
          <p className="text-gray-600 mb-6">
            It looks like you've lost your internet connection. MoneyTalk requires an internet connection to work properly.
          </p>
          
          {outboxTransactions.length > 0 && (
            <div className="bg-primary-50 border border-primary-200 rounded-md p-4 mb-6 text-left">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Wifi size={20} className="text-primary-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-primary-800">Offline Transactions</h3>
                  <p className="mt-1 text-sm text-primary-700">
                    You have {outboxTransactions.length} transaction{outboxTransactions.length !== 1 ? 's' : ''} saved locally. 
                    They will be synchronized when you're back online.
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
            {isChecking ? 'Checking Connection...' : 'Check Connection'}
          </Button>
          
          <p className="mt-4 text-sm text-gray-500">
            If you continue to see this message, please check your network settings and try again.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Offline;