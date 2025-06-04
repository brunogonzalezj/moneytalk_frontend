import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import Button from '../components/ui/Button';

const NotFound = () => {
  const { isAuthenticated } = useAuthStore();
  
  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-9xl font-bold text-primary">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mt-4 mb-2">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to={isAuthenticated ? '/dashboard' : '/login'}>
            <Button variant="primary" icon={<Home size={16} />}>
              {isAuthenticated ? 'Go to Dashboard' : 'Go to Login'}
            </Button>
          </Link>
          
          <button onClick={() => window.history.back()}>
            <Button variant="outline" icon={<ArrowLeft size={16} />}>
              Go Back
            </Button>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;