import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Bell } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';

const Header = () => {
  const { setSidebarOpen } = useUIStore();
  const { user } = useAuthStore();
  const location = useLocation();
  const [pageTitle, setPageTitle] = useState('Panel Principal');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    if (pathSegments.length === 0) {
      setPageTitle('Panel Principal');
    } else {
      const titles: { [key: string]: string } = {
        'dashboard': 'Panel Principal',
        'transactions': 'Transacciones',
        'new': 'Nueva Transacción',
        'reports': 'Reportes',
        'profile': 'Perfil'
      };
      const title = pathSegments[pathSegments.length - 1];
      setPageTitle(titles[title] || title.charAt(0).toUpperCase() + title.slice(1));
    }
  }, [location]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`bg-white px-4 py-4 flex items-center justify-between transition-shadow ${
        isScrolled ? 'shadow-md' : ''
      }`}
    >
      <div className="flex items-center">
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden p-2 mr-2 rounded-md hover:bg-base-200 transition-colors"
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-xl font-bold text-gray-800">{pageTitle}</h1>
      </div>

      <div className="flex items-center space-x-4">
        <button 
          className="p-2 rounded-full hover:bg-base-200 transition-colors relative"
          aria-label="Notificaciones"
        >
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
        </button>
        
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-700 mr-3 hidden sm:block">
            {user?.displayName || user?.email}
          </span>
          <div className="avatar placeholder">
            <div className="bg-primary text-white rounded-full w-10">
              <span className="text-sm">
                {user?.displayName 
                  ? user.displayName.substring(0, 2).toUpperCase() 
                  : user?.email?.substring(0, 2).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;